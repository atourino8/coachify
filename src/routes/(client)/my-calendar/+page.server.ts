// Calendario del cliente: ve sus sesiones y puede solicitar cita en los
// huecos que su coach ha publicado (availability_slots).

import { fail, redirect } from '@sveltejs/kit';
import { accesoDeCliente } from '$lib/access.server';
import { mensajeDeError, DIAS_DE_AVISO } from '$lib/clases';
import { faltasPorCliente } from '$lib/faltas.server';
import type { GroupClass } from '$lib/supabase/types';
import { avisar } from '$lib/aviso.server';
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
  workout: { id: string; title: string | null; date: string } | null;
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

  // Sesiones del cliente (futuras y recientes), con el entreno ligado si lo hay.
  const { data: sessionsRaw } = await supabase
    .from('sessions')
    .select(
      `id, starts_at, ends_at, status, modality, location, notes, requested_by,
       workout:workouts(id, title, date)`
    )
    .eq('client_id', user.id)
    .order('starts_at', { ascending: true });

  const allSessions = (sessionsRaw ?? []) as unknown as SessionRow[];
  const now = Date.now();
  // Marcar las citas que ha propuesto el COACH (requested_by != cliente) y
  // están pendientes: el cliente debe confirmarlas o rechazarlas.
  const withMeta = allSessions.map((s) => ({
    ...s,
    proposedByCoach: s.status === 'requested' && s.requested_by !== user.id
  }));
  const futureActive = withMeta.filter(
    (s) =>
      new Date(s.starts_at).getTime() >= now && s.status !== 'cancelled' && s.status !== 'rejected'
  );
  // Propuestas del coach por confirmar: van arriba, separadas.
  const proposals = futureActive.filter((s) => s.proposedByCoach);
  // El resto de próximas (ya confirmadas o pedidas por el cliente).
  const upcoming = futureActive.filter((s) => !s.proposedByCoach);
  const past = withMeta
    .filter(
      (s) =>
        new Date(s.starts_at).getTime() < now || s.status === 'cancelled' || s.status === 'rejected'
    )
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

  // ---- Clases grupales (ADR-004) ----
  //
  // Qué clases ve lo decide la RLS: las de su entrenador, y de las
  // restringidas a un grupo solo si pertenece. Aquí no se filtra por eso, se
  // filtra por lo que el cliente entiende: lo que aún no ha pasado.
  const desde = new Date(now - 60 * 60 * 1000).toISOString(); // una hora de margen
  const { data: clasesRaw } = await supabase
    .from('group_classes')
    .select('id, title, starts_at, ends_at, capacity, location, notes, status')
    .gte('starts_at', desde)
    .order('starts_at');
  const clasesBase = (clasesRaw ?? []) as unknown as Pick<
    GroupClass,
    'id' | 'title' | 'starts_at' | 'ends_at' | 'capacity' | 'location' | 'notes' | 'status'
  >[];

  // Sus inscripciones y las plazas ocupadas de cada clase. Las plazas van por
  // función porque su política solo le deja ver SUS inscripciones: puede saber
  // cuánta gente hay, no quién.
  const ocupadas = new Map<string, number>();
  const mias = new Map<string, 'seat' | 'waitlist'>();
  if (clasesBase.length > 0) {
    const ids = clasesBase.map((c) => c.id);
    const [{ data: plazas }, { data: misRaw }] = await Promise.all([
      supabase.rpc('class_seats_taken', { p_class_ids: ids }),
      supabase
        .from('class_bookings')
        .select('class_id, status')
        .eq('client_id', user.id)
        .in('class_id', ids)
        .in('status', ['seat', 'waitlist'])
    ]);
    for (const f of (plazas ?? []) as { class_id: string; taken: number }[]) {
      ocupadas.set(f.class_id, f.taken);
    }
    for (const b of (misRaw ?? []) as { class_id: string; status: 'seat' | 'waitlist' }[]) {
      mias.set(b.class_id, b.status);
    }
  }

  const clases = clasesBase.map((c) => ({
    ...c,
    ocupadas: ocupadas.get(c.id) ?? 0,
    inscripcion: mias.get(c.id) ?? null
  }));

  // Sus faltas, para poder avisarle antes de que suelte otra plaza tarde.
  const misFaltas = coachId
    ? ((await faltasPorCliente(supabase, coachId, [user.id])).get(user.id) ?? 0)
    : 0;

  return {
    proposals,
    upcoming,
    past,
    bookable,
    clases,
    misFaltas,
    hasCoach: !!coachId
  };
};

export const actions: Actions = {
  request: async ({ request, cookies, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');

    // Pedir hueco es lo ÚNICO que se cierra aquí. Ver sus citas y cancelarlas
    // sigue abierto aunque esté en pausa: cerrarle eso no consigue que pague,
    // consigue que se plante en una sesión que ya no tocaba o que deje
    // colgado al entrenador sin poder avisar.
    //
    // Reservar es distinto: es ocupar una hora de la agenda del entrenador,
    // que es exactamente lo que está pendiente de pagar.
    if ((await accesoDeCliente(user.id)).pausado) {
      return fail(403, {
        error: 'Tu acceso está en pausa. Habla con tu entrenador para volver a pedir cita.'
      });
    }

    // En actions no hay parent(); leemos el coach_id del perfil directamente.
    const { data: profile } = await supabase
      .from('profiles')
      .select('coach_id')
      .eq('id', user.id)
      .single();
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
    avisar(cookies, 'Cita solicitada. Tu entrenador la confirmará pronto.');
    return { success: true };
  },

  cancel: async ({ request, cookies, locals: { supabase, user } }) => {
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
    avisar(cookies, 'Cita cancelada. Tu entrenador ya lo sabe.');
    return { success: true };
  },

  // El cliente confirma una cita que le propuso el coach.
  confirm: async ({ request, cookies, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const id = (await request.formData()).get('session_id') as string;
    if (!id) return fail(400, { error: 'Falta el id.' });
    const { error } = await supabase
      .from('sessions')
      .update({ status: 'confirmed', decided_at: new Date().toISOString() } as never)
      .eq('id', id)
      .eq('client_id', user.id);
    if (error) return fail(500, { error: error.message });
    avisar(cookies, 'Cita confirmada.');
    return { success: true };
  },

  // El cliente rechaza una cita que le propuso el coach.
  reject: async ({ request, cookies, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const id = (await request.formData()).get('session_id') as string;
    if (!id) return fail(400, { error: 'Falta el id.' });
    const { error } = await supabase
      .from('sessions')
      .update({ status: 'rejected', decided_at: new Date().toISOString() } as never)
      .eq('id', id)
      .eq('client_id', user.id);
    if (error) return fail(500, { error: error.message });
    avisar(cookies, 'Cita rechazada. Tu entrenador ya lo sabe.', 'aviso');
    return { success: true };
  },
  // Apuntarse. Todo el trabajo lo hace book_class: comprueba el aforo con la
  // fila de la clase bloqueada y decide si es plaza o lista de espera.
  apuntarse: async ({ request, cookies, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');

    // Mismo criterio que pedir cita: ocupar una plaza es exactamente lo que
    // está pendiente de pagar. Salirse sigue abierto en pausa.
    if ((await accesoDeCliente(user.id)).pausado) {
      return fail(403, {
        error: 'Tu acceso está en pausa. Habla con tu entrenador para apuntarte a clases.'
      });
    }

    const fd = await request.formData();
    const classId = String(fd.get('class_id') ?? '');
    if (!classId) return fail(400, { error: 'Falta la clase.' });

    const { data, error: err } = await supabase.rpc('book_class', { p_class_id: classId });
    if (err) return fail(400, { error: mensajeDeError(err.message) });
    if (data === 'seat') {
      avisar(
        cookies,
        `Tienes plaza. Si no puedes ir, avisa con ${DIAS_DE_AVISO} días para que la coja otro.`
      );
    } else {
      avisar(
        cookies,
        'La clase está completa: estás en la lista de espera. Si alguien suelta su plaza y eres el primero, entras automáticamente.',
        'aviso'
      );
    }
    return { success: true };
  },

  salirse: async ({ request, cookies, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const fd = await request.formData();
    const classId = String(fd.get('class_id') ?? '');
    if (!classId) return fail(400, { error: 'Falta la clase.' });

    const { data, error: err } = await supabase.rpc('cancel_class_booking', {
      p_class_id: classId
    });
    if (err) return fail(400, { error: mensajeDeError(err.message) });
    if (data === 'cancelled_late') {
      avisar(
        cookies,
        `Fuera de la clase. Como quedaban menos de ${DIAS_DE_AVISO} días, le consta a tu entrenador.`,
        'aviso'
      );
    } else {
      avisar(cookies, 'Fuera de la clase. Gracias por avisar con tiempo.');
    }
    return { success: true };
  }
};
