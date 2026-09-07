// Detalle / edición / archivado de un ejercicio.

import { error, fail, redirect } from '@sveltejs/kit';
import { etiquetasParaGuardar } from '$lib/exercise-tags';
import { BUCKET_COACH, validarImagen, validarTramo } from '$lib/coach-media';
import { videosDelCoach, resolverVideo } from '$lib/videos.server';
import { avisar } from '$lib/aviso.server';
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

  // URL firmada de lo que esté subido. El cubo es privado, así que no hay
  // enlaces permanentes: se firman al cargar la página y caducan en una hora.
  const firmar = async (ruta: string | null | undefined) => {
    if (!ruta) return null;
    const { data } = await supabase.storage.from(BUCKET_COACH).createSignedUrl(ruta, 3600);
    return data?.signedUrl ?? null;
  };

  const [imagenFirmada, biblioteca] = await Promise.all([
    firmar(exercise.image_path),
    videosDelCoach(supabase, user.id)
  ]);

  return {
    exercise,
    imagenFirmada,
    videos: biblioteca.videos,
    usosDeVideo: biblioteca.usos
  };
};

export const actions: Actions = {
  update: async ({ request, params, cookies, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const formData = await request.formData();

    const name = (formData.get('name') as string)?.trim();
    if (!name || name.length < 2) {
      return fail(400, { error: 'El nombre es obligatorio.' });
    }

    // La imagen sigue colgando del ejercicio: es SUYA, no se comparte. El
    // fichero ya se subió desde el navegador para poder enseñar el progreso,
    // así que aquí solo llega la ruta.
    const imagen = {
      image_url: (formData.get('image_url') as string)?.trim() || null,
      image_path: (formData.get('image_path') as string)?.trim() || null
    };
    const problemaImagen = validarImagen(imagen);
    if (problemaImagen) return fail(400, { error: problemaImagen });

    // El vídeo NO cuelga del ejercicio desde la 0026: se elige de su biblioteca
    // o se crea uno nuevo allí (ADR-005).
    const video = await resolverVideo(supabase, user.id, formData);
    if ('error' in video) return fail(400, { error: video.error });

    const tramo = validarTramo(
      formData.get('video_desde') as string,
      formData.get('video_hasta') as string
    );
    if ('error' in tramo) return fail(400, { error: tramo.error });

    // Sin vídeo no hay tramo ni nota que valgan: dejarlos puestos guardaría un
    // «mira el segundo 40» de un vídeo que ya no está.
    const nota = video.videoId
      ? ((formData.get('video_nota') as string)?.trim() || null)?.slice(0, 300) || null
      : null;

    // Antes de guardar hay que saber qué imagen había, para limpiar el fichero
    // que deja de usarse. Sin esto, cambiar una imagen subida por un enlace
    // dejaría la vieja en el cubo para siempre: ocupando espacio y sin ninguna
    // fila que la mencione, o sea imposible de encontrar.
    const { data: antes } = await supabase
      .from('exercises')
      .select('image_path')
      .eq('id', params.id)
      .eq('coach_id', user.id)
      .single();

    const { error: dbError } = await supabase
      .from('exercises')
      .update({
        name,
        description: (formData.get('description') as string)?.trim() || null,
        ...imagen,
        video_id: video.videoId,
        video_nota: nota,
        video_desde: video.videoId ? tramo.desde : null,
        video_hasta: video.videoId ? tramo.hasta : null,
        ...etiquetasParaGuardar(formData)
      } as never)
      .eq('id', params.id)
      .eq('coach_id', user.id);

    if (dbError) return fail(500, { error: dbError.message });

    // Se borra DESPUÉS de guardar, no antes: si el guardado falla, el fichero
    // sigue ahí y la fila sigue apuntándolo. Al revés se perdería el archivo y
    // la fila quedaría señalando a la nada.
    //
    // Y SOLO LA IMAGEN. El vídeo que deja de usar aquí puede estar en uso por
    // otros ejercicios: dejar de apuntarlo no autoriza a borrarlo. Para eso
    // está la acción `borrarVideo`, que cuenta a cuántos afecta.
    if (antes?.image_path && antes.image_path !== imagen.image_path) {
      await supabase.storage.from(BUCKET_COACH).remove([antes.image_path]);
    }

    avisar(cookies, 'Cambios guardados.');
    return { success: true };
  },

  /**
   * Borrar un vídeo de la biblioteca, de verdad: fila y fichero.
   *
   * La relación es `on delete set null`, así que los ejercicios que lo usaban
   * se quedan sin vídeo pero no se rompen. Un `restrict` obligaría a
   * desengancharlos de uno en uno antes de poder borrar, que es peor.
   *
   * Lo importante es que el entrenador sepa a cuántos afecta ANTES, y eso lo
   * enseña la pantalla con el recuento que ya viene cargado.
   */
  borrarVideo: async ({ request, cookies, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const id = ((await request.formData()).get('video_id') as string)?.trim();
    if (!id) return fail(400, { error: 'Falta el vídeo.' });

    const { data: vid } = await supabase
      .from('coach_videos')
      .select('id, path')
      .eq('id', id)
      .eq('coach_id', user.id)
      .maybeSingle();
    if (!vid) return fail(403, { error: 'Ese vídeo no es tuyo.' });

    const { count } = await supabase
      .from('exercises')
      .select('id', { count: 'exact', head: true })
      .eq('coach_id', user.id)
      .eq('video_id', id);

    const { error: delErr } = await supabase
      .from('coach_videos')
      .delete()
      .eq('id', id)
      .eq('coach_id', user.id);
    if (delErr) return fail(500, { error: delErr.message });

    // El fichero DESPUÉS de la fila, y solo si la fila se fue: al revés, un
    // fallo al borrar la fila dejaría una fila apuntando a un fichero que ya
    // no existe, que es peor que un huérfano en el cubo.
    const ruta = (vid as { path: string | null }).path;
    if (ruta) await supabase.storage.from(BUCKET_COACH).remove([ruta]);

    const n = count ?? 0;
    avisar(
      cookies,
      n > 0
        ? `Vídeo borrado. ${n} ${n === 1 ? 'ejercicio se ha quedado' : 'ejercicios se han quedado'} sin vídeo.`
        : 'Vídeo borrado.',
      n > 0 ? 'aviso' : 'ok'
    );
    return { success: true };
  },

  archive: async ({ params, cookies, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    // Archivar NO borra el material: es reversible y el ejercicio puede seguir
    // dentro de entrenos ya programados. Los ficheros se limpian al borrar de
    // verdad, desde la biblioteca.
    await supabase
      .from('exercises')
      .update({ archived: true })
      .eq('id', params.id)
      .eq('coach_id', user.id);
    // El aviso ANTES del redirect, y por eso va en cookie: al aterrizar en la
    // biblioteca el ejercicio ya no está en la lista, y sin una palabra que lo
    // diga parece que se ha borrado o que se ha perdido.
    avisar(cookies, 'Ejercicio archivado. Puedes restaurarlo desde el filtro «Archivados».');
    redirect(303, '/exercises');
  }
};
