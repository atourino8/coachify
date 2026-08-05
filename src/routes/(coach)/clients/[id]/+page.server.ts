// Detalle del cliente: perfil + calendario (vista semana rodante de 14 días
// o vista mensual). Marca entrenos "hechos" (con set_logs) y permite duplicar.

import { error, fail, redirect } from '@sveltejs/kit';
import { addDays, formatDateISO, todayISOLocal, currentMonthISO } from '$lib/week';
import { materializeTemplateWorkout } from '$lib/workouts';
import { BUCKET } from '$lib/technique';
import type { TechniqueVideo } from '$lib/supabase/types';
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
    const loggedItemIds = new Set(
      (logs ?? []).map((l) => (l as { workout_item_id: string }).workout_item_id)
    );
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
  const templates = (
    (tplRaw ?? []) as unknown as {
      id: string;
      name: string;
      category: string | null;
      workout_template_items: { id: string }[] | null;
    }[]
  ).map((t) => ({
    id: t.id,
    name: t.name,
    category: t.category,
    itemCount: (t.workout_template_items ?? []).length
  }));

  // Ficha del cliente (tabla client_info, solo-coach vía RLS).
  const { data: infoRaw } = await supabase
    .from('client_info')
    .select('*')
    .eq('client_id', params.id)
    .maybeSingle();
  const info = infoRaw ?? null;

  // ---- Historial: entrenos pasados (con flag done) + citas pasadas ----
  const today = todayISOLocal();

  const { data: pastWorkoutsRaw } = await supabase
    .from('workouts')
    .select('id, date, title, workout_items(id)')
    .eq('client_id', params.id)
    .lt('date', today)
    .order('date', { ascending: false })
    .limit(40);
  const pastWorkouts = (pastWorkoutsRaw ?? []) as unknown as {
    id: string;
    date: string;
    title: string | null;
    workout_items: { id: string }[] | null;
  }[];

  const pastItemIds = pastWorkouts.flatMap((w) => (w.workout_items ?? []).map((it) => it.id));
  const pastDone = new Set<string>();
  if (pastItemIds.length > 0) {
    const { data: logs } = await supabase
      .from('set_logs')
      .select('workout_item_id')
      .eq('client_id', params.id)
      .in('workout_item_id', pastItemIds);
    const logged = new Set(
      (logs ?? []).map((l) => (l as { workout_item_id: string }).workout_item_id)
    );
    for (const w of pastWorkouts) {
      if ((w.workout_items ?? []).some((it) => logged.has(it.id))) pastDone.add(w.id);
    }
  }
  const historyWorkouts = pastWorkouts.map((w) => ({
    id: w.id,
    date: w.date,
    title: w.title,
    itemCount: (w.workout_items ?? []).length,
    done: pastDone.has(w.id)
  }));

  const nowISO = new Date().toISOString();
  const { data: pastSessionsRaw } = await supabase
    .from('sessions')
    .select('id, starts_at, status, modality')
    .eq('client_id', params.id)
    .eq('coach_id', user.id)
    .lt('starts_at', nowISO)
    .order('starts_at', { ascending: false })
    .limit(40);
  const historySessions = (pastSessionsRaw ?? []) as {
    id: string;
    starts_at: string;
    status: string;
    modality: string;
  }[];

  // ---- Vídeos de técnica del cliente (máx. 2 por ejercicio) ----
  const { data: tvRaw } = await supabase
    .from('technique_videos')
    .select('*, exercise:exercises(id, name)')
    .eq('client_id', params.id)
    .eq('coach_id', user.id)
    .order('created_at', { ascending: false });

  const tvRows = (tvRaw ?? []) as unknown as (TechniqueVideo & {
    exercise: { id: string; name: string } | null;
  })[];

  // Agrupar por ejercicio y firmar las URLs (bucket privado).
  const techniqueByExercise: Record<
    string,
    {
      exerciseId: string;
      exerciseName: string;
      first: (TechniqueVideo & { url: string | null }) | null;
      latest: (TechniqueVideo & { url: string | null }) | null;
      pending: boolean;
      lastAt: string;
    }
  > = {};

  for (const v of tvRows) {
    const { data: s } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(v.storage_path, 60 * 60);
    const withUrl = { ...v, url: s?.signedUrl ?? null };
    const key = v.exercise_id;
    techniqueByExercise[key] ??= {
      exerciseId: v.exercise_id,
      exerciseName: v.exercise?.name ?? 'Ejercicio',
      first: null,
      latest: null,
      pending: false,
      lastAt: v.created_at
    };
    if (v.kind === 'first') techniqueByExercise[key].first = withUrl;
    else techniqueByExercise[key].latest = withUrl;
    if (v.created_at > techniqueByExercise[key].lastAt) {
      techniqueByExercise[key].lastAt = v.created_at;
    }
  }

  // "Pendiente" = el vídeo más reciente del ejercicio aún no tiene comentario.
  const technique = Object.values(techniqueByExercise).map((g) => {
    const newest = g.latest ?? g.first;
    return { ...g, pending: !!newest && !newest.coach_comment };
  });
  // Los pendientes de revisar, primero.
  technique.sort((a, b) =>
    a.pending === b.pending ? b.lastAt.localeCompare(a.lastAt) : a.pending ? -1 : 1
  );

  return {
    client,
    view,
    windowStart,
    windowDays: WINDOW_DAYS,
    monthISO,
    workoutsByDate,
    templates,
    info,
    historyWorkouts,
    historySessions,
    technique
  };
};

export const actions: Actions = {
  // Guarda (upsert) la ficha del cliente.
  saveInfo: async ({ request, params, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');

    // Verificar que el cliente es de este coach.
    const { data: owned } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', params.id)
      .eq('coach_id', user.id)
      .maybeSingle();
    if (!owned) return fail(403, { error: 'Ese cliente no es tuyo.' });

    const fd = await request.formData();
    const str = (k: string) => {
      const v = (fd.get(k) as string | null)?.trim();
      return v ? v : null;
    };
    const num = (k: string) => {
      const v = str(k);
      if (v === null) return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };
    const level = str('level');
    const validLevel =
      level && ['principiante', 'intermedio', 'avanzado'].includes(level) ? level : null;

    const row = {
      client_id: params.id,
      coach_id: user.id,
      goals: str('goals'),
      injuries: str('injuries'),
      training_days_per_week: num('training_days_per_week'),
      level: validLevel,
      height_cm: num('height_cm'),
      birth_date: str('birth_date'),
      coach_notes: str('coach_notes'),
      fee_amount: num('fee_amount'),
      paid_until: str('paid_until')
    };

    const { error: upErr } = await supabase
      .from('client_info')
      .upsert(row as never, { onConflict: 'client_id' });
    if (upErr) return fail(500, { error: upErr.message });

    return { success: true, infoSaved: true };
  },

  // Registra un mes de pago: empuja paid_until un mes hacia delante desde hoy
  // (o desde la fecha ya pagada, si aún no ha vencido, para no perder días).
  markPaid: async ({ params, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');

    const { data: infoRaw } = await supabase
      .from('client_info')
      .select('paid_until, fee_amount')
      .eq('client_id', params.id)
      .maybeSingle();
    const info = infoRaw as { paid_until: string | null; fee_amount: number | null } | null;

    const today = todayISOLocal();
    const base = info?.paid_until && info.paid_until > today ? info.paid_until : today;
    const next = new Date(base + 'T00:00:00');
    next.setMonth(next.getMonth() + 1);
    const nextISO = formatDateISO(next);

    const { error: upErr } = await supabase.from('client_info').upsert(
      {
        client_id: params.id,
        coach_id: user.id,
        fee_amount: info?.fee_amount ?? null,
        paid_until: nextISO
      } as never,
      { onConflict: 'client_id' }
    );
    if (upErr) return fail(500, { error: upErr.message });

    return { success: true, paidUntil: nextISO };
  },

  // Guarda la corrección del coach sobre un vídeo de técnica.
  commentVideo: async ({ request, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const fd = await request.formData();
    const videoId = fd.get('video_id') as string;
    const comment = ((fd.get('comment') as string) ?? '').trim();
    if (!videoId) return fail(400, { error: 'Falta el vídeo.' });

    const { error: upErr } = await supabase
      .from('technique_videos')
      .update({
        coach_comment: comment || null,
        coach_comment_at: comment ? new Date().toISOString() : null
      } as never)
      .eq('id', videoId)
      .eq('coach_id', user.id);
    if (upErr) return fail(500, { error: upErr.message });

    return { success: true, commented: true };
  },

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
      .select(
        'id, client_id, coach_id, title, notes, published, workout_items(exercise_id, order_index, sets, reps_prescribed, weight_prescribed, rest_seconds, notes)'
      )
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
    if (existing)
      return fail(409, {
        error: 'Ya hay un entreno en la fecha destino. Bórralo primero o elige otra.'
      });

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
    if (createErr || !created)
      return fail(500, { error: createErr?.message ?? 'No se pudo crear.' });

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
      return fail(400, { error: 'Elige un entrenamiento, fecha de inicio y fin.' });
    }
    if (weekdays.length === 0) return fail(400, { error: 'Marca al menos un día de la semana.' });
    if (endDate < startDate)
      return fail(400, { error: 'La fecha de fin es anterior a la de inicio.' });

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
