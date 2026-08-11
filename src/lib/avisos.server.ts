/**
 * Avisos del entrenador, derivados de lo que ya hay en la base.
 *
 * No hay tabla de notificaciones y no hace falta: los cuatro tipos se pueden
 * consultar de las tablas que ya existen (ver la migración 0018). Aquí se
 * reúnen, se cruzan con las marcas de lectura y se devuelven ordenados.
 *
 * Vive en un `.server.ts` porque lo usan dos rutas —la pantalla de avisos y la
 * cabecera, que necesita el contador— y porque tener la regla en un solo sitio
 * evita que el número de la campana y la lista digan cosas distintas, que es
 * el fallo clásico de las bandejas de entrada.
 */

import { paymentStatus } from '$lib/supabase/types';
import { todayISOInTZ, addDays, formatDateISO } from '$lib/week';
import { dia } from '$lib/formato';
import type { SupabaseClient } from '@supabase/supabase-js';

export type TipoAviso = 'cita' | 'revision' | 'pago' | 'sin_entreno';

export interface Aviso {
  tipo: TipoAviso;
  /** Id de la entidad. Es lo que se marca como leído. */
  id: string;
  titulo: string;
  detalle: string;
  /** A dónde lleva para resolverlo. Un aviso que no lleva a la acción es ruido. */
  href: string;
  /** Para ordenar: lo más antiguo primero dentro de cada tipo. */
  fecha: string;
  leido: boolean;
}

export const ETIQUETAS_AVISO: Record<TipoAviso, string> = {
  pago: 'Pagos',
  cita: 'Citas',
  revision: 'Revisiones',
  sin_entreno: 'Sin entreno'
};

const TZ = 'Europe/Madrid';

/**
 * Todos los avisos del entrenador.
 *
 * Se consultan las cuatro fuentes en paralelo. Ninguna es cara: son las mismas
 * consultas que ya hacía el inicio, solo que juntas.
 */
export async function avisosDelCoach(
  // El cliente de Supabase con la sesión del entrenador. Se pasa en vez de
  // crearlo aquí para que la RLS siga aplicando: esto no necesita permisos
  // especiales y no debe tenerlos.
  supabase: SupabaseClient,
  coachId: string
): Promise<Aviso[]> {
  const hoy = todayISOInTZ(TZ);
  const finDeSemana = formatDateISO(addDays(new Date(hoy + 'T00:00:00'), 6));

  const [{ data: citasRaw }, { data: videosRaw }, { data: clientesRaw }, { data: leidasRaw }] =
    await Promise.all([
      supabase
        .from('sessions')
        .select('id, starts_at, requested_by, client:profiles!sessions_client_id_fkey(full_name)')
        .eq('coach_id', coachId)
        .eq('status', 'requested')
        .order('starts_at', { ascending: true }),
      supabase
        .from('technique_videos')
        .select('id, client_id, created_at, exercise:exercises(name)')
        .eq('coach_id', coachId)
        .is('coach_comment', null)
        .order('created_at', { ascending: true }),
      supabase
        .from('profiles')
        .select('id, full_name')
        .eq('coach_id', coachId)
        .eq('archived', false),
      supabase.from('notification_reads').select('kind, entity_id').eq('coach_id', coachId)
    ]);

  const leidas = new Set(
    ((leidasRaw ?? []) as { kind: string; entity_id: string }[]).map(
      (l) => `${l.kind}:${l.entity_id}`
    )
  );
  const visto = (tipo: TipoAviso, id: string) => leidas.has(`${tipo}:${id}`);

  const clientes = (clientesRaw ?? []) as { id: string; full_name: string | null }[];
  const nombrePorId = new Map(clientes.map((c) => [c.id, c.full_name ?? 'Cliente']));

  const avisos: Aviso[] = [];

  // ---- Citas que ha pedido el cliente y esperan respuesta ----
  //
  // Se excluyen las que propuso el propio entrenador: ahí quien tiene que
  // moverse es el cliente, y meterlas aquí sería darle trabajo que no es suyo.
  for (const c of (citasRaw ?? []) as unknown as {
    id: string;
    starts_at: string;
    requested_by: string | null;
    client: { full_name: string | null } | null;
  }[]) {
    if (c.requested_by === coachId) continue;
    avisos.push({
      tipo: 'cita',
      id: c.id,
      titulo: c.client?.full_name ?? 'Cliente',
      detalle: `Te ha pedido cita para el ${dia(c.starts_at)}`,
      href: '/agenda',
      fecha: c.starts_at,
      leido: visto('cita', c.id)
    });
  }

  // ---- Técnica sin corregir ----
  for (const v of (videosRaw ?? []) as unknown as {
    id: string;
    client_id: string;
    created_at: string;
    exercise: { name: string } | null;
  }[]) {
    avisos.push({
      tipo: 'revision',
      id: v.id,
      titulo: nombrePorId.get(v.client_id) ?? 'Cliente',
      detalle: `${v.exercise?.name ?? 'Ejercicio'} · sin corregir desde el ${dia(v.created_at)}`,
      href: `/clients/${v.client_id}`,
      fecha: v.created_at,
      leido: visto('revision', v.id)
    });
  }

  // ---- Cuotas vencidas ----
  //
  // Solo las vencidas, no las que vencen pronto: un aviso que aparece siete
  // días antes de que haya nada que hacer es el que enseña a ignorar la
  // campana.
  const { data: cuotasRaw } = await supabase
    .from('client_info')
    .select('client_id, fee_amount, paid_until')
    .eq('coach_id', coachId);

  const cuotas = (cuotasRaw ?? []) as {
    client_id: string;
    fee_amount: number | null;
    paid_until: string | null;
  }[];
  const activos = new Set(clientes.map((c) => c.id));

  for (const q of cuotas) {
    if (!activos.has(q.client_id)) continue;
    if (paymentStatus(q, hoy) !== 'vencido') continue;
    avisos.push({
      tipo: 'pago',
      id: q.client_id,
      titulo: nombrePorId.get(q.client_id) ?? 'Cliente',
      detalle: q.paid_until ? `Vencido desde el ${dia(q.paid_until)}` : 'Sin ningún pago',
      href: `/clients/${q.client_id}`,
      fecha: q.paid_until ?? '1970-01-01',
      leido: visto('pago', q.client_id)
    });
  }

  // ---- Clientes sin entreno en los próximos siete días ----
  //
  // No estaba en las tres clases que se plantearon, y se añade porque es la
  // única que avisa de algo que NO ha pasado. Las otras tres las dispara el
  // cliente; esta la dispara el olvido del entrenador, que es justo la que él
  // no puede notar solo.
  const { data: entrenosRaw } = await supabase
    .from('workouts')
    .select('client_id')
    .eq('coach_id', coachId)
    .gte('date', hoy)
    .lte('date', finDeSemana);

  const conEntreno = new Set(
    ((entrenosRaw ?? []) as { client_id: string }[]).map((w) => w.client_id)
  );
  for (const c of clientes) {
    if (conEntreno.has(c.id)) continue;
    avisos.push({
      tipo: 'sin_entreno',
      id: c.id,
      titulo: c.full_name ?? 'Cliente',
      detalle: 'Sin nada programado esta semana',
      href: `/clients/${c.id}`,
      fecha: hoy,
      leido: visto('sin_entreno', c.id)
    });
  }

  return avisos;
}

/** Cuántos hay sin ver. Es el número de la campana. */
export function cuentaSinVer(avisos: Aviso[]): number {
  return avisos.filter((a) => !a.leido).length;
}
