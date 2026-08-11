/**
 * Vocabulario de etiquetas: el base del código más el propio del entrenador.
 *
 * El base (ocho grupos, siete materiales) vive en types.ts y lo ve todo el
 * mundo sin configurar nada. Encima se apilan las filas de `coach_tags`
 * (migración 0019), que pueden añadir etiquetas nuevas o RENOMBRAR una del
 * base guardando su mismo identificador con otro texto.
 *
 * El orden importa: primero el base, luego lo suyo. Así lo que se inventa
 * aparece al final del selector, donde molesta menos, y lo de siempre sigue
 * saliendo primero.
 */

import { MUSCLE_GROUP_LABELS, EQUIPMENT_LABELS } from '$lib/supabase/types';

export type ClaseEtiqueta = 'muscle' | 'equipment';

export interface EtiquetaCoach {
  id: string;
  kind: ClaseEtiqueta;
  slug: string;
  label: string;
}

/** Los dos diccionarios listos para pintar, con lo del entrenador aplicado. */
export interface Vocabulario {
  muscle: Record<string, string>;
  equipment: Record<string, string>;
  /** Identificadores del base: no se pueden borrar, solo renombrar. */
  baseMuscle: string[];
  baseEquipment: string[];
}

export const VOCABULARIO_BASE: Vocabulario = {
  muscle: { ...MUSCLE_GROUP_LABELS },
  equipment: { ...EQUIPMENT_LABELS },
  baseMuscle: Object.keys(MUSCLE_GROUP_LABELS),
  baseEquipment: Object.keys(EQUIPMENT_LABELS)
};

export function construirVocabulario(propias: EtiquetaCoach[]): Vocabulario {
  const v: Vocabulario = {
    muscle: { ...MUSCLE_GROUP_LABELS },
    equipment: { ...EQUIPMENT_LABELS },
    baseMuscle: Object.keys(MUSCLE_GROUP_LABELS),
    baseEquipment: Object.keys(EQUIPMENT_LABELS)
  };
  for (const t of propias) {
    if (t.kind === 'muscle') v.muscle[t.slug] = t.label;
    else v.equipment[t.slug] = t.label;
  }
  return v;
}

/**
 * De "Suelo pélvico" a "suelo_pelvico".
 *
 * Se quitan los acentos con normalize('NFD') y no con una tabla de
 * sustituciones: así funciona igual con la ñ, con la diéresis y con lo que
 * traiga cualquiera, en vez de con la lista de casos que se nos ocurran hoy.
 */
export function aIdentificador(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 32);
}

/** ¿Tiene la forma que exige la restricción de la tabla? */
export function identificadorValido(slug: string): boolean {
  return /^[a-z0-9_]{2,32}$/.test(slug);
}
