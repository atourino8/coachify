#!/usr/bin/env node
/**
 * Datos de prueba para ver las pantallas pobladas.
 *
 *   node scripts/seed-demo.mjs <email-del-coach>
 *   node scripts/seed-demo.mjs <email-del-coach> --limpiar
 *
 * Crea 4 clientes demo colgando del coach que le indiques, con justo el estado
 * que hace aparecer cada sección del inicio:
 *
 *   Lucía Bermejo   · cita HOY confirmada + entreno montado + a punto de vencer
 *   Marcos Vidal    · te ha pedido cita (pendiente de que confirmes)
 *   Nadia Ferrer    · vídeo de técnica sin corregir + cuota vencida
 *   Iván Puig       · sin entrenos esta semana + propuesta tuya sin responder
 *
 * POR QUÉ ASÍ: cada cliente cubre un caso distinto en vez de repetir el mismo.
 * Con 4 clientes salen las cinco secciones del inicio a la vez, que es lo que
 * hace falta para juzgar el diseño.
 *
 * SEGURIDAD: usa la service_role, que se salta la RLS. Solo para local o para
 * un proyecto de pruebas. Todo lo que crea va marcado con demo:true en el
 * metadata del usuario, y --limpiar borra exactamente eso y nada más.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// --- Configuración -----------------------------------------------------------

const BUCKET = 'technique-videos';
const DEMO_PASSWORD = 'demo1234';
/** Marca en el metadata que permite limpiar sin tocar datos reales. */
const DEMO_FLAG = 'coachify_demo';

// --- Utilidades --------------------------------------------------------------

const log = (...a) => console.log(...a);
const ok = (...a) => console.log('  ✓', ...a);
const die = (msg) => {
  let texto = String(msg);
  // supabase-js reporta cualquier fallo de red como "fetch failed" a secas y
  // encima escupe su propio stack. Añadimos la pista útil.
  if (/fetch failed|ENOTFOUND|ECONNREFUSED|EAI_AGAIN/i.test(texto)) {
    texto +=
      '\n  → Parece un problema de conexión. Revisa PUBLIC_SUPABASE_URL en .env.local' +
      '\n    y que el proyecto de Supabase esté activo. (El stack de arriba es de supabase-js.)';
  }
  console.error('\n✗ ' + texto + '\n');
  process.exit(1);
};

/** Lee .env.local (o .env) sin dependencias externas. */
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

/** Fecha ISO (YYYY-MM-DD) desplazada N días respecto a hoy. */
function day(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

/** Timestamp ISO a una hora concreta de un día desplazado. */
function at(offset, hour, minutes = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(hour, minutes, 0, 0);
  return d.toISOString();
}

/** Suma horas a un ISO. */
function plusHour(iso, hours = 1) {
  return new Date(new Date(iso).getTime() + hours * 3600000).toISOString();
}

// --- Definición de los clientes demo -----------------------------------------

const DEMO_CLIENTS = [
  {
    key: 'lucia',
    name: 'Lucía Bermejo',
    info: {
      goals: 'Volver a correr 10 km sin molestias.',
      injuries: 'Condromalacia rótula izquierda (2023).',
      training_days_per_week: 3,
      level: 'intermedio',
      height_cm: 168,
      fee_amount: 45,
      paid_until: day(4) // vence dentro de 4 días -> "vence pronto"
    }
  },
  {
    key: 'marcos',
    name: 'Marcos Vidal',
    info: {
      goals: 'Ganar masa muscular en tren superior.',
      training_days_per_week: 4,
      level: 'principiante',
      height_cm: 181,
      fee_amount: 60,
      paid_until: day(20)
    }
  },
  {
    key: 'nadia',
    name: 'Nadia Ferrer',
    info: {
      goals: 'Perder grasa y coger el hábito.',
      injuries: 'Molestias lumbares al peso muerto.',
      training_days_per_week: 2,
      level: 'principiante',
      height_cm: 162,
      fee_amount: 45,
      paid_until: day(-11) // vencido hace 11 días
    }
  },
  {
    key: 'ivan',
    name: 'Iván Puig',
    info: {
      goals: 'Mantenerse activo trabajando a turnos.',
      training_days_per_week: 2,
      level: 'intermedio',
      height_cm: 175,
      fee_amount: 45,
      paid_until: day(15)
    }
  }
];

/** Email determinista por cliente: permite reejecutar sin duplicar. */
const emailFor = (key, coachEmail) => {
  const [, domain] = coachEmail.split('@');
  return `demo.${key}@${domain ?? 'example.com'}`;
};

// --- Programa principal ------------------------------------------------------

async function main() {
  loadEnv();

  const args = process.argv.slice(2);
  const clean = args.includes('--limpiar') || args.includes('--clean');
  const coachEmail = args.find((a) => !a.startsWith('--'));

  if (!coachEmail) {
    die(
      'Falta el email del coach.\n' +
        '  node scripts/seed-demo.mjs tu@email.com\n' +
        '  node scripts/seed-demo.mjs tu@email.com --limpiar'
    );
  }

  const url = process.env.PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    die(
      'Faltan PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.\n' +
        'Deben estar en .env.local (o exportadas en el entorno).'
    );
  }

  const db = createClient(url, key, { auth: { persistSession: false } });

  // ---- Localizar al coach ----
  log('\nBuscando al coach…');
  const { data: usersPage, error: listErr } = await db.auth.admin.listUsers({ perPage: 1000 });
  if (listErr) die('No se pudo listar usuarios: ' + listErr.message);

  const coachUser = usersPage.users.find(
    (u) => (u.email ?? '').toLowerCase() === coachEmail.toLowerCase()
  );
  if (!coachUser) die(`No existe ningún usuario con el email ${coachEmail}.`);

  const { data: coachProfile } = await db
    .from('profiles')
    .select('id, role, full_name')
    .eq('id', coachUser.id)
    .maybeSingle();
  if (!coachProfile) die('Ese usuario no tiene perfil en la tabla profiles.');
  if (coachProfile.role !== 'coach') {
    die(`El perfil de ${coachEmail} tiene rol "${coachProfile.role}", no "coach".`);
  }
  ok(`Coach: ${coachProfile.full_name ?? coachEmail}`);

  const coachId = coachUser.id;
  const demoEmails = DEMO_CLIENTS.map((c) => emailFor(c.key, coachEmail).toLowerCase());
  const existing = usersPage.users.filter((u) =>
    demoEmails.includes((u.email ?? '').toLowerCase())
  );

  // ---- Modo limpieza ----
  if (clean) {
    log('\nLimpiando datos demo…');
    if (existing.length === 0) {
      ok('No había nada que limpiar.');
      return;
    }
    for (const u of existing) {
      if (!u.user_metadata?.[DEMO_FLAG]) {
        log(`  · ${u.email} no está marcado como demo, lo dejo intacto.`);
        continue;
      }
      // Los vídeos del Storage no caen con el borrado en cascada de la BD.
      const { data: files } = await db.storage.from(BUCKET).list(u.id, { limit: 100 });
      for (const dir of files ?? []) {
        const { data: inner } = await db.storage.from(BUCKET).list(`${u.id}/${dir.name}`);
        const paths = (inner ?? []).map((f) => `${u.id}/${dir.name}/${f.name}`);
        if (paths.length) await db.storage.from(BUCKET).remove(paths);
      }
      // Borrar el usuario arrastra profile, sesiones, entrenos y client_info
      // por las FK on delete cascade.
      const { error } = await db.auth.admin.deleteUser(u.id);
      if (error) log(`  ! ${u.email}: ${error.message}`);
      else ok(`Borrado ${u.email}`);
    }
    log('\nListo.\n');
    return;
  }

  if (existing.length > 0) {
    die(
      `Ya existen ${existing.length} clientes demo para este coach.\n` +
        'Ejecuta primero:  node scripts/seed-demo.mjs ' +
        coachEmail +
        ' --limpiar'
    );
  }

  // ---- Ejercicios del coach (necesarios para montar entrenos) ----
  const { data: exercises } = await db
    .from('exercises')
    .select('id, name')
    .eq('coach_id', coachId)
    .eq('archived', false)
    .limit(6);

  if (!exercises || exercises.length < 3) {
    die(
      'Este coach tiene menos de 3 ejercicios.\n' +
        'Entra en Biblioteca → Ejercicios y pulsa "Cargar biblioteca base" antes de sembrar.'
    );
  }
  ok(`${exercises.length} ejercicios disponibles`);

  // ---- Crear los clientes ----
  log('\nCreando clientes…');
  const ids = {};
  for (const c of DEMO_CLIENTS) {
    const email = emailFor(c.key, coachEmail);
    const { data, error } = await db.auth.admin.createUser({
      email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: c.name,
        role: 'client',
        coach_id: coachId,
        [DEMO_FLAG]: true
      }
    });
    if (error) die(`No se pudo crear ${email}: ${error.message}`);
    ids[c.key] = data.user.id;
    ok(`${c.name} · ${email}`);

    // El trigger handle_new_user crea el perfil leyendo el metadata. Nos
    // aseguramos igualmente de que quede colgando del coach correcto.
    await db.from('profiles').update({ coach_id: coachId, role: 'client' }).eq('id', data.user.id);

    const { fee_amount, paid_until, ...rest } = c.info;
    await db.from('client_info').upsert({
      client_id: data.user.id,
      coach_id: coachId,
      fee_amount,
      paid_until,
      fee_currency: 'EUR',
      coach_notes: 'Cliente de prueba generado por seed-demo.mjs.',
      ...rest
    });
  }

  // ---- Entrenos ----
  log('\nMontando entrenos…');
  async function crearEntreno(clientId, fecha, titulo, { conProgreso = false } = {}) {
    const { data: w, error } = await db
      .from('workouts')
      .insert({
        client_id: clientId,
        coach_id: coachId,
        date: fecha,
        title: titulo,
        published: true,
        notes: 'Calienta 10 minutos antes de empezar.'
      })
      .select('id')
      .single();
    if (error) die('Error creando entreno: ' + error.message);

    const usados = exercises.slice(0, 4);
    const items = usados.map((ex, i) => ({
      workout_id: w.id,
      exercise_id: ex.id,
      order_index: i,
      sets: 4,
      reps_prescribed: '8-10',
      weight_prescribed: i === 0 ? '40 kg' : null,
      rest_seconds: 90
    }));
    const { data: inserted, error: itErr } = await db
      .from('workout_items')
      .insert(items)
      .select('id, exercise_id');
    if (itErr) die('Error creando ejercicios del entreno: ' + itErr.message);

    // Progreso parcial: deja el entreno a medias para probar "Continuar".
    if (conProgreso) {
      const logs = [];
      for (const [idx, it] of inserted.entries()) {
        const series = idx === 0 ? 4 : idx === 1 ? 2 : 0;
        for (let s = 1; s <= series; s++) {
          logs.push({
            workout_item_id: it.id,
            client_id: clientId,
            exercise_id: it.exercise_id,
            set_number: s,
            reps_done: 9,
            weight_done: 40,
            feedback: s === series ? 'hard' : 'just_right'
          });
        }
      }
      if (logs.length) await db.from('set_logs').insert(logs);
    }
    return w.id;
  }

  const wLuciaHoy = await crearEntreno(ids.lucia, day(0), 'Fuerza · tren inferior', {
    conProgreso: true
  });
  await crearEntreno(ids.lucia, day(2), 'Empuje · pecho y hombro');
  await crearEntreno(ids.lucia, day(4), 'Tirón · espalda y bíceps');
  await crearEntreno(ids.marcos, day(1), 'Full body A');
  await crearEntreno(ids.nadia, day(0), 'Adaptación · circuito');
  ok('5 entrenos creados (Iván se queda sin ninguno, a propósito)');

  // ---- Citas ----
  log('\nCreando citas…');
  const citas = [
    {
      // Hoy, confirmada, con el entreno enlazado -> sección "Hoy" del coach.
      client_id: ids.lucia,
      workout_id: wLuciaHoy,
      starts_at: at(0, 18),
      status: 'confirmed',
      modality: 'presencial',
      location: 'Sala 2',
      requested_by: coachId
    },
    {
      // El cliente la pidió -> "Te han pedido cita", con botones de confirmar.
      client_id: ids.marcos,
      starts_at: at(2, 10),
      status: 'requested',
      modality: 'presencial',
      notes: '¿Podríamos empezar media hora antes?',
      requested_by: ids.marcos
    },
    {
      // La propuso el coach -> "Esperando a que confirmen".
      client_id: ids.ivan,
      starts_at: at(3, 19, 30),
      status: 'requested',
      modality: 'online',
      requested_by: coachId
    },
    {
      // Confirmada futura -> le sale al cliente como "próxima cita".
      client_id: ids.nadia,
      starts_at: at(1, 9),
      status: 'confirmed',
      modality: 'presencial',
      location: 'Parque del Oeste',
      requested_by: coachId
    }
  ];

  for (const c of citas) {
    const { error } = await db.from('sessions').insert({
      coach_id: coachId,
      ends_at: plusHour(c.starts_at),
      ...c
    });
    if (error) die('Error creando cita: ' + error.message);
  }
  ok(`${citas.length} citas creadas`);

  // ---- Vídeo de técnica sin corregir ----
  log('\nSubiendo vídeo de técnica…');
  const videoPath = join(__dirname, 'assets', 'demo-technique.mp4');
  if (!existsSync(videoPath)) {
    log('  ! No encuentro scripts/assets/demo-technique.mp4, me salto los vídeos.');
  } else {
    const bytes = readFileSync(videoPath);
    const ejercicio = exercises[0];

    // Dos vídeos del mismo ejercicio: el primero ya corregido y el más
    // reciente sin corregir. Así se ve la comparación antes/después en la
    // bandeja de corrección del inicio.
    const subidas = [
      { kind: 'first', comment: 'Buen inicio. Baja un poco más y controla la bajada.', dias: -21 },
      { kind: 'latest', comment: null, dias: -2 }
    ];

    for (const s of subidas) {
      const path = `${ids.nadia}/${ejercicio.id}/${s.kind}.mp4`;
      const { error: upErr } = await db.storage
        .from(BUCKET)
        .upload(path, bytes, { contentType: 'video/mp4', upsert: true });
      if (upErr) {
        log(`  ! No se pudo subir el vídeo (${upErr.message}). ¿Existe el bucket "${BUCKET}"?`);
        break;
      }
      const { error: rowErr } = await db.from('technique_videos').insert({
        client_id: ids.nadia,
        coach_id: coachId,
        exercise_id: ejercicio.id,
        kind: s.kind,
        storage_path: path,
        duration_seconds: 3,
        size_bytes: bytes.length,
        coach_comment: s.comment,
        coach_comment_at: s.comment ? new Date().toISOString() : null,
        created_at: at(s.dias, 12)
      });
      if (rowErr) log(`  ! ${rowErr.message}`);
      else ok(`${s.kind} · ${ejercicio.name}`);
    }
  }

  // ---- Resumen ----
  log('\n' + '─'.repeat(64));
  log('Listo. Entra en tu Inicio y deberías ver:');
  log('  · Hoy            → Lucía a las 18:00, con su entreno');
  log('  · Te han pedido  → Marcos, con Confirmar / Rechazar');
  log('  · Técnica        → el vídeo de Nadia, con el primero al lado');
  log('  · Atención       → Nadia (cuota vencida), Lucía (vence pronto), Iván (sin entrenos)');
  log('  · Esperando      → la propuesta a Iván');
  log('');
  log('Para entrar como cliente y ver su pantalla:');
  log(`  ${emailFor('lucia', coachEmail)}  ·  contraseña: ${DEMO_PASSWORD}`);
  log('  (tiene el entreno de hoy a medias, para probar "Continuar")');
  log('');
  log(`Para borrarlo todo:  node scripts/seed-demo.mjs ${coachEmail} --limpiar`);
  log('─'.repeat(64) + '\n');
}

main().catch((e) => die(e?.message ?? e));
