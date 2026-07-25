// Calendario del cliente: ve sus sesiones y puede solicitar cita en los
// huecos que su coach ha publicado (availability_slots).

import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

type AvailabilitySlot = {
  id: string;
  coach_id: string;
  kind: 'recurring' | 'specific';
  day_of_week: number | null;
  specific_date: string | null;
  start_time: string; // "HH:MM:SS"
  end_time: string;
  duration_minutes: number;
  modalities: string[];
};

type SessionRow = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  modality: string;
  location: string | null;
  notes: string | null;
  requested_by: string | null;
};

const DAYS_AHEAD = 14;

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

// Genera los huecos concretos reservables para los próximos DAYS_AHEAD días,
// a partir de los slots recurrentes/específicos, excluyendo los ya ocupados.
function buildBookableSlots(
  slots: AvailabilitySlot[],
  busyStartTimes: Set<string>
): { startsAt: string; endsAt: string; modalities: string[]; label: string }[] {
  const out: { startsAt: string; endsAt: string; modalities: string[]; label: string }[] = [];
  const now = new Date();

  for (let d = 0; d < DAYS_AHEAD; d++) {
    const day = new Date(now);
    day.setDate(day.getDate() + d);
    day.setHours(0, 0, 0, 0);
    const dow = day.getDay(); // 0=domingo
    const isoDate = `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`;

    for (const s of slots) {
      const matches =
        (s.kind === 'recurring' && s.day_of_week === dow) ||
        (s.kind === 'specific' && s.specific_date === isoDate);
      if (!matches) continue;

      const [sh, sm] = s.start_time.split(':').map(Number);
      const starts = new Date(day);
      starts.setHours(sh, sm, 0, 0);

      // No ofrecer huecos en el pasado
      if (starts.getTime() < now.getTime()) continue;

      const ends = new Date(starts);
      ends.setMinutes(ends.getMinutes() + (s.duration_minutes || 60));

      const startsAt = starts.toISOString();
      if (busyStartTimes.has(startsAt)) continue; // ya reservado

      out.push({
        startsAt,
        endsAt: ends.toISOString(),
        modalities: s.modalities,
        label: starts.toLocaleString('es-ES', {
          weekday: 'long',
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit'
        })
      });
    }
  }

  out.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  return out;
}

export const load: PageServerLoad = async ({ locals: { supabase, user }, parent }) => {
  if (!user) redirect(303, '/login');
  const { profile } = await parent();
  const coachId = profile?.coach_id ?? null;

  // Sesiones del cliente (futuras y recientes)
  const { data: sessionsRaw } = await supabase
    .from('sessions')
    .select('id, starts_at, ends_at, status, modality, location, notes, requested_by')
    .eq('client_id', user.id)
    .order('starts_at', { ascending: true });

  const allSessions = (sessionsRaw ?? []) as unknown as SessionRow[];
  const now = Date.now();
  const upcoming = allSessions.filter(
    (s) => new Date(s.starts_at).getTime() >= now && s.status !== 'cancelled' && s.status !== 'rejected'
  );
  const past = allSessions
    .filter((s) => new Date(s.starts_at).getTime() < now || s.status === 'cancelled' || s.status === 'rejected')
    .reverse();

  // Huecos ocupados (para no ofrecerlos): sesiones activas del cliente
  const busy = new Set<string>(
    allSessions
      .filter((s) => s.status === 'requested' || s.status === 'confirmed')
      .map((s) => new Date(s.starts_at).toISOString())
  );

  // Disponibilidad del coach
  let bookable: ReturnType<typeof buildBookableSlots> = [];
  if (coachId) {
    const { data: slotsRaw } = await supabase
      .from('availability_slots')
      .select('*')
      .eq('coach_id', coachId);
    bookable = buildBookableSlots((slotsRaw ?? []) as unknown as AvailabilitySlot[], busy);
  }

  return {
    upcoming,
    past,
    bookable,
    hasCoach: !!coachId
  };
};

export const actions: Actions = {
  request: async ({ request, locals: { supabase, user }, parent }) => {
    if (!user) redirect(303, '/login');
    const { profile } = await parent();
    const coachId = profile?.coach_id;
    if (!coachId) return fail(400, { error: 'No tienes un entrenador asignado.' });

    const fd = await request.formData();
    const startsAt = fd.get('starts_at') as string;
    const endsAt = fd.get('ends_at') as string;
    const modality = (fd.get('modality') as string) || 'presencial';
    const notes = ((fd.get('notes') as string) || '').trim() || null;

    if (!startsAt || !endsAt) return fail(400, { error: 'Falta la fecha del hueco.' });

    // Verificar que no haya ya una sesión activa del cliente a esa hora
    const { data: existing } = await supabase
      .from('sessions')
      .select('id')
      .eq('client_id', user.id)
      .eq('starts_at', startsAt)
      .in('status', ['requested', 'confirmed'])
      .maybeSingle();
    if (existing) return fail(409, { error: 'Ya tienes una cita solicitada a esa hora.' });

    const { error } = await supabase.from('sessions').insert({
      coach_id: coachId,
      client_id: user.id,
      starts_at: startsAt,
      ends_at: endsAt,
      status: 'requested',
      modality: modality as never,
      notes,
      requested_by: user.id
    } as never);

    if (error) return fail(500, { error: error.message });
    return { success: true, requested: true };
  },

  cancel: async ({ request, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const fd = await request.formData();
    const id = fd.get('session_id') as string;
    if (!id) return fail(400, { error: 'Falta el id de la sesión.' });

    // El cliente solo puede cancelar sus propias sesiones (RLS lo refuerza).
    const { error } = await supabase
      .from('sessions')
      .update({ status: 'cancelled', decided_at: new Date().toISOString() } as never)
      .eq('id', id)
      .eq('client_id', user.id);

    if (error) return fail(500, { error: error.message });
    return { success: true, cancelled: true };
  }
};
