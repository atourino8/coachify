// Constructor de entreno: carga el workout del día (o lo prepara vacío)
// + la biblioteca completa del coach para poder arrastrar.

import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, locals: { supabase, user } }) => {
  if (!user) redirect(303, '/login');

  // Verificar que el cliente pertenece al coach
  const { data: client } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', params.id)
    .eq('coach_id', user.id)
    .single();
  if (!client) error(404, 'Cliente no encontrado');

  // Cargar biblioteca de ejercicios del coach
  const { data: exercises } = await supabase
    .from('exercises')
    .select('*')
    .eq('coach_id', user.id)
    .eq('archived', false)
    .order('name');

  // ¿Existe ya un workout para esa fecha? Si no, lo dejamos como null.
  const { data: workout } = await supabase
    .from('workouts')
    .select('*, workout_items(*, exercise:exercises(*))')
    .eq('client_id', params.id)
    .eq('date', params.date)
    .maybeSingle();

  // Ordenar items por order_index si existen
  if (workout?.workout_items) {
    workout.workout_items.sort((a, b) => a.order_index - b.order_index);
  }

  return {
    client,
    date: params.date,
    exercises: exercises ?? [],
    workout
  };
};

export const actions: Actions = {
  save: async ({ request, params, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');

    const formData = await request.formData();
    const rawItems = formData.get('items') as string;
    const title = ((formData.get('title') as string) || '').trim() || null;
    const notes = ((formData.get('notes') as string) || '').trim() || null;

    let items: Array<{
      exercise_id: string;
      sets: number;
      reps_prescribed: string;
      weight_prescribed: string;
      rest_seconds: number | null;
      notes: string;
    }>;
    try {
      items = JSON.parse(rawItems || '[]');
    } catch {
      return fail(400, { error: 'Datos inválidos.' });
    }

    // ¿Hay workout ya? Si sí, lo actualizamos; si no, lo creamos.
    const { data: existing } = await supabase
      .from('workouts')
      .select('id')
      .eq('client_id', params.id)
      .eq('date', params.date)
      .maybeSingle();

    let workoutId: string;
    if (existing) {
      workoutId = existing.id;
      await supabase.from('workouts').update({ title, notes }).eq('id', workoutId);
      // Borrar items previos para reemplazar
      await supabase.from('workout_items').delete().eq('workout_id', workoutId);
    } else {
      const { data: created, error: createError } = await supabase
        .from('workouts')
        .insert({
          client_id: params.id,
          coach_id: user.id,
          date: params.date,
          title,
          notes
        })
        .select('id')
        .single();
      if (createError || !created) return fail(500, { error: createError?.message });
      workoutId = created.id;
    }

    // Insertar items con orden secuencial
    if (items.length > 0) {
      const rows = items.map((it, i) => ({
        workout_id: workoutId,
        exercise_id: it.exercise_id,
        order_index: i,
        sets: it.sets || 1,
        reps_prescribed: it.reps_prescribed || null,
        weight_prescribed: it.weight_prescribed || null,
        rest_seconds: it.rest_seconds || null,
        notes: it.notes || null
      }));
      const { error: insertError } = await supabase.from('workout_items').insert(rows);
      if (insertError) return fail(500, { error: insertError.message });
    }

    return { success: true };
  },

  delete: async ({ params, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const { data: existing } = await supabase
      .from('workouts')
      .select('id')
      .eq('client_id', params.id)
      .eq('date', params.date)
      .maybeSingle();
    if (existing) {
      await supabase.from('workouts').delete().eq('id', existing.id);
    }
    redirect(303, `/clients/${params.id}`);
  }
};
