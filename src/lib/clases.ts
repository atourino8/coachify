/**
 * Reglas de las clases grupales, en un solo sitio.
 *
 * Aquí no se consulta nada: son las decisiones que toman la pantalla del
 * entrenador y la del cliente, y tienen que tomarlas igual. El motivo de cada
 * una está en ADR-004-CLASES-GRUPALES.md.
 */

import type { ClassBookingStatus, GroupClass } from '$lib/supabase/types';

/**
 * Cuánto hay que avisar para que cancelar no cuente como falta.
 *
 * Este número está TAMBIÉN en la migración 0022, dentro de
 * cancel_class_booking. No hay forma de compartirlo entre SQL y TypeScript
 * sin inventar un generador, así que si cambia uno hay que cambiar el otro:
 * el de la base decide, el de aquí solo avisa antes de pulsar.
 */
export const DIAS_DE_AVISO = 2;

/** Ventana en la que se cuentan las faltas. Fuera de ella, prescriben. */
export const MESES_DE_FALTAS = 3;

/** ¿Cancelar AHORA esta clase contaría como falta? */
export function cancelarSeriaTarde(startsAt: string, ahora = new Date()): boolean {
  const limite = new Date(startsAt).getTime() - DIAS_DE_AVISO * 24 * 60 * 60 * 1000;
  return ahora.getTime() > limite;
}

export interface EstadoDeClase {
  /** Plazas libres. Nunca negativo: bajar el aforo no echa a nadie. */
  libres: number;
  llena: boolean;
  pasada: boolean;
  cancelada: boolean;
  /** Ni apuntarse ni entrar en lista: la clase ya no admite movimiento. */
  cerrada: boolean;
}

export function estadoDeClase(
  clase: Pick<GroupClass, 'capacity' | 'starts_at' | 'status'>,
  ocupadas: number,
  ahora = new Date()
): EstadoDeClase {
  const pasada = new Date(clase.starts_at).getTime() <= ahora.getTime();
  const cancelada = clase.status === 'cancelled';
  const libres = Math.max(0, clase.capacity - ocupadas);
  return {
    libres,
    llena: libres === 0,
    pasada,
    cancelada,
    cerrada: pasada || cancelada
  };
}

/**
 * Qué le pasa a ESTE cliente con esta clase, en una palabra.
 *
 * Se separa del estado de la clase porque son dos preguntas distintas —«¿queda
 * sitio?» y «¿voy?»— y la pantalla del entrenador solo necesita la primera.
 */
export type Situacion =
  'apuntado' | 'en_espera' | 'puede_apuntarse' | 'en_lista_de_espera' | 'ya_no';

export function situacionDelCliente(
  estado: EstadoDeClase,
  inscripcion: ClassBookingStatus | null
): Situacion {
  if (inscripcion === 'seat') return 'apuntado';
  if (inscripcion === 'waitlist') return 'en_espera';
  if (estado.cerrada) return 'ya_no';
  return estado.llena ? 'en_lista_de_espera' : 'puede_apuntarse';
}

/**
 * Los errores de book_class y cancel_class_booking llegan como el texto crudo
 * que levantó la función. Traducirlos aquí y no en cada pantalla evita que un
 * caso nuevo salga en pantalla como «P0001: CLASE_PASADA».
 */
const MENSAJES: Record<string, string> = {
  SIN_SESION: 'Tu sesión ha caducado. Vuelve a entrar.',
  CLASE_NO_EXISTE: 'Esa clase ya no existe.',
  CLASE_CANCELADA: 'Esa clase se ha cancelado.',
  CLASE_PASADA: 'Esa clase ya ha empezado.',
  NO_ES_TU_ENTRENADOR: 'Esa clase no es de tu entrenador.',
  CLASE_DE_OTRO_GRUPO: 'Esa clase es solo para otro grupo.',
  YA_APUNTADO: 'Ya estabas apuntado.',
  NO_ESTABA_APUNTADO: 'No estabas apuntado a esa clase.',
  NO_AUTORIZADO: 'No puedes hacer eso.'
};

export function mensajeDeError(bruto: string | undefined): string {
  if (!bruto) return 'No se ha podido completar.';
  for (const [clave, texto] of Object.entries(MENSAJES)) {
    if (bruto.includes(clave)) return texto;
  }
  return 'No se ha podido completar. Vuelve a intentarlo.';
}
