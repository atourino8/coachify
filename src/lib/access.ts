/**
 * Acceso del cliente cuando la cuota está vencida.
 *
 * POR QUÉ ESTÁ TODO EN UN FICHERO
 * La regla se consulta desde cuatro rutas distintas. Si cada una la escribiera
 * por su cuenta, bastaría con olvidarse en una para dejar un agujero: el
 * cliente bloqueado que entra por la ruta que nadie revisó. Aquí la decisión
 * se toma una vez y las rutas solo la aplican.
 *
 * QUÉ SE PAUSA Y QUÉ NO
 * Se pausa lo que produce el entrenador: el entreno del día y los vídeos de
 * técnica. Esa es su palanca y es su trabajo.
 *
 * NO se pausa el historial de progreso del cliente. Sus pesos, sus series y su
 * evolución son datos personales suyos, y el derecho de acceso del RGPD no se
 * puede condicionar a que pague una deuda con un tercero. Además la palanca
 * está en lo otro: nadie sigue pagando por consultar una gráfica.
 *
 * Tampoco se pausan las citas. Si tiene una sesión presencial mañana necesita
 * poder verla o cancelarla; cerrarle eso genera un plantón, no un pago.
 */

import { paymentStatus } from '$lib/supabase/types';

/**
 * Días de margen desde que vence la cuota hasta que se pausa el acceso.
 *
 * Es política del producto, no una preferencia configurable. Siete días
 * cubren el fin de semana, el despiste y —sobre todo— el retraso del propio
 * entrenador en apuntar un pago que ya recibió, que con contabilidad manual
 * es el caso más probable de todos.
 *
 * Si algún día se hace ajustable, el mínimo debería seguir siendo mayor que
 * cero mientras los cobros se apunten a mano.
 */
export const DIAS_DE_GRACIA = 7;

export type EstadoAcceso =
  /** Todo normal. */
  | 'abierto'
  /** Vencida pero dentro de la gracia: ve todo, con un aviso. */
  | 'aviso'
  /** Fuera de la gracia y con el bloqueo activado: entrenos y vídeos en pausa. */
  | 'pausado';

export interface Acceso {
  estado: EstadoAcceso;
  /** true si hay que cerrar entrenos y vídeos. Es lo único que miran las rutas. */
  pausado: boolean;
  /** Días que quedan de gracia. Solo tiene sentido en estado 'aviso'. */
  diasRestantes: number;
}

const ABIERTO: Acceso = { estado: 'abierto', pausado: false, diasRestantes: 0 };

/** Días enteros entre dos fechas ISO (YYYY-MM-DD). Positivo si b es posterior. */
function diasEntre(aISO: string, bISO: string): number {
  const a = Date.parse(aISO + 'T00:00:00Z');
  const b = Date.parse(bISO + 'T00:00:00Z');
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.round((b - a) / 86400000);
}

/**
 * Decide qué ve un cliente hoy.
 *
 * @param bloqueoActivado  El interruptor del entrenador (profiles.block_on_overdue).
 * @param info             Cuota y fecha pagada hasta, de client_info.
 * @param hoyISO           Fecha de hoy en local, no UTC: a las 00:30 en Madrid
 *                         el UTC todavía es ayer, y bloquear a alguien un día
 *                         antes de tiempo es exactamente el fallo que estamos
 *                         intentando evitar.
 */
export function accesoDelCliente(
  bloqueoActivado: boolean | null | undefined,
  info: { fee_amount: number | null; paid_until: string | null } | null | undefined,
  hoyISO: string
): Acceso {
  // Una cuota de 0 € es un cliente que no paga: un amigo, un familiar, alguien
  // en periodo de prueba. paymentStatus lo trata como cuota definida y por
  // tanto puede darlo por vencido, que para la pastilla de una lista da
  // igual pero aquí significaría cerrarle la puerta a quien no debe nada.
  if ((info?.fee_amount ?? 0) <= 0) return ABIERTO;

  const estadoPago = paymentStatus(info, hoyISO);

  // Sin cuota definida no hay nada que deber. Cubre a quien entrena gratis, a
  // quien paga por sesión suelta y a los clientes de una empresa que factura
  // aparte: ninguno de ellos debería encontrarse una puerta cerrada.
  if (estadoPago === 'sin_cuota') return ABIERTO;
  if (estadoPago !== 'vencido') return ABIERTO;

  // Vencida. Cuánto hace.
  //
  // Sin paid_until no sabemos desde cuándo debe: puede ser un cliente recién
  // dado de alta al que todavía no se le ha apuntado el primer pago. Ese caso
  // no se bloquea nunca, porque el más probable no es que no haya pagado sino
  // que nadie lo haya registrado aún.
  if (!info?.paid_until) return ABIERTO;

  const diasVencida = diasEntre(info.paid_until, hoyISO);
  const diasRestantes = DIAS_DE_GRACIA - diasVencida + 1;

  if (diasVencida <= DIAS_DE_GRACIA) {
    return { estado: 'aviso', pausado: false, diasRestantes: Math.max(diasRestantes, 0) };
  }

  // Fuera de gracia. Si el entrenador no ha activado el bloqueo, sigue viendo
  // todo: el aviso ya se lo dimos durante la semana anterior y no vamos a
  // cerrarle nada que su entrenador no haya decidido cerrar.
  if (!bloqueoActivado) return ABIERTO;

  return { estado: 'pausado', pausado: true, diasRestantes: 0 };
}
