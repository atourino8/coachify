// Ajustes del entrenador.
//
// Nace de un agujero concreto: hoy el nombre solo se escribe en el asistente
// de alta y después NO hay forma de cambiarlo en toda la aplicación. Eso pasó
// de ser molesto a ser un problema cuando la cabecera del cliente empezó a
// enseñar el nombre de su entrenador: una errata al registrarse la ven todos
// sus clientes, todos los días, y él no puede arreglarla.

import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, user } }) => {
  if (!user) redirect(303, '/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, brand_accent, brand_accent_2')
    .eq('id', user.id)
    .single();

  return {
    nombre: profile?.full_name ?? '',
    email: user.email ?? '',
    tieneMarca: Boolean(profile?.brand_accent)
  };
};

export const actions: Actions = {
  nombre: async ({ request, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const nombre = ((await request.formData()).get('full_name') as string)?.trim() ?? '';

    // Se exige nombre: si se permitiera vacío, sus clientes verían "Treno" en
    // la cabecera en vez de a su entrenador, que es justo lo contrario de lo
    // que buscamos.
    if (nombre.length < 2) {
      return fail(400, { error: 'Escribe tu nombre: es lo que ven tus clientes.' });
    }
    if (nombre.length > 80) {
      return fail(400, { error: 'El nombre es demasiado largo.' });
    }

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: nombre } as never)
      .eq('id', user.id);

    if (error) return fail(500, { error: error.message });
    return { success: true };
  }
};
