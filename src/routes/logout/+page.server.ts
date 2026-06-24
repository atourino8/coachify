// Logout: invalida la sesión y redirige al home.

import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
  await supabase.auth.signOut();
  redirect(303, '/');
};

export const actions: Actions = {
  default: async ({ locals: { supabase } }) => {
    await supabase.auth.signOut();
    redirect(303, '/');
  }
};
