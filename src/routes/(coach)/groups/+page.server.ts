// Grupos de clientes: capa de gestión para atender a muchos clientes a la vez
// (caso típico: las empleadas de una empresa que contrata al entrenador).

import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, user } }) => {
  if (!user) redirect(303, '/login');

  const { data: raw } = await supabase
    .from('client_groups')
    .select('*, client_group_members(client_id)')
    .eq('coach_id', user.id)
    .order('created_at', { ascending: false });

  const groups = ((raw ?? []) as unknown as {
    id: string;
    name: string;
    company: string | null;
    notes: string | null;
    created_at: string;
    client_group_members: { client_id: string }[] | null;
  }[]).map((g) => ({
    id: g.id,
    name: g.name,
    company: g.company,
    notes: g.notes,
    created_at: g.created_at,
    memberCount: (g.client_group_members ?? []).length
  }));

  return { groups };
};

export const actions: Actions = {
  create: async ({ request, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const fd = await request.formData();
    const name = ((fd.get('name') as string) ?? '').trim();
    const company = ((fd.get('company') as string) ?? '').trim() || null;
    if (!name) return fail(400, { error: 'Ponle un nombre al grupo.' });

    const { error } = await supabase
      .from('client_groups')
      .insert({ coach_id: user.id, name, company } as never);
    if (error) return fail(500, { error: error.message });

    return { success: true, created: true };
  },

  delete: async ({ request, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const groupId = (await request.formData()).get('group_id') as string;
    if (!groupId) return fail(400, { error: 'Falta el grupo.' });

    // Borrar el grupo NO borra clientes: solo deshace la agrupación
    // (client_group_members cae en cascada).
    const { error } = await supabase
      .from('client_groups')
      .delete()
      .eq('id', groupId)
      .eq('coach_id', user.id);
    if (error) return fail(500, { error: error.message });

    return { success: true, deleted: true };
  }
};
