// Crear nuevo ejercicio.

import { fail, redirect } from '@sveltejs/kit';
import { etiquetasParaGuardar } from '$lib/exercise-tags';
import { idDeYoutube } from '$lib/coach-media';
import type { Actions } from './$types';

export const actions: Actions = {
  default: async ({ request, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const formData = await request.formData();

    const name = (formData.get('name') as string)?.trim();
    const description = (formData.get('description') as string)?.trim() || null;
    const video_url = (formData.get('video_url') as string)?.trim() || null;

    if (!name || name.length < 2) {
      return fail(400, { error: 'El nombre del ejercicio es obligatorio.' });
    }
    // Misma comprobación que al editar: lo que se guarda acaba en un iframe,
    // y solo se admite lo que sabemos reconstruir como URL de YouTube.
    if (video_url && !idDeYoutube(video_url)) {
      return fail(400, { error: 'Ese enlace no parece un vídeo de YouTube.' });
    }

    const { data, error } = await supabase
      .from('exercises')
      .insert({
        coach_id: user.id,
        name,
        description,
        video_url,
        // Las columnas sueltas muscle_group y equipment NO se escriben: las
        // calcula el disparador de la migración 0016 a partir de los arrays.
        ...etiquetasParaGuardar(formData)
      } as never)
      .select()
      .single();

    if (error) {
      console.error('Error creando ejercicio:', error);
      return fail(500, { error: error.message });
    }

    redirect(303, `/exercises/${data.id}`);
  }
};
