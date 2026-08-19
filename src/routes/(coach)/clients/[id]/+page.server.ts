// Detalle del cliente: perfil + calendario (vista semana rodante de 14 días
// o vista mensual). Marca entrenos "hechos" (con set_logs) y permite duplicar.

import { error, fail, redirect } from '@sveltejs/kit';
import {
  addDays,
  formatDateISO,
  todayISOLocal,
  currentMonthISO,
  datesInRangeOnWeekdays
} from '$lib/week';
import { materializeTemplateWorkout } from '$lib/workouts';
import { faltasPorCliente } from '$lib/faltas.server';
import { guardarAvatar, quitarAvatar, urlDeAvatar } from '$lib/avatares.server';
import { BUCKET } from '$lib/technique';
import type { TechniqueVideo, Exercise } from '$lib/supabase/types';
import type { PageServerLoad, Actions } from './$types';

const WINDOW_DAYS = 7;

type WorkoutRow = {
  id: string;
  date: string;
  title: string | null;
  notes: string | null;
  workout_items:
    | {
        id: string;
        order_index: number;
        sets: number;
        reps_prescribed: string | null;
        weight_prescribed: string | null;
        rest_seconds: number | null;
        exercise: { id: string; name: string } | null;
      }[]
    | null;
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
    // Se traen las series y los pesos, no solo el nombre: la pestaña
    // Calendario ahora edita el día sin salir de la ficha (pantalla 15), y
    // pedirlos por separado al desplegar sería una consulta por día abierto.
    .select(
      `id, date, title, notes,
       workout_items(
         id, order_index, sets, reps_prescribed, weight_prescribed, rest_seconds,
         exercise:exercises(id, name)
       )`
    )
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
    {
      id: string;
      title: string | null;
      itemCount: number;
      done: boolean;
      exercises: string[];
      items: {
        id: string;
        exerciseId: string;
        nombre: string;
        sets: number;
        reps: string;
        peso: string;
        descanso: number | null;
      }[];
    }
  > = {};
  for (const w of workouts) {
    const items = [...(w.workout_items ?? [])].sort((a, b) => a.order_index - b.order_index);
    workoutsByDate[w.date] = {
      id: w.id,
      title: w.title,
      itemCount: items.length,
      done: doneWorkoutIds.has(w.id),
      exercises: items.map((it) => it.exercise?.name).filter((n): n is string => !!n),
      items: items.map((it) => ({
        id: it.id,
        exerciseId: it.exercise?.id ?? '',
        nombre: it.exercise?.name ?? 'Ejercicio',
        sets: it.sets,
        reps: it.reps_prescribed ?? '',
        peso: it.weight_prescribed ?? '',
        descanso: it.rest_seconds
      }))
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

  // Las URL se firman TODAS DE UNA VEZ.
  //
  // Antes era una llamada a Storage por vídeo dentro del bucle. Con un cliente
  // veterano que ha subido técnica de quince ejercicios son treinta viajes en
  // serie antes de poder pintar la página, y cada uno con su latencia. La
  // versión en lote hace uno.
  const rutas = tvRows.map((v) => v.storage_path);
  const firmadas = new Map<string, string>();
  if (rutas.length > 0) {
    const { data: lote } = await supabase.storage.from(BUCKET).createSignedUrls(rutas, 60 * 60);
    for (const f of lote ?? []) {
      if (f.path && f.signedUrl) firmadas.set(f.path, f.signedUrl);
    }
  }

  for (const v of tvRows) {
    const withUrl = { ...v, url: firmadas.get(v.storage_path) ?? null };
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

  // ---- Progreso por ejercicio ----
  // El entrenador necesita ver esto más que nadie: es literalmente su trabajo.
  // Hasta ahora la evolución solo existía en la pantalla del cliente, así que
  // el coach tenía que creerse lo que le contaran.
  const { data: logsRaw } = await supabase
    .from('set_logs')
    .select(
      `exercise_id, reps_done, weight_done, completed_at,
       exercise:exercises(id, name, muscle_group)`
    )
    .eq('client_id', params.id)
    .order('completed_at', { ascending: true });

  type LogRow = {
    exercise_id: string;
    reps_done: number | null;
    weight_done: number | null;
    completed_at: string;
    exercise: { id: string; name: string; muscle_group: string | null } | null;
  };

  // Un punto por ejercicio y día, con el peso máximo de ese día: dentro de una
  // sesión hay varias series y lo que interesa es el tope, no el promedio.
  const porEjercicio = new Map<
    string,
    {
      id: string;
      name: string;
      muscleGroup: string | null;
      dias: Map<string, { maxWeight: number; totalReps: number }>;
    }
  >();

  for (const l of (logsRaw ?? []) as unknown as LogRow[]) {
    if (!l.exercise) continue;
    const dia = l.completed_at.slice(0, 10);
    let ex = porEjercicio.get(l.exercise.id);
    if (!ex) {
      ex = {
        id: l.exercise.id,
        name: l.exercise.name,
        muscleGroup: l.exercise.muscle_group,
        dias: new Map()
      };
      porEjercicio.set(l.exercise.id, ex);
    }
    const agg = ex.dias.get(dia) ?? { maxWeight: 0, totalReps: 0 };
    agg.maxWeight = Math.max(agg.maxWeight, l.weight_done ?? 0);
    agg.totalReps += l.reps_done ?? 0;
    ex.dias.set(dia, agg);
  }

  const progress = [...porEjercicio.values()]
    .map((ex) => {
      const points = [...ex.dias.entries()]
        .map(([date, agg]) => ({ date, ...agg }))
        .sort((a, b) => a.date.localeCompare(b.date));
      const pesos = points.map((p) => p.maxWeight);
      return {
        id: ex.id,
        name: ex.name,
        muscleGroup: ex.muscleGroup,
        points,
        sessions: points.length,
        bestWeight: pesos.length ? Math.max(...pesos) : null,
        // Diferencia entre la primera y la última sesión: es el dato que el
        // entrenador quiere de un vistazo ("¿ha mejorado o no?").
        delta: points.length > 1 ? points[points.length - 1].maxWeight - points[0].maxWeight : null
      };
    })
    .sort((a, b) => b.sessions - a.sessions);

  // ---- Clases a las que va (ADR-004) ----
  //
  // El !inner sobre group_classes convierte el join en filtro y de paso trae
  // el coach_id, que es lo que permite descartar clases de otro entrenador si
  // el cliente alguna vez cambió de manos.
  const { data: susClasesRaw } = await supabase
    .from('class_bookings')
    .select('status, group_classes!inner(id, title, starts_at, coach_id, status)')
    .eq('client_id', params.id)
    .in('status', ['seat', 'waitlist']);

  const ahoraMs = Date.now();
  const clasesProximas = (
    (susClasesRaw ?? []) as unknown as {
      status: 'seat' | 'waitlist';
      group_classes: {
        id: string;
        title: string;
        starts_at: string;
        coach_id: string;
        status: string;
      };
    }[]
  )
    .filter(
      (b) =>
        b.group_classes.coach_id === user.id &&
        new Date(b.group_classes.starts_at).getTime() > ahoraMs
    )
    .map((b) => ({
      id: b.group_classes.id,
      title: b.group_classes.title,
      starts_at: b.group_classes.starts_at,
      cancelada: b.group_classes.status === 'cancelled',
      enEspera: b.status === 'waitlist'
    }))
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));

  const faltas = (await faltasPorCliente(supabase, user.id, [params.id])).get(params.id) ?? 0;

  // La biblioteca, para el modal de añadir ejercicios del editor en línea.
  // Solo id, nombre y grupos: lo demás —vídeo, descripción, material— no se
  // usa para elegir, y son cincuenta filas que viajan en cada carga.
  const { data: bibliotecaRaw } = await supabase
    .from('exercises')
    .select('id, name, muscle_groups')
    .eq('coach_id', user.id)
    .eq('archived', false)
    .order('name');

  return {
    client,
    exercises: (bibliotecaRaw ?? []) as unknown as Exercise[],
    // La cara del cliente, firmada. El cubo es privado (migración 0024).
    avatar: await urlDeAvatar(supabase, (client as { avatar_path: string | null }).avatar_path),
    clasesProximas,
    faltas,
    view,
    windowStart,
    windowDays: WINDOW_DAYS,
    monthISO,
    workoutsByDate,
    templates,
    info,
    historyWorkouts,
    historySessions,
    technique,
    progress
  };
};

export const actions: Actions = {
  /**
   * Guarda el día entero desde la pestaña Calendario (pantalla 15).
   *
   * Reemplaza los ejercicios de golpe en vez de ir campo a campo: la pantalla
   * edita en local y manda una sola vez, así que un guardado parcial dejaría
   * el día a medias sin que nadie lo supiera. Es lo mismo que hace el
   * constructor del día desde su propia pantalla.
   */
  guardarDia: async ({ request, params, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const fd = await request.formData();
    const workoutId = String(fd.get('workout_id') ?? '');
    if (!workoutId) return fail(400, { error: 'Falta el entreno.' });

    // El entreno tiene que ser de ESTE cliente y de ESTE entrenador. Sin las
    // dos comprobaciones, mandar otro id por el formulario editaría el día de
    // cualquiera.
    const { data: propio } = await supabase
      .from('workouts')
      .select('id')
      .eq('id', workoutId)
      .eq('client_id', params.id)
      .eq('coach_id', user.id)
      .maybeSingle();
    if (!propio) return fail(403, { error: 'Ese entreno no es tuyo.' });

    let filas: {
      exercise_id: string;
      sets: number;
      reps_prescribed: string | null;
      weight_prescribed: string | null;
      rest_seconds: number | null;
    }[];
    try {
      filas = JSON.parse(String(fd.get('items') ?? '[]'));
    } catch {
      return fail(400, { error: 'Datos inválidos.' });
    }

    await supabase.from('workout_items').delete().eq('workout_id', workoutId);

    if (filas.length > 0) {
      const { error: errIns } = await supabase.from('workout_items').insert(
        filas.map((f, i) => ({
          workout_id: workoutId,
          exercise_id: f.exercise_id,
          order_index: i,
          sets: Number(f.sets) || 1,
          reps_prescribed: f.reps_prescribed || null,
          weight_prescribed: f.weight_prescribed || null,
          rest_seconds: f.rest_seconds === null ? null : Number(f.rest_seconds) || null
        })) as never
      );
      if (errIns) return fail(500, { error: errIns.message });
    }

    return { success: true, diaGuardado: true, ejercicios: filas.length };
  },

  // La foto del cliente, puesta por su entrenador.
  //
  // El .eq('coach_id') no es decorativo: sin él, cualquiera podría cambiarle
  // la cara a un cliente ajeno mandando otro id en la URL. La RLS del cubo lo
  // impediría igualmente, pero la comprobación se hace donde se decide.
  foto: async ({ request, params, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');

    const { data: perfil } = await supabase
      .from('profiles')
      .select('avatar_path')
      .eq('id', params.id)
      .eq('coach_id', user.id)
      .maybeSingle();
    if (!perfil) return fail(404, { error: 'Ese cliente no es tuyo.' });
    const anterior = (perfil as { avatar_path: string | null }).avatar_path;

    const fd = await request.formData();
    if (fd.get('quitar')) {
      const { error: err } = await quitarAvatar(supabase, params.id, anterior);
      if (err) return fail(500, { error: err });
      return { success: true, fotoQuitada: true };
    }

    const res = await guardarAvatar(supabase, params.id, fd.get('foto') as File | null, anterior);
    if ('error' in res) return fail(400, { error: res.error });
    return { success: true, fotoGuardada: true };
  },

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
      paid_until: str('paid_until'),
      // Se sanean contra su forma y no contra el vocabulario del entrenador:
      // la restricción de la tabla exige la forma, y comprobar que existen
      // costaría una consulta más para protegerse de algo cuyo peor caso es
      // que él vea una etiqueta suelta en SU propia ficha.
      tags: fd
        .getAll('tags')
        .map(String)
        .filter((s) => /^[a-z0-9_]{2,32}$/.test(s))
        .slice(0, 20)
    };

    const { error: upErr } = await supabase
      .from('client_info')
      .upsert(row as never, { onConflict: 'client_id' });
    if (upErr) return fail(500, { error: upErr.message });

    return { success: true, infoSaved: true };
  },

  // Registra un mes de pago: empuja paid_until un mes hacia delante desde hoy
  // (o desde la fecha ya pagada, si aún no ha vencido, para no perder días).
  // Registra un cobro REAL y, de paso, avanza el "pagado hasta".
  //
  // Antes esto solo empujaba la fecha, así que no quedaba constancia de cuándo
  // ni de cuánto: imposible hacer contabilidad con eso. Ahora cada cobro deja
  // una fila en client_payments, que es de donde salen el export y el
  // histórico. El importe y la fecha se pueden ajustar porque en la vida real
  // se paga tarde y a veces no se paga la cuota exacta.
  markPaid: async ({ request, params, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');

    const fd = await request.formData();
    const today = todayISOLocal();

    const { data: infoRaw } = await supabase
      .from('client_info')
      .select('paid_until, fee_amount, fee_currency')
      .eq('client_id', params.id)
      .maybeSingle();
    const info = infoRaw as {
      paid_until: string | null;
      fee_amount: number | null;
      fee_currency: string | null;
    } | null;

    // Sin datos en el formulario se comporta como antes: cuota pactada y hoy.
    const importeCrudo = String(fd.get('amount') ?? '').replace(',', '.');
    const amount = importeCrudo ? Number(importeCrudo) : (info?.fee_amount ?? null);
    const paidOn = String(fd.get('paid_on') ?? '') || today;
    const method = String(fd.get('method') ?? '') || 'efectivo';
    const notes = String(fd.get('notes') ?? '').trim() || null;

    if (amount === null || Number.isNaN(amount) || amount < 0) {
      return fail(400, { error: 'Indica un importe válido para el cobro.' });
    }

    // El periodo cubierto arranca donde acababa lo pagado, para que un cobro
    // atrasado siga cuadrando con el mes al que corresponde.
    const desde = info?.paid_until && info.paid_until > today ? info.paid_until : today;
    const hasta = new Date(desde + 'T00:00:00');
    hasta.setMonth(hasta.getMonth() + 1);
    const hastaISO = formatDateISO(hasta);

    const { error: payErr } = await supabase.from('client_payments').insert({
      client_id: params.id,
      coach_id: user.id,
      paid_on: paidOn,
      amount,
      currency: info?.fee_currency ?? 'EUR',
      method,
      covers_from: desde,
      covers_until: hastaISO,
      notes
    } as never);
    if (payErr) return fail(500, { error: 'No se pudo registrar el cobro.' });

    const { error: upErr } = await supabase.from('client_info').upsert(
      {
        client_id: params.id,
        coach_id: user.id,
        fee_amount: info?.fee_amount ?? null,
        paid_until: hastaISO
      } as never,
      { onConflict: 'client_id' }
    );
    if (upErr) return fail(500, { error: upErr.message });

    return { success: true, paidUntil: hastaISO, amount };
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

    const dates = datesInRangeOnWeekdays(startDate, endDate, weekdays);

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
