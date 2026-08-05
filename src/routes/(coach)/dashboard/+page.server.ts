// Inicio del coach: lo accionable del día.
//
// Principio de esta pantalla: todo lo que aparece aquí se puede RESOLVER aquí.
// Si un aviso solo sirve para mandarte a otra página, es ruido. Por eso las
// citas se confirman/rechazan desde el propio inicio y los avisos llevan a la
// acción concreta (el día del constructor, el vídeo, la ficha), no a un índice.
//
//  - Citas de hoy (confirmadas).
//  - Citas que el cliente pidió y esperan tu respuesta -> confirmar/rechazar in situ.
//  - Vídeos de técnica que el cliente ha subido y aún no has comentado.
//  - Cuotas vencidas o a punto de vencer.
//  - Clientes sin entreno programado en los próximos 7 días.
//  - Propuestas tuyas que el cliente aún no ha respondido.

import { fail, redirect } from '@sveltejs/kit';
import { todayISOInTZ, addDays, formatDateISO } from '$lib/week';
import { paymentStatus } from '$lib/supabase/types';
import { BUCKET } from '$lib/technique';
import type { PageServerLoad, Actions } from './$types';

// Cuántos vídeos pendientes se corrigen desde el inicio. Cada uno cuesta una
// (o dos) firmas de URL contra Storage, así que la bandeja es corta a
// propósito: es para despachar lo del día, no para revisar el histórico.
const INBOX_SIZE = 4;

const TZ = 'Europe/Madrid';

type SessionRow = {
  id: string;
  client_id: string;
  starts_at: string;
  status: string;
  modality: string;
  requested_by: string | null;
  client: { full_name: string | null } | null;
  workout: { id: string; title: string | null; date: string } | null;
};

type VideoRow = {
  id: string;
  client_id: string;
  exercise_id: string;
  kind: string;
  storage_path: string;
  created_at: string;
  exercise: { name: string } | null;
};

export const load: PageServerLoad = async ({ locals: { supabase, user } }) => {
  if (!user) redirect(303, '/login');

  const today = todayISOInTZ(TZ);
  const weekEnd = formatDateISO(addDays(new Date(today + 'T00:00:00'), 6));

  // Clientes del coach
  const { data: clientsRaw } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('coach_id', user.id)
    .eq('archived', false)
    .order('full_name');
  const clients = (clientsRaw ?? []) as {
    id: string;
    full_name: string | null;
  }[];

  // Sesiones del coach de aquí en adelante
  const { data: sessRaw } = await supabase
    .from('sessions')
    .select(
      `id, client_id, starts_at, status, modality, requested_by,
       client:profiles!sessions_client_id_fkey(full_name),
       workout:workouts(id, title, date)`
    )
    .eq('coach_id', user.id)
    .gte('starts_at', today + 'T00:00:00')
    .order('starts_at', { ascending: true });
  const sessions = (sessRaw ?? []) as unknown as SessionRow[];

  // Citas de HOY (confirmadas)
  const todaySessions = sessions.filter(
    (s) => s.status === 'confirmed' && s.starts_at.slice(0, 10) === today
  );

  // Propuestas que el coach hizo y el cliente aún no ha respondido
  const pendingProposals = sessions.filter(
    (s) => s.status === 'requested' && s.requested_by === user.id
  );

  // Solicitudes de cliente pendientes de que el coach confirme
  const pendingRequests = sessions.filter(
    (s) => s.status === 'requested' && s.requested_by !== user.id
  );

  // Vídeos de técnica subidos por clientes que aún no has comentado.
  // Es el aviso que más se echaba en falta: sin esto el cliente sube un vídeo
  // y el coach no se entera hasta que entra en su ficha por casualidad.
  const { data: vidRaw } = await supabase
    .from('technique_videos')
    .select('id, client_id, exercise_id, kind, storage_path, created_at, exercise:exercises(name)')
    .eq('coach_id', user.id)
    .is('coach_comment', null)
    .order('created_at', { ascending: false })
    .limit(20);
  const allPending = (vidRaw ?? []) as unknown as VideoRow[];

  // Solo firmamos URL de los primeros: el resto se cuenta pero no se reproduce.
  const inbox = allPending.slice(0, INBOX_SIZE);

  // Para los que son 'latest' traemos también el 'first' del mismo ejercicio:
  // comparar el antes/después es justo lo que justifica guardar dos vídeos.
  const needFirst = inbox.filter((v) => v.kind === 'latest');
  let firsts: {
    client_id: string;
    exercise_id: string;
    storage_path: string;
    created_at: string;
  }[] = [];
  if (needFirst.length > 0) {
    const { data: fRaw } = await supabase
      .from('technique_videos')
      .select('client_id, exercise_id, storage_path, created_at')
      .eq('coach_id', user.id)
      .eq('kind', 'first')
      .in('client_id', [...new Set(needFirst.map((v) => v.client_id))])
      .in('exercise_id', [...new Set(needFirst.map((v) => v.exercise_id))]);
    firsts = (fRaw ?? []) as typeof firsts;
  }

  async function sign(path: string) {
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
    return data?.signedUrl ?? null;
  }

  // El nombre lo resolvemos con los clientes ya cargados, en vez de con un join
  // a profiles: una consulta menos y no dependemos del nombre de la FK.
  const nameById = new Map(clients.map((c) => [c.id, c.full_name ?? 'Cliente']));

  const reviewQueue = await Promise.all(
    inbox.map(async (v) => {
      const first =
        v.kind === 'latest'
          ? firsts.find((f) => f.client_id === v.client_id && f.exercise_id === v.exercise_id)
          : undefined;
      return {
        id: v.id,
        clientId: v.client_id,
        clientName: nameById.get(v.client_id) ?? 'Cliente',
        exerciseName: v.exercise?.name ?? 'Ejercicio',
        createdAt: v.created_at,
        url: await sign(v.storage_path),
        firstUrl: first ? await sign(first.storage_path) : null,
        firstAt: first?.created_at ?? null
      };
    })
  );

  const pendingVideoCount = allPending.length;

  // Cuotas: solo interesan las que requieren acción (vencidas o vencen pronto).
  const { data: feesRaw } = await supabase
    .from('client_info')
    .select('client_id, fee_amount, paid_until')
    .eq('coach_id', user.id);
  const feeByClient = new Map(
    (
      (feesRaw ?? []) as {
        client_id: string;
        fee_amount: number | null;
        paid_until: string | null;
      }[]
    ).map((f) => [f.client_id, { fee_amount: f.fee_amount, paid_until: f.paid_until }])
  );
  const paymentAlerts = clients
    .map((c) => ({
      id: c.id,
      name: c.full_name ?? 'Cliente',
      status: paymentStatus(feeByClient.get(c.id), today),
      paidUntil: feeByClient.get(c.id)?.paid_until ?? null
    }))
    .filter((c) => c.status === 'vencido' || c.status === 'vence_pronto');

  // Clientes SIN entreno en los próximos 7 días (incl. hoy)
  const { data: wkRaw } = await supabase
    .from('workouts')
    .select('client_id, date')
    .eq('coach_id', user.id)
    .gte('date', today)
    .lte('date', weekEnd);
  const clientsWithWorkout = new Set(
    (wkRaw ?? []).map((w) => (w as { client_id: string }).client_id)
  );
  const clientsWithoutWorkout = clients.filter((c) => !clientsWithWorkout.has(c.id));

  return {
    firstName: (user.user_metadata?.full_name as string | undefined)?.split(' ')[0] ?? null,
    today,
    counts: { clients: clients.length },
    todaySessions,
    pendingProposals,
    pendingRequests,
    reviewQueue,
    pendingVideoCount,
    paymentAlerts,
    clientsWithoutWorkout,
    hasClients: clients.length > 0
  };
};

// Confirmar o rechazar una cita sin salir del inicio. Filtramos siempre por
// coach_id para no depender solo de la RLS.
export const actions: Actions = {
  confirmSession: async ({ request, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const sessionId = String((await request.formData()).get('session_id') ?? '');
    if (!sessionId) return fail(400, { error: 'Falta la cita.' });

    const { error } = await supabase
      .from('sessions')
      .update({
        status: 'confirmed',
        decided_at: new Date().toISOString()
      } as never)
      .eq('id', sessionId)
      .eq('coach_id', user.id);
    if (error) return fail(500, { error: 'No se pudo confirmar la cita.' });
    return { success: true, confirmed: true };
  },

  rejectSession: async ({ request, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const sessionId = String((await request.formData()).get('session_id') ?? '');
    if (!sessionId) return fail(400, { error: 'Falta la cita.' });

    const { error } = await supabase
      .from('sessions')
      .update({
        status: 'rejected',
        decided_at: new Date().toISOString()
      } as never)
      .eq('id', sessionId)
      .eq('coach_id', user.id);
    if (error) return fail(500, { error: 'No se pudo rechazar la cita.' });
    return { success: true, rejected: true };
  },

  // Corregir la técnica sin entrar en la ficha del cliente. Guardar el
  // comentario es lo que saca el vídeo de la bandeja (coach_comment deja de
  // ser null), así que la lista se vacía sola a medida que despachas.
  commentVideo: async ({ request, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');

    const fd = await request.formData();
    const videoId = String(fd.get('video_id') ?? '');
    const comment = String(fd.get('comment') ?? '').trim();
    if (!videoId) return fail(400, { error: 'Falta el vídeo.' });
    if (!comment) return fail(400, { error: 'Escribe la corrección antes de guardar.' });

    const { error } = await supabase
      .from('technique_videos')
      .update({
        coach_comment: comment,
        coach_comment_at: new Date().toISOString()
      } as never)
      .eq('id', videoId)
      .eq('coach_id', user.id);
    if (error) return fail(500, { error: 'No se pudo guardar la corrección.' });
    return { success: true, commented: true };
  }
};
