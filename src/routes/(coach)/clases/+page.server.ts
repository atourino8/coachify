// Clases grupales del entrenador: próximas y pasadas, y alta en lote.
// Decisiones en ADR-004-CLASES-GRUPALES.md.

import { fail, redirect } from '@sveltejs/kit';
import { datesInRangeOnWeekdays } from '$lib/week';
import type { GroupClass } from '$lib/supabase/types';
import { avisar } from '$lib/aviso.server';
import type { PageServerLoad, Actions } from './$types';

/** Tope de clases por alta en lote. Un trimestre de tres días semanales cabe. */
const TOPE_EN_LOTE = 60;

export const load: PageServerLoad = async ({ locals: { supabase, user } }) => {
  if (!user) redirect(303, '/login');

  // Una sola consulta con las inscripciones dentro: contar plazas por clase
  // con una consulta cada una era el patrón N+1 que ya se quitó tres veces.
  const { data: raw } = await supabase
    .from('group_classes')
    .select('*, class_bookings(status), client_groups(name)')
    .eq('coach_id', user.id)
    .order('starts_at', { ascending: false });

  const filas = (raw ?? []) as unknown as (GroupClass & {
    class_bookings: { status: string }[] | null;
    client_groups: { name: string } | null;
  })[];

  const clases = filas.map((c) => {
    const inscripciones = c.class_bookings ?? [];
    return {
      id: c.id,
      title: c.title,
      starts_at: c.starts_at,
      ends_at: c.ends_at,
      capacity: c.capacity,
      location: c.location,
      status: c.status,
      grupo: c.client_groups?.name ?? null,
      ocupadas: inscripciones.filter((i) => i.status === 'seat').length,
      enEspera: inscripciones.filter((i) => i.status === 'waitlist').length
    };
  });

  const ahora = Date.now();
  const proximas = clases
    .filter((c) => new Date(c.starts_at).getTime() > ahora)
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const pasadas = clases.filter((c) => new Date(c.starts_at).getTime() <= ahora);

  const { data: gruposRaw } = await supabase
    .from('client_groups')
    .select('id, name')
    .eq('coach_id', user.id)
    .order('name');

  return {
    proximas,
    pasadas,
    grupos: (gruposRaw ?? []) as { id: string; name: string }[]
  };
};

export const actions: Actions = {
  // Crea una clase, o todas las del rango si vienen días de la semana marcados.
  create: async ({ request, cookies, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const fd = await request.formData();

    const title = ((fd.get('title') as string) ?? '').trim();
    const startDate = (fd.get('start_date') as string) ?? '';
    const endDate = ((fd.get('end_date') as string) ?? '').trim();
    const startTime = (fd.get('start_time') as string) ?? '';
    const endTime = (fd.get('end_time') as string) ?? '';
    const capacity = Number(fd.get('capacity'));
    const location = ((fd.get('location') as string) ?? '').trim() || null;
    const notes = ((fd.get('notes') as string) ?? '').trim() || null;
    const groupId = ((fd.get('group_id') as string) ?? '').trim() || null;
    const weekdays = fd
      .getAll('weekdays')
      .map((v) => Number(v))
      .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);

    if (!title) return fail(400, { error: 'Ponle un nombre a la clase.' });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return fail(400, { error: 'Falta la fecha.' });
    if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime))
      return fail(400, { error: 'Faltan las horas.' });
    if (endTime <= startTime)
      return fail(400, { error: 'La hora de fin va después de la de inicio.' });
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 200)
      return fail(400, { error: 'El aforo va de 1 a 200 plazas.' });

    // Sin días marcados es una clase suelta; con días, todas las del rango.
    let fechas: string[];
    if (weekdays.length > 0) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate))
        return fail(400, { error: 'Para repetir hace falta una fecha de fin.' });
      if (endDate < startDate)
        return fail(400, { error: 'La fecha de fin es anterior a la de inicio.' });
      fechas = datesInRangeOnWeekdays(startDate, endDate, weekdays);
      if (fechas.length === 0)
        return fail(400, { error: 'Ese rango no incluye ningún día marcado.' });
      if (fechas.length > TOPE_EN_LOTE)
        return fail(400, {
          error: `Son ${fechas.length} clases de una vez y el tope está en ${TOPE_EN_LOTE}. Acorta el rango.`
        });
    } else {
      fechas = [startDate];
    }

    // Las horas se guardan como timestamptz. Se construyen sumando la hora a
    // la fecha en LOCAL del servidor y dejando que Postgres las normalice: la
    // alternativa —montar el desfase a mano— se rompe con el cambio de hora.
    const filas = fechas.map((f) => ({
      coach_id: user.id,
      group_id: groupId,
      title,
      starts_at: new Date(`${f}T${startTime}:00`).toISOString(),
      ends_at: new Date(`${f}T${endTime}:00`).toISOString(),
      capacity,
      location,
      notes
    }));

    const { error } = await supabase.from('group_classes').insert(filas as never);
    if (error) return fail(500, { error: error.message });

    avisar(cookies, filas.length === 1 ? 'Clase creada.' : `${filas.length} clases creadas.`);
    return { success: true };
  }
};
