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
 */
export function rutaMedio(
  coachId: string,
  exerciseId: string,
  tipo: MedioTipo,
  mime: string
): string {
  return `${coachId}/${exerciseId}/${tipo}.${extPara(mime)}`;
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
  video_url: string | null;
  video_path: string | null;
  image_url: string | null;
  image_path: string | null;
}): string | null {
  if (campos.video_url && campos.video_path) {
    return 'Elige una cosa: o subes el vídeo o lo enlazas.';
  }
  if (campos.image_url && campos.image_path) {
    return 'Elige una cosa: o subes la imagen o la enlazas.';
  }
  if (campos.video_url && !idDeYoutube(campos.video_url)) {
    return 'Ese enlace no parece un vídeo de YouTube. Pega la dirección completa.';
  }
  return null;
}
