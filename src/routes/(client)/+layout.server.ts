// Layout server del cliente: verifica que el usuario sea client. Si no, redirige.

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
  if (profile.role !== 'client') redirect(303, '/dashboard');

  return { profile };
};
