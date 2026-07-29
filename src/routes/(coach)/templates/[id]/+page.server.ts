// Editor de una plantilla: nombre + ejercicios. Espejo del constructor del día
// pero para plantillas (sin cliente ni fecha).

import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

type TemplateWithItems = {
  id: string;
  name: string;
  notes: string | null;
  category: string | null;
  workout_template_items:
    | {
        id: string;
        exercise_id: string;
        order_index: number;
        sets: number;
        reps_prescribed: string | null;
        weight_prescribed: string | null;
        rest_seconds: number | null;
        notes: string | null;
        exercise: { id: string; name: string; muscle_group: string | null } | null;
      }[]
    | null;
};

export const load: PageServerLoad = async ({ params, locals: { supabase, user } }) => {
  if (!user) redirect(303, '/login');

  const { data: tplRaw, error: tplErr } = await supabase
    .from('workout_templates')
    .select(
      `id, name, notes, category,
       workout_template_items(
         id, exercise_id, order_index, sets, reps_prescribed, weight_prescribed, rest_seconds, notes,
         exercise:exercises(id, name, muscle_group)
       )`
    )
    .eq('id', params.id)
    .eq('coach_id', user.id)
    .single();

  if (tplErr || !tplRaw) error(404, 'Entrenamiento no encontrado');
  const tpl = tplRaw as unknown as TemplateWithItems;
  (tpl.workout_template_items ?? []).sort((a, b) => a.order_index - b.order_index);

  // Biblioteca de ejercicios del coach
  const { data: exercises } = await supabase
    .from('exercises')
    .select('*')
    .eq('coach_id', user.id)
    .eq('archived', false)
    .order('name');

  return { template: tpl, exercises: exercises ?? [] };
};

export const actions: Actions = {
  save: async ({ request, params, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');

    const fd = await request.formData();
    const name = ((fd.get('name') as string) || '').trim();
    const notes = ((fd.get('notes') as string) || '').trim() || null;
    const category = ((fd.get('category') as string) || '').trim() || null;
    const rawItems = fd.get('items') as string;
    if (!name) return fail(400, { error: 'El entrenamiento necesita un nombre.' });

    let items: Array<{
      exercise_id: string;
      sets: number;
      reps_prescribed: string;
      weight_prescribed: string;
      rest_seconds: number | null;
      notes: string;
    }>;
    try {
      items = JSON.parse(rawItems || '[]');
    } catch {
      return fail(400, { error: 'Datos inválidos.' });
    }

    // Verificar propiedad y actualizar cabecera
    const { error: updErr } = await supabase
      .from('workout_templates')
      .update({ name, notes, category } as never)
      .eq('id', params.id)
      .eq('coach_id', user.id);
    if (updErr) return fail(500, { error: updErr.message });

    // Reemplazar items
    await supabase.from('workout_template_items').delete().eq('template_id', params.id);

    if (items.length > 0) {
      const rows = items.map((it, i) => ({
        template_id: params.id,
        exercise_id: it.exercise_id,
        order_index: i,
        sets: it.sets || 1,
        reps_prescribed: it.reps_prescribed || null,
        weight_prescribed: it.weight_prescribed || null,
        rest_seconds: it.rest_seconds || null,
        notes: it.notes || null
      }));
      const { error: insErr } = await supabase.from('workout_template_items').insert(rows as never);
      if (insErr) return fail(500, { error: insErr.message });
    }

    return { success: true };
  }
};
