#!/usr/bin/env node
/**
 * Datos de prueba para ver las pantallas pobladas.
 *
 *   node scripts/seed-demo.mjs <email-del-coach>
 *   node scripts/seed-demo.mjs <email-del-coach> --limpiar
 *
 * CRITERIO: cada cliente demo cubre un caso distinto. No repetimos perfiles
 * "normales" porque no enseñan nada; buscamos los estados donde la interfaz
 * tiene que decidir algo (vacío, límite, error, texto que no cabe).
 *
 *   Lucía Bermejo    · cita hoy + entreno a medias + cuota que vence pronto
 *   Marcos Vidal     · te ha pedido cita (pendiente de que confirmes)
 *   Nadia Ferrer     · vídeo de técnica sin corregir + cuota vencida
 *   Iván Puig        · sin entrenos esta semana + propuesta tuya sin responder
 *   Sofía Iglesias-Montenegro de la Torre · nombre larguísimo (truncado),
 *                      sin cuota definida y entreno de hoy COMPLETADO
 *   Rubén Casal      · invitado que aún no ha aceptado (pestaña Pendientes)
 *   Elena Prats      · archivada (no debe salir en ninguna lista)
 *   Carla Otero      · 8 semanas de historial (gráfica de progreso real)
 *                      y citas pasadas completada/rechazada/cancelada
 *   Ana, Beatriz y Diana · grupo corporativo "Talleres López"
 *
 * Además crea:
 *   · Huecos de disponibilidad → sin esto "Pedir cita" SIEMPRE dice que no
 *     hay huecos, y el flujo entero de reserva es imposible de probar.
 *   · Un ejercicio con vídeo de YouTube → prueba del embebido.
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
/** Nombres exactos de lo que creamos aparte de usuarios, para poder borrarlo. */
const DEMO_GROUP = 'Empleadas · Talleres López';
const DEMO_EXERCISE = 'Sentadilla con barra (demo)';

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
      // Vencida hace 11 días: pasados los 7 de gracia, así que es la única
      // que queda EN PAUSA si activas el bloqueo desde Cobros. Entra con su
      // usuario para ver la pantalla que le sale.
      paid_until: day(-11)
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
      // Vencida hace 3 días: DENTRO de los 7 de gracia. Es el caso que hay que
      // ver antes de activar nada, porque enseña el aviso amarillo con la
      // cuenta atrás y demuestra que a este NO se le corta todavía.
      paid_until: day(-3)
    }
  },
  {
    // Nombre deliberadamente larguísimo: revienta cualquier truncado mal hecho,
    // y sin cuota para ver el estado "sin_cuota".
    key: 'sofia',
    name: 'Sofía Iglesias-Montenegro de la Torre',
    info: {
      goals: 'Recuperar movilidad de hombro tras la operación.',
      injuries: 'Manguito rotador derecho operado en enero.',
      training_days_per_week: 3,
      level: 'principiante',
      height_cm: 170,
      fee_amount: null,
      paid_until: null
    }
  },
  {
    // Invitado que aún no ha entrado: alimenta la pestaña "Pendientes", que
    // hasta ahora estaba siempre vacía.
    key: 'ruben',
    name: 'Rubén Casal',
    pending: true,
    info: {
      goals: 'Empezar de cero.',
      fee_amount: 45,
      paid_until: null
    }
  },
  {
    // Archivado: NO debe aparecer en clientes, ni en el inicio, ni en grupos.
    key: 'elena',
    name: 'Elena Prats',
    archived: true,
    info: { goals: 'Dejó de entrenar en marzo.', fee_amount: 45, paid_until: day(-120) }
  },
  {
    // Con historial largo: es la única forma de ver la gráfica de progreso
    // con una curva de verdad en vez de dos puntos.
    key: 'carla',
    name: 'Carla Otero',
    history: true,
    info: {
      goals: 'Subir el press de banca a 60 kg.',
      training_days_per_week: 4,
      level: 'avanzado',
      height_cm: 165,
      fee_amount: 55,
      paid_until: day(9)
    }
  },
  {
    key: 'ana',
    name: 'Ana Ruiz',
    group: true,
    info: { goals: 'Salud general.', level: 'principiante', fee_amount: 25, paid_until: day(25) }
  },
  {
    key: 'beatriz',
    name: 'Beatriz Soto',
    group: true,
    info: {
      goals: 'Dolor cervical de oficina.',
      level: 'principiante',
      fee_amount: 25,
      paid_until: day(25)
    }
  },
  {
    key: 'diana',
    name: 'Diana Melo',
    group: true,
    info: { goals: 'Volver a moverse.', level: 'principiante', fee_amount: 25, paid_until: day(25) }
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

    // El grupo y el ejercicio demo se borran por nombre exacto.
    await db.from('client_groups').delete().eq('coach_id', coachId).eq('name', DEMO_GROUP);
    await db.from('exercises').delete().eq('coach_id', coachId).eq('name', DEMO_EXERCISE);
    ok('Grupo y ejercicio demo borrados');

    // La marca vuelve a NULL, no al naranja: NULL significa "no ha elegido",
    // y así el coach queda como estaba antes de sembrar.
    await db
      .from('profiles')
      .update({ brand_accent: null, brand_accent_2: null })
      .eq('id', coachId);
    ok('Marca demo retirada');

    if (existing.length === 0) {
      ok('No había clientes demo que borrar.');
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

    log('\nNo toco tus huecos de disponibilidad: son tuyos y borrarlos');
    log('podría cargarse los que hubieras puesto de verdad.\n');
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

  // ---- Marca del entrenador ----
  //
  // Se siembra un color a propósito, y uno HOSTIL: un azul marino que sobre
  // el fondo grafito contrasta 1.62:1 y sería ilegible tal cual. Así la
  // primera vez que se entra en "Mi marca" se ve funcionando la corrección
  // automática, con sus dos números, en vez de un caso fácil que no demuestra
  // nada. Si ya había elegido color, no se toca.
  const MARCA_DEMO = '#1B3A6B';

  // Se consulta aparte y no en el select del perfil de arriba porque ese
  // select falla entero si la columna no existe, y entonces la siembra moriría
  // por no poder poner un color. Aquí, si la migración 0014 no está aplicada,
  // esta consulta falla sola, se avisa y el resto de los datos se siembra igual.
  const { data: marcaActual, error: errLeerMarca } = await db
    .from('profiles')
    .select('brand_accent')
    .eq('id', coachId)
    .maybeSingle();

  if (errLeerMarca) {
    log(`  (marca demo omitida, ¿falta la migración 0014?: ${errLeerMarca.message})`);
  } else if (marcaActual?.brand_accent) {
    // Si ya eligió color, no se toca. Sembrar datos de prueba no es motivo
    // para borrarle una decisión suya.
    ok(`Marca: respetada la que ya tenías (${marcaActual.brand_accent})`);
  } else {
    const { error: errMarca } = await db
      .from('profiles')
      .update({ brand_accent: MARCA_DEMO })
      .eq('id', coachId);
    if (errMarca) log(`  (marca demo omitida: ${errMarca.message})`);
    else ok(`Marca demo: ${MARCA_DEMO} · se corrige solo a un azul legible`);
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

  // ---- Ejercicio con vídeo (para probar el embebido de YouTube) ----
  await db
    .from('exercises')
    .insert({
      coach_id: coachId,
      name: DEMO_EXERCISE,
      description: 'Ejercicio de prueba con vídeo, para ver cómo queda el reproductor embebido.',
      video_url: 'https://www.youtube.com/watch?v=aclHkVaku9U',
      muscle_group: 'legs',
      equipment: 'barbell'
    })
    .select('id')
    .single();
  ok('Ejercicio con vídeo de YouTube creado');

  // ---- Disponibilidad (desbloquea el flujo de "Pedir cita") ----
  const { count: slotCount } = await db
    .from('availability_slots')
    .select('id', { count: 'exact', head: true })
    .eq('coach_id', coachId);

  if ((slotCount ?? 0) === 0) {
    const slots = [1, 2, 3, 4, 5].flatMap((dow) => [
      {
        coach_id: coachId,
        kind: 'recurring',
        day_of_week: dow,
        start_time: '09:00',
        end_time: '13:00',
        duration_minutes: 60,
        modalities: ['presencial', 'online']
      },
      {
        coach_id: coachId,
        kind: 'recurring',
        day_of_week: dow,
        start_time: '16:00',
        end_time: '20:00',
        duration_minutes: 60,
        modalities: ['presencial']
      }
    ]);
    const { error } = await db.from('availability_slots').insert(slots);
    if (error) log('  ! No se pudo crear la disponibilidad: ' + error.message);
    else ok('Disponibilidad L-V (9-13 y 16-20) publicada');
  } else {
    ok(`Ya tenías ${slotCount} huecos publicados, no los toco`);
  }

  // ---- Crear los clientes ----
  log('\nCreando clientes…');
  const ids = {};
  for (const c of DEMO_CLIENTS) {
    const email = emailFor(c.key, coachEmail);
    const { data, error } = await db.auth.admin.createUser({
      email,
      password: DEMO_PASSWORD,
      // Sin confirmar = aparece como invitación pendiente en la pestaña Pendientes.
      email_confirm: !c.pending,
      user_metadata: {
        full_name: c.name,
        role: 'client',
        coach_id: coachId,
        [DEMO_FLAG]: true
      }
    });
    if (error) die(`No se pudo crear ${email}: ${error.message}`);
    ids[c.key] = data.user.id;
    ok(`${c.name}${c.pending ? ' (pendiente)' : ''}${c.archived ? ' (archivada)' : ''}`);

    // El trigger handle_new_user crea el perfil leyendo el metadata. Nos
    // aseguramos igualmente de que quede colgando del coach correcto.
    await db
      .from('profiles')
      .update({ coach_id: coachId, role: 'client', archived: !!c.archived })
      .eq('id', data.user.id);

    const { fee_amount = null, paid_until = null, ...rest } = c.info ?? {};
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

  // ---- Grupo corporativo ----
  const { data: group } = await db
    .from('client_groups')
    .insert({
      coach_id: coachId,
      name: DEMO_GROUP,
      company: 'Talleres López S.L.',
      notes: 'Convenio de empresa. Facturación mensual conjunta.'
    })
    .select('id')
    .single();
  await db
    .from('client_group_members')
    .insert(['ana', 'beatriz', 'diana'].map((k) => ({ group_id: group.id, client_id: ids[k] })));
  ok('Grupo "Talleres López" con 3 personas');

  // ---- Entrenos ----
  log('\nMontando entrenos…');
  async function crearEntreno(clientId, fecha, titulo, { series = 'ninguna' } = {}) {
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

    if (series !== 'ninguna') {
      const logs = [];
      for (const [idx, it] of inserted.entries()) {
        // 'parcial' deja el entreno a medias (para probar "Continuar").
        // 'todas' lo deja completo (para probar la píldora "Completado").
        const n = series === 'todas' ? 4 : idx === 0 ? 4 : idx === 1 ? 2 : 0;
        for (let s = 1; s <= n; s++) {
          logs.push({
            workout_item_id: it.id,
            client_id: clientId,
            exercise_id: it.exercise_id,
            set_number: s,
            reps_done: 9,
            weight_done: 40,
            feedback: s === n ? 'hard' : 'just_right'
          });
        }
      }
      if (logs.length) await db.from('set_logs').insert(logs);
    }
    return w.id;
  }

  const wLuciaHoy = await crearEntreno(ids.lucia, day(0), 'Fuerza · tren inferior', {
    series: 'parcial'
  });
  await crearEntreno(ids.lucia, day(2), 'Empuje · pecho y hombro');
  await crearEntreno(ids.lucia, day(4), 'Tirón · espalda y bíceps');
  await crearEntreno(ids.marcos, day(1), 'Full body A');
  await crearEntreno(ids.nadia, day(0), 'Adaptación · circuito');
  await crearEntreno(ids.sofia, day(0), 'Movilidad de hombro', { series: 'todas' });
  ok('Entrenos de la semana creados (Iván se queda sin ninguno, a propósito)');

  // ---- Historial largo de Carla (para la gráfica de progreso) ----
  const ejProgreso = exercises[0];
  const logsHist = [];
  for (let semana = 8; semana >= 1; semana--) {
    const fecha = day(-semana * 7);
    const { data: w } = await db
      .from('workouts')
      .insert({
        client_id: ids.carla,
        coach_id: coachId,
        date: fecha,
        title: `Fuerza · semana ${9 - semana}`,
        published: true
      })
      .select('id')
      .single();
    const { data: it } = await db
      .from('workout_items')
      .insert({
        workout_id: w.id,
        exercise_id: ejProgreso.id,
        order_index: 0,
        sets: 4,
        reps_prescribed: '6-8',
        rest_seconds: 120
      })
      .select('id')
      .single();
    // Progresión con un estancamiento en medio: una recta perfecta no se
    // parece a ningún entrenamiento real.
    const peso = 40 + (9 - semana) * 2.5 - (semana === 4 ? 2.5 : 0);
    for (let s = 1; s <= 4; s++) {
      logsHist.push({
        workout_item_id: it.id,
        client_id: ids.carla,
        exercise_id: ejProgreso.id,
        set_number: s,
        reps_done: s === 4 ? 6 : 8,
        weight_done: peso,
        completed_at: at(-semana * 7, 19),
        feedback: s === 4 ? 'hard' : 'just_right'
      });
    }
  }
  await db.from('set_logs').insert(logsHist);
  ok(`Carla: 8 semanas de historial en "${ejProgreso.name}" (40 → 60 kg)`);

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
    },
    // Pasadas: alimentan la pestaña Historial, que estaba siempre vacía.
    {
      client_id: ids.carla,
      starts_at: at(-7, 19),
      status: 'completed',
      modality: 'presencial',
      requested_by: coachId
    },
    {
      client_id: ids.carla,
      starts_at: at(-14, 19),
      status: 'cancelled',
      modality: 'presencial',
      notes: 'Se puso mala.',
      requested_by: ids.carla
    },
    {
      client_id: ids.ivan,
      starts_at: at(-3, 8),
      status: 'rejected',
      modality: 'online',
      notes: 'A esa hora estoy trabajando.',
      requested_by: ids.ivan
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
  ok(`${citas.length} citas creadas (4 activas + 3 de historial)`);

  // ---- Cobros ----
  // Sin histórico la pantalla de Cobros no dice nada: hace falta más de un mes
  // para que aparezca una evolución. Se generan meses hacia atrás y se meten a
  // propósito los casos raros que en la vida real siempre acaban saliendo.
  log('\nRegistrando cobros…');

  /** Resta meses a una fecha ISO manteniendo el día. */
  function restarMeses(iso, meses) {
    const d = new Date(iso + 'T00:00:00');
    d.setMonth(d.getMonth() - meses);
    return d.toISOString().slice(0, 10);
  }

  const METODOS = ['transferencia', 'bizum', 'efectivo', 'transferencia', 'bizum'];
  const cobros = [];

  for (const c of DEMO_CLIENTS) {
    const cuota = c.info?.fee_amount;
    if (!cuota) continue; // Sofía no tiene cuota: no genera cobros.

    // Rubén está invitado y no ha entrado todavía; nunca ha pagado.
    if (c.pending) continue;

    // Elena se dio de baja: cobros hasta marzo y se acabó.
    const meses = c.archived ? 5 : 7;
    const desde = c.archived ? 4 : 0;

    // `i` son los meses hacia atrás en que EMPIEZA el periodo cubierto. Con
    // i=0 el periodo arranca hoy, así que el mes en curso tiene cobros y la
    // primera cifra de la pantalla no sale a cero.
    for (let i = desde; i < desde + meses; i++) {
      // Nadia está marcada como cuota vencida, así que NO puede tener un cobro
      // que cubra el mes en curso: se contradiría con su propia ficha. Además
      // hace que "cobrado este mes" y "si cobras todas las cuotas" den cifras
      // distintas, que es lo que permite ver que son dos métricas.
      if (c.key === 'nadia' && i === 0) continue;

      const periodoDesde = restarMeses(day(0), i);
      const periodoHasta = restarMeses(day(0), i - 1);

      // Se paga unos días después del comienzo del periodo, como en la vida real.
      const diasTarde = (i * 3) % 7;
      const pagado = new Date(periodoDesde + 'T00:00:00');
      pagado.setDate(pagado.getDate() + diasTarde);

      // Un mes concreto de Nadia se paga a medias, para que el importe no
      // coincida con la cuota y se vea que la pantalla lo aguanta.
      const aMedias = c.key === 'nadia' && i === 2;

      cobros.push({
        client_id: ids[c.key],
        coach_id: coachId,
        paid_on: pagado.toISOString().slice(0, 10),
        amount: aMedias ? cuota / 2 : cuota,
        currency: 'EUR',
        method: METODOS[i % METODOS.length],
        covers_from: periodoDesde,
        covers_until: periodoHasta,
        notes: aMedias
          ? 'Pagó la mitad; el resto lo dejamos para el mes que viene'
          : diasTarde > 4
            ? 'Cobrado con unos días de retraso'
            : null
      });
    }
  }

  const { error: cobrosErr } = await db.from('client_payments').insert(cobros);
  if (cobrosErr) {
    // La tabla llega en la migración 0013. Si no está aplicada, avisamos con
    // claridad en vez de reventar el resto de la siembra.
    log(`  ! No se pudieron registrar los cobros: ${cobrosErr.message}`);
    log('    ¿Has aplicado la migración 0013_client_payments.sql?');
  } else {
    const total = cobros.reduce((s, c) => s + c.amount, 0);
    ok(`${cobros.length} cobros repartidos en varios meses · ${total.toFixed(2)} € en total`);
    ok('Incluye un pago a medias y notas con punto y coma, para probar el export');
  }

  // ---- Vídeos de técnica ----
  log('\nSubiendo vídeos de técnica…');
  const videoPath = join(__dirname, 'assets', 'demo-technique.mp4');
  if (!existsSync(videoPath)) {
    log('  ! No encuentro scripts/assets/demo-technique.mp4, me salto los vídeos.');
  } else {
    const bytes = readFileSync(videoPath);

    // Nadia: dos vídeos del mismo ejercicio, el primero corregido y el reciente
    // sin corregir -> comparación antes/después en la bandeja del inicio.
    // Carla: uno ya corregido -> estado "revisado", que no se veía nunca.
    const subidas = [
      {
        client: 'nadia',
        exercise: exercises[0],
        kind: 'first',
        comment: 'Buen inicio. Baja un poco más y controla la bajada.',
        dias: -21
      },
      { client: 'nadia', exercise: exercises[0], kind: 'latest', comment: null, dias: -2 },
      {
        client: 'carla',
        exercise: exercises[1],
        kind: 'first',
        comment: 'Técnica correcta. Sigue así y sube 2,5 kg la semana que viene.',
        dias: -30
      }
    ];

    for (const s of subidas) {
      const path = `${ids[s.client]}/${s.exercise.id}/${s.kind}.mp4`;
      const { error: upErr } = await db.storage
        .from(BUCKET)
        .upload(path, bytes, { contentType: 'video/mp4', upsert: true });
      if (upErr) {
        log(`  ! No se pudo subir el vídeo (${upErr.message}). ¿Existe el bucket "${BUCKET}"?`);
        break;
      }
      const { error: rowErr } = await db.from('technique_videos').insert({
        client_id: ids[s.client],
        coach_id: coachId,
        exercise_id: s.exercise.id,
        kind: s.kind,
        storage_path: path,
        duration_seconds: 3,
        size_bytes: bytes.length,
        coach_comment: s.comment,
        coach_comment_at: s.comment ? new Date().toISOString() : null,
        created_at: at(s.dias, 12)
      });
      if (rowErr) log(`  ! ${rowErr.message}`);
      else ok(`${s.client} · ${s.exercise.name} · ${s.kind}`);
    }
  }

  // ---- Resumen ----
  log('\n' + '─'.repeat(68));
  log('Listo. Casos que ahora puedes probar:');
  log('');
  log('  INICIO DEL COACH');
  log('   · Hoy            → Lucía a las 18:00, con su entreno');
  log('   · Te han pedido  → Marcos, con Confirmar / Rechazar');
  log('   · Técnica        → vídeo de Nadia, con el primero al lado para comparar');
  log('   · Atención       → Nadia (vencida), Lucía (vence pronto), Iván (sin entrenos)');
  log('   · Esperando      → la propuesta a Iván');
  log('');
  log('  CASOS LÍMITE');
  log('   · Sofía Iglesias-Montenegro de la Torre → nombre que no cabe en ningún sitio');
  log('   · Rubén Casal    → pestaña Clientes ▸ Pendientes (invitado sin aceptar)');
  log('   · Elena Prats    → archivada: NO debe aparecer en ninguna lista');
  log('   · Carla Otero    → Ficha ▸ Historial, y su gráfica de progreso a 8 semanas');
  log('   · Grupos         → "Talleres López" con 3 personas y programación masiva');
  log('   · Biblioteca     → "Sentadilla con barra (demo)" tiene vídeo de YouTube');
  log('');
  log('  COBROS');
  log('   · Varios meses de historial, para que la evolución mes a mes diga algo');
  log('   · Sofía sin cuota y Rubén sin haber pagado nunca: no suman');
  log('   · Elena dejó de pagar hace meses: sale en el histórico, no en la previsión');
  log('   · Un cobro de Nadia a medias, para ver un importe distinto de la cuota');
  log('   · Descarga los dos CSV y ábrelos en Excel: hay una nota con punto y');
  log('     coma dentro, que es justo lo que rompe estos ficheros mal hechos');
  log('');
  log('  ACCESO DE QUIEN NO PAGA (Cobros, abajo del todo)');
  log('   · Está apagado. Antes de activarlo, mira la lista de a quién afecta');
  log('   · Nadia (vencida hace 11 días) es la única que se pausaría');
  log('   · Iván (hace 3) está en gracia: ve el aviso amarillo, no se le corta');
  log('   · Sofía no tiene cuota y Ana/Beatriz/Diana son del grupo: nunca se pausan');
  log('   · Entra como Nadia con el bloqueo activado y prueba /today y /progress:');
  log('     los entrenos se cierran, su historial NO');
  log('');
  log('  MARCA');
  log('   · Mi marca → tu color es un azul marino que NO se lee sobre el fondo:');
  log('     mira los dos números y el color con el que lo hemos sustituido');
  log('   · Marca la casilla del degradado para ver el aviso de la inicial');
  log('   · Luego entra como cliente: verás tu nombre arriba, no "Treno"');
  log('');
  log('  COMO CLIENTE (contraseña: ' + DEMO_PASSWORD + ')');
  log(`   · ${emailFor('lucia', coachEmail)}`);
  log('       entreno de hoy a medias → prueba el botón "Continuar"');
  log('       y "Pedir cita", que ahora sí tiene huecos donde elegir');
  log(`   · ${emailFor('sofia', coachEmail)}`);
  log('       entreno de hoy completado al 100% → píldora "Completado"');
  log(`   · ${emailFor('carla', coachEmail)}`);
  log('       Progreso con una curva real de 8 semanas');
  log('');
  log(`Para borrarlo todo:  node scripts/seed-demo.mjs ${coachEmail} --limpiar`);
  log('─'.repeat(68) + '\n');
}

main().catch((e) => die(e?.message ?? e));
