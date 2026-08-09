#!/usr/bin/env node
/**
 * Guardián del sistema de diseño.
 *
 *   node scripts/check-design.mjs
 *
 * POR QUÉ EXISTE
 * Un modelo de lenguaje —y cualquiera con prisa— tira por defecto a lo que ha
 * visto un millón de veces: `bg-indigo-600`, `p-[13px]`, un degradado morado.
 * Revisar eso a ojo no escala: lo obvio se pilla, la deriva sutil no. Esto lo
 * comprueba siempre igual y falla el build.
 *
 * Los colores por defecto de Tailwind ya no compilan (tailwind.config.js los
 * borra al declarar `colors` fuera de `extend`), pero aquí se detectan además
 * para dar un mensaje que se entienda en vez de un error de compilación.
 *
 * Complementa a DISENO.md: el documento explica el porqué, esto impide el qué.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join, extname } from 'node:path';

const RAIZ = 'src';

/** Paleta por defecto de Tailwind: prohibida, solo tokens del proyecto. */
const COLORES_TAILWIND =
  'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';

/**
 * Propiedades donde un valor arbitrario significa que la escala no se está
 * respetando. Se permiten a propósito en z-index, alturas y rejillas: ahí no
 * hay escala que seguir y el valor concreto es la decisión.
 */
const ARBITRARIO_PROHIBIDO = 'text|p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap|space-x|space-y';

const REGLAS = [
  {
    id: 'color-por-defecto',
    patron: new RegExp(
      `\\b(?:bg|text|border|ring|fill|stroke|from|to|via|divide)-(?:${COLORES_TAILWIND})-\\d{2,3}\\b`,
      'g'
    ),
    mensaje:
      'Color de la paleta por defecto de Tailwind. Usa un token: bg, surface, accent, line, text, danger, warning, success.'
  },
  {
    id: 'degradado',
    patron: /\bbg-gradient-to-|\bfrom-\[|\bvia-\[|\bto-\[/g,
    mensaje:
      'Degradado. Prohibidos como estilo propio (ver DISENO.md §1). La excepción de marca del entrenador se implementa aparte, no con utilidades sueltas.'
  },
  {
    id: 'color-a-mano',
    patron: /\b(?:bg|text|border|ring|fill|stroke)-\[#[0-9a-fA-F]{3,8}\]/g,
    mensaje: 'Color escrito a mano. Los colores solo viven en las variables de src/app.css.'
  },
  {
    id: 'hex-suelto',
    patron: /(?<!&)#[0-9a-fA-F]{6}\b/g,
    mensaje: 'Hexadecimal suelto en una plantilla. Debe ser un token.',
    soloEn: ['.svelte']
  },
  {
    id: 'valor-inventado',
    patron: new RegExp(`\\b(?:${ARBITRARIO_PROHIBIDO})-\\[[^\\]]+\\]`, 'g'),
    mensaje:
      'Valor fuera de la escala. Si la escala no llega, añádele un escalón en tailwind.config.js en vez de improvisar aquí.'
  }
];

function ficheros(dir, salida = []) {
  for (const entrada of readdirSync(dir, { withFileTypes: true })) {
    const ruta = join(dir, entrada.name);
    if (entrada.isDirectory()) ficheros(ruta, salida);
    else if (['.svelte', '.css', '.ts', '.html'].includes(extname(entrada.name))) salida.push(ruta);
  }
  return salida;
}

const infracciones = [];

for (const ruta of ficheros(RAIZ)) {
  // app.css es el único sitio donde los colores pueden ser literales: es
  // donde se define la paleta.
  const esPaleta = ruta.endsWith('app.css');
  const lineas = readFileSync(ruta, 'utf8').split('\n');

  lineas.forEach((linea, i) => {
    for (const regla of REGLAS) {
      if (regla.soloEn && !regla.soloEn.includes(extname(ruta))) continue;
      if (esPaleta && (regla.id === 'hex-suelto' || regla.id === 'color-a-mano')) continue;

      const encontrados = linea.match(regla.patron);
      if (encontrados) {
        infracciones.push({
          ruta,
          linea: i + 1,
          regla: regla.id,
          hallazgo: [...new Set(encontrados)].join(', '),
          mensaje: regla.mensaje
        });
      }
    }
  });
}

if (infracciones.length === 0) {
  console.log('✓ Sistema de diseño: sin infracciones.');
  process.exit(0);
}

const porRegla = {};
for (const inf of infracciones) (porRegla[inf.regla] ??= []).push(inf);

console.error(`\n✗ ${infracciones.length} infracciones del sistema de diseño.\n`);
for (const [regla, lista] of Object.entries(porRegla)) {
  console.error(`── ${regla} (${lista.length}) ──`);
  console.error(`   ${lista[0].mensaje}\n`);
  for (const inf of lista.slice(0, 12)) {
    console.error(`   ${inf.ruta}:${inf.linea}  →  ${inf.hallazgo}`);
  }
  if (lista.length > 12) console.error(`   … y ${lista.length - 12} más`);
  console.error('');
}
console.error('El porqué de cada regla está en DISENO.md.\n');
process.exit(1);
