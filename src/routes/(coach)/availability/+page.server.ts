// Disponibilidad del coach: define huecos semanales recurrentes que los
// clientes verán al pedir cita.

import { fail, redirect } from '@sveltejs/kit';
import { avisar } from '$lib/aviso.server';
import type { PageServerLoad, Actions } from './$types';

type Slot = {
  id: string;
  kind: 'recurring' | 'specific';
  day_of_week: number | null;
  specific_date: string | null;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  modalities: string[];
};

export const load: PageServerLoad = async ({ locals: { supabase, user } }) => {
  if (!user) redirect(303, '/login');

  const { data: slotsRaw } = await supabase
    .from('availability_slots')
    .select('*')
    .eq('coach_id', user.id)
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true });

  const slots = (slotsRaw ?? []) as unknown as Slot[];
  return { slots };
};

export const actions: Actions = {
  add: async ({ request, cookies, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const fd = await request.formData();

    const dayOfWeek = Number(fd.get('day_of_week'));
    const startTime = fd.get('start_time') as string;
    const duration = Number(fd.get('duration_minutes')) || 60;
    const modalities = fd.getAll('modalities').map((m) => String(m));

    if (Number.isNaN(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
      return fail(400, { error: 'Día no válido.' });
    }
    if (!startTime) return fail(400, { error: 'Falta la hora de inicio.' });
    if (modalities.length === 0) modalities.push('presencial');

    // Calcular end_time = start_time + duration
    const [h, m] = startTime.split(':').map(Number);
    const endMinutes = h * 60 + m + duration;
    const endTime = `${Math.floor(endMinutes / 60)
      .toString()
      .padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`;

    const { error } = await supabase.from('availability_slots').insert({
      coach_id: user.id,
      kind: 'recurring',
      day_of_week: dayOfWeek,
      specific_date: null,
      start_time: startTime,
      end_time: endTime,
      duration_minutes: duration,
      modalities
    } as never);

    if (error) return fail(500, { error: error.message });
    avisar(cookies, 'Hueco añadido.');
    return { success: true };
  },

  remove: async ({ request, cookies, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const fd = await request.formData();
    const id = fd.get('slot_id') as string;
    if (!id) return fail(400, { error: 'Falta el id del hueco.' });

    const { error } = await supabase
      .from('availability_slots')
      .delete()
      .eq('id', id)
      .eq('coach_id', user.id);

    if (error) return fail(500, { error: error.message });
    avisar(cookies, 'Hueco quitado.');
    return { success: true };
  }
};
