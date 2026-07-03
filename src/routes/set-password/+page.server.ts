// Verificar que hay sesión activa antes de mostrar el form.
// Si no, redirigir a /login.
//
// Nota: la sesión que vemos aquí es la que hay en las COOKIES HTTP, que puede
// no coincidir con la que hay en localStorage del navegador (típico si el
// callback de invite/recovery acaba de establecer una nueva sesión sólo en
// localStorage). El +page.svelte hace verificación cruzada antes de updateUser.

import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { safeGetSession }, url }) => {
  const { session, user } = await safeGetSession();
  if (!session || !user) redirect(303, '/login');
  const reason = url.searchParams.get('reason') === 'recovery' ? 'recovery' : 'invite';
  return { email: user.email, reason };
};
