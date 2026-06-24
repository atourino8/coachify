// Detalle de un workout_item para el cliente: vídeo + form para registrar series.

import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, locals: { supabase, user } }) => {
  if (!user) redirect(303, '/login');

  const { data: item, error: itemError } = await supabase
    .from('workout_items')
    .select(
      `*,
       exercise:exercises(*),
       workout:workouts(id, date, client_id),
       set_logs(*)`
    )
    .eq('id', params.id)
    .single();

  if (itemError || !item) error(404, 'Ejercicio no encontrado');
  // Validar que el workout es del cliente autenticado
  if (item.workout.client_id !== user.id) error(403, 'No autorizado');

  // Ordenar set_logs por número
  item.set_logs?.sort((a, b) => a.set_number - b.set_number);

  return { item };
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
    const { data: item } = await supabase
      .from('workout_items')
      .select('exercise_id, workout:workouts(client_id)')
      .eq('id', params.id)
      .single();
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
  }
};
