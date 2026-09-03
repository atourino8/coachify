// Lista de ejercicios del coach autenticado.

import { fail, redirect } from '@sveltejs/kit';
import { SEED_EXERCISES } from '$lib/seed-exercises';
import { BUCKET } from '$lib/technique';
import { BUCKET_COACH } from '$lib/coach-media';
import { COOKIE_VISTA_EJERCICIOS, leerPreferencia } from '$lib/preferencias';
import { avisar } from '$lib/aviso.server';
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

const VISTAS = ['grupos', 'lista'] as const;

export const load: PageServerLoad = async ({ cookies, locals: { supabase, user } }) => {
  if (!user) redirect(303, '/login');

  // La vista elegida la última vez. Se lee AQUÍ y no en el navegador para que
  // la primera pantalla ya salga bien: leerla al arrancar el JavaScript sería
  // pintar la lista y cambiarla a rejilla delante de los ojos.
  const vistaGuardada = cookies.get(COOKIE_VISTA_EJERCICIOS);

  const { data: exercises, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('coach_id', user.id)
    .eq('archived', false)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error cargando ejercicios:', error);
    return { exercises: [], vistaGuardada: null };
  }

  return {
    exercises: exercises ?? [],
    vistaGuardada: vistaGuardada ? leerPreferencia(vistaGuardada, VISTAS, 'lista') : null
  };
};

/**
 * El resultado de borrar en lote, en una frase.
 *
 * Se escribe una sola vez porque tiene DOS salidas y las dos ocurren a la vez:
 * unos se borran y otros no se pueden borrar porque están dentro de entrenos ya
 * hechos —dentro hay series con pesos reales de clientes— y esos se archivan.
 * Decir solo «borrados» sería mentira, y decir solo «archivados» también.
 */
function mensajeDeBorrado(borrados: number, archivadosPorUso: number): string {
  const partes: string[] = [];
  if (borrados > 0) {
    partes.push(`${borrados} ${borrados === 1 ? 'ejercicio borrado' : 'ejercicios borrados'}`);
  }
  if (archivadosPorUso > 0) {
    partes.push(
      archivadosPorUso === 1
        ? '1 no se pudo borrar porque está dentro de entrenos ya hechos: se ha archivado'
        : `${archivadosPorUso} no se pudieron borrar porque están dentro de entrenos ya hechos: se han archivado`
    );
  }
  return partes.length === 0 ? 'No había nada que borrar.' : partes.join(' · ') + '.';
}

export const actions: Actions = {
  archive: async ({ request, cookies, locals: { supabase, user } }) => {
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
    avisar(cookies, 'Ejercicio archivado.');
    return { success: true };
  },

  // ---- Acciones en lote -----------------------------------------------------

  archivarVarios: async ({ request, cookies, locals: { supabase, user } }) => {
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
    avisar(
      cookies,
      ids.length === 1 ? 'Ejercicio archivado.' : `${ids.length} ejercicios archivados.`
    );
    return { success: true, idsParaDeshacer: ids };
  },

  desarchivarVarios: async ({ request, cookies, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const ids = idsDelFormulario(await request.formData());
    if (ids.length === 0) return fail(400, { error: 'Nada que restaurar.' });

    const { error } = await supabase
      .from('exercises')
      .update({ archived: false })
      .in('id', ids)
      .eq('coach_id', user.id);

    if (error) return fail(500, { error: error.message });
    avisar(
      cookies,
      ids.length === 1 ? 'Ejercicio restaurado.' : `${ids.length} ejercicios restaurados.`
    );
    return { success: true };
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
  borrarVarios: async ({ request, cookies, locals: { supabase, user } }) => {
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
      // Primero los ficheros de los dos cubos, porque después de borrar la
      // fila ya no hay forma de saber qué rutas había.
      const [{ data: vids }, { data: medios }] = await Promise.all([
        // Vídeos de técnica de los clientes: la fila cae en cascada, el
        // fichero no.
        supabase.from('technique_videos').select('storage_path').in('exercise_id', borrables),
        // Material propio del entrenador: vídeo e imagen subidos.
        supabase.from('exercises').select('video_path, image_path').in('id', borrables)
      ]);

      const rutas = ((vids ?? []) as { storage_path: string }[]).map((v) => v.storage_path);
      if (rutas.length > 0) await supabase.storage.from(BUCKET).remove(rutas);

      const rutasMedios = (
        (medios ?? []) as { video_path: string | null; image_path: string | null }[]
      )
        .flatMap((m) => [m.video_path, m.image_path])
        .filter((r): r is string => Boolean(r));
      if (rutasMedios.length > 0) {
        await supabase.storage.from(BUCKET_COACH).remove(rutasMedios);
      }

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

          avisar(cookies, mensajeDeBorrado(0, ids.length), 'aviso');
          return { success: true, idsParaDeshacer: ids };
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

    avisar(
      cookies,
      mensajeDeBorrado(borrados, archivables.length),
      archivables.length > 0 ? 'aviso' : 'ok'
    );
    // Solo se puede deshacer lo ARCHIVADO. Lo borrado no vuelve, y por eso el
    // botón de deshacer solo aparece si esta lista trae algo.
    return { success: true, idsParaDeshacer: archivables };
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
  etiquetarVarios: async ({ request, cookies, locals: { supabase, user } }) => {
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

    avisar(
      cookies,
      `${actuales.length} ${actuales.length === 1 ? 'ejercicio actualizado' : 'ejercicios actualizados'}` +
        (quitar ? ' (etiqueta quitada)' : '') +
        '.'
    );
    return { success: true };
  },

  // Carga la biblioteca base en la cuenta del coach. Se puede ejecutar más de
  // una vez sin duplicar: solo inserta los que no tenga ya (por nombre).
  seedLibrary: async ({ cookies, locals: { supabase, user } }) => {
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
      avisar(cookies, 'Ya tenías todos los ejercicios de la biblioteca base.', 'aviso');
      return { success: true };
    }

    const { error } = await supabase.from('exercises').insert(rows as never);
    if (error) return fail(500, { error: error.message });

    avisar(
      cookies,
      `${rows.length} ejercicios añadidos a tu biblioteca. Edítalos o añade los tuyos cuando quieras.`
    );
    return { success: true };
  }
};
