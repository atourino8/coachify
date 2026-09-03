// Guardián de los avisos de «ya está hecho».
//
// QUÉ VIGILA Y POR QUÉ
//
// Hay UN mecanismo de aviso: la acción llama a `avisar(cookies, …)` y el layout
// raíz lo pinta flotando (ver DISENO.md). Antes había veinticinco maneras
// distintas y veinticinco acciones que no decían nada. Volver a ese estado no
// cuesta nada —basta con escribir una acción nueva y olvidarse—, así que esto
// lo comprueba solo.
//
// Las cuatro comprobaciones responden a los cuatro fallos reales que aparecieron
// al hacer la migración:
//
//   1. Acciones mudas. Una acción que acaba bien y no dice nada. Es el fallo
//      original: pulsas «Proponer cita» y la pantalla se queda igual.
//   2. Carteles dentro del flujo. Un `{#if form.success}` nuevo en una plantilla
//      es volver al problema de visibilidad: el mensaje aparece arriba y en un
//      móvil, después de un formulario largo, no se ve.
//   3. `avisar()` sin `cookies`. No compila, pero el error que da es oscuro; es
//      más rápido decirlo aquí.
//   4. Campos fantasma. Se quita `borrados: n` del servidor y se olvida el
//      `{form.borrados}` de la plantilla. Svelte pinta cadena vacía, no falla
//      nada, y el mensaje se queda a medias en silencio. Este es el peligroso.
//
// Uso: node scripts/check-avisos.mjs

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

const RUTAS = 'src/routes';

/**
 * Las excepciones, con su motivo. Están aquí y no repartidas por el código para
 * que se puedan contar: si esta lista empieza a crecer, la regla no vale.
 * Ver la tabla de DISENO.md § «Las cuatro excepciones».
 */
const EXENTAS = new Map([
  ['(client)/workout/[id]::logSet', 'Se registra serie a serie: un aviso por serie sería ruido.'],
  ['(coach)/clients::invite', 'La confirmación es una pantalla entera dentro del modal.'],
  ['(coach)/clients::inviteBulk', 'Avisa dentro cuando todo sale; si algo falla deja el parte.'],
  ['(coach)/onboarding::saveProfile', 'El asistente avanza de paso: eso ES la confirmación.'],
  ['(coach)/onboarding::seedLibrary', 'Ídem.'],
  ['(coach)/onboarding::saveAvailability', 'Ídem.'],
  ['(coach)/onboarding::inviteClient', 'Ídem, y acaba en pantalla de confirmación.'],
  ['(coach)/onboarding::finish', 'Ídem.'],
  ['logout::default', 'Aterrizar en la pantalla de entrar ya lo dice todo.']
]);

/** Los `{#if form.success …}` que SÍ pueden quedarse, porque no son mensajes. */
const CARTELES_PERMITIDOS = new Set([
  '(coach)/clients', // el parte de correos que fallaron
  '(coach)/dashboard', // el botón de deshacer el rechazo
  '(coach)/exercises', // el botón de deshacer el archivado
  '(coach)/onboarding' // la pantalla de confirmación del último paso
]);

function ficheros(dir, nombre, salida = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) ficheros(p, nombre, salida);
    else if (e === nombre) salida.push(p);
  }
  return salida;
}

const ruta = (p) => dirname(p).replace(/\\/g, '/').replace(`${RUTAS}/`, '');

/** Trocea `export const actions` en pares [nombre, cuerpo]. */
function acciones(src) {
  const i = src.indexOf('export const actions');
  if (i < 0) return [];
  const cuerpo = src.slice(i);
  const marcas = [...cuerpo.matchAll(/\n {2}(\w+): async \(\{([^}]*)\}/g)];
  return marcas.map((m, n) => ({
    nombre: m[1],
    firma: m[2],
    cuerpo: cuerpo.slice(m.index, n + 1 < marcas.length ? marcas[n + 1].index : cuerpo.length)
  }));
}

const fallos = [];
let totalAcciones = 0;

for (const f of ficheros(RUTAS, '+page.server.ts')) {
  const src = readFileSync(f, 'utf8');
  const r = ruta(f);

  for (const a of acciones(src)) {
    const acabaBien = a.cuerpo.includes('success: true') || /redirect\(30\d/.test(a.cuerpo);
    if (!acabaBien) continue;
    totalAcciones++;

    if (!a.cuerpo.includes('avisar(') && !EXENTAS.has(`${r}::${a.nombre}`)) {
      fallos.push(`Acción muda: ${r} · ${a.nombre} acaba bien y no dice nada.`);
    }
    if (a.cuerpo.includes('avisar(') && !a.firma.includes('cookies')) {
      fallos.push(`${r} · ${a.nombre}: llama a avisar() pero no recibe \`cookies\`.`);
    }
  }
}

for (const f of ficheros(RUTAS, '+page.svelte')) {
  const src = readFileSync(f, 'utf8');
  const r = ruta(f);

  for (const m of src.matchAll(/\{#if [^}]*form\??\.success[^}]*\}/g)) {
    if (!CARTELES_PERMITIDOS.has(r)) {
      fallos.push(`Cartel en el flujo: ${r} tiene \`${m[0].trim()}\`. Usa avisar() en la acción.`);
    }
  }

  // Campos fantasma: la plantilla lee algo de `form` que su servidor no manda.
  const srv = join(dirname(f), '+page.server.ts');
  if (!existsSync(srv)) continue;
  const fuenteSrv = readFileSync(srv, 'utf8');
  const leidos = new Set([...src.matchAll(/\bform\??\.(\w+)\b/g)].map((m) => m[1]));
  for (const campo of leidos) {
    if (campo === 'success' || campo === 'error') continue;
    if (!new RegExp(`\\b${campo}\\b`).test(fuenteSrv)) {
      fallos.push(`Campo fantasma: ${r} lee \`form.${campo}\` y su servidor ya no lo devuelve.`);
    }
  }
}

if (fallos.length === 0) {
  console.log(`✓ Avisos: ${totalAcciones} acciones, ninguna muda y ningún cartel en el flujo.`);
  console.log(`  (${EXENTAS.size} excepciones declaradas, ver DISENO.md)`);
} else {
  console.error(`✗ Avisos: ${fallos.length} problema(s).\n`);
  for (const x of fallos) console.error('  · ' + x);
  process.exit(1);
}
