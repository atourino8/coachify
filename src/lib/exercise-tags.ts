/**
 * Lectura y validación de las etiquetas múltiples de un ejercicio.
 *
 * Vive aparte porque lo usan cuatro sitios —crear, editar, cambiar en lote y
 * el guardián de tipos— y porque la validación no puede quedarse solo en la
 * base de datos: la restricción de la migración 0016 rechazaría un valor
 * inventado, pero devolviendo un error de Postgres que no le dice nada a
 * nadie. Aquí se filtra antes y se sabe qué se descartó.
 */

import { MUSCLE_GROUPS, EQUIPMENT_TYPES } from '$lib/supabase/types';
import type { MuscleGroup, Equipment } from '$lib/supabase/types';

/**
 * Valores válidos del formulario, sin repetidos y en el orden en que llegaron.
 *
 * EL ORDEN IMPORTA y por eso no se ordena alfabéticamente: el primer elemento
 * es el principal, es el que el disparador copia a la columna suelta, y es la
 * etiqueta que ve el cliente en su entreno. Reordenar aquí cambiaría lo que se
 * ve en pantallas que no tienen nada que ver con este formulario.
 *
 * Se limita a `permitidos.length` porque más elementos que el vocabulario solo
 * pueden venir de repetidos o de basura.
 */
function limpiar<T extends string>(valores: string[], permitidos: readonly T[]): T[] {
  const validos = valores.filter((v): v is T => (permitidos as readonly string[]).includes(v));
  return [...new Set(validos)].slice(0, permitidos.length);
}

export function gruposDelFormulario(fd: FormData, campo = 'muscle_groups'): MuscleGroup[] {
  return limpiar(fd.getAll(campo).map(String), MUSCLE_GROUPS);
}

export function materialesDelFormulario(fd: FormData, campo = 'equipment_types'): Equipment[] {
  return limpiar(fd.getAll(campo).map(String), EQUIPMENT_TYPES);
}

/**
 * Lo que se manda a la base al crear o editar.
 *
 * No incluye `muscle_group` ni `equipment` a propósito: son columnas derivadas
 * y el disparador las calcula. Escribirlas desde aquí sería duplicar la regla
 * en dos sitios que acabarían discrepando.
 */
export function etiquetasParaGuardar(fd: FormData) {
  return {
    muscle_groups: gruposDelFormulario(fd),
    equipment_types: materialesDelFormulario(fd)
  };
}
