// Agenda del coach: bandeja de citas. Confirmar/rechazar/cancelar + asignar
// un entreno a cada cita (o crear uno nuevo desde el constructor).

import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

type SessionRow = {
  id: string;
  client_id: string;
  workout_id: string | null;
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
      `id, client_id, workout_id, starts_at, ends_at, status, modality, location, notes,
       client:profiles!sessions_client_id_fkey(id, full_name),
       workout:workouts(id, title, date)`
    )
    .eq('coach_id', user.id)
    .order('starts_at', { ascending: true });

  const all = (sessionsRaw ?? []) as unknown as SessionRow[];
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

  return { pending, confirmed, history, workoutsByClient };
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
  }
};
