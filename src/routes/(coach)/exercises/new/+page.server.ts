// Crear nuevo ejercicio.

import { fail, redirect } from '@sveltejs/kit';
import { etiquetasParaGuardar } from '$lib/exercise-tags';
import { resolverVideo } from '$lib/videos.server';
import { avisar } from '$lib/aviso.server';
import type { Actions } from './$types';

export const actions: Actions = {
  default: async ({ request, cookies, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const formData = await request.formData();

    const name = (formData.get('name') as string)?.trim();
    const description = (formData.get('description') as string)?.trim() || null;

    if (!name || name.length < 2) {
      return fail(400, { error: 'El nombre del ejercicio es obligatorio.' });
    }

    // Un enlace aquí crea un vídeo en SU BIBLIOTECA, no una columna de este
    // ejercicio (ADR-005): desde el primer momento se puede reutilizar en otra
    // variante. Le ponemos de nombre el del ejercicio, que es lo que acaba de
    // escribir y lo que reconocerá después.
    formData.set('video_nuevo_nombre', name);
    const video = await resolverVideo(supabase, user.id, formData);
    if ('error' in video) return fail(400, { error: video.error });

    const { data, error } = await supabase
      .from('exercises')
      .insert({
        coach_id: user.id,
        name,
        description,
        video_id: video.videoId,
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

    // Se aterriza en la ficha del ejercicio recién creado, que se parece
    // bastante al formulario que se acaba de rellenar: sin una palabra, no se
    // distingue de «no se ha guardado y me lo ha devuelto».
    avisar(cookies, 'Ejercicio creado.');
    redirect(303, `/exercises/${data.id}`);
  }
};
