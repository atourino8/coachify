// Plantillas de entreno del coach: lista + crear + borrar.

import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

type TemplateRow = {
  id: string;
  name: string;
  notes: string | null;
  category: string | null;
  updated_at: string;
  workout_template_items: { id: string }[] | null;
};

export const load: PageServerLoad = async ({ locals: { supabase, user } }) => {
  if (!user) redirect(303, '/login');

  const { data: rows } = await supabase
    .from('workout_templates')
    .select('id, name, notes, category, updated_at, workout_template_items(id)')
    .eq('coach_id', user.id)
    .order('name', { ascending: true });

  const templates = ((rows ?? []) as unknown as TemplateRow[]).map((t) => ({
    id: t.id,
    name: t.name,
    notes: t.notes,
    category: t.category,
    itemCount: (t.workout_template_items ?? []).length
  }));

  return { templates };
};

export const actions: Actions = {
  create: async ({ request, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const name = ((await request.formData()).get('name') as string)?.trim();
    if (!name) return fail(400, { error: 'Ponle un nombre a la plantilla.' });

    const { data, error } = await supabase
      .from('workout_templates')
      .insert({ coach_id: user.id, name } as never)
      .select('id')
      .single();
    if (error || !data) return fail(500, { error: error?.message ?? 'No se pudo crear.' });

    // Ir directo al editor de la plantilla recién creada.
    redirect(303, `/templates/${(data as { id: string }).id}`);
  },

  delete: async ({ request, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const id = (await request.formData()).get('template_id') as string;
    if (!id) return fail(400, { error: 'Falta el id.' });
    const { error } = await supabase
      .from('workout_templates')
      .delete()
      .eq('id', id)
      .eq('coach_id', user.id);
    if (error) return fail(500, { error: error.message });
    return { success: true, deleted: true };
  }
};
