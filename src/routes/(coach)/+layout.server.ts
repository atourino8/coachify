// Layout server del coach: verifica que el usuario sea coach. Si no, redirige.

import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ url, locals: { supabase, safeGetSession } }) => {
  const { session, user } = await safeGetSession();
  if (!session || !user) redirect(303, '/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

  if (!profile) redirect(303, '/login?error=no-profile');
  if (profile.role !== 'coach') redirect(303, '/today');

  // Primer login: al asistente. Se excluye la propia ruta del asistente para
  // no entrar en bucle, y el asistente siempre deja salir (marca onboarded_at
  // tanto si se completa como si se salta).
  //
  // El `in profile` no sobra: si este código llega a producción antes de que
  // se aplique la migración 0012, la columna no existe, el valor sería
  // undefined y todo coach quedaría encerrado en el asistente sin forma de
  // marcarlo como hecho. Sin la columna, simplemente no redirigimos.
  const tieneColumna = 'onboarded_at' in profile;
  if (tieneColumna && !profile.onboarded_at && url.pathname !== '/onboarding') {
    redirect(303, '/onboarding');
  }

  return { profile };
};
