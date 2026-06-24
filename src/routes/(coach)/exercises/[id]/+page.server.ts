// Detalle / edición / archivado de un ejercicio.

import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, locals: { supabase, user } }) => {
  if (!user) redirect(303, '/login');

  const { data: exercise, error: dbError } = await supabase
    .from('exercises')
    .select('*')
    .eq('id', params.id)
    .eq('coach_id', user.id)
    .single();

  if (dbError || !exercise) error(404, 'Ejercicio no encontrado');
  return { exercise };
};

export const actions: Actions = {
  update: async ({ request, params, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const formData = await request.formData();

    const name = (formData.get('name') as string)?.trim();
    if (!name || name.length < 2) {
      return fail(400, { error: 'El nombre es obligatorio.' });
    }

    const { error: dbError } = await supabase
      .from('exercises')
      .update({
        name,
        description: (formData.get('description') as string)?.trim() || null,
        video_url: (formData.get('video_url') as string)?.trim() || null,
        muscle_group: ((formData.get('muscle_group') as string) || null) as never,
        equipment: ((formData.get('equipment') as string) || null) as never
      })
      .eq('id', params.id)
      .eq('coach_id', user.id);

    if (dbError) return fail(500, { error: dbError.message });
    return { success: true };
  },

  archive: async ({ params, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    await supabase
      .from('exercises')
      .update({ archived: true })
      .eq('id', params.id)
      .eq('coach_id', user.id);
    redirect(303, '/exercises');
  }
};
