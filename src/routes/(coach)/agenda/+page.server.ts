// Agenda del coach: bandeja de citas. Confirmar/rechazar/cancelar + asignar
// un entreno a cada cita (o crear uno nuevo desde el constructor).

import { fail, redirect } from '@sveltejs/kit';
import { isoDateInTZ } from '$lib/week';
import { materializeTemplateWorkout } from '$lib/workouts';
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

  // ---- Conflictos de horario (pantalla 22, «Sin conflictos ✓») ------------
  //
  // QUÉ CUENTA COMO CONFLICTO, que es la parte que hay que decidir y no
  // adivinar:
  //
  //   · Otra cita CONFIRMADA suya que se solape. Las rechazadas y las
  //     canceladas no ocupan a nadie, y dos PENDIENTES solapadas tampoco son
  //     un conflicto todavía: confirmar una es justo lo que decide cuál gana.
  //   · Una CLASE suya que se solape. Da igual cuánta gente haya apuntada: si
  //     está dando una clase, no puede estar en una sesión individual.
  //
  // SIN MARGEN ENTRE MEDIAS, a propósito. Dos citas pegadas —una acaba a las
  // 10:00 y otra empieza a las 10:00— no se marcan. Un margen para desplazarse
  // sería útil pero es una política que nadie ha decidido, y quince minutos
  // inventados por mí llenarían la pantalla de avisos falsos.
  const { data: clasesRaw } = await supabase
    .from('group_classes')
    .select('starts_at, ends_at')
    .eq('coach_id', user.id)
    .eq('status', 'published');

  const ocupados = [
    ...all
      .filter((s) => s.status === 'confirmed')
      .map((s) => ({ id: s.id, ini: s.starts_at, fin: s.ends_at })),
    ...((clasesRaw ?? []) as { starts_at: string; ends_at: string }[]).map((c) => ({
      id: null as string | null,
      ini: c.starts_at,
      fin: c.ends_at
    }))
  ];

  /** Dos tramos se solapan si cada uno empieza antes de que acabe el otro. */
  function chocaCon(s: (typeof all)[number]) {
    return ocupados.some((o) => o.id !== s.id && o.ini < s.ends_at && s.starts_at < o.fin);
  }

  // Una petición SIN CONTESTAR que ya pasó no es una cita próxima.
  //
  // Estaba metida en el mismo montón que las de mañana, así que aparecía bajo
  // «Próximas citas» — y al confirmarla desaparecía de golpe, porque
  // `confirmed` sí filtra por fecha. Se pulsaba un botón y se esfumaba la
  // fila, sin que nada explicara a dónde había ido.
  //
  // Ahora van aparte. Siguen a la vista porque son trabajo pendiente de
  // verdad: alguien pidió una cita y nadie le contestó.
  const pending = all
    .filter((s) => s.status === 'requested' && new Date(s.starts_at).getTime() >= now)
    .map((s) => ({ ...s, choca: chocaCon(s) }));
  const caducadas = all
    .filter((s) => s.status === 'requested' && new Date(s.starts_at).getTime() < now)
    .map((s) => ({ ...s, choca: false }));
  const confirmed = all
    .filter((s) => s.status === 'confirmed' && new Date(s.starts_at).getTime() >= now)
    .map((s) => ({ ...s, choca: chocaCon(s) }));
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
  for (const w of (workoutsRaw ?? []) as {
    id: string;
    client_id: string;
    date: string;
    title: string | null;
  }[]) {
    (workoutsByClient[w.client_id] ??= []).push({ id: w.id, date: w.date, title: w.title });
  }

  // Plantillas del coach (para asignar directamente a una cita).
  const { data: tplRaw } = await supabase
    .from('workout_templates')
    .select('id, name, workout_template_items(id)')
    .eq('coach_id', user.id)
    .order('name');
  const templates = (
    (tplRaw ?? []) as unknown as {
      id: string;
      name: string;
      workout_template_items: { id: string }[] | null;
    }[]
  ).map((t) => ({ id: t.id, name: t.name, itemCount: (t.workout_template_items ?? []).length }));

  // Clientes del coach (para proponer una cita a uno de ellos).
  const { data: clientsRaw } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('coach_id', user.id)
    .eq('archived', false)
    .order('full_name');
  const clients = (clientsRaw ?? []) as { id: string; full_name: string | null }[];

  return { pending, caducadas, confirmed, history, workoutsByClient, templates, clients };
};

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
    // `hecho` es lo que permite decir en pantalla QUÉ ha pasado. Devolver un
    // `success: true` pelado deja a quien pulsa sin ninguna señal, que es
    // exactamente el fallo que había aquí.
    return { success: true, hecho: 'confirmada' };
  },
  reject: async ({ request, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const id = (await request.formData()).get('session_id') as string;
    if (!id) return fail(400, { error: 'Falta el id.' });
    const { error } = await setStatus(supabase, user.id, id, 'rejected');
    if (error) return fail(500, { error: error.message });
    // `hecho` es lo que permite decir en pantalla QUÉ ha pasado. Devolver un
    // `success: true` pelado deja a quien pulsa sin ninguna señal, que es
    // exactamente el fallo que había aquí.
    return { success: true, hecho: 'rechazada' };
  },
  cancel: async ({ request, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const id = (await request.formData()).get('session_id') as string;
    if (!id) return fail(400, { error: 'Falta el id.' });
    const { error } = await setStatus(supabase, user.id, id, 'cancelled');
    if (error) return fail(500, { error: error.message });
    // `hecho` es lo que permite decir en pantalla QUÉ ha pasado. Devolver un
    // `success: true` pelado deja a quien pulsa sin ninguna señal, que es
    // exactamente el fallo que había aquí.
    return { success: true, hecho: 'cancelada' };
  },
  complete: async ({ request, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const id = (await request.formData()).get('session_id') as string;
    if (!id) return fail(400, { error: 'Falta el id.' });
    const { error } = await setStatus(supabase, user.id, id, 'completed');
    if (error) return fail(500, { error: error.message });
    // `hecho` es lo que permite decir en pantalla QUÉ ha pasado. Devolver un
    // `success: true` pelado deja a quien pulsa sin ninguna señal, que es
    // exactamente el fallo que había aquí.
    return { success: true, hecho: 'completada' };
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
    if (!sessionId || !templateId) return fail(400, { error: 'Falta la cita o el entrenamiento.' });

    const { data: sess, error: sessErr } = await supabase
      .from('sessions')
      .select('id, client_id, starts_at')
      .eq('id', sessionId)
      .eq('coach_id', user.id)
      .single();
    if (sessErr || !sess) return fail(404, { error: 'Cita no encontrada.' });
    const session = sess as { client_id: string; starts_at: string };
    const date = isoDateInTZ(new Date(session.starts_at), DEFAULT_TZ);

    const res = await materializeTemplateWorkout(
      supabase,
      user.id,
      session.client_id,
      date,
      templateId,
      { overwrite: true }
    );
    if ('error' in res) return fail(500, { error: res.error });
    if ('skipped' in res) return fail(500, { error: 'No se pudo crear el entreno.' });

    const { error: linkErr } = await supabase
      .from('sessions')
      .update({ workout_id: res.workoutId } as never)
      .eq('id', sessionId)
      .eq('coach_id', user.id);
    if (linkErr) return fail(500, { error: linkErr.message });

    return { success: true, fromTemplate: true };
  },

  // Reprograma una cita (nueva fecha/hora). starts_at/ends_at llegan ya en ISO
  // calculados en el navegador (zona local del coach).
  reschedule: async ({ request, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const fd = await request.formData();
    const id = fd.get('session_id') as string;
    const startsAt = fd.get('starts_at') as string;
    const endsAt = fd.get('ends_at') as string;
    if (!id || !startsAt || !endsAt) return fail(400, { error: 'Falta fecha u hora.' });

    const { error } = await supabase
      .from('sessions')
      .update({ starts_at: startsAt, ends_at: endsAt } as never)
      .eq('id', id)
      .eq('coach_id', user.id);
    if (error) return fail(500, { error: error.message });
    return { success: true, rescheduled: true };
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
    if (createErr || !created)
      return fail(500, { error: createErr?.message ?? 'No se pudo crear la cita.' });
    const sessionId = (created as { id: string }).id;

    // Si eligió plantilla, materializarla y ligarla.
    if (templateId) {
      const date = isoDateInTZ(new Date(startsAt), DEFAULT_TZ);
      const res = await materializeTemplateWorkout(supabase, user.id, clientId, date, templateId, {
        overwrite: true
      });
      if ('workoutId' in res) {
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
