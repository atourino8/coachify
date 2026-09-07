/**
 * La biblioteca de vídeos del entrenador (ADR-005), en un sitio.
 *
 * Lo comparten las dos pantallas que tocan el vídeo de un ejercicio —crear y
 * editar—, y existe por el motivo de siempre: si cada una resolviera «qué
 * vídeo, y de dónde sale» a su manera, acabarían discrepando en el caso raro.
 * Aquí el caso raro es que el vídeo sea NUEVO y todavía no exista la fila.
 */
import { BUCKET_COACH, validarOrigenes } from '$lib/coach-media';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { CoachVideo } from '$lib/supabase/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Cliente = SupabaseClient<any, 'public', any>;

export interface VideoParaElegir {
  id: string;
  nombre: string;
  firmada: string | null;
  url: string | null;
}

/**
 * Sus vídeos, con las URL ya firmadas, y en cuántos ejercicios se usa cada uno.
 *
 * El recuento no es adorno: es lo que permite decirle «lo usan tres ejercicios»
 * antes de que cambie o borre algo, que es el aviso que pidió el ADR.
 *
 * Se firma en LOTE y no vídeo a vídeo. Firmar en un bucle es el N+1 de siempre
 * y ya nos mordió con los avatares.
 */
export async function videosDelCoach(
  supabase: Cliente,
  coachId: string
): Promise<{ videos: VideoParaElegir[]; usos: Record<string, number> }> {
  const [{ data: filas }, { data: enUso }] = await Promise.all([
    supabase
      .from('coach_videos')
      .select('id, nombre, url, path')
      .eq('coach_id', coachId)
      .order('nombre'),
    supabase
      .from('exercises')
      .select('video_id')
      .eq('coach_id', coachId)
      .not('video_id', 'is', null)
  ]);

  const videos = (filas ?? []) as Pick<CoachVideo, 'id' | 'nombre' | 'url' | 'path'>[];

  const rutas = videos.map((v) => v.path).filter((p): p is string => Boolean(p));
  const firmadas = new Map<string, string>();
  if (rutas.length > 0) {
    const { data } = await supabase.storage.from(BUCKET_COACH).createSignedUrls(rutas, 3600);
    for (const f of data ?? []) {
      if (f.path && f.signedUrl) firmadas.set(f.path, f.signedUrl);
    }
  }

  const usos: Record<string, number> = {};
  for (const e of (enUso ?? []) as { video_id: string | null }[]) {
    if (e.video_id) usos[e.video_id] = (usos[e.video_id] ?? 0) + 1;
  }

  return {
    videos: videos.map((v) => ({
      id: v.id,
      nombre: v.nombre,
      url: v.url,
      firmada: v.path ? (firmadas.get(v.path) ?? null) : null
    })),
    usos
  };
}

/**
 * Qué vídeo queda apuntado tras enviar el formulario del ejercicio.
 *
 * Tres casos, y el tercero es el que justifica que esto sea una función:
 *
 *   · No hay vídeo        → null.
 *   · Uno ya suyo         → su id, tal cual.
 *   · Uno NUEVO           → hay que crear la fila ANTES de poder apuntarla, y
 *                           el id ya viene del navegador porque el fichero se
 *                           subió a una ruta que lo lleva dentro.
 *
 * Comprueba que el id existente sea SUYO. No es paranoia: el campo viaja en un
 * formulario y cualquiera puede cambiarlo. Sin esta comprobación, un entrenador
 * podría apuntar al vídeo de otro y sus clientes lo verían — las políticas de
 * la tabla dejan leer los vídeos «de tu entrenador», así que la fila cruzada
 * sería perfectamente legible.
 */
export async function resolverVideo(
  supabase: Cliente,
  coachId: string,
  fd: FormData
): Promise<{ error: string } | { videoId: string | null }> {
  const nuevoId = ((fd.get('video_nuevo_id') as string) ?? '').trim();
  const nuevoPath = ((fd.get('video_nuevo_path') as string) ?? '').trim() || null;
  const nuevoUrl = ((fd.get('video_nuevo_url') as string) ?? '').trim() || null;

  if (nuevoPath || nuevoUrl) {
    const problema = validarOrigenes({ url: nuevoUrl, path: nuevoPath });
    if (problema) return { error: problema };

    // El id solo es obligatorio cuando hay FICHERO: la ruta en el cubo lo
    // lleva dentro, así que la fila tiene que nacer con ese id exacto o
    // apuntaría a un sitio donde no hay nada. Un enlace de YouTube no toca el
    // cubo, así que ahí el id lo pone la base y no hay nada que casar.
    if (nuevoPath && !nuevoId) {
      return { error: 'Falta el identificador del vídeo nuevo. Vuelve a subirlo.' };
    }

    const nombre =
      ((fd.get('video_nuevo_nombre') as string) ?? '').trim().slice(0, 80) || 'Vídeo sin nombre';

    const fila: Record<string, unknown> = {
      coach_id: coachId,
      nombre,
      url: nuevoUrl,
      path: nuevoPath
    };
    if (nuevoId) fila.id = nuevoId;

    const { data, error } = await supabase
      .from('coach_videos')
      .insert(fila as never)
      .select('id')
      .single();
    if (error) return { error: error.message };
    return { videoId: (data as { id: string }).id };
  }

  const existente = ((fd.get('video_id') as string) ?? '').trim();
  if (!existente) return { videoId: null };

  const { data } = await supabase
    .from('coach_videos')
    .select('id')
    .eq('id', existente)
    .eq('coach_id', coachId)
    .maybeSingle();
  if (!data) return { error: 'Ese vídeo no es tuyo.' };

  return { videoId: existente };
}
