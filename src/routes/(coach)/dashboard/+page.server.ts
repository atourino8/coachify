// Datos del dashboard: contadores reales para los badges.

import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, user } }) => {
  if (!user) redirect(303, '/login');

  const [exercisesRes, clientsRes] = await Promise.all([
    supabase
      .from('exercises')
      .select('id', { count: 'exact', head: true })
      .eq('coach_id', user.id)
      .eq('archived', false),
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('coach_id', user.id)
      .eq('archived', false)
  ]);

  return {
    counts: {
      exercises: exercisesRes.count ?? 0,
      clients: clientsRes.count ?? 0
    }
  };
};
