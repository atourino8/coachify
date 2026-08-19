/**
 * Avatares de mentira para el sembrado, generados aquí mismo.
 *
 * POR QUÉ NO FOTOS DE VERDAD
 *
 * Lo fácil sería tirar de pravatar.cc o randomuser.me, o meter doce JPG en el
 * repositorio. Las dos cosas tienen el mismo problema y no es técnico: son
 * CARAS DE PERSONAS REALES metidas en una base de datos junto a un nombre
 * inventado, un peso y una lesión. En una aplicación cuya política de
 * privacidad acabamos de escribir para decir que las fotos son datos
 * sensibles, sembrar caras ajenas es incoherente. Y si algún día una demo se
 * enseña en una reunión, esas caras salen en la pantalla.
 *
 * Además, un servicio externo mete red en un guion que hoy funciona sin ella:
 * el día que pravatar esté caído, el sembrado falla por algo que no es culpa
 * de nadie.
 *
 * POR QUÉ IDENTICONS Y NO UN COLOR PLANO
 *
 * Lo que se está probando es una REJILLA DE CARAS: que se distingan de un
 * vistazo, que el recorte redondo quede bien, que la lista no se rompa. Doce
 * cuadrados del mismo color no prueban nada de eso; doce patrones distintos,
 * sí. Es el mismo truco que usaba GitHub para los avatares por defecto.
 *
 * POR QUÉ UN PNG ESCRITO A MANO
 *
 * Un PNG es una firma, tres trozos y un CRC. Con zlib —que viene en Node— son
 * sesenta líneas. La alternativa era añadir una dependencia de imágenes al
 * proyecto para generar cuadrados de colores.
 */

import { deflateSync } from 'node:zlib';

/** Tamaño del lienzo. 240 px basta: el sitio más grande donde se ve son 96. */
const LADO = 240;

/** La rejilla del patrón, como en los identicons de toda la vida. */
const CELDAS = 5;

/**
 * Hash determinista de una cadena.
 *
 * Determinista importa: al resembrar, Lucía tiene que salir con la misma cara
 * que antes. Si cambiara en cada siembra, comparar dos capturas de pantalla
 * dejaría de servir para nada.
 */
function hash(texto) {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** CRC32, que es lo que exige cada trozo del PNG. */
const TABLA_CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = TABLA_CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** Un trozo del PNG: longitud, tipo, datos y CRC de (tipo + datos). */
function trozo(tipo, datos) {
  const longitud = Buffer.alloc(4);
  longitud.writeUInt32BE(datos.length, 0);
  const cuerpo = Buffer.concat([Buffer.from(tipo, 'ascii'), datos]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(cuerpo), 0);
  return Buffer.concat([longitud, cuerpo, crc]);
}

/**
 * Devuelve un PNG con el identicon de `semilla`.
 *
 * El patrón es SIMÉTRICO respecto al eje vertical: es lo que hace que un
 * montón de cuadrados aleatorios parezca una figura y no ruido.
 */
export function avatarPNG(semilla) {
  const h = hash(semilla);

  // Color del trazo en HSL → RGB. Saturación y luminosidad fijas y elegidas
  // para que TODOS contrasten con el fondo oscuro de la aplicación: dejarlas
  // al azar sacaría alguno ilegible.
  const tono = h % 360;
  const [r, g, b] = hslARgb(tono, 0.55, 0.6);
  const fondo = [38, 35, 25]; // el gris cálido de --c-surface-2

  // Qué celdas se pintan. Solo se decide la mitad izquierda y el centro; la
  // derecha es su espejo.
  const mitad = Math.ceil(CELDAS / 2);
  const pintada = [];
  for (let y = 0; y < CELDAS; y++) {
    pintada[y] = [];
    for (let x = 0; x < mitad; x++) {
      // Un bit distinto del hash por celda, mezclado para que dos semillas
      // parecidas no den patrones parecidos.
      const bit = (hash(`${semilla}:${x}:${y}`) >>> 3) & 1;
      pintada[y][x] = bit === 1;
    }
    for (let x = mitad; x < CELDAS; x++) {
      pintada[y][x] = pintada[y][CELDAS - 1 - x];
    }
  }

  // Píxeles. Cada fila del PNG empieza por un byte de filtro; se usa 0
  // (ninguno), que es lo más simple y aquí no cuesta tamaño porque la imagen
  // son bloques planos que el deflate aplasta igual.
  const porCelda = LADO / CELDAS;
  const filas = Buffer.alloc(LADO * (1 + LADO * 3));
  let p = 0;
  for (let y = 0; y < LADO; y++) {
    filas[p++] = 0;
    const cy = Math.floor(y / porCelda);
    for (let x = 0; x < LADO; x++) {
      const cx = Math.floor(x / porCelda);
      const dentro = pintada[cy][cx];
      filas[p++] = dentro ? r : fondo[0];
      filas[p++] = dentro ? g : fondo[1];
      filas[p++] = dentro ? b : fondo[2];
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(LADO, 0);
  ihdr.writeUInt32BE(LADO, 4);
  ihdr[8] = 8; // bits por canal
  ihdr[9] = 2; // color: RGB sin alfa
  ihdr[10] = 0; // compresión
  ihdr[11] = 0; // filtro
  ihdr[12] = 0; // entrelazado

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    trozo('IHDR', ihdr),
    trozo('IDAT', deflateSync(filas, { level: 9 })),
    trozo('IEND', Buffer.alloc(0))
  ]);
}

function hslARgb(tono, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((tono / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    tono < 60
      ? [c, x, 0]
      : tono < 120
        ? [x, c, 0]
        : tono < 180
          ? [0, c, x]
          : tono < 240
            ? [0, x, c]
            : tono < 300
              ? [x, 0, c]
              : [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}
