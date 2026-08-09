// Layout server del cliente: verifica que el usuario sea client. Si no, redirige.

import { redirect } from '@sveltejs/kit';
import { identidadDeMarca } from '$lib/brand';
import type { LayoutServerLoad } from './$types';

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
  if (profile.coach_id) {
    const { data: coach } = await supabase
      .from('profiles')
      .select('full_name, brand_accent, brand_accent_2')
      .eq('id', profile.coach_id)
      .maybeSingle();

    if (coach) {
      marca = identidadDeMarca(
        coach.full_name,
        coach.brand_accent ?? null,
        coach.brand_accent_2 ?? null
      );
    }
  }

  return { profile, marca };
};
