// Progreso del cliente: histórico de series registradas, agrupado por ejercicio,
// para poder mostrar la evolución del peso a lo largo del tiempo.

import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

type SetLogRow = {
  exercise_id: string;
  set_number: number;
  reps_done: number | null;
  weight_done: number | null;
  completed_at: string;
  exercise: { id: string; name: string; muscle_group: string | null } | null;
};

export const load: PageServerLoad = async ({ locals: { supabase, user } }) => {
  if (!user) redirect(303, '/login');

  // Todas las series que ha registrado el cliente, con el ejercicio asociado.
  const { data: logsRaw } = await supabase
    .from('set_logs')
    .select(
      `exercise_id, set_number, reps_done, weight_done, completed_at,
       exercise:exercises(id, name, muscle_group)`
    )
    .eq('client_id', user.id)
    .order('completed_at', { ascending: true });

  const logs = (logsRaw ?? []) as unknown as SetLogRow[];

  // Agrupar por ejercicio: para cada ejercicio, una serie temporal de
  // { fecha, pesoMax } donde pesoMax es el peso máximo levantado ese día.
  type Point = { date: string; maxWeight: number; totalReps: number };
  type ExerciseProgress = {
    id: string;
    name: string;
    muscleGroup: string | null;
    points: Point[];
    lastWeight: number | null;
    bestWeight: number | null;
    sessions: number;
  };

  const byExercise = new Map<string, ExerciseProgress>();
  // acumulador por (exercise, día) para calcular máximos
  const dayAgg = new Map<string, { maxWeight: number; totalReps: number }>();

  for (const l of logs) {
    if (!l.exercise) continue;
    const exId = l.exercise.id;
    const day = l.completed_at.slice(0, 10);
    const key = exId + '|' + day;

    const w = l.weight_done ?? 0;
    const reps = l.reps_done ?? 0;
    const agg = dayAgg.get(key) ?? { maxWeight: 0, totalReps: 0 };
    agg.maxWeight = Math.max(agg.maxWeight, w);
    agg.totalReps += reps;
    dayAgg.set(key, agg);

    if (!byExercise.has(exId)) {
      byExercise.set(exId, {
        id: exId,
        name: l.exercise.name,
        muscleGroup: l.exercise.muscle_group,
        points: [],
        lastWeight: null,
        bestWeight: null,
        sessions: 0
      });
    }
  }

  // Reconstruir los puntos ordenados por día
  for (const [key, agg] of dayAgg) {
    const [exId, day] = key.split('|');
    const ex = byExercise.get(exId);
    if (!ex) continue;
    ex.points.push({ date: day, maxWeight: agg.maxWeight, totalReps: agg.totalReps });
  }

  const exercises: ExerciseProgress[] = [];
  for (const ex of byExercise.values()) {
    ex.points.sort((a, b) => a.date.localeCompare(b.date));
    ex.sessions = ex.points.length;
    ex.lastWeight = ex.points.length ? ex.points[ex.points.length - 1].maxWeight : null;
    ex.bestWeight = ex.points.reduce((m, p) => Math.max(m, p.maxWeight), 0) || null;
    exercises.push(ex);
  }
  // Ordenar: los que más sesiones tienen primero
  exercises.sort((a, b) => b.sessions - a.sessions);

  // Lista de entrenos completados (workouts donde hay al menos un set_log)
  const { data: workoutsRaw } = await supabase
    .from('workouts')
    .select('id, date, title')
    .eq('client_id', user.id)
    .order('date', { ascending: false })
    .limit(30);

  const workouts = workoutsRaw ?? [];

  // Totales para las tarjetas de cabecera
  const totalSets = logs.length;
  const totalVolume = logs.reduce(
    (sum, l) => sum + (l.weight_done ?? 0) * (l.reps_done ?? 0),
    0
  );

  return {
    exercises,
    workouts,
    stats: {
      totalSets,
      totalVolume: Math.round(totalVolume),
      exerciseCount: exercises.length
    }
  };
};
