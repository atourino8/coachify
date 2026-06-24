// Lista de ejercicios del coach autenticado.

import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, user } }) => {
  if (!user) redirect(303, '/login');

  const { data: exercises, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('coach_id', user.id)
    .eq('archived', false)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error cargando ejercicios:', error);
    return { exercises: [] };
  }

  return { exercises: exercises ?? [] };
};

export const actions: Actions = {
  archive: async ({ request, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const formData = await request.formData();
    const id = formData.get('id') as string;
    if (!id) return { success: false, error: 'ID requerido' };

    const { error } = await supabase
      .from('exercises')
      .update({ archived: true })
      .eq('id', id)
      .eq('coach_id', user.id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  }
};
