// La marca del entrenador: el color con el que él y sus clientes ven la app.
//
// El objetivo del producto es potenciar al entrenador, no reemplazarlo. Su
// cliente abre esto para ver lo que le ha puesto ÉL, así que la aplicación
// debería parecer suya. Esta pantalla es donde lo decide.

import { fail, redirect } from '@sveltejs/kit';
import { esHexValido, derivarMarca } from '$lib/brand';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, user } }) => {
  if (!user) redirect(303, '/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, brand_accent, brand_accent_2')
    .eq('id', user.id)
    .single();

  return {
    nombre: profile?.full_name ?? null,
    accent: profile?.brand_accent ?? null,
    accent2: profile?.brand_accent_2 ?? null
  };
};

export const actions: Actions = {
  guardar: async ({ request, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const fd = await request.formData();

    const accent = ((fd.get('accent') as string) ?? '').trim();
    const usarSegundo = fd.get('usar_segundo') === 'on';
    const accent2 = ((fd.get('accent_2') as string) ?? '').trim();

    if (!esHexValido(accent)) {
      return fail(400, { error: 'El color principal no es un color válido.' });
    }
    if (usarSegundo && !esHexValido(accent2)) {
      return fail(400, { error: 'El segundo color no es un color válido.' });
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        brand_accent: accent,
        brand_accent_2: usarSegundo ? accent2 : null
      } as never)
      .eq('id', user.id);

    if (error) return fail(500, { error: error.message });

    // Se devuelve si hubo que aclarar el color para poder decírselo en la
    // pantalla. Callárselo sería peor: vería un color distinto al que eligió
    // y no sabría por qué.
    const marca = derivarMarca(accent, usarSegundo ? accent2 : null);
    return {
      success: true,
      corregido: marca?.corregido ?? false,
      contrasteElegido: marca?.contrasteElegido ?? null
    };
  },

  restablecer: async ({ locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');

    // A NULL, no al naranja de Treno. Son cosas distintas: NULL significa
    // "no he elegido", y así el día que cambiemos la paleta por defecto este
    // entrenador se va con ella en vez de quedarse anclado a un naranja que
    // nadie eligió.
    const { error } = await supabase
      .from('profiles')
      .update({ brand_accent: null, brand_accent_2: null } as never)
      .eq('id', user.id);

    if (error) return fail(500, { error: error.message });
    return { success: true, restablecido: true };
  }
};
