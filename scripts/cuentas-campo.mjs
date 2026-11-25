#!/usr/bin/env node
/**
 * Dos cuentas FICTICIAS para entrar a probar.
 *
 *   node scripts/cuentas-campo.mjs
 *   node scripts/cuentas-campo.mjs --clave aleatoria
 *   node scripts/cuentas-campo.mjs --limpiar
 *
 * Crea:
 *   · aaron@example.com  → ENTRENADOR
 *   · toni@example.com   → CLIENTE SUYO
 *
 * Las dos con la contraseña `demo1234`, la misma que los clientes de
 * demostración de `seed-demo.mjs`.
 *
 * Las dos con contraseña y listas para entrar. Sirven para recorrer la web de
 * verdad: subir un vídeo, programar un entreno, verlo desde el otro lado.
 *
 * ---------------------------------------------------------------------------
 * POR QUÉ example.com
 *
 * Está reservado por la IANA (RFC 2606) para ejemplos y pruebas: no es de
 * nadie, nunca lo será, y no hay buzón detrás al que molestar. Es lo que evita
 * el problema que ya nos costó un aviso de Supabase — ver CORREO.md.
 *
 * LA CONSECUENCIA, Y HAY QUE TENERLA PRESENTE: a esas direcciones NO LLEGA
 * NADA. «He olvidado mi contraseña» no sirve con ellas. Si se pierde la clave,
 * se vuelve a ejecutar esto con --limpiar y otra vez.
 *
 * POR QUÉ UN GUION APARTE Y NO UN TROZO DE seed-demo.mjs
 *
 * `seed-demo.mjs --limpiar` borra por una marca del metadata y borra sin
 * preguntar. Estas dos cuentas van a acumular lo que probéis —vídeos incluidos—
 * y no quiero que una limpieza de datos de demostración se las lleve de paso.
 *
 * CUANDO ACABE LA PRUEBA, BÓRRALAS. Viven en el proyecto de verdad.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const log = (...a) => console.log(...a);
const ok = (...a) => console.log('  ✓', ...a);
const die = (msg) => {
  console.error('\n✗ ' + String(msg) + '\n');
  process.exit(1);
};

function loadEnv() {
  for (const name of ['.env.local', '.env']) {
    const p = join(ROOT, name);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const value = m[2].replace(/^["']|["']$/g, '');
      if (!process.env[m[1]]) process.env[m[1]] = value;
    }
  }
}

/**
 * LA MISMA QUE LOS CLIENTES DE DEMOSTRACIÓN, a propósito.
 *
 * `seed-demo.mjs` usa `demo1234` desde siempre. Que estas dos cuentas usen otra
 * obliga a recordar dos cosas en una prueba donde se entra y se sale de varias
 * cuentas todo el rato, y eso acaba en «no me deja entrar» que no es un fallo
 * del producto.
 *
 * ES UNA CONTRASEÑA MALA Y SE USA IGUAL, porque lo que protege no vale nada:
 * cuentas ficticias en example.com con datos inventados. Deja de valer en
 * cuanto entre algo real —el vídeo de una persona, por ejemplo—, y para ese
 * caso está `--clave`.
 */
const CLAVE_POR_DEFECTO = 'demo1234';

/**
 * Una fuerte, para cuando haga falta: 20 caracteres de un alfabeto de 31 sin
 * letras ambiguas (ni O ni 0, ni I ni l), que se dicta sin deletrear.
 * Se pide con `--clave aleatoria`.
 */
function claveAleatoria() {
  const abc = 'abcdefghjkmnpqrstuvwxyz23456789';
  return [...randomBytes(20)].map((b) => abc[b % abc.length]).join('');
}

/**
 * Los dos hermanos, cada uno con SU cuenta de entrenador.
 *
 * Son cuentas independientes, no dos accesos a la misma: hoy un cliente cuelga
 * de un entrenador y nada más (ver ADR-003, que recoge el caso de varios
 * entrenadores compartiendo clientes y lo deja para cuando haga falta). Así que
 * esto prueba lo que de verdad hay: dos negocios en paralelo bajo una marca.
 *
 * Para añadir un tercero, una línea más aquí y ya.
 */
const ENTRENADORES = [
  { email: 'aaron@example.com', nombre: 'Aarón Santomé' },
  { email: 'manuel@example.com', nombre: 'Manuel Santomé' }
];

/**
 * `de` dice de qué entrenador cuelga. Tiene que existir arriba.
 *
 * DOS CUENTAS PARA LA MISMA PERSONA, Y NO ES UN DESCUIDO.
 *
 * Un cliente cuelga de UN entrenador: `profiles.coach_id` es una sola columna.
 * Así que «Toni es cliente de Aarón y de Manuel» no se puede decir con una
 * cuenta — hacen falta dos, y en la aplicación son dos personas distintas que
 * casualmente se llaman igual.
 *
 * Esto NO es un apaño para la prueba: es el modelo de datos de hoy, y conviene
 * verlo funcionando para saber si molesta. Si al usarlo resulta que molesta —
 * tener que salir y entrar con otra cuenta para ver el entreno del otro
 * hermano—, entonces el ADR-003 (clientes compartidos entre entrenadores) deja
 * de ser teoría y pasa a ser trabajo.
 */
const CLIENTES = [
  { email: 'toni@example.com', nombre: 'Toni (con Aarón)', de: 'aaron@example.com' },
  { email: 'toni.manuel@example.com', nombre: 'Toni (con Manuel)', de: 'manuel@example.com' }
];

const arg = (nombre) => {
  const i = process.argv.indexOf(`--${nombre}`);
  return i !== -1 ? process.argv[i + 1] : null;
};

async function main() {
  loadEnv();

  const limpiar = process.argv.includes('--limpiar');
  const claveFijada = arg('clave');

  const url = process.env.PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    die('Faltan PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local.');
  }

  const db = createClient(url, key, { auth: { persistSession: false } });

  const { data: page, error: errList } = await db.auth.admin.listUsers({ perPage: 1000 });
  if (errList) die('No se pudo listar usuarios: ' + errList.message);
  const buscar = (email) =>
    page.users.find((u) => (u.email ?? '').toLowerCase() === email.toLowerCase());

  // ---- Limpiar -------------------------------------------------------------
  //
  // El cliente primero: cuelga del entrenador, y borrar al entrenador antes
  // dejaría un cliente apuntando a nadie durante un instante.
  if (limpiar) {
    log('\nBorrando las cuentas de prueba…');
    for (const { email } of [...CLIENTES, ...ENTRENADORES]) {
      const u = buscar(email);
      if (!u) {
        ok(`${email} no existía`);
        continue;
      }
      const { error } = await db.auth.admin.deleteUser(u.id);
      if (error) die(`No se pudo borrar ${email}: ${error.message}`);
      ok(`${email} borrado`);
    }
    log('\n  Lo que subieran al cubo NO se borra con esto. Si había vídeos de');
    log('  personas reales, hay que quitarlos a mano desde Supabase.\n');
    return;
  }

  // ---- Crear ---------------------------------------------------------------
  //
  // ORDEN OBLIGATORIO: los entrenadores primero, porque cada cliente necesita
  // el id del suyo para colgar de él. Al revés nacería huérfano y no vería
  // nada al entrar.

  for (const { email } of [...ENTRENADORES, ...CLIENTES]) {
    if (buscar(email)) {
      die(
        `Ya existe una cuenta con ${email}.\n` +
          'Será de una prueba anterior: bórrala con --limpiar y vuelve a lanzarlo.'
      );
    }
  }

  // Comprobación de la configuración de arriba, no de la base: si un cliente
  // apunta a un entrenador que no está en la lista, es una errata al añadir
  // gente. Mejor decirlo ahora que crear medio juego de cuentas y morir luego.
  for (const c of CLIENTES) {
    if (!ENTRENADORES.some((e) => e.email === c.de)) {
      die(`El cliente ${c.email} cuelga de «${c.de}», que no está en ENTRENADORES.`);
    }
  }

  // `--clave aleatoria` genera una distinta para cada cuenta; `--clave loquesea`
  // impone esa; sin nada, la misma que los clientes de demostración.
  const unaClave = () =>
    claveFijada === 'aleatoria' ? claveAleatoria() : (claveFijada ?? CLAVE_POR_DEFECTO);

  /** email → { id, nombre, clave }, para vincular clientes y para el resumen. */
  const creadas = new Map();

  log('\nCreando las cuentas de entrenador…');
  for (const e of ENTRENADORES) {
    const clave = unaClave();
    const { data, error } = await db.auth.admin.createUser({
      email: e.email,
      password: clave,
      // Sin esto la cuenta nace sin confirmar y no se puede entrar — y la
      // confirmación llegaría a un buzón que no existe.
      email_confirm: true,
      user_metadata: { full_name: e.nombre, role: 'coach' }
    });
    if (error) die(`No se pudo crear ${e.email}: ${error.message}`);

    // El trigger handle_new_user ya crea el perfil leyendo el metadata. Se
    // fuerza igualmente: si algún día cambia el trigger, esto sigue dejando el
    // papel correcto en vez de fallar en silencio.
    const { error: errPerfil } = await db
      .from('profiles')
      .update({ role: 'coach', full_name: e.nombre })
      .eq('id', data.user.id);
    if (errPerfil) die(`No se pudo marcar ${e.email} como entrenador: ${errPerfil.message}`);

    creadas.set(e.email, { id: data.user.id, nombre: e.nombre, clave, papel: 'Entrenador' });
    ok(`${e.nombre} · ${e.email}`);
  }

  log('\nCreando las cuentas de cliente…');
  for (const c of CLIENTES) {
    const entrenador = creadas.get(c.de);
    const clave = unaClave();
    const { data, error } = await db.auth.admin.createUser({
      email: c.email,
      password: clave,
      email_confirm: true,
      user_metadata: { full_name: c.nombre, role: 'client', coach_id: entrenador.id }
    });
    if (error) die(`No se pudo crear ${c.email}: ${error.message}`);

    const { error: errV } = await db
      .from('profiles')
      .update({ role: 'client', coach_id: entrenador.id })
      .eq('id', data.user.id);
    if (errV) die(`No se pudo vincular ${c.email}: ${errV.message}`);

    creadas.set(c.email, {
      id: data.user.id,
      nombre: c.nombre,
      clave,
      papel: `Cliente de ${entrenador.nombre}`
    });
    ok(`${c.nombre}, cliente de ${entrenador.nombre} · ${c.email}`);
  }

  // ---- Las claves, una sola vez -------------------------------------------
  log('\n' + '─'.repeat(62));
  log('  A example.com no llega ningún correo, así que «He olvidado mi');
  log('  contraseña» NO sirve con estas cuentas.');
  log('─'.repeat(62));
  for (const [email, { papel, clave }] of creadas) {
    log(`\n  ${papel}`);
    log(`    ${email}`);
    log(`    ${clave}`);
  }
  log('\n' + '─'.repeat(62));
  log('\n  Si se pierden: este guion con --limpiar y otra vez.');
  log('  Cuando acabéis de probar, bórralas: viven en el proyecto real.\n');

  log('  Para poblar las pantallas de cada entrenador:');
  for (const e of ENTRENADORES) log(`    node scripts/seed-demo.mjs ${e.email}`);
  log('');
}

main().catch((e) => die(e?.message ?? e));
