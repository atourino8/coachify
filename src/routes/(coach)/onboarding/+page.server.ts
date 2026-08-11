// Asistente de primer login del entrenador.
//
// Qué resuelve: alguien que se registra hoy aterriza en una aplicación vacía y
// tiene que deducir por su cuenta que el orden es biblioteca → horarios →
// cliente. Los estados vacíos ayudan, pero no llevan de la mano.
//
// Los cuatro pasos son los que DESBLOQUEAN algo, no una visita guiada:
//   1. Perfil    · tu nombre es lo que ven tus clientes en sus citas.
//   2. Biblioteca· sin ejercicios no puedes montar nada.
//   3. Horarios  · sin huecos publicados, tus clientes NO pueden pedirte cita.
//   4. Cliente   · sin cliente, la aplicación no tiene a quién servir.
//
// Todos se pueden saltar. Un asistente que no deja salir es una jaula.

import { fail, redirect } from '@sveltejs/kit';
import { SEED_EXERCISES } from '$lib/seed-exercises';
import { supabaseAdmin } from '$lib/supabase/admin';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, user } }) => {
  if (!user) redirect(303, '/login');

  // Contamos lo que ya tiene para poder marcar los pasos hechos: si alguien
  // abandona a medias y vuelve, no tiene sentido pedirle lo que ya hizo.
  const [{ count: exerciseCount }, { count: slotCount }, { count: clientCount }] =
    await Promise.all([
      supabase
        .from('exercises')
        .select('id', { count: 'exact', head: true })
        .eq('coach_id', user.id)
        .eq('archived', false),
      supabase
        .from('availability_slots')
        .select('id', { count: 'exact', head: true })
        .eq('coach_id', user.id),
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('coach_id', user.id)
        .eq('archived', false)
    ]);

  return {
    seedCount: SEED_EXERCISES.length,
    done: {
      exercises: (exerciseCount ?? 0) > 0,
      availability: (slotCount ?? 0) > 0,
      clients: (clientCount ?? 0) > 0
    },
    counts: {
      exercises: exerciseCount ?? 0,
      availability: slotCount ?? 0,
      clients: clientCount ?? 0
    }
  };
};

/** Marca el asistente como terminado y lleva al inicio. */
async function finish(supabase: App.Locals['supabase'], userId: string) {
  await supabase
    .from('profiles')
    .update({ onboarded_at: new Date().toISOString() } as never)
    .eq('id', userId);
}

export const actions: Actions = {
  // Paso 1 · el nombre que verán sus clientes.
  saveProfile: async ({ request, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const fd = await request.formData();
    const fullName = String(fd.get('full_name') ?? '').trim();
    if (!fullName) return fail(400, { error: 'Escribe tu nombre para continuar.' });

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName } as never)
      .eq('id', user.id);
    if (error) return fail(500, { error: 'No se pudo guardar tu nombre.' });
    return { success: true, step: 'profile' };
  },

  // Paso 2 · biblioteca base. Idempotente: solo añade los que falten.
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
      // Se insertan las columnas sueltas a propósito: el disparador de la
      // migración 0016 rellena los arrays a partir de ellas. Reescribir los
      // cuarenta y ocho ejercicios de la biblioteca base para poner arrays de
      // un elemento sería churn sin ganancia, y de paso esto ejercita el
      // camino de compatibilidad cada vez que alguien carga la biblioteca.
      muscle_group: e.muscle_group,
      equipment: e.equipment
    }));

    if (rows.length === 0) return { success: true, step: 'library', seeded: 0 };

    const { error } = await supabase.from('exercises').insert(rows as never);
    if (error) return fail(500, { error: 'No se pudo cargar la biblioteca.' });
    return { success: true, step: 'library', seeded: rows.length };
  },

  // Paso 3 · horarios. Genera un hueco recurrente por cada día marcado.
  saveAvailability: async ({ request, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const fd = await request.formData();

    const days = fd.getAll('days').map((d) => Number(d));
    const startTime = String(fd.get('start_time') ?? '');
    const endTime = String(fd.get('end_time') ?? '');
    const duration = Number(fd.get('duration_minutes')) || 60;

    if (days.length === 0) return fail(400, { error: 'Marca al menos un día.' });
    if (!startTime || !endTime)
      return fail(400, { error: 'Indica desde qué hora hasta qué hora.' });
    if (endTime <= startTime) {
      return fail(400, { error: 'La hora de fin tiene que ser posterior a la de inicio.' });
    }

    const rows = days.map((d) => ({
      coach_id: user.id,
      kind: 'recurring',
      day_of_week: d,
      specific_date: null,
      start_time: startTime,
      end_time: endTime,
      duration_minutes: duration,
      modalities: ['presencial', 'online']
    }));

    const { error } = await supabase.from('availability_slots').insert(rows as never);
    if (error) return fail(500, { error: 'No se pudieron guardar tus horarios.' });
    return { success: true, step: 'availability', slots: rows.length };
  },

  // Paso 4 · invitar al primer cliente.
  inviteClient: async ({ request, url, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const fd = await request.formData();
    const email = String(fd.get('email') ?? '')
      .trim()
      .toLowerCase();
    const fullName = String(fd.get('full_name') ?? '').trim();

    if (!email || !fullName) {
      return fail(400, { error: 'Necesito el nombre y el email de tu cliente.' });
    }

    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName, role: 'client', coach_id: user.id },
      redirectTo: `${url.origin}/auth/callback?invite=1`
    });

    if (error) {
      const msg = error.message.includes('already')
        ? 'Ese email ya tiene cuenta. Pídele que entre y se vincule contigo.'
        : error.message;
      return fail(400, { error: msg });
    }

    // Vincular explícitamente, por si el trigger no leyó el metadata.
    if (data?.user?.id) {
      await supabaseAdmin
        .from('profiles')
        .update({ coach_id: user.id, role: 'client', full_name: fullName } as never)
        .eq('id', data.user.id);
    }

    return { success: true, step: 'client', invited: email };
  },

  // Terminar o saltar: en ambos casos dejamos de preguntar.
  finish: async ({ locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    await finish(supabase, user.id);
    redirect(303, '/dashboard');
  }
};
