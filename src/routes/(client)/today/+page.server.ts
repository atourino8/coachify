// Carga el workout del día (si existe) para el cliente autenticado.

import { redirect } from '@sveltejs/kit';
import { formatDateISO } from '$lib/week';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals: { supabase, user } }) => {
  if (!user) redirect(303, '/login');

  // ¿Qué día? ?date=YYYY-MM-DD opcional, por defecto hoy
  const dateParam = url.searchParams.get('date');
  const today = dateParam ?? formatDateISO(new Date());

  const { data: workout } = await supabase
    .from('workouts')
    .select(
      `id, date, title, notes, published,
       workout_items(
         id, sets, reps_prescribed, weight_prescribed, rest_seconds, notes, order_index,
         exercise:exercises(id, name, description, video_url, muscle_group),
         set_logs(id, set_number, reps_done, weight_done, completed_at, feedback)
       )`
    )
    .eq('client_id', user.id)
    .eq('date', today)
    .eq('published', true)
    .maybeSingle();

  if (workout?.workout_items) {
    workout.workout_items.sort((a, b) => a.order_index - b.order_index);
  }

  return { workout, date: today };
};
