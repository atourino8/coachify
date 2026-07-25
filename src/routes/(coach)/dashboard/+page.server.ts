// Inicio del coach: lo accionable del día.
//  - Citas de hoy (confirmadas).
//  - Propuestas de cita que el cliente aún no ha respondido.
//  - Clientes sin entreno programado en los próximos 7 días.

import { redirect } from '@sveltejs/kit';
import { todayISOInTZ, addDays, formatDateISO } from '$lib/week';
import type { PageServerLoad } from './$types';

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
  const clients = (clientsRaw ?? []) as { id: string; full_name: string | null }[];

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

  // Clientes SIN entreno en los próximos 7 días (incl. hoy)
  const { data: wkRaw } = await supabase
    .from('workouts')
    .select('client_id, date')
    .eq('coach_id', user.id)
    .gte('date', today)
    .lte('date', weekEnd);
  const clientsWithWorkout = new Set((wkRaw ?? []).map((w) => (w as { client_id: string }).client_id));
  const clientsWithoutWorkout = clients.filter((c) => !clientsWithWorkout.has(c.id));

  return {
    firstName: (user.user_metadata?.full_name as string | undefined)?.split(' ')[0] ?? null,
    counts: { clients: clients.length },
    todaySessions,
    pendingProposals,
    pendingRequests,
    clientsWithoutWorkout,
    hasClients: clients.length > 0
  };
};
