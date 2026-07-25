// Agenda del coach: bandeja de citas. Confirmar/rechazar/cancelar + asignar
// un entreno a cada cita (o crear uno nuevo desde el constructor).

import { fail, redirect } from '@sveltejs/kit';
import { isoDateInTZ } from '$lib/week';
import type { PageServerLoad, Actions } from './$types';

const DEFAULT_TZ = 'Europe/Madrid';

type SessionRow = {
  id: string;
  client_id: string;
  workout_id: string | null;
  requested_by: string | null;
  starts_at: string;
  ends_at: string;
  status: string;
  modality: string;
  location: string | null;
  notes: string | null;
  client: { id: string; full_name: string | null } | null;
  workout: { id: string; title: string | null; date: string } | null;
};

export const load: PageServerLoad = async ({ locals: { supabase, user } }) => {
  if (!user) redirect(303, '/login');

  const { data: sessionsRaw } = await supabase
    .from('sessions')
    .select(
      `id, client_id, workout_id, requested_by, starts_at, ends_at, status, modality, location, notes,
       client:profiles!sessions_client_id_fkey(id, full_name),
       workout:workouts(id, title, date)`
    )
    .eq('coach_id', user.id)
    .order('starts_at', { ascending: true });

  // Marcamos si la cita la propuso el propio coach (espera al cliente) o la
  // pidió el cliente (espera al coach).
  const all = ((sessionsRaw ?? []) as unknown as SessionRow[]).map((s) => ({
    ...s,
    proposedByCoach: s.requested_by === user.id
  }));
  const now = Date.now();

  const pending = all.filter((s) => s.status === 'requested');
  const confirmed = all.filter(
    (s) => s.status === 'confirmed' && new Date(s.starts_at).getTime() >= now
  );
  const history = all
    .filter(
      (s) =>
        s.status === 'rejected' ||
        s.status === 'cancelled' ||
        s.status === 'completed' ||
        (s.status === 'confirmed' && new Date(s.starts_at).getTime() < now)
    )
    .reverse();

  // Entrenos del coach por cliente (para el desplegable "asignar entreno").
  const { data: workoutsRaw } = await supabase
    .from('workouts')
    .select('id, client_id, date, title')
    .eq('coach_id', user.id)
    .order('date', { ascending: false })
    .limit(200);

  const workoutsByClient: Record<string, { id: string; date: string; title: string | null }[]> = {};
  for (const w of (workoutsRaw ?? []) as { id: string; client_id: string; date: string; title: string | null }[]) {
    (workoutsByClient[w.client_id] ??= []).push({ id: w.id, date: w.date, title: w.title });
  }

  // Plantillas del coach (para asignar directamente a una cita).
  const { data: tplRaw } = await supabase
    .from('workout_templates')
    .select('id, name, workout_template_items(id)')
    .eq('coach_id', user.id)
    .order('name');
  const templates = ((tplRaw ?? []) as unknown as { id: string; name: string; workout_template_items: { id: string }[] | null }[]).map(
    (t) => ({ id: t.id, name: t.name, itemCount: (t.workout_template_items ?? []).length })
  );

  // Clientes del coach (para proponer una cita a uno de ellos).
  const { data: clientsRaw } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('coach_id', user.id)
    .eq('archived', false)
    .order('full_name');
  const clients = (clientsRaw ?? []) as { id: string; full_name: string | null }[];

  return { pending, confirmed, history, workoutsByClient, templates, clients };
};

// Materializa una plantilla como entreno (workout) para un cliente en una fecha,
// y devuelve el id del workout. Reutilizado por assignTemplate y createSession.
async function materializeTemplate(
  supabase: App.Locals['supabase'],
  coachId: string,
  clientId: string,
  date: string,
  templateId: string
): Promise<{ workoutId: string } | { error: string }> {
  const { data: tpl, error: tplErr } = await supabase
    .from('workout_templates')
    .select(
      'id, name, workout_template_items(exercise_id, order_index, sets, reps_prescribed, weight_prescribed, rest_seconds, notes)'
    )
    .eq('id', templateId)
    .eq('coach_id', coachId)
    .single();
  if (tplErr || !tpl) return { error: 'Plantilla no encontrada.' };
  const template = tpl as unknown as {
    name: string;
    workout_template_items: {
      exercise_id: string;
      order_index: number;
      sets: number;
      reps_prescribed: string | null;
      weight_prescribed: string | null;
      rest_seconds: number | null;
      notes: string | null;
    }[];
  };

  const { data: existing } = await supabase
    .from('workouts')
    .select('id')
    .eq('client_id', clientId)
    .eq('date', date)
    .maybeSingle();

  let workoutId: string;
  if (existing) {
    workoutId = (existing as { id: string }).id;
    await supabase.from('workouts').update({ title: template.name } as never).eq('id', workoutId);
    await supabase.from('workout_items').delete().eq('workout_id', workoutId);
  } else {
    const { data: created, error: createErr } = await supabase
      .from('workouts')
      .insert({ client_id: clientId, coach_id: coachId, date, title: template.name } as never)
      .select('id')
      .single();
    if (createErr || !created) return { error: createErr?.message ?? 'No se pudo crear el entreno.' };
    workoutId = (created as { id: string }).id;
  }

  const tplItems = [...(template.workout_template_items ?? [])].sort((a, b) => a.order_index - b.order_index);
  if (tplItems.length > 0) {
    const rows = tplItems.map((it, i) => ({
      workout_id: workoutId,
      exercise_id: it.exercise_id,
      order_index: i,
      sets: it.sets,
      reps_prescribed: it.reps_prescribed,
      weight_prescribed: it.weight_prescribed,
      rest_seconds: it.rest_seconds,
      notes: it.notes
    }));
    const { error: insErr } = await supabase.from('workout_items').insert(rows as never);
    if (insErr) return { error: insErr.message };
  }

  return { workoutId };
}

async function setStatus(
  supabase: App.Locals['supabase'],
  userId: string,
  id: string,
  status: 'confirmed' | 'rejected' | 'cancelled' | 'completed'
) {
  return supabase
    .from('sessions')
    .update({ status, decided_at: new Date().toISOString() } as never)
    .eq('id', id)
    .eq('coach_id', userId);
}

export const actions: Actions = {
  confirm: async ({ request, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const id = (await request.formData()).get('session_id') as string;
    if (!id) return fail(400, { error: 'Falta el id.' });
    const { error } = await setStatus(supabase, user.id, id, 'confirmed');
    if (error) return fail(500, { error: error.message });
    return { success: true };
  },
  reject: async ({ request, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const id = (await request.formData()).get('session_id') as string;
    if (!id) return fail(400, { error: 'Falta el id.' });
    const { error } = await setStatus(supabase, user.id, id, 'rejected');
    if (error) return fail(500, { error: error.message });
    return { success: true };
  },
  cancel: async ({ request, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const id = (await request.formData()).get('session_id') as string;
    if (!id) return fail(400, { error: 'Falta el id.' });
    const { error } = await setStatus(supabase, user.id, id, 'cancelled');
    if (error) return fail(500, { error: error.message });
    return { success: true };
  },
  complete: async ({ request, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const id = (await request.formData()).get('session_id') as string;
    if (!id) return fail(400, { error: 'Falta el id.' });
    const { error } = await setStatus(supabase, user.id, id, 'completed');
    if (error) return fail(500, { error: error.message });
    return { success: true };
  },
  // Asigna un entreno existente a la cita.
  assignWorkout: async ({ request, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const fd = await request.formData();
    const id = fd.get('session_id') as string;
    const workoutId = (fd.get('workout_id') as string) || null;
    if (!id) return fail(400, { error: 'Falta el id de la cita.' });
    const { error } = await supabase
      .from('sessions')
      .update({ workout_id: workoutId } as never)
      .eq('id', id)
      .eq('coach_id', user.id);
    if (error) return fail(500, { error: error.message });
    return { success: true };
  },
  // Quita el entreno ligado a la cita.
  unassignWorkout: async ({ request, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const id = (await request.formData()).get('session_id') as string;
    if (!id) return fail(400, { error: 'Falta el id.' });
    const { error } = await supabase
      .from('sessions')
      .update({ workout_id: null } as never)
      .eq('id', id)
      .eq('coach_id', user.id);
    if (error) return fail(500, { error: error.message });
    return { success: true };
  },

  // Materializa una PLANTILLA como entreno en la fecha de la cita y lo liga.
  assignTemplate: async ({ request, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const fd = await request.formData();
    const sessionId = fd.get('session_id') as string;
    const templateId = fd.get('template_id') as string;
    if (!sessionId || !templateId) return fail(400, { error: 'Falta la cita o la plantilla.' });

    const { data: sess, error: sessErr } = await supabase
      .from('sessions')
      .select('id, client_id, starts_at')
      .eq('id', sessionId)
      .eq('coach_id', user.id)
      .single();
    if (sessErr || !sess) return fail(404, { error: 'Cita no encontrada.' });
    const session = sess as { client_id: string; starts_at: string };
    const date = isoDateInTZ(new Date(session.starts_at), DEFAULT_TZ);

    const res = await materializeTemplate(supabase, user.id, session.client_id, date, templateId);
    if ('error' in res) return fail(500, { error: res.error });

    const { error: linkErr } = await supabase
      .from('sessions')
      .update({ workout_id: res.workoutId } as never)
      .eq('id', sessionId)
      .eq('coach_id', user.id);
    if (linkErr) return fail(500, { error: linkErr.message });

    return { success: true, fromTemplate: true };
  },

  // El coach PROPONE una cita a un cliente. Queda 'requested' (requested_by =
  // coach) para que el cliente la confirme. Opcionalmente asigna una plantilla.
  createSession: async ({ request, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const fd = await request.formData();
    const clientId = fd.get('client_id') as string;
    const startsAt = fd.get('starts_at') as string;
    const endsAt = fd.get('ends_at') as string;
    const modality = (fd.get('modality') as string) || 'presencial';
    const templateId = (fd.get('template_id') as string) || '';

    if (!clientId || !startsAt || !endsAt) {
      return fail(400, { error: 'Elige cliente, fecha y hora.' });
    }

    // Verificar que el cliente es del coach.
    const { data: client } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', clientId)
      .eq('coach_id', user.id)
      .maybeSingle();
    if (!client) return fail(403, { error: 'Ese cliente no es tuyo.' });

    const { data: created, error: createErr } = await supabase
      .from('sessions')
      .insert({
        coach_id: user.id,
        client_id: clientId,
        starts_at: startsAt,
        ends_at: endsAt,
        status: 'requested',
        modality: modality as never,
        requested_by: user.id
      } as never)
      .select('id')
      .single();
    if (createErr || !created) return fail(500, { error: createErr?.message ?? 'No se pudo crear la cita.' });
    const sessionId = (created as { id: string }).id;

    // Si eligió plantilla, materializarla y ligarla.
    if (templateId) {
      const date = isoDateInTZ(new Date(startsAt), DEFAULT_TZ);
      const res = await materializeTemplate(supabase, user.id, clientId, date, templateId);
      if (!('error' in res)) {
        await supabase
          .from('sessions')
          .update({ workout_id: res.workoutId } as never)
          .eq('id', sessionId)
          .eq('coach_id', user.id);
      }
    }

    return { success: true, proposed: true };
  }
};
