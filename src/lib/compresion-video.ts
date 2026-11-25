/**
 * Comprimir un vídeo EN EL NAVEGADOR antes de subirlo.
 *
 * POR QUÉ: lo que más cuesta de los vídeos no es guardarlos, es servirlos
 * (PRUEBA-S3.md): un vídeo se sube una vez y se ve cientos. Un vídeo cinco
 * veces más ligero cuesta cinco veces menos en cada reproducción. Y de paso
 * se sube antes por 4G.
 *
 * CÓMO: Mediabunny lee el fichero, lo decodifica y lo vuelve a codificar con
 * WebCodecs, que usa el chip de vídeo del móvil. Sale un MP4 en H.264 a 720p,
 * que reproduce cualquier navegador. Eso también arregla otra cosa: los .mov
 * del iPhone vienen en HEVC, que muchos Android no saben reproducir.
 *
 * NUNCA BLOQUEA UNA SUBIDA. Si el navegador no sabe comprimir, o algo falla,
 * o el resultado pesa más que el original, se devuelve el original y se sube
 * como hasta ahora. Lo único que se pierde es el ahorro. El motivo queda en
 * `motivo` para poder verlo en las pruebas.
 *
 * Mediabunny se importa al usarse (import dinámico): pesa, y quien no sube
 * vídeos no tiene por qué descargarlo.
 */

/** Ajustes por defecto. Se tocan aquí, en un solo sitio. */
export const COMPRESION = {
  /** El lado CORTO del vídeo, en píxeles. 720 = 1280×720 en horizontal o 720×1280 en vertical. */
  ladoCorto: 720,
  /** Bits por segundo de imagen. 2 Mbps a 720p sobra para ver la técnica de un ejercicio. */
  bitrateVideo: 2_000_000,
  /** Bits por segundo de sonido. Una voz se entiende de sobra con 96 kbps. */
  bitrateAudio: 96_000,
  /** Más grande que esto ni se intenta: el móvil se quedaría sin memoria. */
  maxEntrada: 1024 * 1024 * 1024
} as const;

export type OpcionesCompresion = {
  /** De 0 a 100. */
  onProgress?: (pct: number) => void;
  /** Si se aborta, la compresión se cancela y se lanza un AbortError. */
  signal?: AbortSignal;
  ladoCorto?: number;
  bitrateVideo?: number;
  /** Quitar el sonido. Ahorra poco (el sonido pesa poco), pero a veces no hace falta. */
  sinSonido?: boolean;
};

export type ResultadoCompresion = {
  /** Lo que hay que subir: el comprimido o, si no se pudo, el original. */
  archivo: File;
  comprimido: boolean;
  /** Por qué se subió el original. Vacío si se comprimió. */
  motivo: string;
  bytesAntes: number;
  bytesDespues: number;
  /** Lo que tardó en comprimir, en segundos. */
  segundos: number;
  /** Medidas del resultado, si se conocen. */
  ancho: number | null;
  alto: number | null;
  /**
   * El original venía en HDR (los iPhone graban así por defecto). Se apunta
   * porque al pasarlo a H.264 normal los colores pueden salir apagados: es
   * lo primero que hay que mirar en las pruebas.
   */
  hdr: boolean;
};

/** ¿Puede este navegador comprimir? Sin WebCodecs, no. */
export function puedeComprimir(): boolean {
  return typeof window !== 'undefined' && 'VideoEncoder' in window && 'VideoDecoder' in window;
}

function original(file: File, motivo: string, inicio: number): ResultadoCompresion {
  return {
    archivo: file,
    comprimido: false,
    motivo,
    bytesAntes: file.size,
    bytesDespues: file.size,
    segundos: (performance.now() - inicio) / 1000,
    ancho: null,
    alto: null,
    hdr: false
  };
}

function abortado(): DOMException {
  return new DOMException('Compresión cancelada', 'AbortError');
}

export async function comprimirVideo(
  file: File,
  opciones: OpcionesCompresion = {}
): Promise<ResultadoCompresion> {
  const inicio = performance.now();
  const ladoCorto = opciones.ladoCorto ?? COMPRESION.ladoCorto;
  const bitrateVideo = opciones.bitrateVideo ?? COMPRESION.bitrateVideo;

  if (!puedeComprimir()) return original(file, 'Este navegador no sabe comprimir vídeo.', inicio);
  if (file.size > COMPRESION.maxEntrada) {
    return original(file, 'El vídeo es demasiado grande para comprimirlo en el móvil.', inicio);
  }
  if (opciones.signal?.aborted) throw abortado();

  let mb: typeof import('mediabunny');
  try {
    mb = await import('mediabunny');
  } catch {
    return original(file, 'No se pudo cargar el compresor.', inicio);
  }

  const {
    Input,
    Output,
    BlobSource,
    BufferTarget,
    Mp4OutputFormat,
    Conversion,
    Quality,
    ALL_FORMATS,
    canEncodeVideo,
    getFirstEncodableAudioCodec
  } = mb;

  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });

  try {
    const pista = await input.getPrimaryVideoTrack();
    if (!pista) return original(file, 'El fichero no tiene imagen.', inicio);

    const anchoOrig = await pista.getDisplayWidth();
    const altoOrig = await pista.getDisplayHeight();
    const vertical = altoOrig > anchoOrig;
    const cortoOrig = Math.min(anchoOrig, altoOrig);
    const hdr = await pista.hasHighDynamicRange().catch(() => false);

    // Solo se reduce, nunca se amplía. Se fija UN lado y el otro sale solo,
    // respetando la proporción: así sirve igual para vídeo vertical.
    const reducir = cortoOrig > ladoCorto;
    const medidas = reducir ? (vertical ? { width: ladoCorto } : { height: ladoCorto }) : {};
    const ancho = reducir ? (vertical ? ladoCorto : Math.round((anchoOrig * ladoCorto) / altoOrig)) : anchoOrig;
    const alto = reducir ? (vertical ? Math.round((altoOrig * ladoCorto) / anchoOrig) : ladoCorto) : altoOrig;

    const calidad = new Quality({ bitrate: bitrateVideo });
    const sabeH264 = await canEncodeVideo('avc', { width: ancho, height: alto, quality: calidad });
    if (!sabeH264) return original(file, 'Este navegador no sabe codificar H.264.', inicio);

    // AAC es lo que mejor se reproduce en todas partes; Opus, el plan B. Si no
    // sabe ninguno, el vídeo sale sin sonido antes que no comprimirlo.
    const codecAudio = opciones.sinSonido ? null : await getFirstEncodableAudioCodec(['aac', 'opus']);

    const output = new Output({
      // 'in-memory' pone el índice al principio: el vídeo empieza a verse
      // antes de terminar de descargarse.
      format: new Mp4OutputFormat({ fastStart: 'in-memory' }),
      target: new BufferTarget()
    });

    const conversion = await Conversion.init({
      input,
      output,
      tracks: 'primary',
      video: { ...medidas, codec: 'avc', quality: calidad, forceTranscode: true },
      audio: codecAudio
        ? { codec: codecAudio, quality: new Quality({ bitrate: COMPRESION.bitrateAudio }) }
        : { discard: true }
    });

    if (!conversion.isValid) {
      const razones = conversion.discardedTracks.map((d) => d.reason).join(', ');
      return original(file, `No se pudo preparar la compresión (${razones}).`, inicio);
    }
    const sinImagen = conversion.discardedTracks.some((d) => d.track.isVideoTrack());
    if (sinImagen) return original(file, 'No se pudo comprimir la imagen del vídeo.', inicio);

    conversion.onProgress = (p: number) => opciones.onProgress?.(Math.min(99, Math.round(p * 100)));

    const alAbortar = () => void conversion.cancel();
    opciones.signal?.addEventListener('abort', alAbortar, { once: true });
    try {
      await conversion.execute();
    } catch (err) {
      if (opciones.signal?.aborted) throw abortado();
      throw err;
    } finally {
      opciones.signal?.removeEventListener('abort', alAbortar);
    }

    const buffer = output.target.buffer;
    if (!buffer) return original(file, 'La compresión no produjo ningún fichero.', inicio);

    // Si ya venía bien comprimido, el resultado puede pesar casi lo mismo o más.
    // Entonces no compensa haber perdido calidad: se sube el original.
    if (buffer.byteLength >= file.size * 0.9) {
      return original(file, 'Ya venía comprimido: el original pesa casi lo mismo.', inicio);
    }

    const nombre = file.name.replace(/\.[^.]+$/, '') + '.mp4';
    const archivo = new File([buffer], nombre, { type: 'video/mp4', lastModified: Date.now() });
    opciones.onProgress?.(100);

    return {
      archivo,
      comprimido: true,
      motivo: '',
      bytesAntes: file.size,
      bytesDespues: archivo.size,
      segundos: (performance.now() - inicio) / 1000,
      ancho,
      alto,
      hdr
    };
  } catch (err) {
    if ((err as DOMException)?.name === 'AbortError' || opciones.signal?.aborted) throw abortado();
    // Cualquier otro fallo: se sube el original. Se deja en la consola para
    // poder diagnosticar en las pruebas.
    console.warn('[compresión] falló, se sube el original:', err);
    return original(file, `Falló la compresión: ${(err as Error)?.message ?? err}`, inicio);
  } finally {
    input.dispose();
  }
}

/** «85 MB → 12 MB (−86 %) en 23 s», para enseñar el resultado en pantalla. */
export function resumenCompresion(r: ResultadoCompresion): string {
  const mb = (b: number) => (b / 1048576).toFixed(b < 10 * 1048576 ? 1 : 0) + ' MB';
  if (!r.comprimido) return `${mb(r.bytesAntes)} · sin comprimir: ${r.motivo}`;
  const ahorro = Math.round((1 - r.bytesDespues / r.bytesAntes) * 100);
  const medidas = r.ancho && r.alto ? ` · ${r.ancho}×${r.alto}` : '';
  const hdr = r.hdr ? ' · original en HDR' : '';
  return `${mb(r.bytesAntes)} → ${mb(r.bytesDespues)} (−${ahorro} %) en ${Math.round(r.segundos)} s${medidas}${hdr}`;
}
