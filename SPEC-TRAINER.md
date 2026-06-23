# Spec · `[NOMBRE_APP]`

**SaaS B2B para entrenadores personales**: gestionar clientes, armar rutinas
de entrenamiento con vídeos propios, agendar sesiones presenciales/online y
seguir el progreso del cliente.

> **Nombre provisional**: `[NOMBRE_APP]`. Candidatos en discusión: Liftify,
> Coachify, Tempo, Stride. Pendiente verificar disponibilidad de dominio.

---

## 0. Premisas inamovibles

Cuatro reglas que rigen todas las decisiones de diseño:

1. **SIMPLE**. Si una funcionalidad no es obvia en 30 segundos, se replantea o se quita.
2. **UX-FRIENDLY**. El cliente abre la app en el gym, con manos sudadas, prisas y el móvil con grasa. *Tap* y *swipe*, no formularios.
3. **CAMBIABLE**. Arquitectura modular. Una nueva funcionalidad no requiere refactor del core.
4. **PRODUCTIZABLE DESDE EL DÍA 1**. Multi-tenant nativo. Cualquier coach se registra solo y empieza a usar el producto. Los hermanos son nuestros **primeros usuarios reales**, no los únicos.

---

## 1. Resumen del producto

Una webapp (responsive + PWA opcional, app nativa en v2) con tres roles:

- **Coach**: gestiona su biblioteca de ejercicios, sus clientes, sus rutinas semanales y sus sesiones presenciales. Es el **cliente que paga** la suscripción.
- **Client**: el cliente final del coach. Recibe rutinas, las ejecuta, tracking de pesos reales, ve histórico, agenda sesiones con su coach.
- **Visitor**: cualquier persona que entra a la landing pública. Puede registrarse como coach (free tier) y empezar a usar el producto sin intervención humana.

**Eje central**: cada ejercicio que el coach crea tiene un **vídeo propio de 1 min** con técnica postural. Eso es el diferencial vs. Trainerize/TrueCoach.

---

## 2. Roadmap por versiones

### v1 — Producto base productizable (~182 h)

Listado completo de funcionalidades de v1:

| Bloque | Detalle |
| --- | --- |
| **Landing pública** | Home con propuesta de valor, sección de features, pricing (placeholder), login, registro. SEO básico (sitemap, OG, JSON-LD). |
| **Auth self-service** | Cualquiera se registra como coach con email + contraseña. Verificación por email. Recuperación de contraseña. |
| **Onboarding del coach** | Wizard de 4 pasos al primer login: perfil, primer ejercicio (con vídeo), primer cliente (invitar), demo de calendario. |
| **Roles** | `coach`, `client`. Multi-tenant: cada coach es un tenant aislado. |
| **Biblioteca de ejercicios** | CRUD. Nombre, descripción, vídeo (Cloudinary), thumbnail, grupo muscular, equipamiento, archivado. |
| **Lista de clientes** | Búsqueda, alta por invitación email, baja, datos básicos. |
| **Calendario semanal por cliente (coach)** | Vista 7 días. Tap en un día → constructor de entreno. |
| **Constructor de entreno (drag & drop)** | Biblioteca a un lado, día al otro. Arrastra. Edita series/reps/peso prescritos/descanso/notas. |
| **Duplicar entreno** | Botón "duplicar a otro día" + "duplicar semana completa". |
| **Vista cliente "Hoy"** | Pantalla principal del cliente. Tarjetas del día con vídeo, prescripción y estado. |
| **Tracking de series** | Cliente marca cada serie como hecha + anota peso real + reps reales + feedback opcional. |
| **Histórico por ejercicio (cliente)** | Lista cronológica + gráfico de evolución de peso. |
| **Sistema de citas con Google Calendar** | Reservas: cliente solicita hueco, coach acepta/rechaza, evento creado en Google Calendar del coach, detección de conflictos. |
| **Modalidad de la cita** | Presencial / online (link de Meet/Zoom) / remoto libre. |
| **Vínculo cita ↔ entreno** | El coach puede asociar un workout a una cita. Coach y cliente lo ven al abrir la cita. |
| **Vista calendario (cliente)** | El cliente ve sus próximas citas y puede solicitar nueva. |
| **Notas del coach al cliente por día** | Texto corto que el cliente ve sobre el entreno. |
| **Responsive móvil-first** | Funciona en iPhone, Android, escritorio. |
| **Páginas legales** | Términos, privacidad, cookies. Plantillas estándar. |

**Lo que NO hace v1 explícitamente:**

- Cronómetro de descanso (cada cliente descansa lo suyo).
- Chat coach↔cliente (usan WhatsApp).
- Plan de nutrición.
- Pagos del cliente final al coach (eso es v3 vía Stripe Connect).
- App nativa (es v2 con Capacitor).
- Multi-idioma (v2).
- Plantillas reutilizables (v1.5).
- PWA + push notifications (v1.5).

### v1.5 — "lo que se nota a las 4 semanas" (~49 h)

| Feature | Horas | Por qué |
| --- | --- | --- |
| Plantillas de entrenos reutilizables | 12 | "Full Body 3 días" creado una vez, aplicado a N clientes. |
| Notas privadas del coach sobre el cliente | 3 | "Lumbago, evitar peso muerto." No las ve el cliente. |
| PWA instalable + push notifications | 10 | "Tu coach publicó el entreno de mañana." |
| Pricing tiers + Stripe (cobro mensual a coaches) | 16 | Free + Pro. Stripe checkout, webhooks, planes en Supabase. |
| Etiquetas a clientes ("VIP", "online", "intensivo") | 3 | Filtrar lista con 30+ clientes. |
| Vista mensual del calendario | 5 | Complementa la semanal. |
| **Total v1.5** | **49 h** | |

### v2 — "lo que escala el negocio" (~61 h)

| Feature | Horas | Por qué |
| --- | --- | --- |
| Dashboard analítico del coach (clientes activos, frecuencia de uso, ejercicios más populares) | 12 | El coach ve su negocio. |
| App nativa iOS/Android vía Capacitor | 25 | Sin App Store no compites con TrueCoach. |
| Tracking enriquecido (peso + medidas + fotos progreso + feedback emocional) | 14 | Diferencia del Excel. |
| Multi-idioma del producto (ES + EN) | 10 | Abre mercado internacional. |
| **Total v2** | **61 h** | |

### v3 / backlog (sin estimar)

- Apple Health / Google Fit / Health Connect.
- Plan de nutrición (módulo entero).
- Plataforma de cobros directos coach ↔ cliente final (Stripe Connect).
- Marketplace de plantillas (coaches venden sus rutinas a otros coaches).
- White-label (coach con dominio propio).
- Multi-coach por organización ("Team plan" para gimnasios).
- Chat ligero coach ↔ cliente.
- IA: "genera una rutina full-body de 4 días para principiante."
- Cronómetro inteligente de descanso (descartado v1 por feedback explícito).
- Mapa corporal de dolor (interesante pero no prioritario).
- Sistema de referidos.
- API pública + webhooks.

---

## 3. Stack técnico

| Capa | Elección | Coste |
| --- | --- | --- |
| Backend (DB + Auth + Storage + RLS) | **Supabase** | 0 € free tier hasta 500 MB DB / 1 GB storage. Pro 25 $/mes. |
| Vídeos | **Cloudinary** | 0 € free 25 GB y 25K transformaciones/mes. |
| Frontend | **SvelteKit** | 0 € open source. |
| Hosting | **Vercel** (recomendado) o Netlify | 0 € free tier. |
| Email transaccional | **Resend** (3K/mes free) o Supabase | 0 € inicialmente. |
| Pagos | **Stripe** (a partir de v1.5) | 1.4 % + 0.25 € por cobro EU. |
| OAuth Google Calendar | **Google Identity Services** | Gratis. |
| Dominio | Cloudflare Registrar o Namecheap | ~10-14 €/año. |
| App nativa (v2) | **Capacitor** + cuenta dev Apple ($99/año) + Google Play ($25 una vez) | ~95 €/año. |

**Coste mensual operativo del producto en v1** (sin coaches pagando): ~1 €/mes (dominio).

**Cuando empiece a generar suscripciones (v1.5+)**: Stripe se queda con ~3 % de cada cobro. Supabase Pro a partir de ~20 coaches activos.

### Justificaciones rápidas

- **Supabase vs Firebase**: Postgres relacional encaja con el modelo (coach → cliente → workout → exercises). RLS resuelve el aislamiento multi-tenant a nivel DB.
- **SvelteKit vs Nuxt/Astro**: la app es fuertemente interactiva (drag & drop, formularios, calendarios). SvelteKit ofrece la mejor relación DX/rendimiento para apps reactivas con SSR/SEO sólido. Para la landing pública, mismo framework: páginas estáticas pre-renderizadas.
- **Cloudinary vs YouTube/Vimeo**: control total, sin marca, sin tracking de terceros, transcoding automático a varias resoluciones, CDN global.
- **Capacitor vs React Native**: reutiliza la codebase web 90 %. Sin reescribir nada.

---

## 4. Modelo de datos (Postgres / Supabase)

Todas las tablas con `id uuid PRIMARY KEY` + `created_at timestamp` + `updated_at timestamp` por convención.

```
profiles                            ← perfil de cada usuario (coach o client)
├── id              uuid (= auth.users.id)
├── role            text  ('coach' | 'client')
├── full_name       text
├── coach_id        uuid? (FK profiles.id, solo si role='client')
├── avatar_url      text?
├── invited_at      timestamp?
├── google_calendar_token  text?   (OAuth token cifrado, solo coaches)
├── google_calendar_email  text?
├── timezone        text  default 'Europe/Madrid'
├── locale          text  default 'es'   (v2+)
└── archived        boolean default false


exercises                           ← biblioteca del coach
├── id            uuid
├── coach_id      uuid  (FK profiles.id)
├── name          text
├── description   text?
├── video_url     text  (Cloudinary)
├── video_poster  text?
├── duration_seconds int?
├── muscle_group  text  ('chest','back','legs','shoulders','arms','core','cardio','full_body')
├── equipment     text? ('barbell','dumbbell','machine','bodyweight','kettlebell','band')
└── archived      boolean default false


workout_templates                   ← plantillas reutilizables (v1.5)
├── id            uuid
├── coach_id      uuid
├── name          text  ('Full Body 3 días')
└── notes         text?

workout_template_items              ← ejercicios dentro de una plantilla
├── id                uuid
├── template_id       uuid (FK workout_templates.id)
├── exercise_id       uuid (FK exercises.id)
├── day_offset        int   (0=lunes, 1=martes, etc. — para plantillas multi-día)
├── order_index       int
├── sets              int
├── reps_prescribed   text
├── weight_prescribed text?
├── rest_seconds      int?
└── notes             text?


workouts                            ← un día de entreno de un cliente
├── id            uuid
├── client_id     uuid  (FK profiles.id)
├── coach_id      uuid  (FK profiles.id, redundante para RLS)
├── date          date
├── title         text?
├── notes         text?
├── template_id   uuid? (FK workout_templates.id, si vino de plantilla — para tracking de origen)
├── session_id    uuid? (FK sessions.id, si está vinculado a una cita)
└── published     boolean default true


workout_items                       ← ejercicio dentro de un workout
├── id                uuid
├── workout_id        uuid  (FK workouts.id ON DELETE CASCADE)
├── exercise_id       uuid  (FK exercises.id)
├── order_index       int
├── sets              int
├── reps_prescribed   text   ('8-10', '12', '5x5'...)
├── weight_prescribed text?  ('60kg', '70-75%', 'libre'...)
├── rest_seconds      int?
└── notes             text?


set_logs                            ← lo que el cliente registró DE VERDAD
├── id              uuid
├── workout_item_id uuid  (FK workout_items.id ON DELETE CASCADE)
├── client_id       uuid  (FK profiles.id, redundante para histórico)
├── exercise_id     uuid  (FK exercises.id, redundante para histórico cross-workout)
├── set_number      int   (1, 2, 3...)
├── reps_done       int?
├── weight_done     numeric(5,2)?
├── completed_at    timestamp
└── feedback        text? ('fácil','justo','duro')


sessions                            ← cita / sesión presencial (v1)
├── id                uuid
├── coach_id          uuid (FK profiles.id)
├── client_id         uuid (FK profiles.id)
├── workout_id        uuid? (FK workouts.id — entreno asociado, opcional)
├── starts_at         timestamptz
├── ends_at           timestamptz
├── status            text  ('requested'|'confirmed'|'rejected'|'cancelled'|'completed')
├── modality          text  ('presencial'|'online'|'remoto')
├── location          text?  (gym, dirección, link de Zoom...)
├── notes             text?
├── google_event_id   text?
├── requested_by      uuid (FK profiles.id — normalmente client, a veces coach)
└── decided_at        timestamp?


availability_slots                  ← huecos publicados por el coach (v1)
├── id                uuid
├── coach_id          uuid (FK profiles.id)
├── kind              text  ('recurring'|'specific')
├── day_of_week       int?  (0-6 si kind=recurring)
├── specific_date     date? (si kind=specific)
├── start_time        time
├── end_time          time
├── duration_minutes  int   (cuánto dura cada slot dentro de la franja)
└── modalities        text[] (array: ['presencial','online'])


client_tags                         ← etiquetas a clientes (v1.5)
├── id          uuid
├── coach_id    uuid (FK profiles.id)
├── name        text  ('VIP','online','intensivo'...)
└── color       text  (hex)

client_tag_assignments              ← M:N profiles ↔ client_tags
├── id           uuid
├── client_id    uuid (FK profiles.id)
├── tag_id       uuid (FK client_tags.id)
└── (PK compuesta: client_id, tag_id)


tracking_entries                    ← tracking enriquecido del cliente (v2)
├── id           uuid
├── client_id    uuid (FK profiles.id)
├── kind         text  ('weight'|'measurement'|'photo'|'mood'|'sleep')
├── date         date
├── value_num    numeric?  (peso en kg, medida en cm, sueño 1-5)
├── value_text   text?      (notas o emoji)
├── label        text?      (para measurement: 'waist','arm','thigh','chest'...)
└── photo_url    text?      (Cloudinary, si kind='photo')


subscriptions                       ← gestión de planes (v1.5+)
├── id                       uuid
├── coach_id                 uuid (FK profiles.id)
├── plan                     text  ('free'|'pro'|'team')
├── status                   text  ('active'|'past_due'|'cancelled'|'trial')
├── stripe_customer_id       text?
├── stripe_subscription_id   text?
├── current_period_end       timestamp?
└── trial_ends_at            timestamp?
```

### Decisiones clave del modelo

- **`reps_prescribed`, `weight_prescribed`, `unidad` son texto libre**, no números: permiten "8-10 reps", "75% 1RM", "al fallo".
- **`set_logs` desnormaliza `client_id` y `exercise_id`** para histórico eficiente sin JOINs caros.
- **`workouts.session_id`** vincula un entreno con una cita (puede tener entreno sin cita, cita sin entreno, o ambas asociadas).
- **`workouts.template_id`** trackea de qué plantilla salió un entreno (útil para analítica v2).
- **`exercises.archived`** en vez de DELETE: no rompe workouts antiguos que lo referencian.
- **`profiles.timezone`**: crítico para que las citas se muestren en hora local del usuario.
- **`subscriptions` separado de `profiles`**: futureproof para Team plan (varios coaches bajo una org).

---

## 5. Seguridad — Row Level Security en Supabase

RLS activa en todas las tablas. Resumen de políticas:

```
profiles:
  SELECT: id = auth.uid()
          OR coach_id = auth.uid()   (coach ve a sus clientes)
          OR (id = (SELECT coach_id FROM profiles WHERE id = auth.uid()))
                                       (cliente puede ver perfil de su coach)
  UPDATE: id = auth.uid()

exercises:
  SELECT: coach_id = auth.uid()
          OR exists relación coach-cliente vía workouts
  INSERT/UPDATE/DELETE: coach_id = auth.uid()

workouts, workout_items, workout_templates, workout_template_items:
  SELECT: cliente o coach implicado
  INSERT/UPDATE/DELETE: solo coach

set_logs, tracking_entries:
  SELECT: cliente OR coach del cliente
  INSERT/UPDATE/DELETE: solo el client_id correspondiente

sessions:
  SELECT: cliente o coach implicado
  INSERT (status='requested'): cliente o coach
  UPDATE (status→'confirmed'|'rejected'): solo coach
  UPDATE (status→'cancelled'): cualquiera de los dos
  DELETE: solo coach

availability_slots:
  SELECT: cualquiera (cliente necesita verlos para reservar)
  INSERT/UPDATE/DELETE: solo coach propietario

subscriptions:
  SELECT: coach_id = auth.uid()
  INSERT/UPDATE: solo backend (service role), nunca cliente
```

Resultado: aunque el frontend mande la query equivocada, la DB rechaza acceder a lo que no toca. **Multi-tenancy seguro por diseño.**

---

## 6. Pantallas principales

### 6.1 Landing pública (`/`)

```
┌────────────────────────────────────┐
│ [LOGO]              Login   Probar │
├────────────────────────────────────┤
│                                    │
│   Entrena a tus clientes con tus   │
│   propios vídeos. Sin Excel,       │
│   sin WhatsApp, sin caos.          │
│                                    │
│   [  Empieza gratis  ]             │
│                                    │
│   ⌚ Sin tarjeta · Tu primer       │
│   cliente en 5 minutos             │
│                                    │
│  [ ─── screenshot del producto ─── ]│
│                                    │
├────────────────────────────────────┤
│  Features · Pricing · Quiénes somos│
└────────────────────────────────────┘
```

Bloques: hero, 3 features clave (biblioteca, calendario, tracking), pricing (con tier free), testimonios (mock v1, reales en v2), CTA final, footer.

### 6.2 Onboarding del coach (4 pasos)

Modal full-screen tras primer login.

```
Paso 1/4 · Tu perfil
  ┌──────────────────────────────┐
  │ Nombre completo: [        ]  │
  │ Avatar (opc):    [ subir ]   │
  │ Zona horaria:    [ Madrid ▼] │
  └──────────────────────────────┘
            [Siguiente]

Paso 2/4 · Tu primer ejercicio
  "Sube tu primer ejercicio con un vídeo
   de 1 min explicando la técnica"
  [Crear ejercicio] o [Saltar]

Paso 3/4 · Tu primer cliente
  "Invita a un cliente por email"
  Email: [      ]   [Enviar invitación]
  o [Saltar]

Paso 4/4 · ¡Listo!
  "Ya puedes empezar. Mira tu dashboard."
  [Ir al dashboard]
```

### 6.3 Dashboard coach

```
┌────────────────────────────────────┐
│ [LOGO]  Hola, Marcos   [⚙][salir]  │
├────────────────────────────────────┤
│  📚 Mis ejercicios       [42] >    │
│  👥 Mis clientes         [12] >    │
│  📅 Mi calendario        >         │
│  ⭐ Plantillas (v1.5)    [3] >     │
│                                    │
│  ───── Esta semana ─────           │
│  • 4 entrenos publicados           │
│  • 2 sesiones confirmadas          │
│  • 1 solicitud de cita pendiente ⚠ │
│                                    │
│  [ + Crear entreno ]               │
└────────────────────────────────────┘
```

### 6.4 Biblioteca de ejercicios

Grid de tarjetas con thumbnail del vídeo + nombre + grupo muscular.

```
┌────────────────────────────────────┐
│ ← Volver           Mis ejercicios  │
├────────────────────────────────────┤
│ [🔍 buscar]  [Grupo ▼] [+ Nuevo]   │
│                                    │
│ ┌────────┐ ┌────────┐ ┌────────┐  │
│ │[▶ 1:00]│ │[▶ 1:00]│ │[▶ 1:00]│  │
│ │ Press  │ │ Sentad-│ │ Remo en│  │
│ │ banca  │ │ illa   │ │ punta  │  │
│ │ Pecho  │ │ Pierna │ │ Espalda│  │
│ └────────┘ └────────┘ └────────┘  │
└────────────────────────────────────┘
```

### 6.5 Lista de clientes

```
┌────────────────────────────────────┐
│ ← Volver           Mis clientes    │
├────────────────────────────────────┤
│ [🔍 buscar]  [Etiqueta ▼] [+ Inv.] │
│                                    │
│ ▸ Pepe García           [VIP]      │
│   última sesión: ayer              │
│ ▸ Ana Martínez          [online]   │
│   última sesión: hace 3 días       │
│ ▸ Luis Fernández                   │
│   sin actividad reciente ⚠         │
└────────────────────────────────────┘
```

### 6.6 Detalle de cliente · calendario semanal

```
┌────────────────────────────────────┐
│ ← Pepe García   [Notas privadas]✏ │
├────────────────────────────────────┤
│ ◀ Sem. 24-30 jun ▶ [duplicar...]   │
│ [vista semanal | mensual]          │
│                                    │
│ ┌─Lun──┐┌─Mar──┐┌─Mié──┐┌─Jue──┐  │
│ │PIERNA││Cardio││ TREN ││Descan│  │
│ │ 6 ej.││ 30min││ SUP. ││  --  │  │
│ │ 📅10h││      ││ 5 ej.││      │  │
│ │  ✏   ││  ✏   ││  ✏   ││  +   │  │
│ └──────┘└──────┘└──────┘└──────┘  │
│ ┌─Vie──┐┌─Sáb──┐┌─Dom──┐          │
│ │ FULL ││Descan││Descan│          │
│ │  +   ││  --  ││  --  │          │
│ └──────┘└──────┘└──────┘          │
│                                    │
│ Histórico del cliente >            │
└────────────────────────────────────┘
```

El icono 📅 indica que hay cita asociada a ese día.

### 6.7 Constructor de entreno (drag & drop)

```
┌────────────────────────────────────┐
│ ← Pepe · Lunes 24 jun · Pierna     │
├──────────────┬─────────────────────┤
│ Biblioteca   │ Ejercicios del día  │
│ [🔍 buscar]  │ ┌────────────────┐  │
│              │ │1. Sentadilla   │  │
│ [Pierna]     │ │  4×8 · 80kg    │  │
│ ┌──────┐     │ │  [▶][✏][×]    │  │
│ │Sentad│⇆    │ └────────────────┘  │
│ │illa  │     │ ┌────────────────┐  │
│ └──────┘     │ │2. Press pierna │  │
│ ┌──────┐     │ │  4×10 · 100kg  │  │
│ │Press │⇆    │ └────────────────┘  │
│ │pierna│     │                     │
│ └──────┘     │ + Arrastra desde    │
│ ┌──────┐     │   la biblioteca     │
│ │Zanca │⇆    │                     │
│ └──────┘     │ [Aplicar plantilla] │
│              │ [Guardar y publicar]│
└──────────────┴─────────────────────┘
```

En móvil: tap en `+ Añadir ejercicio` → modal con la biblioteca filtrable → tap añade al final.

### 6.8 Vista cliente "Hoy"

Pantalla principal del cliente al abrir la app.

```
┌────────────────────────────────────┐
│ Hola, Pepe        24 jun · LUN     │
├────────────────────────────────────┤
│ PIERNA · 6 ejercicios              │
│ 📅 19:00 Sesión con Marcos         │
│ Nota: "Calienta bien rodillas hoy" │
│                                    │
│ ┌──────────────────────────────┐   │
│ │[▶ Sentadilla con barra]      │   │
│ │ 4 series · 8 reps · 80 kg    │   │
│ │ ○ ○ ○ ○  (0/4)               │   │
│ └──────────────────────────────┘   │
│ ┌──────────────────────────────┐   │
│ │[▶ Press pierna]              │   │
│ │ 4 series · 10 reps · 100 kg  │   │
│ │ ○ ○ ○ ○  (0/4)               │   │
│ └──────────────────────────────┘   │
│ ...                                │
│                                    │
│ [ ◀ Ayer ]   [ Mañana ▶ ]          │
│                                    │
│ 📅 Mi calendario · 📈 Mi progreso  │
└────────────────────────────────────┘
```

### 6.9 Detalle ejercicio en sesión (cliente)

```
┌────────────────────────────────────┐
│ ← Volver                           │
├────────────────────────────────────┤
│ ┌──────────────────────────────┐   │
│ │   [Vídeo 1 min · ▶]          │   │
│ └──────────────────────────────┘   │
│                                    │
│ Sentadilla con barra               │
│ Prescrito: 4×8 · 80 kg · 2' desc.  │
│                                    │
│ Serie 1   Peso [80] kg  Reps [8]   │
│ Serie 2   Peso [80] kg  Reps [8]   │
│ Serie 3   Peso [80] kg  Reps [7]   │
│ Serie 4   Peso [   ]    Reps [  ]  │
│                                    │
│ Cómo te ha salido (opc):           │
│ ○ Fácil  ● Justo  ○ Duro           │
│                                    │
│ [    Guardar serie    ]            │
│                                    │
│ 📈 Ver mi histórico >              │
└────────────────────────────────────┘
```

### 6.10 Calendario coach

```
┌────────────────────────────────────┐
│ ← Dashboard       Mi calendario    │
├────────────────────────────────────┤
│ [Semana | Mes (v1.5)]  [+ Hueco]   │
│                                    │
│ ◀ Sem. 24-30 jun ▶                 │
│                                    │
│      Lun  Mar  Mié  Jue  Vie       │
│  9h  ░   ░         ░               │
│ 10h  PEPE  ANA           LUIS      │
│ 11h        ░    ░                  │
│ 12h                                │
│ ...                                │
│                                    │
│ ⚠ Tienes 1 solicitud pendiente >   │
└────────────────────────────────────┘
```

░ = hueco libre publicado.

### 6.11 Bandeja de solicitudes (coach)

```
┌────────────────────────────────────┐
│ ← Calendario   Solicitudes pend.   │
├────────────────────────────────────┤
│                                    │
│ Pepe García pide cita              │
│ Martes 25 jun, 10:00 - 11:00       │
│ Modalidad: Presencial              │
│ "Quiero trabajar core hoy"         │
│                                    │
│ ⚠ Tienes 'comida familiar' en      │
│   Google Calendar a esa hora       │
│                                    │
│ [ ✓ Aceptar ]   [ ✗ Rechazar ]    │
│                                    │
│ ──────────────────────────         │
│                                    │
│ Ana Martínez pide cita...          │
└────────────────────────────────────┘
```

### 6.12 Calendario cliente

```
┌────────────────────────────────────┐
│ ← Hoy            Mi calendario     │
├────────────────────────────────────┤
│ Próximas sesiones                  │
│                                    │
│ • Martes 25 jun · 10:00            │
│   con Marcos · Presencial          │
│   📋 Entreno: Tren superior        │
│                                    │
│ • Jueves 27 jun · 19:00            │
│   con Marcos · Online              │
│                                    │
│ [ + Pedir cita ]                   │
│                                    │
│ Solicitudes pendientes:            │
│ • Lunes 1 jul · 10:00              │
│   Estado: esperando confirmación   │
└────────────────────────────────────┘
```

### 6.13 Histórico por ejercicio (cliente)

```
┌────────────────────────────────────┐
│ ← Sentadilla con barra             │
├────────────────────────────────────┤
│ Mi mejor peso: 85 kg (15 jun)      │
│ Reps medias: 8.3                   │
│                                    │
│ ┌──────────────────────────────┐   │
│ │ Peso a lo largo del tiempo   │   │
│ │ 85│       ●                  │   │
│ │ 80│   ●       ● ● ●          │   │
│ │ 75│ ●                        │   │
│ │   └──────────────────────    │   │
│ │   1mar 15mar 1abr 15abr      │   │
│ └──────────────────────────────┘   │
│                                    │
│ Últimas sesiones:                  │
│ • 17 jun · 4×8 · 80 kg             │
│ • 15 jun · 4×8 · 85 kg ⭐          │
│ ...                                │
└────────────────────────────────────┘
```

### 6.14 Pantallas v1.5 / v2 (referencia)

- **Plantillas (v1.5)**: lista de plantillas del coach + editor visual con drag&drop similar al constructor.
- **Vista mensual del calendario (v1.5)**: grid 5x7 con puntitos por día (color según estado: confirmada, pendiente, completada).
- **Tracking enriquecido (v2)**: pantalla "Mi progreso" para el cliente con secciones: peso, medidas, fotos (comparador antes/después), feedback emocional.
- **Dashboard analítico (v2)**: para el coach. Gráficos de clientes activos, frecuencia de uso, ejercicios más populares.
- **Cambio de idioma (v2)**: selector ES/EN en header. localStorage para preferencia.

---

## 7. Sistema de diseño · paleta Deep Blue + Electric

```css
:root {
  /* Colores — Paleta A */
  --bg:           #0a1628;   /* azul muy oscuro, casi negro */
  --surface:      #122340;   /* tarjetas */
  --surface-2:    #1a2e4a;   /* tarjetas hover / contraste */
  --primary:      #3b82f6;   /* azul eléctrico (acciones) */
  --primary-h:    #2563eb;   /* hover */
  --accent:       #38bdf8;   /* cyan para destacar / éxito */
  --text:         #f1f5f9;
  --text-mute:    #94a3b8;
  --danger:       #ef4444;
  --warning:      #f59e0b;
  --success:      #22c55e;

  /* Tipografía */
  --font:        'Inter', system-ui, -apple-system, sans-serif;
  --font-mono:   'JetBrains Mono', monospace;

  /* Espaciado base (4px) */
  --s-1: 4px;   --s-2: 8px;   --s-3: 12px;   --s-4: 16px;
  --s-5: 24px;  --s-6: 32px;  --s-8: 48px;   --s-10: 64px;

  /* Radius */
  --r-sm: 6px;  --r-md: 12px; --r-lg: 20px;  --r-full: 999px;

  /* Sombras */
  --shadow-sm: 0 1px 2px rgba(0,0,0,.3);
  --shadow-md: 0 8px 24px -8px rgba(0,0,0,.4);
  --shadow-lg: 0 24px 48px -16px rgba(0,0,0,.5);
}
```

**Razones de paleta oscura**:

1. Cliente la usa con luz baja en vestuarios o por la mañana temprano.
2. Vídeos negros con fondo oscuro: menos cambio de luminosidad → menos fatiga visual.
3. Sensación moderna asociada a apps de fitness premium (Whoop, Apple Fitness).
4. Si más adelante quieren modo claro: se añade con `prefers-color-scheme`.

**Tipografía**: una sola, **Inter**. Limpia, legible en móvil, soporta acentos y caracteres especiales. Si más tarde queremos un toque editorial para titulares de marketing, podemos sumar una serif (Fraunces o similar) solo en la landing.

---

## 8. Pricing tiers (propuesta v1.5+)

Esto es propuesta de modelo de negocio, no técnica. Aterrizar contigo cuando lleguemos.

| Plan | Precio | Límites | Quién |
| --- | --- | --- | --- |
| **Free** | 0 € | 3 clientes activos, sin Google Calendar, sin plantillas | Coach probando el producto |
| **Pro** | 19 €/mes | Clientes ilimitados, Google Calendar, plantillas, etiquetas, push | Coach pro individual (tus amigos) |
| **Team** (v2) | 49 €/mes | Pro + analytics avanzado + branding + multi-coach | Gimnasios, estudios |

**Trial**: 14 días Pro gratis al registrarse, sin tarjeta.

**Comparativa**: Trainerize cuesta $30-100/mes. TrueCoach $20-50/mes. Estás en línea.

**Punto de equilibrio**: con ~10 coaches Pro (190 €/mes), Supabase Pro (25 €/mes) y Cloudinary Plus (~50 €/mes si crece) salen las cuentas para cubrir infraestructura. A partir de 20 coaches Pro, ya hay margen para tu tiempo.

---

## 9. Servicios externos · cuentas que crear

Por orden, antes de empezar:

1. **GitHub** → cuenta nueva. Repo privado `[nombre-app]`.
2. **Supabase** → cuenta. Proyecto `[nombre-app]-prod`.
3. **Cloudinary** → cuenta. Cloud `[nombre-app]`.
4. **Vercel** → cuenta. Conectar al repo de GitHub.
5. **Cloudflare Registrar** → comprar dominio cuando esté decidido.
6. **Resend** → cuenta. API key para emails transaccionales.
7. **Stripe** (v1.5) → cuenta. Configurar productos y precios.
8. **Google Cloud Console** → proyecto. Habilitar Calendar API + crear OAuth credentials.
9. **Apple Developer** (v2) → cuenta. $99/año.
10. **Google Play Developer** (v2) → cuenta. $25 una vez.

**Decisión a tomar contigo**: las creas tú con tu email y luego transfieres, o las crea cada hermano con su email desde el día 1. Para SaaS productizable, lo lógico es que las cuentas vivan a tu nombre (eres dueño del producto, no de "su instancia"). La diferencia con Can Ficus es importante.

---

## 10. Flujos de usuario clave

### 10.1 Coach se registra (self-service)

1. Visitor abre la landing pública.
2. Click en `Empieza gratis`.
3. Formulario: email + contraseña + nombre.
4. Email de verificación → click en el link.
5. Onboarding 4 pasos (sección 6.2).
6. Dashboard. Free plan activo.

### 10.2 Coach invita a un cliente

1. Dashboard → Clientes → `+ Invitar`.
2. Email del cliente + nombre.
3. Supabase envía email con link mágico.
4. Cliente acepta, define contraseña, queda asociado al coach.

### 10.3 Coach arma entreno de la semana

1. Cliente → calendario semanal.
2. Tap en `Lunes`. Constructor.
3. Drag&drop desde biblioteca. Editar parámetros.
4. (Opcional v1.5) "Aplicar plantilla" → selecciona una y pre-rellena los 7 días.
5. `Guardar y publicar`.

### 10.4 Cliente pide cita y coach acepta

1. Cliente → calendario → `+ Pedir cita`.
2. Ve huecos disponibles del coach. Selecciona uno.
3. Indica modalidad + nota corta.
4. Solicitud en estado `requested`. Coach recibe email + badge.
5. Coach abre bandeja de solicitudes. Ve si tiene conflicto con Google Calendar.
6. `Aceptar` → cita pasa a `confirmed`, evento creado en Google Calendar del coach. Cliente recibe email.
7. (Opcional) Coach asocia un workout a la cita.

### 10.5 Cliente entrena en el gym

1. Abre la app. Pantalla "Hoy".
2. Tap en tarjeta → vídeo de técnica + parámetros prescritos.
3. Entrena. Vuelve a la app. Anota peso real + reps reales.
4. `Guardar serie`. Tarjeta muestra `● ○ ○ ○ (1/4)`.
5. Al completar todas: tarjeta marcada con ✓.

### 10.6 Coach actualiza pricing (v1.5)

1. Ajustes → Plan.
2. Click `Actualizar a Pro`.
3. Stripe Checkout. Tarjeta.
4. Webhook actualiza `subscriptions.plan = 'pro'`.
5. Coach desbloquea features Pro.

---

## 11. Estructura del proyecto SvelteKit

```
src/
├── routes/
│   ├── +layout.svelte                ← layout base + auth check
│   ├── +page.svelte                   ← landing pública si no logueado, redirige si sí
│   ├── (public)/
│   │   ├── features/+page.svelte
│   │   ├── pricing/+page.svelte
│   │   ├── legal/{terminos,privacidad,cookies}/+page.svelte
│   │   ├── login/+page.svelte
│   │   └── register/+page.svelte
│   ├── (coach)/
│   │   ├── +layout.svelte             ← header coach + nav
│   │   ├── dashboard/+page.svelte
│   │   ├── exercises/+page.svelte
│   │   ├── exercises/[id]/+page.svelte
│   │   ├── templates/+page.svelte    (v1.5)
│   │   ├── clients/+page.svelte
│   │   ├── clients/[id]/+page.svelte
│   │   ├── clients/[id]/workouts/[date]/+page.svelte
│   │   ├── calendar/+page.svelte
│   │   ├── calendar/requests/+page.svelte
│   │   ├── settings/+page.svelte
│   │   └── settings/billing/+page.svelte  (v1.5)
│   ├── (client)/
│   │   ├── +layout.svelte
│   │   ├── today/+page.svelte
│   │   ├── workout/[id]/+page.svelte
│   │   ├── history/[exerciseId]/+page.svelte
│   │   ├── calendar/+page.svelte
│   │   └── progress/+page.svelte   (v2 tracking)
│   ├── (admin)/                       ← v3, panel de admins del SaaS
│   └── api/
│       ├── stripe/webhook/+server.ts  (v1.5)
│       └── google/calendar/+server.ts (v1)
├── lib/
│   ├── supabase.ts
│   ├── stripe.ts                       (v1.5)
│   ├── google-calendar.ts
│   ├── cloudinary.ts
│   ├── auth.ts
│   ├── components/
│   │   ├── ExerciseCard.svelte
│   │   ├── WorkoutBuilder.svelte
│   │   ├── VideoPlayer.svelte
│   │   ├── SetLogger.svelte
│   │   ├── CalendarWeekView.svelte
│   │   ├── CalendarMonthView.svelte
│   │   ├── DragDropList.svelte
│   │   └── PricingTable.svelte
│   └── stores/
│       ├── user.ts
│       ├── tenant.ts                    (coach actual)
│       └── workout-builder.ts
├── app.html
├── app.css                              ← design tokens
└── service-worker.ts                   (v1.5, PWA)
```

---

## 12. Plan de iteración

| Versión | Alcance | Horas | Precio @ 35 €/h | Precio @ 50 €/h | Cuándo |
| --- | --- | --- | --- | --- | --- |
| **v1** | Producto base productizable + citas Google Calendar | 182 h | 6.370 € | 9.100 € | Mes 1-3 |
| **v1.5** | Plantillas + notas + PWA + Stripe + etiquetas + mes mensual | 49 h | 1.715 € | 2.450 € | Mes 4 |
| **v2** | Analytics + Capacitor + tracking enriquecido + multi-idioma | 61 h | 2.135 € | 3.050 € | Mes 6-8 |
| **TOTAL hasta v2** | | **~292 h** | **~10.220 €** | **~14.600 €** | |

Si trabajas a tiempo parcial (~15 h/semana), v1 son ~12 semanas. v1+v1.5 son ~16 semanas. Hasta v2 son ~20 semanas (5 meses).

Recomendación de cadencia de releases:

1. **v1 → Beta privada**: solo los hermanos durante 4-6 semanas. Recoger feedback real.
2. **v1.1**: ajustes que pidan los hermanos. Reservar 10-15 h sin facturar.
3. **v1 → Beta abierta**: landing pública con waitlist. Otros coaches probando.
4. **v1.5**: con Stripe ya integrado, empezar a cobrar a los primeros que aporten valor.
5. **v2**: con ingresos validados, decisión informada de invertir en app nativa.

---

## 13. Riesgos y mitigaciones

| Riesgo | Mitigación |
| --- | --- |
| Subida de vídeos lenta / coach se aburre | Cloudinary autoupload + transcoding en background. Permitir ejercicio sin vídeo (flag "pendiente"). |
| Cliente no entiende cómo registrar series | Onboarding al primer login del cliente: 3 tooltips guiados. |
| Pérdida de datos por error del coach | Backups diarios automáticos Supabase + papelera 30 días. |
| Vídeos pesados → consumo móvil cliente | Cloudinary transcoding a 480p/720p/1080p, decisión por ancho de banda. Lazy load. |
| Google Calendar OAuth complicado | Aislado en `/api/google/calendar/`. Tests con cuenta dev. Documentar bien. |
| Stripe webhooks fallan / dobles cobros | Idempotency keys. Logs de webhooks en tabla auditoría. |
| Conflictos de zona horaria en citas | Todo en UTC en DB, conversión a `profiles.timezone` en frontend. |
| Coach quiere algo no incluido | Mantener LECCIONES + roadmap. Cuota Pro o presupuesto custom. |
| Capacidad libre Supabase agotada | Alertas a 80%. Upgrade a Pro a tiempo. |
| Cliente abandona la app | Email "no has entrenado en X días" (v2). |
| Otros entrenadores se nos copian | Foso de marca + ejecución continua. Open source partes no críticas. |

---

## 14. Decisiones pendientes

- [ ] **Nombre del producto** + dominio. Mientras tanto, `[NOMBRE_APP]` placeholder.
- [ ] **Modelo de cobro contigo** (no urgente, lo discutimos cuando avancemos).
- [ ] **¿Cuentas creadas a tu nombre o cada hermano la suya?** Recomendación: como es SaaS multi-tenant y tú eres el dueño del producto, las cuentas técnicas (Supabase, Cloudinary, Stripe, Google Cloud) van a tu nombre. Los hermanos serán usuarios pagantes como cualquier otro coach.
- [ ] **Pricing definitivo** (Free 3 clientes / Pro 19 € / Team 49 €). Aterrizar antes de v1.5.
- [ ] **Plantilla de términos legales** (¿usamos Iubenda, Termly, o redactas?). Coste 10-30 €/mes Iubenda. Manual: gratis pero requiere abogado revisor.

---

## 15. Próximo paso concreto

Cuando me confirmes que la spec te encaja:

1. **Confirmar nombre y comprar dominio.**
2. **Crear las cuentas técnicas a tu nombre** (GitHub, Supabase, Cloudinary, Vercel, Google Cloud, Resend).
3. **Generar el starter inicial** SvelteKit + Supabase config + auth shell + landing minimal. Sin lógica de negocio aún, solo el esqueleto que despliega y se ve. Estimado: 8 h.
4. **Iteración 1: auth + perfiles + roles.** Coach y client pueden registrarse, hacer login, ver su dashboard vacío. Estimado: 12 h.
5. **Iteración 2: biblioteca de ejercicios** sin vídeo aún, solo CRUD. Estimado: 8 h.
6. **Iteración 3: subida de vídeos a Cloudinary.** Estimado: 6 h.
7. **Iteración 4: clientes + invitaciones.** Estimado: 8 h.
8. **Iteración 5: calendario + constructor de entreno.** Estimado: 24 h. **Pico de complejidad de v1.**
9. **Iteración 6: vista cliente "Hoy" + tracking.** Estimado: 16 h.
10. **Iteración 7: histórico + gráficos.** Estimado: 10 h.
11. **Iteración 8: sistema de citas + Google Calendar.** Estimado: 50 h.
12. **Iteración 9: páginas legales + responsive pulido + tests.** Estimado: 18 h.
13. **Despliegue a producción + invitar a los hermanos como beta privada.**

Cada iteración: rama, commits pequeños, despliegue de preview a Vercel, prueba real en móvil, merge a main. **Aplicando todas las LECCIONES.md del Can Ficus.**

---

*Documento vivo. Editar conforme avance el proyecto.*
