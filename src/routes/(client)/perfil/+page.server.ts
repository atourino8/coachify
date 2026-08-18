// El perfil del cliente. No existía: hasta ahora un cliente no tenía ninguna
// pantalla suya, solo las tres de entrenar. Nace porque la foto es lo primero
// que tiene sentido que gestione él mismo —es su cara—, y de paso resuelve un
// agujero viejo: tampoco podía corregir su nombre si venía mal de la
// invitación.

import { fail, redirect } from '@sveltejs/kit';
import { guardarAvatar, quitarAvatar, urlDeAvatar } from '$lib/avatares.server';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, user } }) => {
  if (!user) redirect(303, '/login');

  const { data: perfil } = await supabase
    .from('profiles')
    .select('full_name, avatar_path')
    .eq('id', user.id)
    .single();
  const p = perfil as { full_name: string | null; avatar_path: string | null } | null;

  return {
    nombre: p?.full_name ?? '',
    email: user.email ?? '',
    tieneFoto: Boolean(p?.avatar_path),
    avatar: await urlDeAvatar(supabase, p?.avatar_path ?? null)
  };
};

export const actions: Actions = {
  foto: async ({ request, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');

    const { data: actual } = await supabase
      .from('profiles')
      .select('avatar_path')
      .eq('id', user.id)
      .single();
    const anterior = (actual as { avatar_path: string | null } | null)?.avatar_path ?? null;

    const fd = await request.formData();
    if (fd.get('quitar')) {
      const { error } = await quitarAvatar(supabase, user.id, anterior);
      if (error) return fail(500, { error });
      return { success: true, fotoQuitada: true };
    }

    const res = await guardarAvatar(supabase, user.id, fd.get('foto') as File | null, anterior);
    if ('error' in res) return fail(400, { error: res.error });
    return { success: true, fotoGuardada: true };
  },

  nombre: async ({ request, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const nombre = ((await request.formData()).get('full_name') as string)?.trim() ?? '';
    if (!nombre) return fail(400, { error: 'Escribe tu nombre.' });

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: nombre.slice(0, 80) } as never)
      .eq('id', user.id);
    if (error) return fail(500, { error: error.message });
    return { success: true, nombreGuardado: true };
  }
};
