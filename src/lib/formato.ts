/**
 * Cómo se escriben fechas, horas e importes.
 *
 * POR QUÉ EXISTE
 * Había diez ficheros con su propia copia de `toLocaleDateString('es-ES', …)`,
 * casi iguales pero no del todo: unos con día de la semana y otros sin él,
 * unos con año y otros sin. Eso hace que la misma fecha se lea distinta según
 * la pantalla, y que cambiar el criterio sea buscar y sustituir en diez sitios.
 *
 * LA TRAMPA QUE ARREGLA
 * `new Date('2026-08-11')` se interpreta como MEDIANOCHE UTC. En España eso es
 * el día 11 a las dos de la madrugada, así que se ve bien... hasta que alguien
 * abre la aplicación desde una zona al oeste, donde sale el día 10. La forma
 * correcta es `new Date('2026-08-11T00:00:00')`, que se interpreta como hora
 * local. Estaba puesta en unos sitios y en otros no.
 *
 * Las funciones se llaman por lo que significan —día, díaConSemana— y no por
 * cómo se ven, para que cambiar el aspecto no obligue a renombrarlas.
 */

const LOCALE = 'es-ES';

/**
 * Convierte a Date interpretando las fechas sueltas como hora LOCAL.
 *
 * Acepta 'YYYY-MM-DD' (una fecha, sin hora) y marcas de tiempo completas. La
 * distinción importa: una fecha de entreno es un día del calendario del
 * cliente, y una cita es un instante.
 */
function aFecha(valor: string | Date): Date {
  if (valor instanceof Date) return valor;
  return new Date(/^\d{4}-\d{2}-\d{2}$/.test(valor) ? valor + 'T00:00:00' : valor);
}

/** 11 ago */
export function dia(valor: string | Date): string {
  return aFecha(valor).toLocaleDateString(LOCALE, { day: 'numeric', month: 'short' });
}

/** mar, 11 ago */
export function diaConSemana(valor: string | Date): string {
  return aFecha(valor).toLocaleDateString(LOCALE, {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });
}

/** martes, 11 de agosto */
export function diaLargo(valor: string | Date): string {
  return aFecha(valor).toLocaleDateString(LOCALE, {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
}

/** 11 ago 2026 · para listas donde puede haber años distintos */
export function diaConAnio(valor: string | Date): string {
  return aFecha(valor).toLocaleDateString(LOCALE, {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

/** 11/8/2026 · formato corto del sistema, para datos de registro */
export function fechaCorta(valor: string | Date): string {
  return aFecha(valor).toLocaleDateString(LOCALE);
}

/** 09:00 */
export function hora(valor: string | Date): string {
  return aFecha(valor).toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' });
}

/** agosto de 2026 · a partir de 'YYYY-MM' */
export function mesLargo(anioMes: string): string {
  const [a, m] = anioMes.split('-').map(Number);
  return new Date(a, m - 1, 1).toLocaleDateString(LOCALE, { month: 'long', year: 'numeric' });
}

/**
 * 45,00 €
 *
 * Se crea el formateador UNA vez y no en cada llamada: construir un
 * Intl.NumberFormat es caro, y en la pantalla de cobros esto se llama una vez
 * por fila.
 */
const EUROS = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: 'EUR' });
export function euros(importe: number): string {
  return EUROS.format(importe);
}
