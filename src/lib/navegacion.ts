/**
 * Las pestañas que comparten varias páginas.
 *
 * POR QUÉ UNA CONSTANTE Y NO EL ARRAY EN CADA PANTALLA
 *
 * Porque el fallo típico de las pestañas por ruta es que una se queda atrás.
 * Se añade una cuarta sección a la agenda, se pone en dos de las tres
 * pantallas, y desde la tercera esa sección no existe. Nadie ve el error
 * mirando el código de una pantalla: solo aparece navegando.
 *
 * Es el mismo tipo de fallo que llevamos toda la semana persiguiendo —el mismo
 * trabajo hecho de tres maneras—, así que aquí la lista es una y se importa.
 */

export interface Pestana {
  href: string;
  texto: string;
}

/**
 * Agenda: las tres cosas que ocupan el tiempo del entrenador.
 *
 * El orden no es casual y es el del wireframe: **Citas** primero porque es lo
 * que tiene decisiones pendientes esperándole; **Clases** después, que son
 * suyas y ya están decididas; y **Mis huecos** al final, que es configuración
 * y se toca una vez al mes.
 */
export const PESTANAS_AGENDA: Pestana[] = [
  { href: '/agenda', texto: 'Citas' },
  { href: '/clases', texto: 'Clases' },
  { href: '/availability', texto: 'Mis huecos' }
];

/** Biblioteca: lo que el entrenador construye y reutiliza. */
export const PESTANAS_BIBLIOTECA: Pestana[] = [
  { href: '/exercises', texto: 'Ejercicios' },
  { href: '/templates', texto: 'Entrenamientos' }
];

/**
 * Cartera: las personas y cómo se agrupan.
 *
 * Grupos era un enlace gris al lado de «+ Invitar cliente», y en la prueba de
 * concepto (noviembre de 2026) costó encontrarlo. Ahora es una pestaña, igual
 * que Entrenamientos lo es de la biblioteca.
 */
export const PESTANAS_CARTERA: Pestana[] = [
  { href: '/clients', texto: 'Clientes' },
  { href: '/groups', texto: 'Grupos' }
];
