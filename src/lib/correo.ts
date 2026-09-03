/**
 * Qué direcciones no se pueden invitar, y por qué importa tanto.
 *
 * EL PROBLEMA
 *
 * Supabase manda los correos de invitación desde un servidor **compartido con
 * todos sus proyectos**. Cuando escribes a un buzón que no existe, el servidor
 * de destino devuelve el correo —un «rebote»— y esa devolución cuenta contra la
 * reputación del remitente, que no es solo nuestra.
 *
 * Nos llegó su aviso: tasa alta de rebotes, y la amenaza de cortarnos el envío.
 * La causa fue nuestra: el guion de sembrado construía las direcciones de los
 * clientes de prueba con el dominio real del entrenador —`demo.lucia@gmail.com`
 * y compañía—, y esos buzones no existen.
 *
 * QUÉ SE BLOQUEA Y POR QUÉ SOLO ESTO
 *
 * Solo los dominios que la IANA reserva (RFC 2606 y RFC 6761): son los que
 * **nunca** van a tener un buzón detrás, ni hoy ni dentro de diez años. Rebotan
 * el 100 % de las veces.
 *
 * No se intenta adivinar si `juan@gmial.com` es una errata. Eso es un problema
 * distinto —y se resuelve pidiendo confirmación, no bloqueando—: rechazar un
 * dominio real porque nos suena raro deja fuera a un cliente de verdad, que es
 * peor que un rebote.
 */

/** Dominios que por norma nunca resuelven a un buzón real. */
const RESERVADOS = [
  'example.com',
  'example.org',
  'example.net',
  'localhost',
  'invalid',
  'test',
  'local'
];

/** Formato mínimo: algo, arroba, algo, punto, dos letras o más. */
export const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * ¿Es una dirección que va a rebotar seguro?
 *
 * Mira el dominio entero y también su terminación, porque los TLD reservados
 * —`.test`, `.invalid`, `.local`— valen a cualquier profundidad:
 * `cliente@gimnasio.local` es tan inexistente como `a@local`.
 */
export function esDominioReservado(correo: string): boolean {
  const dominio = correo.split('@')[1]?.toLowerCase().trim();
  if (!dominio) return false;
  return RESERVADOS.some((r) => dominio === r || dominio.endsWith('.' + r));
}

/**
 * El motivo por el que no se puede invitar a esa dirección, o `null`.
 *
 * Devuelve texto listo para enseñar: quien lo lee necesita saber qué hacer, no
 * que su correo es «inválido».
 */
export function motivoNoInvitable(correo: string): string | null {
  if (!FORMATO_CORREO.test(correo)) return 'Ese correo no tiene un formato válido.';
  if (esDominioReservado(correo)) {
    return (
      'Ese dominio está reservado para pruebas y no existe, así que el correo ' +
      'rebotaría. Usa una dirección real —la tuya vale— para probar la invitación.'
    );
  }
  return null;
}
