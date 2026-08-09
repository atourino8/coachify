// Layout server del cliente: verifica que el usuario sea client. Si no, redirige.

import { redirect } from '@sveltejs/kit';
import { identidadDeMarca } from '$lib/brand';
import { accesoDelCliente } from '$lib/access';
import { todayISOInTZ } from '$lib/week';
import { supabaseAdmin } from '$lib/supabase/admin';
import type { LayoutServerLoad } from './$types';

const TZ_POR_DEFECTO = 'Europe/Madrid';

export const load: LayoutServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
  const { session, user } = await safeGetSession();
  if (!session || !user) redirect(303, '/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

  if (!profile) redirect(303, '/login?error=no-profile');
  if (profile.role !== 'client') redirect(303, '/dashboard');

  // La identidad que ve el cliente es la de SU ENTRENADOR, no la nuestra.
  // Para él esta aplicación es el sitio donde su entrenador le pone los
  // entrenos; que le reciba una marca que no ha contratado no ayuda a nadie.
  //
  // La consulta no necesita permisos especiales: la política
  // profiles_select_own_or_related de la migración 0002 ya deja a un cliente
  // leer la fila de su entrenador. Si algún día se rompe esa política, esto
  // devuelve null y se cae con elegancia a la marca de Treno.
  let marca = identidadDeMarca(null, null, null);
  let bloqueoActivado = false;
  let nombreCoach: string | null = null;

  if (profile.coach_id) {
    const { data: coach } = await supabase
      .from('profiles')
      .select('full_name, brand_accent, brand_accent_2, block_on_overdue')
      .eq('id', profile.coach_id)
      .maybeSingle();

    if (coach) {
      nombreCoach = coach.full_name;
      marca = identidadDeMarca(
        coach.full_name,
        coach.brand_accent ?? null,
        coach.brand_accent_2 ?? null
      );
      // El ?? false vale también de red de seguridad: si esto llega a
      // producción antes que la migración 0015, la columna no existe, el valor
      // es undefined y nadie queda bloqueado. Fallar hacia el lado que no
      // cierra puertas.
      bloqueoActivado = coach.block_on_overdue ?? false;
    }
  }

  // El acceso se decide UNA vez, aquí, y las rutas solo lo consultan. Si cada
  // ruta lo calculara por su cuenta, olvidarse en una sola dejaría abierta
  // justo la puerta que nadie revisó.
  //
  // Se lee con el cliente ADMIN, y no es un atajo. La RLS de client_info es
  // solo para el entrenador (migración 0008), así que con la sesión del
  // cliente esta consulta devolvería null y el bloqueo no se activaría nunca:
  // un fallo mudo, de los peores.
  //
  // Y no se arregla dándole al cliente permiso de lectura sobre su fila,
  // porque en esa misma tabla vive `coach_notes`: las notas privadas que el
  // entrenador escribe SOBRE él ("lumbago", "no viene si no le insistes").
  // La RLS es por filas, no por columnas: abrir la fila abre las notas.
  //
  // Aquí se leen exactamente dos campos, en servidor, filtrando por su propio
  // id. Nada de esto llega al navegador salvo el veredicto.
  const { data: info } = await supabaseAdmin
    .from('client_info')
    .select('fee_amount, paid_until')
    .eq('client_id', user.id)
    .maybeSingle();

  // Fecha local del cliente, no UTC: a las 00:30 en Madrid el UTC todavía es
  // ayer, y adelantar un día el corte es exactamente el fallo que este
  // periodo de gracia existe para evitar.
  const hoy = todayISOInTZ(profile.timezone || TZ_POR_DEFECTO);
  const acceso = accesoDelCliente(bloqueoActivado, info ?? null, hoy);

  return { profile, marca, acceso, nombreCoach };
};
