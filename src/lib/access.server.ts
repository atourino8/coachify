/**
 * La misma decisión de `access.ts`, pero para sitios donde no hay `parent()`.
 *
 * POR QUÉ HACE FALTA
 * Las `load` de las rutas reciben el acceso ya calculado desde el layout. Las
 * `actions` no: una petición POST a `?/logSet` entra directa sin pasar por el
 * layout. Si el corte viviera solo en las `load`, un cliente pausado no vería
 * la pantalla pero podría seguir registrando series mandando el formulario a
 * mano. Esconder un botón nunca es cerrar una puerta.
 *
 * ESTE FICHERO ES SOLO DE SERVIDOR. Lleva `.server.ts` a propósito: usa la
 * service_role, y SvelteKit falla el build si alguien lo importa desde el
 * navegador. `access.ts` (la regla pura) sigue siendo importable desde
 * cualquier sitio.
 */

import { accesoDelCliente, type Acceso } from '$lib/access';
import { supabaseAdmin } from '$lib/supabase/admin';
import { todayISOInTZ } from '$lib/week';

const TZ_POR_DEFECTO = 'Europe/Madrid';

/**
 * Recalcula el acceso de un cliente desde su id. Dos consultas, y solo se
 * llama en acciones que escriben, que no son un camino caliente.
 *
 * Ante cualquier duda devuelve acceso abierto: si falla una consulta o falta
 * la migración, preferimos no cerrarle la puerta a alguien que sí ha pagado.
 * El coste de equivocarse en un sentido es una serie registrada de más; en el
 * otro, un cliente al día que no puede entrenar y culpa a su entrenador.
 */
export async function accesoDeCliente(clientId: string): Promise<Acceso> {
  const abierto: Acceso = { estado: 'abierto', pausado: false, diasRestantes: 0 };

  const { data: perfil } = await supabaseAdmin
    .from('profiles')
    .select('coach_id, timezone')
    .eq('id', clientId)
    .maybeSingle();

  if (!perfil?.coach_id) return abierto;

  const { data: coach } = await supabaseAdmin
    .from('profiles')
    .select('block_on_overdue')
    .eq('id', perfil.coach_id)
    .maybeSingle();

  if (!coach?.block_on_overdue) return abierto;

  const { data: info } = await supabaseAdmin
    .from('client_info')
    .select('fee_amount, paid_until')
    .eq('client_id', clientId)
    .maybeSingle();

  return accesoDelCliente(true, info ?? null, todayISOInTZ(perfil.timezone || TZ_POR_DEFECTO));
}
