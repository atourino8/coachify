// Home del cliente: el entreno de HOY (o de la fecha ?date) + próximos entrenos.
//
// "Hoy" se computa en la zona horaria del cliente (profile.timezone, por
// defecto Europe/Madrid). En SSR, new Date() da la fecha UTC del servidor de
// Vercel, que de noche en España va un día por detrás -> el entreno de hoy no
// aparecía. Con la zona horaria correcta se soluciona.

import { fail, redirect } from '@sveltejs/kit';
import { todayISOInTZ } from '$lib/week';
import { supabaseAdmin } from '$lib/supabase/admin';
import type { WorkoutWithItems, WorkoutItemWithRelations } from '$lib/supabase/types';
import { avisar } from '$lib/aviso.server';
import type { PageServerLoad, Actions } from './$types';

const DEFAULT_TZ = 'Europe/Madrid';

export const load: PageServerLoad = async ({ url, locals: { supabase, user }, parent }) => {
  if (!user) redirect(303, '/login');

  const { profile, acceso } = await parent();

  // Cuota vencida y su entrenador tiene activado el bloqueo: aquí no hay nada
  // que enseñar. Se corta ANTES de consultar los entrenos, no escondiendo el
  // botón después: una plantilla que no pinta algo sigue habiéndolo mandado.
  if (acceso.pausado) redirect(303, '/pausa');

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

  const workouts = (workoutsRaw ?? []) as unknown as (WorkoutWithItems & {
    date: string;
  })[];

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

  // Siguiente ejercicio sin terminar del entreno de hoy: es el atajo que
  // convierte el home en "seguir donde lo dejé" en vez de "buscar por dónde iba".
  const pendingItem =
    (heroWorkout?.workout_items ?? []).find((it) => (it.set_logs?.length ?? 0) < it.sets) ?? null;
  const started = (heroWorkout?.workout_items ?? []).some((it) => (it.set_logs?.length ?? 0) > 0);

  // Propuestas de cita pendientes de confirmar (el coach las propuso). Traemos
  // los datos completos, no solo el número, para poder confirmarlas desde aquí.
  const { data: propRaw } = await supabase
    .from('sessions')
    .select('id, starts_at, modality, location, notes')
    .eq('client_id', user.id)
    .eq('status', 'requested')
    .neq('requested_by', user.id)
    .order('starts_at', { ascending: true });
  const proposals = (propRaw ?? []) as {
    id: string;
    starts_at: string;
    modality: string;
    location: string | null;
    notes: string | null;
  }[];

  // Próxima cita ya confirmada (para que el home diga cuándo te toca).
  const { data: nextRaw } = await supabase
    .from('sessions')
    .select('id, starts_at, modality, location')
    .eq('client_id', user.id)
    .eq('status', 'confirmed')
    .gte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  const nextSession = (nextRaw ?? null) as {
    id: string;
    starts_at: string;
    modality: string;
    location: string | null;
  } | null;

  // Datos del coach (para el atajo "Contactar a mi coach"). El email vive en
  // auth.users, así que se lee con el cliente admin.
  let coachEmail: string | null = null;
  let coachName: string | null = null;
  if (profile?.coach_id) {
    try {
      const { data: au } = await supabaseAdmin.auth.admin.getUserById(profile.coach_id);
      coachEmail = au?.user?.email ?? null;
      const { data: cp } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', profile.coach_id)
        .maybeSingle();
      coachName = (cp as { full_name: string | null } | null)?.full_name ?? null;
    } catch {
      // Si no se puede leer, el atajo se ocultará.
    }
  }

  return {
    workout: heroWorkout,
    date: viewDate,
    isToday: viewDate === today,
    upcoming,
    nextItemId: pendingItem?.id ?? null,
    started,
    proposals,
    proposalCount: proposals.length,
    nextSession,
    coachEmail,
    coachName
  };
};

// El cliente resuelve la propuesta de cita desde su propio inicio, sin tener
// que ir a /my-calendar. El .eq('client_id') evita tocar citas ajenas.
export const actions: Actions = {
  confirmSession: async ({ request, cookies, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const id = String((await request.formData()).get('session_id') ?? '');
    if (!id) return fail(400, { error: 'Falta la cita.' });

    const { error } = await supabase
      .from('sessions')
      .update({
        status: 'confirmed',
        decided_at: new Date().toISOString()
      } as never)
      .eq('id', id)
      .eq('client_id', user.id);
    if (error) return fail(500, { error: 'No se pudo confirmar la cita.' });
    avisar(cookies, 'Cita confirmada. La tienes en «Citas».');
    return { success: true };
  },

  rejectSession: async ({ request, cookies, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const id = String((await request.formData()).get('session_id') ?? '');
    if (!id) return fail(400, { error: 'Falta la cita.' });

    const { error } = await supabase
      .from('sessions')
      .update({
        status: 'rejected',
        decided_at: new Date().toISOString()
      } as never)
      .eq('id', id)
      .eq('client_id', user.id);
    if (error) return fail(500, { error: 'No se pudo rechazar la cita.' });
    avisar(cookies, 'Cita rechazada. Tu entrenador ya lo sabe.', 'aviso');
    return { success: true };
  }
};
