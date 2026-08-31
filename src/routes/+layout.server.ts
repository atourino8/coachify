// Carga la sesión en cada navegación para que esté disponible en todas las rutas.

import { tomarAviso } from '$lib/aviso.server';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { safeGetSession }, cookies }) => {
  const { session } = await safeGetSession();
  return {
    session,
    // El aviso de la última acción, si lo hay. Se lee AQUÍ y no en cada
    // pantalla porque tiene que sobrevivir a las redirecciones: la acción pasa
    // en una ruta y el mensaje se enseña en otra.
    aviso: tomarAviso(cookies),
    cookies: cookies.getAll()
  };
};
