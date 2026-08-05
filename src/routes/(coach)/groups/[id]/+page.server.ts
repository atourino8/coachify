// Detalle de un grupo: miembros, alta/baja de clientes y programación masiva
// del mismo entrenamiento a todo el grupo.

import { error, fail, redirect } from '@sveltejs/kit';
import { formatDateISO } from '$lib/week';
import { materializeTemplateWorkout } from '$lib/workouts';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, locals: { supabase, user } }) => {
  if (!user) redirect(303, '/login');

  const { data: g, error: gErr } = await supabase
    .from('client_groups')
    .select('*')
    .eq('id', params.id)
    .eq('coach_id', user.id)
    .single();
  if (gErr || !g) error(404, 'Grupo no encontrado');
  const group = g as { id: string; name: string; company: string | null; notes: string | null };

  // Miembros del grupo
  const { data: memRaw } = await supabase
    .from('client_group_members')
    .select(
      'client_id, added_at, client:profiles!client_group_members_client_id_fkey(id, full_name)'
    )
    .eq('group_id', params.id);

  const members = (
    (memRaw ?? []) as unknown as {
      client_id: string;
      added_at: string;
      client: { id: string; full_name: string | null } | null;
    }[]
  )
    .map((m) => ({
      id: m.client_id,
      name: m.client?.full_name ?? 'Cliente',
      addedAt: m.added_at
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const memberIds = new Set(members.map((m) => m.id));

  // Clientes del coach que aún no están en el grupo (para añadirlos)
  const { data: allClients } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('coach_id', user.id)
    .eq('archived', false)
    .order('full_name');
  const available = ((allClients ?? []) as { id: string; full_name: string | null }[])
    .filter((c) => !memberIds.has(c.id))
    .map((c) => ({ id: c.id, name: c.full_name ?? 'Cliente' }));

  // Entrenamientos del coach para la programación masiva
  const { data: tplRaw } = await supabase
    .from('workout_templates')
    .select('id, name, workout_template_items(id)')
    .eq('coach_id', user.id)
    .order('name');
  const templates = (
    (tplRaw ?? []) as unknown as {
      id: string;
      name: string;
      workout_template_items: { id: string }[] | null;
    }[]
  ).map((t) => ({ id: t.id, name: t.name, itemCount: (t.workout_template_items ?? []).length }));

  return { group, members, available, templates };
};

export const actions: Actions = {
  // Añade clientes existentes al grupo.
  addMembers: async ({ request, params, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const fd = await request.formData();
    const ids = fd.getAll('client_ids') as string[];
    if (ids.length === 0) return fail(400, { error: 'Elige al menos un cliente.' });

    const rows = ids.map((client_id) => ({ group_id: params.id, client_id }));
    const { error: insErr } = await supabase
      .from('client_group_members')
      .upsert(rows as never, { onConflict: 'group_id,client_id' });
    if (insErr) return fail(500, { error: insErr.message });

    return { success: true, added: ids.length };
  },

  removeMember: async ({ request, params, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const clientId = (await request.formData()).get('client_id') as string;
    if (!clientId) return fail(400, { error: 'Falta el cliente.' });

    const { error: delErr } = await supabase
      .from('client_group_members')
      .delete()
      .eq('group_id', params.id)
      .eq('client_id', clientId);
    if (delErr) return fail(500, { error: delErr.message });

    return { success: true, removed: true };
  },

  // Programa el mismo entrenamiento a TODOS los miembros del grupo, en el
  // rango de fechas y los días de la semana marcados.
  programGroup: async ({ request, params, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const fd = await request.formData();
    const templateId = fd.get('template_id') as string;
    const startDate = fd.get('start_date') as string;
    const endDate = fd.get('end_date') as string;
    const weekdays = fd.getAll('weekdays').map((d) => Number(d));
    const overwrite = fd.get('overwrite') === '1';

    if (!templateId || !startDate || !endDate) {
      return fail(400, { error: 'Elige entrenamiento, fecha de inicio y fin.' });
    }
    if (weekdays.length === 0) return fail(400, { error: 'Marca al menos un día de la semana.' });
    if (endDate < startDate)
      return fail(400, { error: 'La fecha de fin es anterior a la de inicio.' });

    // Miembros del grupo
    const { data: memRaw } = await supabase
      .from('client_group_members')
      .select('client_id')
      .eq('group_id', params.id);
    const clientIds = ((memRaw ?? []) as { client_id: string }[]).map((m) => m.client_id);
    if (clientIds.length === 0) return fail(400, { error: 'El grupo no tiene miembros.' });

    // Fechas del rango que caen en los días marcados
    const dates: string[] = [];
    const cur = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    let guard = 0;
    while (cur <= end && guard < 400) {
      if (weekdays.includes(cur.getDay())) dates.push(formatDateISO(cur));
      cur.setDate(cur.getDate() + 1);
      guard++;
    }
    if (dates.length === 0) return fail(400, { error: 'Ese rango no incluye ningún día marcado.' });

    let created = 0;
    let skipped = 0;
    const failed: string[] = [];

    for (const clientId of clientIds) {
      for (const date of dates) {
        const res = await materializeTemplateWorkout(
          supabase,
          user.id,
          clientId,
          date,
          templateId,
          { overwrite }
        );
        if ('workoutId' in res) created++;
        else if ('skipped' in res) skipped++;
        else failed.push(res.error);
      }
    }

    return {
      success: true,
      programmedGroup: true,
      created,
      skipped,
      clients: clientIds.length,
      failedCount: failed.length
    };
  }
};
