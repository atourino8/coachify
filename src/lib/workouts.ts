// Helper server-only: materializa una plantilla como entreno (workout) de un
// cliente en una fecha. Reutilizable desde acciones de servidor.

type SupabaseServer = App.Locals['supabase'];

type TemplateItem = {
  exercise_id: string;
  order_index: number;
  sets: number;
  reps_prescribed: string | null;
  weight_prescribed: string | null;
  rest_seconds: number | null;
  notes: string | null;
};

/**
 * Crea (o sobrescribe, si overwrite=true) el entreno de un cliente en una fecha
 * a partir de una plantilla. Devuelve el id del workout, o un motivo de omisión.
 */
export async function materializeTemplateWorkout(
  supabase: SupabaseServer,
  coachId: string,
  clientId: string,
  date: string,
  templateId: string,
  opts: { overwrite: boolean } = { overwrite: false }
): Promise<{ workoutId: string } | { skipped: 'exists' } | { error: string }> {
  const { data: tpl, error: tplErr } = await supabase
    .from('workout_templates')
    .select(
      'id, name, workout_template_items(exercise_id, order_index, sets, reps_prescribed, weight_prescribed, rest_seconds, notes)'
    )
    .eq('id', templateId)
    .eq('coach_id', coachId)
    .single();
  if (tplErr || !tpl) return { error: 'Plantilla no encontrada.' };
  const template = tpl as unknown as { name: string; workout_template_items: TemplateItem[] };

  // ¿Ya hay entreno ese día?
  const { data: existing } = await supabase
    .from('workouts')
    .select('id')
    .eq('client_id', clientId)
    .eq('date', date)
    .maybeSingle();

  if (existing && !opts.overwrite) return { skipped: 'exists' };

  let workoutId: string;
  if (existing) {
    workoutId = (existing as { id: string }).id;
    await supabase.from('workouts').update({ title: template.name } as never).eq('id', workoutId);
    await supabase.from('workout_items').delete().eq('workout_id', workoutId);
  } else {
    const { data: created, error: createErr } = await supabase
      .from('workouts')
      .insert({ client_id: clientId, coach_id: coachId, date, title: template.name } as never)
      .select('id')
      .single();
    if (createErr || !created) return { error: createErr?.message ?? 'No se pudo crear el entreno.' };
    workoutId = (created as { id: string }).id;
  }

  const items = [...(template.workout_template_items ?? [])].sort((a, b) => a.order_index - b.order_index);
  if (items.length > 0) {
    const rows = items.map((it, i) => ({
      workout_id: workoutId,
      exercise_id: it.exercise_id,
      order_index: i,
      sets: it.sets,
      reps_prescribed: it.reps_prescribed,
      weight_prescribed: it.weight_prescribed,
      rest_seconds: it.rest_seconds,
      notes: it.notes
    }));
    const { error: insErr } = await supabase.from('workout_items').insert(rows as never);
    if (insErr) return { error: insErr.message };
  }

  return { workoutId };
}
