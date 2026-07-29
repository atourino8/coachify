// Detalle del cliente: perfil + calendario (vista semana rodante de 14 días
// o vista mensual). Marca entrenos "hechos" (con set_logs) y permite duplicar.

import { error, fail, redirect } from '@sveltejs/kit';
import { addDays, formatDateISO, todayISOLocal, currentMonthISO } from '$lib/week';
import { materializeTemplateWorkout } from '$lib/workouts';
import type { PageServerLoad, Actions } from './$types';

const WINDOW_DAYS = 7;

type WorkoutRow = {
  id: string;
  date: string;
  title: string | null;
  notes: string | null;
  workout_items: { id: string; order_index: number; exercise: { name: string } | null }[] | null;
};

export const load: PageServerLoad = async ({ params, url, locals: { supabase, user } }) => {
  if (!user) redirect(303, '/login');

  const { data: client, error: clientError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', params.id)
    .eq('coach_id', user.id)
    .single();

  if (clientError || !client) error(404, 'Cliente no encontrado');

  // Vista: 'window' (14 días desde hoy) o 'month'.
  const view = url.searchParams.get('view') === 'month' ? 'month' : 'window';

  let rangeStart: string;
  let rangeEnd: string;
  let windowStart = todayISOLocal();
  let monthISO = currentMonthISO();

  if (view === 'month') {
    monthISO = url.searchParams.get('month') ?? currentMonthISO();
    const [y, m] = monthISO.split('-').map(Number);
    // La cuadrícula del mes puede mostrar días del mes anterior/siguiente:
    // consultamos con margen de una semana a cada lado.
    rangeStart = formatDateISO(addDays(new Date(y, m - 1, 1), -7));
    rangeEnd = formatDateISO(addDays(new Date(y, m, 0), 7)); // día 0 del mes siguiente = último del actual
  } else {
    windowStart = url.searchParams.get('start') ?? todayISOLocal();
    rangeStart = windowStart;
    rangeEnd = formatDateISO(addDays(new Date(windowStart + 'T00:00:00'), WINDOW_DAYS - 1));
  }

  const { data: workoutsRaw } = await supabase
    .from('workouts')
    .select('id, date, title, notes, workout_items(id, order_index, exercise:exercises(name))')
    .eq('client_id', params.id)
    .gte('date', rangeStart)
    .lte('date', rangeEnd);

  const workouts = (workoutsRaw ?? []) as unknown as WorkoutRow[];

  // ---- Indicador "hecho": qué workouts tienen set_logs del cliente ----
  const allItemIds = workouts.flatMap((w) => (w.workout_items ?? []).map((it) => it.id));
  const doneWorkoutIds = new Set<string>();
  if (allItemIds.length > 0) {
    const { data: logs } = await supabase
      .from('set_logs')
      .select('workout_item_id')
      .eq('client_id', params.id)
      .in('workout_item_id', allItemIds);
    const loggedItemIds = new Set((logs ?? []).map((l) => (l as { workout_item_id: string }).workout_item_id));
    for (const w of workouts) {
      if ((w.workout_items ?? []).some((it) => loggedItemIds.has(it.id))) {
        doneWorkoutIds.add(w.id);
      }
    }
  }

  // Indexar por fecha, añadiendo el flag done, el número de ejercicios y la
  // lista de nombres (ordenada) para la vista semana.
  const workoutsByDate: Record<
    string,
    { id: string; title: string | null; itemCount: number; done: boolean; exercises: string[] }
  > = {};
  for (const w of workouts) {
    const items = [...(w.workout_items ?? [])].sort((a, b) => a.order_index - b.order_index);
    workoutsByDate[w.date] = {
      id: w.id,
      title: w.title,
      itemCount: items.length,
      done: doneWorkoutIds.has(w.id),
      exercises: items.map((it) => it.exercise?.name).filter((n): n is string => !!n)
    };
  }

  // Plantillas del coach (para el panel "Programar con plantilla").
  const { data: tplRaw } = await supabase
    .from('workout_templates')
    .select('id, name, category, workout_template_items(id)')
    .eq('coach_id', user.id)
    .order('name');
  const templates = ((tplRaw ?? []) as unknown as { id: string; name: string; category: string | null; workout_template_items: { id: string }[] | null }[]).map(
    (t) => ({ id: t.id, name: t.name, category: t.category, itemCount: (t.workout_template_items ?? []).length })
  );

  return {
    client,
    view,
    windowStart,
    windowDays: WINDOW_DAYS,
    monthISO,
    workoutsByDate,
    templates
  };
};

export const actions: Actions = {
  // Duplica un entreno (workout + sus workout_items) a otra fecha.
  duplicate: async ({ request, params, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');

    const fd = await request.formData();
    const sourceId = fd.get('source_id') as string;
    const targetDate = fd.get('target_date') as string;
    if (!sourceId || !targetDate) return fail(400, { error: 'Falta origen o fecha destino.' });

    // Cargar el workout origen (RLS garantiza que sea del coach).
    const { data: src, error: srcErr } = await supabase
      .from('workouts')
      .select('id, client_id, coach_id, title, notes, published, workout_items(exercise_id, order_index, sets, reps_prescribed, weight_prescribed, rest_seconds, notes)')
      .eq('id', sourceId)
      .single();
    if (srcErr || !src) return fail(404, { error: 'No se encontró el entreno origen.' });

    const source = src as unknown as {
      client_id: string;
      title: string | null;
      notes: string | null;
      published: boolean;
      workout_items: {
        exercise_id: string;
        order_index: number;
        sets: number;
        reps_prescribed: string | null;
        weight_prescribed: string | null;
        rest_seconds: number | null;
        notes: string | null;
      }[];
    };

    // ¿Ya hay un workout en la fecha destino? Si sí, no pisamos: error claro.
    const { data: existing } = await supabase
      .from('workouts')
      .select('id')
      .eq('client_id', source.client_id)
      .eq('date', targetDate)
      .maybeSingle();
    if (existing) return fail(409, { error: 'Ya hay un entreno en la fecha destino. Bórralo primero o elige otra.' });

    // Crear el nuevo workout
    const { data: created, error: createErr } = await supabase
      .from('workouts')
      .insert({
        client_id: source.client_id,
        coach_id: user.id,
        date: targetDate,
        title: source.title,
        notes: source.notes,
        published: source.published
      } as never)
      .select('id')
      .single();
    if (createErr || !created) return fail(500, { error: createErr?.message ?? 'No se pudo crear.' });

    const newId = (created as { id: string }).id;

    // Copiar los items
    if (source.workout_items.length > 0) {
      const rows = source.workout_items.map((it) => ({
        workout_id: newId,
        exercise_id: it.exercise_id,
        order_index: it.order_index,
        sets: it.sets,
        reps_prescribed: it.reps_prescribed,
        weight_prescribed: it.weight_prescribed,
        rest_seconds: it.rest_seconds,
        notes: it.notes
      }));
      const { error: itemsErr } = await supabase.from('workout_items').insert(rows as never);
      if (itemsErr) return fail(500, { error: itemsErr.message });
    }

    return { success: true, duplicated: true, targetDate };
  },

  // Programa una plantilla en varios días: rango de fechas + días de la semana.
  programTemplate: async ({ request, params, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const fd = await request.formData();
    const templateId = fd.get('template_id') as string;
    const startDate = fd.get('start_date') as string;
    const endDate = fd.get('end_date') as string;
    const weekdays = fd.getAll('weekdays').map((d) => Number(d)); // 0=domingo … 6=sábado
    const overwrite = fd.get('overwrite') === '1';

    if (!templateId || !startDate || !endDate) {
      return fail(400, { error: 'Elige plantilla, fecha de inicio y fin.' });
    }
    if (weekdays.length === 0) return fail(400, { error: 'Marca al menos un día de la semana.' });
    if (endDate < startDate) return fail(400, { error: 'La fecha de fin es anterior a la de inicio.' });

    // Recorrer el rango y quedarnos con los días cuyo weekday esté marcado.
    const dates: string[] = [];
    const cur = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    let guard = 0;
    while (cur <= end && guard < 400) {
      if (weekdays.includes(cur.getDay())) dates.push(formatDateISO(cur));
      cur.setDate(cur.getDate() + 1);
      guard++;
    }

    let created = 0;
    let skipped = 0;
    for (const date of dates) {
      const res = await materializeTemplateWorkout(supabase, user.id, params.id, date, templateId, {
        overwrite
      });
      if ('workoutId' in res) created++;
      else if ('skipped' in res) skipped++;
      else return fail(500, { error: res.error });
    }

    return { success: true, programmed: true, created, skipped };
  }
};
