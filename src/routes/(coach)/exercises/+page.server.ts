// Lista de ejercicios del coach autenticado.

import { fail, redirect } from '@sveltejs/kit';
import { SEED_EXERCISES } from '$lib/seed-exercises';
import { BUCKET } from '$lib/technique';
import type { PageServerLoad, Actions } from './$types';

/** Campos que tiene sentido cambiar a varios ejercicios de golpe. */
const GRUPOS = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio', 'full_body'];
const MATERIALES = ['barbell', 'dumbbell', 'machine', 'bodyweight', 'kettlebell', 'band', 'other'];

/**
 * Ids marcados en el formulario, saneados.
 *
 * Se limita a 200 porque una petición con diez mil ids no viene de nadie
 * pulsando casillas, y la consulta de comprobación de uso los mete en un `in`.
 */
function idsDelFormulario(fd: FormData): string[] {
  const ids = fd
    .getAll('ids')
    .map(String)
    .map((s) => s.trim())
    .filter((s) => /^[0-9a-fA-F-]{36}$/.test(s));
  return [...new Set(ids)].slice(0, 200);
}

export const load: PageServerLoad = async ({ locals: { supabase, user } }) => {
  if (!user) redirect(303, '/login');

  const { data: exercises, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('coach_id', user.id)
    .eq('archived', false)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error cargando ejercicios:', error);
    return { exercises: [] };
  }

  return { exercises: exercises ?? [] };
};

export const actions: Actions = {
  archive: async ({ request, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const formData = await request.formData();
    const id = formData.get('id') as string;
    if (!id) return { success: false, error: 'ID requerido' };

    const { error } = await supabase
      .from('exercises')
      .update({ archived: true })
      .eq('id', id)
      .eq('coach_id', user.id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  // ---- Acciones en lote -----------------------------------------------------

  archivarVarios: async ({ request, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const ids = idsDelFormulario(await request.formData());
    if (ids.length === 0) return fail(400, { error: 'No has marcado ningún ejercicio.' });

    const { error } = await supabase
      .from('exercises')
      .update({ archived: true })
      .in('id', ids)
      .eq('coach_id', user.id);

    if (error) return fail(500, { error: error.message });

    // Se devuelven los ids para que el aviso pueda ofrecer "deshacer". Sin
    // esto, archivar cuarenta y ocho de golpe no tendría vuelta atrás desde
    // ninguna pantalla: nada desarchiva en toda la aplicación.
    return { success: true, archivados: ids.length, idsParaDeshacer: ids };
  },

  desarchivarVarios: async ({ request, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const ids = idsDelFormulario(await request.formData());
    if (ids.length === 0) return fail(400, { error: 'Nada que restaurar.' });

    const { error } = await supabase
      .from('exercises')
      .update({ archived: false })
      .in('id', ids)
      .eq('coach_id', user.id);

    if (error) return fail(500, { error: error.message });
    return { success: true, restaurados: ids.length };
  },

  /**
   * Borrado de verdad, con dos salvaguardas que no son opcionales.
   *
   * 1. NO SE BORRA LO QUE SE HA USADO. `workout_items`, `set_logs` y
   *    `workout_template_items` apuntan a `exercises` con ON DELETE RESTRICT,
   *    así que la base ya lo impediría, pero devolvería un error de clave
   *    ajena ilegible. Peor: en una tanda de veinte, un solo ejercicio usado
   *    haría fallar la operación entera. Se comprueba antes, se borra lo que
   *    se puede y lo demás se archiva, explicando por qué.
   *
   *    Que la base lo prohíba es lo correcto: dentro de un entreno de hace
   *    seis meses hay series con pesos reales. Eso es el historial del
   *    cliente, y no puede evaporarse porque el entrenador limpie su
   *    biblioteca.
   *
   * 2. LOS VÍDEOS DE TÉCNICA SÍ CAEN EN CASCADA. `technique_videos` está con
   *    ON DELETE CASCADE, así que borrar el ejercicio se lleva las filas...
   *    pero NO los archivos del bucket, que quedarían ocupando espacio para
   *    siempre sin que nadie sepa de quién son. Se borran a mano antes.
   */
  borrarVarios: async ({ request, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const ids = idsDelFormulario(await request.formData());
    if (ids.length === 0) return fail(400, { error: 'No has marcado ningún ejercicio.' });

    // ¿Cuáles están en uso? Tres consultas, una por cada tabla que restringe.
    const [enEntrenos, enRegistros, enPlantillas] = await Promise.all([
      supabase.from('workout_items').select('exercise_id').in('exercise_id', ids),
      supabase.from('set_logs').select('exercise_id').in('exercise_id', ids),
      supabase.from('workout_template_items').select('exercise_id').in('exercise_id', ids)
    ]);

    const usados = new Set<string>(
      [...(enEntrenos.data ?? []), ...(enRegistros.data ?? []), ...(enPlantillas.data ?? [])].map(
        (r) => (r as { exercise_id: string }).exercise_id
      )
    );

    const borrables = ids.filter((id) => !usados.has(id));
    const archivables = ids.filter((id) => usados.has(id));

    let borrados = 0;
    if (borrables.length > 0) {
      // Primero los ficheros del bucket, porque después de borrar la fila ya
      // no hay forma de saber qué rutas había.
      const { data: vids } = await supabase
        .from('technique_videos')
        .select('storage_path')
        .in('exercise_id', borrables);

      const rutas = ((vids ?? []) as { storage_path: string }[]).map((v) => v.storage_path);
      if (rutas.length > 0) await supabase.storage.from(BUCKET).remove(rutas);

      const { error } = await supabase
        .from('exercises')
        .delete()
        .in('id', borrables)
        .eq('coach_id', user.id);

      if (error) {
        // 23503 = violación de clave ajena. Significa que algo apuntaba al
        // ejercicio y la comprobación de arriba no lo vio: pasa con un
        // cliente huérfano, sin coach_id, cuyos registros la RLS nos oculta
        // (el caso que arregló la migración 0005 puede haber dejado alguno).
        //
        // La base ha hecho su trabajo y no ha borrado nada. Aquí solo hay que
        // no escupir el error de Postgres: se archivan y se dice lo mismo que
        // en el caso normal, porque para el entrenador es el mismo caso.
        if (error.code === '23503') {
          await supabase
            .from('exercises')
            .update({ archived: true })
            .in('id', ids)
            .eq('coach_id', user.id);

          return {
            success: true,
            borrados: 0,
            archivadosPorUso: ids.length,
            idsParaDeshacer: ids
          };
        }
        return fail(500, { error: error.message });
      }
      borrados = borrables.length;
    }

    if (archivables.length > 0) {
      await supabase
        .from('exercises')
        .update({ archived: true })
        .in('id', archivables)
        .eq('coach_id', user.id);
    }

    return {
      success: true,
      borrados,
      archivadosPorUso: archivables.length,
      // Solo se puede deshacer lo archivado. Lo borrado, no: se dice claro.
      idsParaDeshacer: archivables
    };
  },

  /**
   * Añadir o quitar una etiqueta a varios ejercicios.
   *
   * ANTES ERA "PONER" Y AHORA ES "AÑADIR / QUITAR", Y NO ES UN CAPRICHO.
   * Con una sola etiqueta por ejercicio, "ponle Pecho a estos ocho" era una
   * operación completa. Desde la migración 0016 un ejercicio puede tener
   * varias, y "poner" significaría borrar las demás: marcar ocho presses para
   * añadirles Hombro les quitaría Pecho sin avisar. El caso real del
   * entrenador es "a estos también les toca hombro", que es añadir.
   */
  etiquetarVarios: async ({ request, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const fd = await request.formData();
    const ids = idsDelFormulario(fd);
    if (ids.length === 0) return fail(400, { error: 'No has marcado ningún ejercicio.' });

    const quitar = fd.get('modo') === 'quitar';
    const grupo = (fd.get('muscle_group') as string) ?? '';
    const material = (fd.get('equipment') as string) ?? '';

    // Se valida contra las listas cerradas y no se confía en el desplegable:
    // la restricción de la tabla rechazaría un valor inventado, pero con un
    // error de Postgres en crudo que no le dice nada a nadie.
    if (grupo && !GRUPOS.includes(grupo)) return fail(400, { error: 'Grupo muscular no válido.' });
    if (material && !MATERIALES.includes(material)) {
      return fail(400, { error: 'Material no válido.' });
    }
    if (!grupo && !material) return fail(400, { error: 'Elige qué etiqueta aplicar.' });

    // Hay que leer antes de escribir: el resultado depende de lo que cada
    // ejercicio tuviera. Es la diferencia entre añadir y sobrescribir.
    const { data: actualesRaw, error: errLeer } = await supabase
      .from('exercises')
      .select('id, muscle_groups, equipment_types')
      .in('id', ids)
      .eq('coach_id', user.id);

    if (errLeer) return fail(500, { error: errLeer.message });
    const actuales = (actualesRaw ?? []) as {
      id: string;
      muscle_groups: string[] | null;
      equipment_types: string[] | null;
    }[];

    const aplicar = (lista: string[] | null, valor: string) => {
      const arr = lista ?? [];
      if (!valor) return arr;
      if (quitar) return arr.filter((v) => v !== valor);
      return arr.includes(valor) ? arr : [...arr, valor];
    };

    // Se agrupan los ejercicios que acaban con el MISMO resultado y se manda
    // una actualización por grupo, en vez de una por ejercicio. En la práctica
    // son dos o tres consultas en lugar de cuarenta.
    const porResultado = new Map<string, { ids: string[]; cambios: Record<string, string[]> }>();
    for (const ex of actuales) {
      const cambios: Record<string, string[]> = {};
      if (grupo) cambios.muscle_groups = aplicar(ex.muscle_groups, grupo);
      if (material) cambios.equipment_types = aplicar(ex.equipment_types, material);
      const clave = JSON.stringify(cambios);
      const entrada = porResultado.get(clave) ?? { ids: [], cambios };
      entrada.ids.push(ex.id);
      porResultado.set(clave, entrada);
    }

    for (const { ids: grupoIds, cambios } of porResultado.values()) {
      const { error } = await supabase
        .from('exercises')
        .update(cambios as never)
        .in('id', grupoIds)
        .eq('coach_id', user.id);
      if (error) return fail(500, { error: error.message });
    }

    return { success: true, cambiados: actuales.length, quitados: quitar };
  },

  // Carga la biblioteca base en la cuenta del coach. Se puede ejecutar más de
  // una vez sin duplicar: solo inserta los que no tenga ya (por nombre).
  seedLibrary: async ({ locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');

    const { data: existingRaw } = await supabase
      .from('exercises')
      .select('name')
      .eq('coach_id', user.id);

    const existing = new Set(
      ((existingRaw ?? []) as { name: string }[]).map((e) => e.name.trim().toLowerCase())
    );

    const rows = SEED_EXERCISES.filter((e) => !existing.has(e.name.toLowerCase())).map((e) => ({
      coach_id: user.id,
      name: e.name,
      description: e.description,
      // Se insertan las columnas sueltas a propósito: el disparador de la
      // migración 0016 rellena los arrays a partir de ellas. Reescribir los
      // cuarenta y ocho ejercicios de la biblioteca base para poner arrays de
      // un elemento sería churn sin ganancia, y de paso esto ejercita el
      // camino de compatibilidad cada vez que alguien carga la biblioteca.
      muscle_group: e.muscle_group,
      equipment: e.equipment
    }));

    if (rows.length === 0) {
      return { success: true, seeded: 0, alreadyHad: true };
    }

    const { error } = await supabase.from('exercises').insert(rows as never);
    if (error) return fail(500, { error: error.message });

    return { success: true, seeded: rows.length };
  }
};
