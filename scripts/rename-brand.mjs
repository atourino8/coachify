#!/usr/bin/env node
/**
 * Cambio de nombre de marca.
 *
 * El nombre aparece en ~50 sitios: títulos de página, cabeceras, textos legales,
 * package.json, robots.txt y los correos de contacto. Este script los cambia
 * todos de una vez de forma consistente.
 *
 * NO toca rutas, tablas de base de datos ni nombres de variables: solo texto
 * visible y dominios. Es reversible con git.
 *
 * Uso:
 *   node scripts/rename-brand.mjs Treno treno.app          # aplica
 *   node scripts/rename-brand.mjs Treno treno.app --dry    # solo muestra
 *
 * Después de ejecutarlo:
 *   1. Revisa el diff con `git diff`
 *   2. Cambia a mano el favicon (static/favicon.svg) si la inicial cambia
 *   3. Renombra la carpeta del proyecto y el repositorio si quieres
 *   4. Pasa `npm run check`
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const [, , NEW_NAME, NEW_DOMAIN, ...flags] = process.argv;
const DRY = flags.includes('--dry');

if (!NEW_NAME) {
  console.error('Uso: node scripts/rename-brand.mjs <NuevoNombre> [nuevo-dominio.app] [--dry]');
  process.exit(1);
}

const OLD_NAME = 'Coachify';
const OLD_DOMAIN = 'coachify.app';

// Directorios y extensiones a revisar.
const ROOTS = ['src', 'static'];
const SINGLE_FILES = [
  'package.json',
  'README.md',
  'SPEC-TRAINER.md',
  'NEGOCIO.md',
  'COMPETENCIA.md'
];
const EXTS = new Set(['.svelte', '.ts', '.js', '.json', '.md', '.html', '.txt', '.css']);

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.git' || entry === '.svelte-kit') continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (EXTS.has(extname(entry))) out.push(full);
  }
  return out;
}

const files = [
  ...ROOTS.flatMap((r) => {
    try {
      return walk(r);
    } catch {
      return [];
    }
  }),
  ...SINGLE_FILES.filter((f) => {
    try {
      statSync(f);
      return true;
    } catch {
      return false;
    }
  })
];

let touched = 0;
let replacements = 0;

for (const file of files) {
  const original = readFileSync(file, 'utf8');
  let updated = original;

  // Dominio primero: si no, "coachify.app" se rompería al cambiar el nombre.
  if (NEW_DOMAIN) {
    updated = updated.replaceAll(OLD_DOMAIN, NEW_DOMAIN);
  }
  // Nombre con mayúscula y en minúscula (paquetes, identificadores en texto).
  updated = updated.replaceAll(OLD_NAME, NEW_NAME);
  updated = updated.replaceAll(OLD_NAME.toLowerCase(), NEW_NAME.toLowerCase());

  if (updated !== original) {
    const n = (original.match(new RegExp(OLD_NAME, 'gi')) ?? []).length;
    replacements += n;
    touched++;
    console.log(`${DRY ? '[dry] ' : ''}${file} — ${n} cambio(s)`);
    // Escribimos siempre con LF y sin BOM: el proyecto lo exige.
    if (!DRY) writeFileSync(file, updated, { encoding: 'utf8' });
  }
}

console.log(
  `\n${DRY ? 'Se cambiarían' : 'Cambiados'} ${replacements} apariciones en ${touched} archivos.`
);
if (!DRY) {
  console.log('\nPendiente a mano:');
  console.log('  · static/favicon.svg (la letra inicial)');
  console.log('  · nombre de la carpeta del proyecto y del repositorio');
  console.log('  · variables de entorno y dominio en Vercel');
  console.log('  · npm run check');
}
