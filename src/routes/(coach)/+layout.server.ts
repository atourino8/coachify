// Layout server del coach: verifica que el usuario sea coach. Si no, redirige.

import { redirect } from '@sveltejs/kit';
import { identidadDeMarca } from '$lib/brand';
import { avisosDelCoach, cuentaSinVer } from '$lib/avisos.server';
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

  // Su marca. Se calcula en el servidor para que llegue ya pintada: si se
  // hiciera al hidratar, el entrenador vería medio segundo de naranja Treno
  // antes de que apareciera su color, en cada carga.
  //
  // El `?? null` no sobra por lo mismo que el `in profile` de arriba: si esto
  // llega a producción antes que la migración 0014, las columnas no existen y
  // la marca sale vacía, que es exactamente el comportamiento correcto.
  const marca = identidadDeMarca(
    profile.full_name,
    profile.brand_accent ?? null,
    profile.brand_accent_2 ?? null
  );

  // Contador de la campana. Sale de la MISMA función que la pantalla de
  // avisos: si se contara por separado, un día el número y la lista dirían
  // cosas distintas y no habría forma de saber cuál está mal.
  //
  // Si algo falla —por ejemplo, la migración 0018 sin aplicar— la cabecera se
  // queda sin número en vez de tumbar todas las pantallas del entrenador.
  let sinVer = 0;
  try {
    sinVer = cuentaSinVer(await avisosDelCoach(supabase, user.id));
  } catch {
    sinVer = 0;
  }

  return { profile, marca, sinVer };
};
