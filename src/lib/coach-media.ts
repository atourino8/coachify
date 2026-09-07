/**
 * Material del entrenador: el vídeo y la imagen de cada ejercicio.
 *
 * Distinto del vídeo de técnica, que es del cliente y personal. Esto es lo que
 * el entrenador produce y ven todos sus clientes, así que vive en su propio
 * cubo con la regla contraria: él escribe, ellos leen.
 *
 * CADA MEDIO ADMITE DOS ORÍGENES
 *   · subido  → vive en el cubo, columna *_path
 *   · enlazado → una URL de YouTube, columna *_url
 * Son excluyentes, y lo garantiza una restricción en la tabla.
 */

export const BUCKET_COACH = 'coach-media';

export const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100 MB
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

export const VIDEO_MIME = ['video/mp4', 'video/webm', 'video/quicktime'];
export const IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp'];

export type MedioTipo = 'video' | 'imagen';

function extPara(mime: string): string {
  const mapa: Record<string, string> = {
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/quicktime': 'mov',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp'
  };
  return mapa[mime] ?? 'bin';
}

/**
 * Ruta dentro del cubo.
 *
 * El primer segmento DEBE ser el id del entrenador: las políticas de storage
 * comprueban exactamente eso para decidir quién puede escribir y qué clientes
 * pueden leer. Si esta función cambiara de forma, las políticas dejarían de
 * proteger nada sin dar ningún error.
 *
 * LA IMAGEN CUELGA DEL EJERCICIO Y EL VÍDEO NO, y esa asimetría no es un
 * descuido: desde la 0026 un vídeo lo comparten varios ejercicios (ADR-005).
 * Guardarlo en `coach/ejercicio/video.mp4` diría que es de ese ejercicio, y
 * bastaría con borrar ese ejercicio para dejar sin vídeo a los otros dos que lo
 * usan. Cuelga de su propio id, que es de quien es.
 */
export function rutaImagen(coachId: string, exerciseId: string, mime: string): string {
  return `${coachId}/${exerciseId}/imagen.${extPara(mime)}`;
}

export function rutaVideo(coachId: string, videoId: string, mime: string): string {
  return `${coachId}/videos/${videoId}.${extPara(mime)}`;
}

/** Valida antes de gastar ancho de banda en algo que vamos a rechazar. */
export function validarMedio(file: File, tipo: MedioTipo): string | null {
  if (tipo === 'video') {
    if (!VIDEO_MIME.includes(file.type)) {
      return 'Formato no admitido. Sube el vídeo en MP4, WebM o MOV.';
    }
    if (file.size > MAX_VIDEO_BYTES) {
      return `El vídeo pesa ${Math.round(file.size / 1048576)} MB y el máximo son 100 MB.`;
    }
    return null;
  }
  if (!IMAGE_MIME.includes(file.type)) {
    return 'Formato no admitido. Sube la imagen en JPG, PNG o WebP.';
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `La imagen pesa ${Math.round(file.size / 1048576)} MB y el máximo son 5 MB.`;
  }
  return null;
}

/**
 * Identificador de un vídeo de YouTube, o null.
 *
 * ESTO ES UNA MEDIDA DE SEGURIDAD, no una comodidad. Lo que se guarda es una
 * URL que escribe el entrenador, y lo que se pinta es un <iframe>. Si se
 * metiera la URL tal cual, cualquier dirección acabaría incrustada en la
 * pantalla de un cliente. Extrayendo el identificador y reconstruyendo la URL
 * de YouTube, lo único que puede acabar en el iframe es un vídeo de YouTube.
 *
 * El patrón ya estaba en dos pantallas copiado; aquí vive una vez.
 */
export function idDeYoutube(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([\w-]{11})/
  );
  return m ? m[1] : null;
}

export function urlDeEmbebido(id: string): string {
  return `https://www.youtube.com/embed/${id}`;
}

/**
 * Miniatura de YouTube. Sirve como imagen del ejercicio cuando el entrenador
 * enlazó un vídeo y no puso imagen: mejor eso que un hueco gris.
 */
export function miniaturaDeYoutube(id: string): string {
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

/**
 * Reglas de lo que se puede guardar, aplicadas en el servidor.
 *
 * Devuelve el error o null. Se comprueba aquí y además con una restricción en
 * la tabla: la restricción impide que la base quede incoherente, y esto
 * permite decir por qué en castellano.
 */
export function validarOrigenes(campos: {
  url: string | null;
  path: string | null;
}): string | null {
  if (campos.url && campos.path) {
    return 'Elige una cosa: o subes el vídeo o lo enlazas.';
  }
  if (!campos.url && !campos.path) {
    return 'Un vídeo tiene que ser o un fichero subido o un enlace de YouTube.';
  }
  if (campos.url && !idDeYoutube(campos.url)) {
    return 'Ese enlace no parece un vídeo de YouTube. Pega la dirección completa.';
  }
  return null;
}

/** La misma regla para la imagen del ejercicio, que sí sigue colgando de él. */
export function validarImagen(campos: {
  image_url: string | null;
  image_path: string | null;
}): string | null {
  if (campos.image_url && campos.image_path) {
    return 'Elige una cosa: o subes la imagen o la enlazas.';
  }
  return null;
}

/**
 * El tramo del vídeo que interesa para ESTA variante, en segundos.
 *
 * Devuelve el error o los dos números ya limpios. Se valida aquí y además con
 * una restricción en la tabla (`exercises_tramo_valido`): la restricción impide
 * que la base quede incoherente, y esto permite decir por qué en castellano.
 *
 * Vacío es válido y significa «el vídeo entero», que es el caso normal: la
 * mayoría de los ejercicios enseñan el gesto completo.
 */
export function validarTramo(
  desdeCrudo: string | null,
  hastaCrudo: string | null
): { error: string } | { desde: number | null; hasta: number | null } {
  const num = (v: string | null) => {
    const t = (v ?? '').trim();
    if (t === '') return null;
    const n = Number(t);
    return Number.isFinite(n) ? Math.floor(n) : NaN;
  };

  const desde = num(desdeCrudo);
  const hasta = num(hastaCrudo);

  if (Number.isNaN(desde) || Number.isNaN(hasta)) {
    return { error: 'El tramo se pone en segundos, con números.' };
  }
  if (desde !== null && desde < 0) return { error: 'El segundo de inicio no puede ser negativo.' };
  if (hasta !== null && hasta <= 0)
    return { error: 'El segundo de fin tiene que ser mayor que 0.' };
  if (desde !== null && hasta !== null && hasta <= desde) {
    return { error: 'El tramo acaba antes de empezar: revisa los segundos.' };
  }
  return { desde, hasta };
}

/** `95` → `1:35`. Para enseñar el tramo sin hacer contar al entrenador. */
export function comoReloj(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
