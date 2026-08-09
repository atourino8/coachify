/**
 * Marca del entrenador · matemática de color
 *
 * POR QUÉ EXISTE
 * Un entrenador elige el color de su marca y no tiene por qué saber nada de
 * contraste. Si su azul marino corporativo se usa tal cual como color de
 * acento sobre nuestro fondo grafito, los enlaces activos y los antetítulos
 * quedan ilegibles. No da error, no rompe nada: simplemente su aplicación se
 * vuelve inservible y él no sabe por qué.
 *
 * Así que aquí no se confía en el color que llega. Se mide, y si no se lee, se
 * aclara hasta que se lee, conservando el tono y la saturación para que siga
 * siendo reconociblemente su color. Y se le dice, en la pantalla de marca,
 * que lo hemos hecho y por qué.
 *
 * QUÉ NO HACE
 * No toca el fondo. La personalización llega al acento y a la marca; el
 * grafito es de todos. Y no toca danger/warning/success: esos comunican
 * significado, no identidad, y un entrenador con la marca roja no puede
 * convertir los avisos de error en decoración.
 */

/**
 * El fondo contra el que se mide todo. Es el valor de --c-bg en app.css.
 *
 * Está duplicado a propósito: aquí hace falta el número para calcular, y en
 * app.css hace falta la variable para pintar. La duplicación es peligrosa
 * (si alguien cambia la paleta y no esto, todos los contrastes calculados
 * pasan a ser mentira), así que scripts/check-design.mjs comprueba que los
 * dos valores coincidan y falla el build si no.
 */
export const FONDO: Rgb = [23, 21, 15];

/** Tinta clara de la paleta (--c-text). Una de las dos opciones sobre relleno. */
export const TINTA_CLARA: Rgb = [240, 237, 230];

/**
 * El acento de Treno (--c-accent en app.css), en hexadecimal.
 *
 * Solo lo usa el selector de color de la pantalla de marca, para tener un
 * punto de partida cuando el entrenador todavía no ha elegido nada. NO se usa
 * como valor por defecto en ningún otro sitio: cuando no hay marca no se
 * emite ninguna variable y manda app.css, que es lo que evita tener la paleta
 * escrita en dos lugares.
 *
 * Igual que FONDO, está verificado contra app.css por check-design.mjs.
 */
export const ACENTO_TRENO = '#E8622A';

/**
 * Mínimo exigido al acento sobre el fondo.
 *
 * 4.5:1 es el umbral AA para texto normal. Se aplica aunque buena parte de los
 * usos del acento sean texto pequeño en negrita o bordes, que tendrían un
 * umbral más bajo: es un solo token para todos los usos, así que tiene que
 * cumplir el más exigente de ellos.
 */
export const CONTRASTE_MINIMO = 4.5;

export type Rgb = [number, number, number];

const HEX = /^#[0-9A-Fa-f]{6}$/;

/** ¿Es un hexadecimal de seis dígitos? Lo que no lo sea no entra en el CSS. */
export function esHexValido(valor: unknown): valor is string {
  return typeof valor === 'string' && HEX.test(valor);
}

export function hexARgb(hex: string): Rgb | null {
  if (!esHexValido(hex)) return null;
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16)
  ];
}

export function rgbAHex([r, g, b]: Rgb): string {
  const dos = (n: number) =>
    Math.round(Math.max(0, Math.min(255, n)))
      .toString(16)
      .padStart(2, '0');
  return `#${dos(r)}${dos(g)}${dos(b)}`;
}

/**
 * Luminancia relativa según WCAG 2.1. El canal se linealiza antes de pesarlo
 * porque sRGB no es lineal: un 50% de verde no emite la mitad de luz que un
 * 100%. Sin ese paso, los contrastes salen mal justo en los tonos medios, que
 * es donde están casi todos los colores de marca.
 */
export function luminancia([r, g, b]: Rgb): number {
  const lineal = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lineal(r) + 0.7152 * lineal(g) + 0.0722 * lineal(b);
}

/** Razón de contraste WCAG entre dos colores. Va de 1:1 a 21:1. */
export function contraste(a: Rgb, b: Rgb): number {
  const la = luminancia(a);
  const lb = luminancia(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

// ---------------------------------------------------------------------------
// Conversión a HSL
//
// Se aclara en HSL y no mezclando con blanco porque mezclar con blanco
// desatura: el rojo de bomberos acaba siendo rosa palo y el entrenador ya no
// reconoce su color. Subiendo la L se conserva el tono y buena parte de la
// saturación.
// ---------------------------------------------------------------------------

type Hsl = [number, number, number];

export function rgbAHsl([r, g, b]: Rgb): Hsl {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;
  return [h, s, l];
}

export function hslARgb([h, s, l]: Hsl): Rgb {
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const canal = (t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  return [
    Math.round(canal(h + 1 / 3) * 255),
    Math.round(canal(h) * 255),
    Math.round(canal(h - 1 / 3) * 255)
  ];
}

/**
 * Sube la luminosidad del color hasta que alcance el contraste mínimo contra
 * el fondo, conservando tono y saturación.
 *
 * Búsqueda binaria sobre la L y no un bucle de "súbele un 1% y vuelve a
 * medir": el resultado es el color MENOS aclarado que cumple, o sea el más
 * parecido al que eligió el entrenador. Un bucle de pasos gruesos se pasaría
 * de largo y le devolvería un pastel cuando no hacía falta.
 *
 * Sobre fondo oscuro siempre converge: en el peor caso llega al blanco, que
 * contrasta 15.6:1. Por eso no hay rama de fallo.
 */
export function aclararHasta(rgb: Rgb, fondo: Rgb = FONDO, minimo = CONTRASTE_MINIMO): Rgb {
  if (contraste(rgb, fondo) >= minimo) return rgb;

  const [h, s, l0] = rgbAHsl(rgb);
  let bajo = l0;
  let alto = 1;
  let mejor: Rgb = [255, 255, 255];

  // 20 iteraciones dejan la L determinada con precisión muy por debajo de un
  // paso de 8 bits, así que el resultado es estable y no depende del azar.
  for (let i = 0; i < 20; i++) {
    const medio = (bajo + alto) / 2;
    const candidato = hslARgb([h, s, medio]);
    if (contraste(candidato, fondo) >= minimo) {
      mejor = candidato;
      alto = medio;
    } else {
      bajo = medio;
    }
  }
  return mejor;
}

/**
 * Tinta que se lee encima de un relleno: o el fondo grafito o la tinta clara,
 * la que más contraste dé. No se inventa un gris intermedio a propósito;
 * ambas opciones son tokens de la paleta y así el resultado sigue siendo
 * nuestro sistema con su color, no un color suelto.
 */
export function tintaSobre(relleno: Rgb): Rgb {
  return contraste(relleno, FONDO) >= contraste(relleno, TINTA_CLARA) ? FONDO : TINTA_CLARA;
}

/**
 * Tinta que se lee encima de un degradado, y cuánto se lee.
 *
 * Se elige la que mejor aguanta el PEOR de los dos extremos: si sirve para el
 * extremo más difícil, sirve para todo lo que hay entre medias.
 *
 * AQUÍ NO SIEMPRE SE PUEDE GANAR. Un degradado que va de azul marino a azul
 * medio (#0B2E59 → #3B82F6) atraviesa la franja de luminosidad donde ni la
 * tinta clara ni la oscura llegan a 4.5:1: la oscura se pierde en el extremo
 * marino y la clara en el extremo medio. No es un fallo del cálculo, es una
 * propiedad del degradado que ha elegido el entrenador.
 *
 * Qué hacemos con eso:
 *
 *   1. Devolvemos la mejor tinta posible y ADEMÁS su contraste, para poder
 *      decírselo en la pantalla de marca en vez de tragárnoslo.
 *   2. El único texto que va sobre este relleno es la inicial del cuadro de
 *      marca, que es un logotipo y está al lado del nombre completo escrito
 *      en tinta normal. WCAG 2.1 excluye explícitamente el texto que forma
 *      parte de un logotipo del criterio 1.4.3, y el nombre de al lado es el
 *      que carga con la información. Por eso la inicial va con aria-hidden:
 *      es decorativa, no es el nombre accesible.
 *
 * Lo que NO hacemos es meterle una sombra a la letra para maquillar el número.
 * Eso arregla la métrica y no la lectura.
 */
export function tintaSobreDegradado(a: Rgb, b: Rgb): { tinta: Rgb; contraste: number } {
  const peorConFondo = Math.min(contraste(a, FONDO), contraste(b, FONDO));
  const peorConClara = Math.min(contraste(a, TINTA_CLARA), contraste(b, TINTA_CLARA));
  return peorConFondo >= peorConClara
    ? { tinta: FONDO, contraste: peorConFondo }
    : { tinta: TINTA_CLARA, contraste: peorConClara };
}

export interface Marca {
  /** Color de acento final, ya legible. Es el que pinta enlaces y antetítulos. */
  acento: Rgb;
  /** Lo que eligió el entrenador, sin tocar. */
  elegido: Rgb;
  /** true si hubo que aclararlo para que se leyera. */
  corregido: boolean;
  /** Contraste del color elegido contra el fondo, para poder explicárselo. */
  contrasteElegido: number;
  /** Contraste final. Siempre >= CONTRASTE_MINIMO. */
  contrasteFinal: number;
  /** Valor CSS del relleno de la marca: un color o un degradado. */
  fondoMarca: string;
  /** Tinta que va encima de ese relleno. */
  tintaMarca: Rgb;
  /**
   * Contraste de esa tinta en el peor punto del relleno. Con un color plano
   * siempre pasa de 4.5. Con un degradado puede no llegar, y entonces hay que
   * avisar al entrenador en vez de disimularlo.
   */
  contrasteTinta: number;
  /** Segundo color, si lo hay. Sin corregir: es relleno, no texto. */
  segundo: Rgb | null;
}

/**
 * Traduce lo que hay en la base de datos a lo que necesita el CSS.
 *
 * Devuelve null cuando el entrenador no ha elegido nada, que es lo que hay que
 * hacer para que no se inyecte ninguna regla y mande la paleta de app.css. Un
 * "sin marca" que emitiera los valores por defecto duplicaría la paleta en dos
 * sitios y acabaría desincronizándose.
 */
export function derivarMarca(accent: unknown, accent2: unknown): Marca | null {
  if (!esHexValido(accent)) return null;
  const elegido = hexARgb(accent);
  if (!elegido) return null;

  const segundo = esHexValido(accent2) ? hexARgb(accent2) : null;
  const acento = aclararHasta(elegido);

  // El degradado usa los colores CRUDOS. Es un relleno, no texto: aquí el
  // contraste lo resuelve la tinta que va encima, y aclarar el extremo oscuro
  // le quitaría al degradado justo lo que lo hace un degradado.
  const fondoMarca = segundo
    ? `linear-gradient(135deg, ${rgbAHex(elegido)}, ${rgbAHex(segundo)})`
    : `rgb(${acento.join(' ')})`;

  const conTinta = segundo
    ? tintaSobreDegradado(elegido, segundo)
    : (() => {
        const tinta = tintaSobre(acento);
        return { tinta, contraste: contraste(tinta, acento) };
      })();

  return {
    acento,
    elegido,
    corregido: acento.join() !== elegido.join(),
    contrasteElegido: contraste(elegido, FONDO),
    contrasteFinal: contraste(acento, FONDO),
    fondoMarca,
    tintaMarca: conTinta.tinta,
    contrasteTinta: conTinta.contraste,
    segundo
  };
}

/**
 * Las variables redefinidas, listas para el atributo `style` de un contenedor.
 *
 * VA EN UN ATRIBUTO Y NO EN UNA ETIQUETA <style>. Las dos formas funcionan,
 * porque las variables CSS cascadean y basta con declararlas en un ancestro
 * para repintar todo lo que hay dentro. La diferencia es la superficie: un
 * <style> generado en servidor hay que escribirlo con {@html}, y ahí un fallo
 * de validación se convierte en inyección de CSS —y con CSS se puede leer un
 * token de un formulario a base de selectores de atributo—. Un atributo lo
 * escapa Svelte solo, así que ese camino no existe.
 *
 * Aun así se vuelve a comprobar la forma del resultado antes de devolverlo:
 * el día que alguien añada un campo a Marca sin pensar en esto, el fallo
 * sería mudo.
 */
export function estiloDeMarca(marca: Marca | null): string {
  if (!marca) return '';
  const canales = (c: Rgb) => c.map((n) => Math.round(n)).join(' ');
  const declaraciones = [
    `--c-accent:${canales(marca.acento)}`,
    `--c-marca-fondo:${marca.fondoMarca}`,
    `--c-marca-tinta:${canales(marca.tintaMarca)}`
  ].join(';');

  // Ni llaves ni etiquetas: si aparece algo así, no emitimos nada y el
  // entrenador ve la paleta por defecto. Es preferible perder el color a
  // servir un atributo con contenido que no sabemos de dónde ha salido.
  if (/[<>{}"']/.test(declaraciones)) return '';
  return declaraciones;
}

/**
 * Lo que necesitan las plantillas para pintar la identidad, en un solo objeto.
 * Se calcula en el servidor y viaja como datos: así no hay parpadeo de color
 * al hidratar, que es lo que pasaría si el cliente lo calculara al arrancar.
 */
export interface IdentidadMarca {
  /** Nombre que se muestra. El del entrenador, o "Treno" si no hay. */
  nombre: string;
  /** Inicial del cuadro. Decorativa: va con aria-hidden. */
  inicial: string;
  /** Contenido del atributo style. Cadena vacía = paleta por defecto. */
  estilo: string;
}

export function identidadDeMarca(
  nombre: string | null | undefined,
  accent: unknown,
  accent2: unknown
): IdentidadMarca {
  const limpio = (nombre ?? '').trim();
  const visible = limpio.length > 0 ? limpio : 'Treno';
  return {
    nombre: visible,
    // Se toma de la cadena ya recortada para que un nombre con espacios
    // delante no produzca un cuadro en blanco.
    inicial: visible.slice(0, 1).toUpperCase(),
    estilo: estiloDeMarca(derivarMarca(accent, accent2))
  };
}
