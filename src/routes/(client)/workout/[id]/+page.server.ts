// Detalle de un workout_item para el cliente: vídeo + form para registrar series.

import { error, fail, redirect } from '@sveltejs/kit';
import { BUCKET } from '$lib/technique';
import type {
  WorkoutItemWithWorkout,
  SetLog,
  WorkoutItemMinimal,
  TechniqueVideo
} from '$lib/supabase/types';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, locals: { supabase, user }, parent }) => {
  if (!user) redirect(303, '/login');

  const { profile } = await parent();

  const { data: itemRaw, error: itemError } = await supabase
    .from('workout_items')
    .select(
      `*,
       exercise:exercises(*),
       workout:workouts(id, date, client_id),
       set_logs(*)`
    )
    .eq('id', params.id)
    .single();

  if (itemError || !itemRaw) error(404, 'Ejercicio no encontrado');

  // Cast: los joins de Supabase se infieren como array, pero aquí son objeto.
  const item = itemRaw as unknown as WorkoutItemWithWorkout;

  // Validar que el workout es del cliente autenticado
  if (item.workout.client_id !== user.id) error(403, 'No autorizado');

  // Ordenar set_logs por número
  item.set_logs?.sort((a: SetLog, b: SetLog) => a.set_number - b.set_number);

  // --- Vídeos de técnica de este ejercicio (máx. 2: 'first' y 'latest') ---
  const { data: videosRaw } = await supabase
    .from('technique_videos')
    .select('*')
    .eq('client_id', user.id)
    .eq('exercise_id', item.exercise_id);

  const videos = (videosRaw ?? []) as unknown as TechniqueVideo[];

  // URLs firmadas temporales (el bucket es privado: nunca enlaces públicos).
  const signed: Record<string, string> = {};
  for (const v of videos) {
    const { data: s } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(v.storage_path, 60 * 60); // 1 hora
    if (s?.signedUrl) signed[v.kind] = s.signedUrl;
  }

  return {
    item,
    clientId: user.id,
    coachId: profile?.coach_id ?? null,
    techniqueFirst: videos.find((v) => v.kind === 'first') ?? null,
    techniqueLatest: videos.find((v) => v.kind === 'latest') ?? null,
    techniqueUrls: signed
  };
};

export const actions: Actions = {
  logSet: async ({ request, params, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const formData = await request.formData();
    const set_number = Number(formData.get('set_number'));
    const reps_done = formData.get('reps_done')
      ? Number(formData.get('reps_done'))
      : null;
    const weight_done = formData.get('weight_done')
      ? Number(formData.get('weight_done'))
      : null;
    const feedback = (formData.get('feedback') as string) || null;

    if (!set_number || set_number < 1) return fail(400, { error: 'Serie inválida.' });

    // Obtener exercise_id del workout_item
    const { data: itemRaw } = await supabase
      .from('workout_items')
      .select('exercise_id, workout:workouts(client_id)')
      .eq('id', params.id)
      .single();
    const item = itemRaw as unknown as WorkoutItemMinimal | null;
    if (!item || item.workout.client_id !== user.id) return fail(403, { error: 'No autorizado.' });

    // ¿Existe ya un log para esta serie? Si sí, actualizar; si no, crear.
    const { data: existing } = await supabase
      .from('set_logs')
      .select('id')
      .eq('workout_item_id', params.id)
      .eq('client_id', user.id)
      .eq('set_number', set_number)
      .maybeSingle();

    if (existing) {
      const { error: updateError } = await supabase
        .from('set_logs')
        .update({
          reps_done,
          weight_done,
          feedback: feedback as never,
          completed_at: new Date().toISOString()
        })
        .eq('id', existing.id);
      if (updateError) return fail(500, { error: updateError.message });
    } else {
      const { error: insertError } = await supabase.from('set_logs').insert({
        workout_item_id: params.id,
        client_id: user.id,
        exercise_id: item.exercise_id,
        set_number,
        reps_done,
        weight_done,
        feedback: feedback as never
      });
      if (insertError) return fail(500, { error: insertError.message });
    }

    return { success: true, set_number };
  },

  // Borra un vídeo de técnica del cliente (fila + archivo del bucket).
  // Importante: borrar la fila NO borra el archivo de Storage, hay que hacerlo
  // explícitamente para no dejar huérfanos ocupando espacio.
  deleteVideo: async ({ request, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const videoId = (await request.formData()).get('video_id') as string;
    if (!videoId) return fail(400, { error: 'Falta el vídeo.' });

    const { data: vid } = await supabase
      .from('technique_videos')
      .select('id, client_id, storage_path')
      .eq('id', videoId)
      .maybeSingle();
    const video = vid as { id: string; client_id: string; storage_path: string } | null;
    if (!video || video.client_id !== user.id) return fail(403, { error: 'No autorizado.' });

    await supabase.storage.from(BUCKET).remove([video.storage_path]);
    const { error: delErr } = await supabase.from('technique_videos').delete().eq('id', videoId);
    if (delErr) return fail(500, { error: delErr.message });

    return { success: true, videoDeleted: true };
  }
};
