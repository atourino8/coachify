// Inicio del entrenador: la agenda, y nada más.
//
// Esta pantalla tenía seis bloques: citas de hoy, peticiones, técnica sin
// corregir, cuotas, clientes sin entreno y propuestas sin responder. Cada uno
// era útil, y juntos convertían el inicio en una lista de deberes que había
// que leer entera antes de saber qué hacer.
//
// Ahora se queda con lo que un entrenador necesita al abrir la aplicación por
// la mañana: a quién ve y quién le está esperando una respuesta. Todo lo demás
// vive en Avisos, con su campana y su contador, que es donde se puede mirar
// cuando toque en vez de cada vez.
//
// El riesgo de esto está anotado en ANALISIS-WIREFRAMES-MOVIL.md §5: una
// campana solo funciona si se mira. Si tras el cambio los vídeos de técnica
// tardan más en corregirse, hay que devolver un aviso aquí.

import { fail, redirect } from '@sveltejs/kit';
import { todayISOInTZ } from '$lib/week';
import { avisar } from '$lib/aviso.server';
import type { PageServerLoad, Actions } from './$types';

const TZ = 'Europe/Madrid';

/** Cuántas peticiones se resuelven desde aquí. El resto, en la agenda. */
const MAX_PETICIONES = 5;

type FilaSesion = {
  id: string;
  client_id: string;
  starts_at: string;
  status: string;
  modality: string;
  location: string | null;
  requested_by: string | null;
  client: { full_name: string | null } | null;
};

export const load: PageServerLoad = async ({ locals: { supabase, user } }) => {
  if (!user) redirect(303, '/login');

  const hoy = todayISOInTZ(TZ);

  const [{ data: sesRaw }, { count: totalClientes }] = await Promise.all([
    supabase
      .from('sessions')
      .select(
        `id, client_id, starts_at, status, modality, location, requested_by,
         client:profiles!sessions_client_id_fkey(full_name)`
      )
      .eq('coach_id', user.id)
      .gte('starts_at', hoy + 'T00:00:00')
      .in('status', ['confirmed', 'requested'])
      .order('starts_at', { ascending: true }),
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('coach_id', user.id)
      .eq('archived', false)
  ]);

  const sesiones = (sesRaw ?? []) as unknown as FilaSesion[];

  const proximas = sesiones
    .filter((s) => s.status === 'confirmed')
    .map((s) => ({
      id: s.id,
      clientId: s.client_id,
      nombre: s.client?.full_name ?? 'Cliente',
      cuando: s.starts_at,
      donde: s.location,
      modalidad: s.modality
    }));

  // Solo las que ha pedido el cliente. Las que propuso el entrenador esperan
  // respuesta del OTRO lado: ponerlas aquí sería pedirle que se conteste solo.
  const peticiones = sesiones
    .filter((s) => s.status === 'requested' && s.requested_by !== user.id)
    .map((s) => ({
      id: s.id,
      nombre: s.client?.full_name ?? 'Cliente',
      cuando: s.starts_at,
      donde: s.location
    }));

  return {
    proximas: proximas.slice(0, 10),
    totalProximas: proximas.length,
    peticiones: peticiones.slice(0, MAX_PETICIONES),
    totalPeticiones: peticiones.length,
    hayClientes: (totalClientes ?? 0) > 0
  };
};

// Confirmar o rechazar sin salir del inicio. Se filtra siempre por coach_id
// para no depender solo de la RLS.
export const actions: Actions = {
  confirmar: async ({ request, cookies, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const id = String((await request.formData()).get('session_id') ?? '');
    if (!id) return fail(400, { error: 'Falta la cita.' });

    const { error } = await supabase
      .from('sessions')
      .update({ status: 'confirmed', decided_at: new Date().toISOString() } as never)
      .eq('id', id)
      .eq('coach_id', user.id);
    if (error) return fail(500, { error: 'No se pudo confirmar la cita.' });
    avisar(cookies, 'Cita confirmada.');
    return { success: true };
  },

  rechazar: async ({ request, cookies, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const id = String((await request.formData()).get('session_id') ?? '');
    if (!id) return fail(400, { error: 'Falta la cita.' });

    const { error } = await supabase
      .from('sessions')
      .update({ status: 'rejected', decided_at: new Date().toISOString() } as never)
      .eq('id', id)
      .eq('coach_id', user.id);
    if (error) return fail(500, { error: 'No se pudo rechazar la cita.' });
    // El MENSAJE se va al aviso flotante; el BOTÓN de deshacer se queda en la
    // página, y por eso `sessionId` sigue viajando. Un botón dentro de algo que
    // se cierra solo a los cinco segundos es una trampa: quien lo necesita es
    // justo quien acaba de darse cuenta del error, y eso tarda más de cinco
    // segundos.
    avisar(cookies, 'Cita rechazada. Tu cliente ya lo ve.', 'aviso');
    return { success: true, rechazada: true, sessionId: id };
  },

  // Deshacer un rechazo. Existe porque rechazar es lo único de esta pantalla
  // que le llega al cliente y no tiene vuelta: el ✓ y la ✕ están a un pulgar
  // de distancia, y en un móvil con prisa el fallo va a pasar.
  deshacerRechazo: async ({ request, cookies, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const id = String((await request.formData()).get('session_id') ?? '');
    if (!id) return fail(400, { error: 'Falta la cita.' });

    const { error } = await supabase
      .from('sessions')
      .update({ status: 'requested', decided_at: null } as never)
      .eq('id', id)
      .eq('coach_id', user.id)
      .eq('status', 'rejected');
    if (error) return fail(500, { error: 'No se pudo deshacer.' });
    avisar(cookies, 'Rechazo deshecho. La cita vuelve a estar pendiente.');
    return { success: true };
  }
};
