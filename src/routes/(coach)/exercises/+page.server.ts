// Lista de ejercicios del coach autenticado.

import { fail, redirect } from '@sveltejs/kit';
import { SEED_EXERCISES } from '$lib/seed-exercises';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, user } }) => {
  if (!user) redirect(303, '/login');

  const { data: exercises, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('coach_id', user.id)
    .eq('archived', false)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error cargando ejercicios:', error);
    return { exercises: [] };
  }

  return { exercises: exercises ?? [] };
};

export const actions: Actions = {
  archive: async ({ request, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const formData = await request.formData();
    const id = formData.get('id') as string;
    if (!id) return { success: false, error: 'ID requerido' };

    const { error } = await supabase
      .from('exercises')
      .update({ archived: true })
      .eq('id', id)
      .eq('coach_id', user.id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  // Carga la biblioteca base en la cuenta del coach. Se puede ejecutar más de
  // una vez sin duplicar: solo inserta los que no tenga ya (por nombre).
  seedLibrary: async ({ locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');

    const { data: existingRaw } = await supabase
      .from('exercises')
      .select('name')
      .eq('coach_id', user.id);

    const existing = new Set(
      ((existingRaw ?? []) as { name: string }[]).map((e) => e.name.trim().toLowerCase())
    );

    const rows = SEED_EXERCISES.filter((e) => !existing.has(e.name.toLowerCase())).map((e) => ({
      coach_id: user.id,
      name: e.name,
      description: e.description,
      muscle_group: e.muscle_group,
      equipment: e.equipment
    }));

    if (rows.length === 0) {
      return { success: true, seeded: 0, alreadyHad: true };
    }

    const { error } = await supabase.from('exercises').insert(rows as never);
    if (error) return fail(500, { error: error.message });

    return { success: true, seeded: rows.length };
  }
};
