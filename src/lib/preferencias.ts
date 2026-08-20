/**
 * Preferencias de vista que sobreviven a recargar la página.
 *
 * POR QUÉ UNA COOKIE Y NO localStorage
 *
 * Con localStorage el servidor no sabe nada: pinta la vista por defecto, el
 * navegador arranca, lee el valor y la cambia. Eso es un PARPADEO en cada
 * carga —lista, y de golpe rejilla— y encima justo en la pantalla que más se
 * visita.
 *
 * Con una cookie, el servidor ya sabe qué quiere el entrenador antes de pintar
 * nada, así que la primera pantalla que se ve ya es la buena.
 *
 * POR QUÉ NO UNA COLUMNA EN EL PERFIL
 *
 * Sería lo mismo pero por dispositivo. Y eso es exactamente lo que se quiere:
 * en el móvil, en el gimnasio, el entrenador quiere la lista densa; sentado en
 * el escritorio, quizá la rejilla con caras. Guardarlo en su perfil le
 * impondría en el móvil lo que eligió en el ordenador.
 *
 * NO ES UNA COOKIE DE LAS QUE HAY QUE CONSENTIR
 *
 * Guarda la palabra «lista» o «rejilla» de quien ya ha iniciado sesión. No
 * identifica, no sigue a nadie y no sale de aquí: es una preferencia de
 * interfaz, del mismo tipo que recordar que el menú estaba plegado.
 */

/** Un año. Es una preferencia, no una sesión. */
const DURACION = 60 * 60 * 24 * 365;

export const COOKIE_VISTA_EJERCICIOS = 'treno_vista_ejercicios';
export const COOKIE_VISTA_CLIENTES = 'treno_vista_clientes';

/**
 * Lee una preferencia validándola contra los valores que existen.
 *
 * Validar importa: la cookie la escribe el navegador y puede llegar con
 * cualquier cosa. Sin esto, `vista` acabaría valiendo lo que alguien escriba
 * en su consola y la plantilla no pintaría ninguna de las dos ramas.
 */
export function leerPreferencia<T extends string>(
  valor: string | undefined,
  permitidos: readonly T[],
  porDefecto: T
): T {
  return permitidos.includes(valor as T) ? (valor as T) : porDefecto;
}

/**
 * Guarda la preferencia desde el navegador.
 *
 * No pasa por el servidor a propósito: cambiar de vista no toca datos, y
 * mandar una petición por cada pulsación del conmutador sería ruido.
 */
export function guardarPreferencia(nombre: string, valor: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${nombre}=${encodeURIComponent(valor)}; path=/; max-age=${DURACION}; samesite=lax`;
}
