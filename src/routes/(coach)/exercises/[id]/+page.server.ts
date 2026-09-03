// Detalle / edición / archivado de un ejercicio.

import { error, fail, redirect } from '@sveltejs/kit';
import { etiquetasParaGuardar } from '$lib/exercise-tags';
import { BUCKET_COACH, validarOrigenes } from '$lib/coach-media';
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

  // URL firmadas de lo que esté subido. El cubo es privado, así que no hay
  // enlaces permanentes: se firman al cargar la página y caducan en una hora.
  const firmar = async (ruta: string | null | undefined) => {
    if (!ruta) return null;
    const { data } = await supabase.storage.from(BUCKET_COACH).createSignedUrl(ruta, 3600);
    return data?.signedUrl ?? null;
  };

  const [videoFirmado, imagenFirmada] = await Promise.all([
    firmar(exercise.video_path),
    firmar(exercise.image_path)
  ]);

  return { exercise, videoFirmado, imagenFirmada };
};

export const actions: Actions = {
  update: async ({ request, params, cookies, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const formData = await request.formData();

    const name = (formData.get('name') as string)?.trim();
    if (!name || name.length < 2) {
      return fail(400, { error: 'El nombre es obligatorio.' });
    }

    // Los ficheros ya se subieron desde el navegador antes de enviar el
    // formulario (para poder enseñar el progreso real). Aquí solo llegan las
    // rutas resultantes.
    const campos = {
      video_url: (formData.get('video_url') as string)?.trim() || null,
      video_path: (formData.get('video_path') as string)?.trim() || null,
      image_url: (formData.get('image_url') as string)?.trim() || null,
      image_path: (formData.get('image_path') as string)?.trim() || null
    };

    const problema = validarOrigenes(campos);
    if (problema) return fail(400, { error: problema });

    // Antes de guardar hay que saber qué había, para limpiar el fichero que
    // deja de usarse. Sin esto, cambiar un vídeo subido por un enlace de
    // YouTube dejaría el vídeo viejo en el cubo para siempre: ocupando espacio
    // y sin ninguna fila que lo mencione, o sea imposible de encontrar.
    const { data: antes } = await supabase
      .from('exercises')
      .select('video_path, image_path')
      .eq('id', params.id)
      .eq('coach_id', user.id)
      .single();

    const { error: dbError } = await supabase
      .from('exercises')
      .update({
        name,
        description: (formData.get('description') as string)?.trim() || null,
        ...campos,
        ...etiquetasParaGuardar(formData)
      } as never)
      .eq('id', params.id)
      .eq('coach_id', user.id);

    if (dbError) return fail(500, { error: dbError.message });

    // Se borra DESPUÉS de guardar, no antes: si el guardado falla, el fichero
    // sigue ahí y la fila sigue apuntándolo. Al revés se perdería el archivo y
    // la fila quedaría señalando a la nada.
    const aBorrar = [
      antes?.video_path && antes.video_path !== campos.video_path ? antes.video_path : null,
      antes?.image_path && antes.image_path !== campos.image_path ? antes.image_path : null
    ].filter((r): r is string => Boolean(r));

    if (aBorrar.length > 0) await supabase.storage.from(BUCKET_COACH).remove(aBorrar);

    avisar(cookies, 'Cambios guardados.');
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
