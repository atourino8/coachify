// Detalle del cliente: perfil + calendario semanal con sus workouts.

import { error, redirect } from '@sveltejs/kit';
import { startOfWeek, addDays, formatDateISO } from '$lib/week';
import type { PageServerLoad } from './$types';

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

  // ¿Qué semana mostrar? Parametro ?week=YYYY-MM-DD del lunes
  const weekParam = url.searchParams.get('week');
  const refDate = weekParam ? new Date(weekParam + 'T00:00:00') : new Date();
  const weekStart = startOfWeek(refDate);
  const weekEnd = addDays(weekStart, 6);

  // Cargar workouts de esa semana para ese cliente
  const { data: workouts } = await supabase
    .from('workouts')
    .select('id, date, title, notes, workout_items(id)')
    .eq('client_id', params.id)
    .gte('date', formatDateISO(weekStart))
    .lte('date', formatDateISO(weekEnd));

  // Indexar por fecha para fácil acceso desde la UI
  const workoutsByDate: Record<string, typeof workouts[number]> = {};
  for (const w of workouts ?? []) workoutsByDate[w.date] = w;

  return {
    client,
    weekStart: formatDateISO(weekStart),
    workoutsByDate
  };
};
