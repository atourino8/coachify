// Si el visitante ya está logueado, lo mandamos a su dashboard según rol.
// Si no, se queda en la landing pública.

import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
  const { user } = await safeGetSession();
  if (!user) return {};

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role === 'coach') redirect(303, '/dashboard');
  if (profile?.role === 'client') redirect(303, '/today');

  return {};
};
