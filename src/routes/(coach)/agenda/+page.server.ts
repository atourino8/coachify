// Agenda del coach: bandeja de citas. Ve solicitudes y confirmadas,
// puede confirmar / rechazar / cancelar.

import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

type SessionRow = {
  id: string;
  client_id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  modality: string;
  location: string | null;
  notes: string | null;
  client: { id: string; full_name: string | null } | null;
};

export const load: PageServerLoad = async ({ locals: { supabase, user } }) => {
  if (!user) redirect(303, '/login');

  const { data: sessionsRaw } = await supabase
    .from('sessions')
    .select(
      `id, client_id, starts_at, ends_at, status, modality, location, notes,
       client:profiles!sessions_client_id_fkey(id, full_name)`
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

  return { pending, confirmed, history };
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
  }
};
