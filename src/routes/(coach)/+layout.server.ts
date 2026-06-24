// Layout server del coach: verifica que el usuario sea coach. Si no, redirige.

import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
  const { session, user } = await safeGetSession();
  if (!session || !user) redirect(303, '/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) redirect(303, '/login?error=no-profile');
  if (profile.role !== 'coach') redirect(303, '/today');

  return { profile };
};
