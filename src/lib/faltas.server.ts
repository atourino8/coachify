/**
 * Contar faltas, en un solo sitio.
 *
 * Una falta es soltar una plaza con menos de DIAS_DE_AVISO de antelación
 * (ADR-004). No hay contador en ninguna tabla: se cuenta al preguntar, y por
 * eso cambiar la regla cambia también el pasado, que es lo que se quiere.
 *
 * Hace falta en tres pantallas —el detalle de la clase, la ficha del cliente y
 * lo que ve el propio cliente—, así que vive aquí y no copiado tres veces con
 * la ventana de días escrita a mano en cada una.
 */

import { DIAS_DE_AVISO, MESES_DE_FALTAS } from '$lib/clases';

type SupabaseServer = App.Locals['supabase'];

interface FilaCruda {
  client_id: string;
  cancelled_at: string;
  group_classes: { coach_id: string; starts_at: string } | null;
}

/**
 * Faltas por cliente en los últimos MESES_DE_FALTAS, contando solo clases de
 * ESTE entrenador. Devuelve un mapa; los que no aparecen tienen cero.
 *
 * Falla a cero, no a error: un número que no se ha podido calcular no debe
 * tumbar la pantalla donde se enseña de refilón.
 */
export async function faltasPorCliente(
  supabase: SupabaseServer,
  coachId: string,
  clientIds: string[]
): Promise<Map<string, number>> {
  const faltas = new Map<string, number>();
  if (clientIds.length === 0) return faltas;

  const desde = new Date();
  desde.setMonth(desde.getMonth() - MESES_DE_FALTAS);

  // El !inner convierte el join en filtro: sin él vendrían inscripciones de
  // clases de otros entrenadores con group_classes en nulo.
  const { data, error } = await supabase
    .from('class_bookings')
    .select('client_id, cancelled_at, group_classes!inner(coach_id, starts_at)')
    .in('client_id', clientIds)
    .eq('status', 'cancelled')
    .eq('had_seat', true)
    .gte('cancelled_at', desde.toISOString());
  if (error) return faltas;

  const margen = DIAS_DE_AVISO * 24 * 60 * 60 * 1000;
  for (const fila of (data ?? []) as unknown as FilaCruda[]) {
    if (!fila.group_classes || fila.group_classes.coach_id !== coachId) continue;
    const limite = new Date(fila.group_classes.starts_at).getTime() - margen;
    if (new Date(fila.cancelled_at).getTime() > limite) {
      faltas.set(fila.client_id, (faltas.get(fila.client_id) ?? 0) + 1);
    }
  }
  return faltas;
}
