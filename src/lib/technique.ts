// Vídeos de técnica del cliente: validación de límites y subida.
//
// Los límites se comprueban EN EL NAVEGADOR antes de subir nada, para no gastar
// ancho de banda en un archivo que vamos a rechazar igualmente.
//
// Tope de almacenamiento: como máximo 2 vídeos por (cliente, ejercicio):
//   · 'first'  → el primero que subió, no se pisa nunca (referencia "antes")
//   · 'latest' → el más reciente, se sobrescribe en cada subida
// El índice único (client_id, exercise_id, kind) lo garantiza en la BD.

export const BUCKET = 'technique-videos';
export const MAX_DURATION_SECONDS = 70; // 1 min + margen
export const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB
export const ALLOWED_MIME = ['video/mp4', 'video/webm', 'video/quicktime'];

export type TechniqueKind = 'first' | 'latest';

/** Extensión del archivo a partir de su mime type. */
function extFor(mime: string): string {
  if (mime === 'video/webm') return 'webm';
  if (mime === 'video/quicktime') return 'mov';
  return 'mp4';
}

/**
 * Ruta en el bucket. El primer segmento DEBE ser el client_id: las políticas
 * RLS de storage comprueban que la carpeta coincide con el usuario.
 */
export function videoPath(clientId: string, exerciseId: string, kind: TechniqueKind, mime: string) {
  return `${clientId}/${exerciseId}/${kind}.${extFor(mime)}`;
}

/** Lee la duración de un vídeo local sin subirlo (usa un <video> temporal). */
export function readDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    const done = (value: number | null) => {
      URL.revokeObjectURL(url);
      resolve(value);
    };
    video.onloadedmetadata = () => {
      const d = video.duration;
      done(Number.isFinite(d) ? d : null);
    };
    video.onerror = () => done(null);
    video.src = url;
  });
}

/**
 * Valida tipo, tamaño y duración. Devuelve un mensaje de error o null si vale.
 */
export async function validateVideo(file: File): Promise<string | null> {
  if (!ALLOWED_MIME.includes(file.type)) {
    return 'Formato no admitido. Graba el vídeo en MP4, WebM o MOV.';
  }
  if (file.size > MAX_SIZE_BYTES) {
    const mb = Math.round(file.size / 1024 / 1024);
    return `El vídeo pesa ${mb} MB y el máximo son 50 MB. Graba uno más corto o con menos calidad.`;
  }
  const duration = await readDuration(file);
  if (duration !== null && duration > MAX_DURATION_SECONDS) {
    return `El vídeo dura ${Math.round(duration)} s y el máximo es 1 minuto.`;
  }
  return null;
}

export function formatBytes(bytes: number | null): string {
  if (!bytes) return '';
  const mb = bytes / 1024 / 1024;
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

/**
 * Subida con progreso REAL y cancelable.
 *
 * Por qué no usamos supabase.storage.upload(): va por fetch(), que no expone
 * el progreso de subida. Con un vídeo de decenas de MB por 4G eso significa
 * una barra parada durante un minuto, que el usuario lee como "colgado" y
 * acaba recargando la página a mitad de la subida.
 *
 * XMLHttpRequest sí da upload.onprogress, así que hablamos directamente con
 * el endpoint REST de Storage. El cuerpo es multipart igual que lo envía
 * supabase-js, y `x-upsert` permite sobrescribir el vídeo 'latest'.
 */
export type UploadHandle = {
  promise: Promise<void>;
  abort: () => void;
};

export function uploadWithProgress(opts: {
  supabaseUrl: string;
  accessToken: string;
  path: string;
  file: File;
  onProgress: (pct: number) => void;
  /**
   * Cubo destino. Por defecto el de técnica, que es de donde salió esta
   * función; el material del entrenador va a `coach-media`. Se parametriza en
   * vez de duplicar la función porque lo único que cambia es el destino, y dos
   * copias de esto acabarían arreglándose solo una cuando falle algo.
   */
  bucket?: string;
}): UploadHandle {
  const xhr = new XMLHttpRequest();
  const bucket = opts.bucket ?? BUCKET;

  const promise = new Promise<void>((resolve, reject) => {
    xhr.open('POST', `${opts.supabaseUrl}/storage/v1/object/${bucket}/${opts.path}`, true);
    xhr.setRequestHeader('Authorization', `Bearer ${opts.accessToken}`);
    xhr.setRequestHeader('x-upsert', 'true');

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) opts.onProgress(Math.round((e.loaded / e.total) * 100));
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }
      // Storage devuelve un JSON con `message`; si no, nos quedamos con el código.
      let detalle = `Error ${xhr.status}`;
      try {
        const body = JSON.parse(xhr.responseText);
        if (body?.message) detalle = body.message;
      } catch {
        // respuesta no-JSON: nos quedamos con el código de estado
      }
      reject(new Error(detalle));
    };

    xhr.onerror = () =>
      reject(new Error('Se perdió la conexión durante la subida. Inténtalo de nuevo.'));
    xhr.ontimeout = () => reject(new Error('La subida tardó demasiado. Inténtalo de nuevo.'));
    xhr.onabort = () => reject(new DOMException('Subida cancelada', 'AbortError'));

    const body = new FormData();
    body.append('cacheControl', '3600');
    body.append('', opts.file);
    xhr.send(body);
  });

  return { promise, abort: () => xhr.abort() };
}
