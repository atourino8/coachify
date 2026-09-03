// Plantillas de entreno del coach: lista + crear + borrar.

import { fail, redirect } from '@sveltejs/kit';
import { avisar } from '$lib/aviso.server';
import type { PageServerLoad, Actions } from './$types';

type TemplateRow = {
  id: string;
  name: string;
  category: string | null;
  updated_at: string;
  workout_template_items: { id: string }[] | null;
};

export const load: PageServerLoad = async ({ locals: { supabase, user } }) => {
  if (!user) redirect(303, '/login');

  const { data: rows } = await supabase
    .from('workout_templates')
    .select('id, name, category, updated_at, workout_template_items(id)')
    .eq('coach_id', user.id)
    .order('name', { ascending: true });

  const templates = ((rows ?? []) as unknown as TemplateRow[]).map((t) => ({
    id: t.id,
    name: t.name,
    category: t.category,
    itemCount: (t.workout_template_items ?? []).length
  }));

  return { templates };
};

export const actions: Actions = {
  create: async ({ request, cookies, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const name = ((await request.formData()).get('name') as string)?.trim();
    if (!name) return fail(400, { error: 'Ponle un nombre al entrenamiento.' });

    const { data, error } = await supabase
      .from('workout_templates')
      .insert({ coach_id: user.id, name } as never)
      .select('id')
      .single();
    if (error || !data) return fail(500, { error: error?.message ?? 'No se pudo crear.' });

    // Ir directo al editor de la plantilla recién creada.
    // Se aterriza en el constructor recién creado y vacío. Sin una palabra,
    // la pantalla en blanco no distingue «creado» de «no ha pasado nada».
    avisar(cookies, 'Entrenamiento creado. Añádele ejercicios.');
    redirect(303, `/templates/${(data as { id: string }).id}`);
  },

  delete: async ({ request, cookies, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const id = (await request.formData()).get('template_id') as string;
    if (!id) return fail(400, { error: 'Falta el id.' });
    const { error } = await supabase
      .from('workout_templates')
      .delete()
      .eq('id', id)
      .eq('coach_id', user.id);
    if (error) return fail(500, { error: error.message });
    avisar(cookies, 'Entrenamiento borrado.');
    return { success: true };
  }
};
