// Home del cliente: el entreno de HOY (o de la fecha ?date) + próximos entrenos.
//
// "Hoy" se computa en la zona horaria del cliente (profile.timezone, por
// defecto Europe/Madrid). En SSR, new Date() da la fecha UTC del servidor de
// Vercel, que de noche en España va un día por detrás -> el entreno de hoy no
// aparecía. Con la zona horaria correcta se soluciona.

import { redirect } from '@sveltejs/kit';
import { todayISOInTZ } from '$lib/week';
import { supabaseAdmin } from '$lib/supabase/admin';
import type { WorkoutWithItems, WorkoutItemWithRelations } from '$lib/supabase/types';
import type { PageServerLoad } from './$types';

const DEFAULT_TZ = 'Europe/Madrid';

export const load: PageServerLoad = async ({ url, locals: { supabase, user }, parent }) => {
  if (!user) redirect(303, '/login');

  const { profile } = await parent();
  const tz = profile?.timezone || DEFAULT_TZ;
  const today = todayISOInTZ(tz);
  const viewDate = url.searchParams.get('date') ?? today;

  // Cargamos una ventana amplia de entrenos publicados desde hoy (o desde la
  // fecha vista si es anterior) para 30 días. Así "hoy" + "próximos" salen de
  // una sola consulta y evitamos el problema de mirar solo la fecha exacta.
  const fromDate = viewDate < today ? viewDate : today;

  const { data: workoutsRaw } = await supabase
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
    .eq('published', true)
    .gte('date', fromDate)
    .order('date', { ascending: true })
    .limit(30);

  const workouts = (workoutsRaw ?? []) as unknown as (WorkoutWithItems & { date: string })[];

  // Ordenar los items de cada entreno
  for (const w of workouts) {
    if (w.workout_items) {
      w.workout_items.sort(
        (a: WorkoutItemWithRelations, b: WorkoutItemWithRelations) => a.order_index - b.order_index
      );
    }
  }

  // Entreno "héroe": el de la fecha vista (hoy por defecto)
  const heroWorkout = workouts.find((w) => w.date === viewDate) ?? null;

  // Próximos: los que vienen DESPUÉS de la fecha vista
  const upcoming = workouts
    .filter((w) => w.date > viewDate)
    .map((w) => ({
      id: w.id,
      date: w.date,
      title: w.title,
      itemCount: w.workout_items?.length ?? 0,
      done: (w.workout_items ?? []).some((it) => (it.set_logs?.length ?? 0) > 0)
    }));

  // Propuestas de cita pendientes de confirmar (el coach las propuso).
  const { count: proposalCount } = await supabase
    .from('sessions')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', user.id)
    .eq('status', 'requested')
    .neq('requested_by', user.id);

  // Email del coach (para el atajo "Contactar a mi coach"). Vive en auth.users.
  let coachEmail: string | null = null;
  if (profile?.coach_id) {
    try {
      const { data: au } = await supabaseAdmin.auth.admin.getUserById(profile.coach_id);
      coachEmail = au?.user?.email ?? null;
    } catch {
      // Si no se puede leer, el atajo se ocultará.
    }
  }

  return {
    workout: heroWorkout,
    date: viewDate,
    isToday: viewDate === today,
    upcoming,
    proposalCount: proposalCount ?? 0,
    coachEmail
  };
};
