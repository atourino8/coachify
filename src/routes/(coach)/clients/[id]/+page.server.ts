// Detalle del cliente: perfil + calendario semanal con sus workouts.

import { error, redirect } from '@sveltejs/kit';
import { addDays, formatDateISO, todayISOLocal } from '$lib/week';
import type { WorkoutSummary } from '$lib/supabase/types';
import type { PageServerLoad } from './$types';

const WINDOW_DAYS = 7;

export const load: PageServerLoad = async ({ params, url, locals: { supabase, user } }) => {
  if (!user) redirect(303, '/login');

  // Cargar perfil del cliente
  const { data: client, error: clientError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', params.id)
    .eq('coach_id', user.id)
    .single();

  if (clientError || !client) error(404, 'Cliente no encontrado');

  // Ventana móvil de WINDOW_DAYS días. Por defecto empieza HOY (no el lunes),
  // para que el coach nunca vea días pasados por defecto. El parámetro
  // ?start=YYYY-MM-DD permite navegar hacia adelante/atrás.
  const startParam = url.searchParams.get('start');
  const windowStart = startParam ?? todayISOLocal();
  const windowEnd = formatDateISO(addDays(new Date(windowStart + 'T00:00:00'), WINDOW_DAYS - 1));

  const { data: workoutsRaw } = await supabase
    .from('workouts')
    .select('id, date, title, notes, workout_items(id)')
    .eq('client_id', params.id)
    .gte('date', windowStart)
    .lte('date', windowEnd);

  const workouts = (workoutsRaw ?? []) as unknown as WorkoutSummary[];

  const workoutsByDate: Record<string, WorkoutSummary> = {};
  for (const w of workouts) workoutsByDate[w.date] = w;

  return {
    client,
    windowStart,
    windowDays: WINDOW_DAYS,
    workoutsByDate
  };
};
