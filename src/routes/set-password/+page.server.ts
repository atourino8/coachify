// Verificar que hay sesión activa antes de mostrar el form.
// Si no, redirigir a /login.

import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { safeGetSession } }) => {
  const { session, user } = await safeGetSession();
  if (!session || !user) redirect(303, '/login');
  return { email: user.email };
};
