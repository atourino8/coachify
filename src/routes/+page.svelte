<script lang="ts">
  // Landing pública de Coachify. Los CTA apuntan a /login (acceso, auto-enruta
  // por rol) y /register (alta de entrenador; los clientes entran por invitación).

  import { page } from '$app/state';

  // Datos estructurados para los buscadores. Deliberadamente NO declaramos
  // precios: los de NEGOCIO.md están sin confirmar y publicar en schema.org un
  // precio que luego cambie es peor que no publicar ninguno.
  const jsonLd = $derived(
    JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': page.url.origin + '/#organizacion',
          name: 'Coachify',
          url: page.url.origin,
          logo: page.url.origin + '/favicon.svg',
          email: 'hola@coachify.app',
          areaServed: 'ES'
        },
        {
          '@type': 'SoftwareApplication',
          name: 'Coachify',
          applicationCategory: 'HealthApplication',
          operatingSystem: 'Web',
          inLanguage: 'es-ES',
          url: page.url.origin,
          publisher: { '@id': page.url.origin + '/#organizacion' },
          description:
            'Aplicación para entrenadores personales: gestión de clientes, programación de entrenos, citas y corrección de la técnica por vídeo.'
        }
      ]
    })
  );

  const features = [
    {
      icon: '🎥',
      title: 'Tus propios vídeos',
      text: 'Cada ejercicio con tu vídeo de técnica de 1 minuto. Sin marca de YouTube ni sugerencias raras.'
    },
    {
      icon: '📅',
      title: 'Citas y entrenos ligados',
      text: 'Propón o acepta citas con tus clientes y adjunta el entreno de cada sesión. Ellos lo ven y confirman.'
    },
    {
      icon: '📈',
      title: 'Progreso real',
      text: 'Cada cliente ve cuánto levantó el último mes en cada ejercicio. Tú detectas mesetas y haces tu trabajo.'
    }
  ];

  const tiers = [
    {
      name: 'Free',
      price: '0',
      period: 'siempre',
      description: 'Para probar el producto sin riesgo.',
      cta: 'Empezar gratis',
      featured: false,
      features: [
        'Hasta 3 clientes activos',
        'Biblioteca de ejercicios ilimitada',
        'Constructor de entrenos',
        'Vista cliente con tracking'
      ]
    },
    {
      name: 'Pro',
      price: '19',
      period: 'mes',
      description: 'Para coaches que viven de esto.',
      cta: 'Empezar 14 días gratis',
      featured: true,
      features: [
        'Clientes ilimitados',
        'Sistema de citas (propuestas y reservas)',
        'Entrenamientos reutilizables',
        'Sincronización con Google Calendar (próximamente)',
        'Notificaciones push (próximamente)',
        'Soporte por email'
      ]
    },
    {
      name: 'Team',
      price: '49',
      period: 'mes',
      description: 'Para gimnasios y estudios.',
      cta: 'Hablar con ventas',
      featured: false,
      features: [
        'Todo lo de Pro',
        'Múltiples coaches en una cuenta',
        'Marca propia (white-label)',
        'Analíticas avanzadas',
        'Soporte prioritario'
      ]
    }
  ];
</script>

<svelte:head>
  <!-- Se inyecta con {@html} porque Svelte trataría un <script> escrito tal
       cual como código del propio componente. El contenido es nuestro y no
       incorpora nada que venga del usuario. -->
  {@html `<script type="application/ld+json">${jsonLd}<\/script>`}
</svelte:head>

<!-- ============== Header ============== -->
<header class="sticky top-0 z-50 bg-bg/80 backdrop-blur-md border-b border-line">
  <div class="container-narrow flex items-center justify-between py-4">
    <a href="/" class="flex items-center gap-2">
      <div
        class="w-9 h-9 rounded-lg bg-accent grid place-items-center
               text-white font-display font-bold text-lg shadow-md"
      >
        C
      </div>
      <span class="font-semibold text-lg tracking-tight">Coachify</span>
    </a>

    <nav class="hidden md:flex items-center gap-6 text-sm text-text-mute">
      <a href="#features" class="hover:text-text transition-colors">Features</a>
      <a href="#pricing" class="hover:text-text transition-colors">Precios</a>
      <a href="/login" class="btn-ghost py-2 px-5 text-sm">Entrar</a>
      <a href="/register" class="btn-primary py-2 px-5 text-sm">Empieza gratis</a>
    </nav>

    <div class="md:hidden flex items-center gap-2">
      <a href="/login" class="btn-ghost py-2 px-3 text-sm">Entrar</a>
      <a href="/register" class="btn-primary py-2 px-3 text-sm">Empezar</a>
    </div>
  </div>
</header>

<!-- ============== Hero ============== -->
<section class="relative overflow-hidden py-24 sm:py-32">
  <div class="container-narrow relative">
    <div class="max-w-3xl mx-auto text-center">
      <span class="eyebrow inline-block mb-6">para entrenadores personales</span>
      <h1
        class="text-5xl sm:text-6xl lg:text-7xl font-display font-semibold tracking-tight mb-6 leading-[1.05]"
      >
        Entrena a tus clientes <br />
        con
        <span class="text-accent">tus propios vídeos</span>
      </h1>
      <p class="text-lg sm:text-xl text-text-mute leading-relaxed mb-10 max-w-2xl mx-auto">
        Sin Excel. Sin WhatsApp. Sin caos. Coachify es la app que reúne tu biblioteca de ejercicios,
        el calendario semanal de tus clientes y su progreso en un solo sitio.
      </p>
      <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
        <a href="/register" class="btn-primary text-base px-8 py-4">
          Empieza gratis
          <span class="text-text-mute/70">→</span>
        </a>
        <a href="#features" class="btn-ghost text-base px-8 py-4">Ver cómo funciona</a>
      </div>
      <p class="mt-6 text-sm text-text-mute">Sin tarjeta · Tu primer cliente en 5 minutos</p>
    </div>
  </div>
</section>

<!-- ============== Acceso por rol ============== -->
<section id="acceso" class="py-20 sm:py-24 border-t border-text-mute/10 bg-surface/30">
  <div class="container-narrow">
    <div class="text-center mb-12 max-w-2xl mx-auto">
      <span class="eyebrow inline-block mb-4">acceso</span>
      <h2 class="text-3xl sm:text-4xl font-display font-semibold tracking-tight mb-3">
        ¿Ya usas Coachify?
      </h2>
      <p class="text-text-mute">
        Entra según quién seas. Es el mismo acceso, te llevamos a tu sitio.
      </p>
    </div>

    <div class="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
      <!-- Entrenador -->
      <div class="card flex flex-col">
        <div class="text-3xl mb-3">🏋️</div>
        <h3 class="text-lg font-semibold mb-1">Soy entrenador</h3>
        <p class="text-sm text-text-mute mb-5 flex-1">
          Gestiona tus clientes, entrenamientos y citas en un solo sitio.
        </p>
        <div class="flex flex-col gap-2">
          <a href="/register" class="btn-primary w-full text-sm">Empezar gratis</a>
          <a
            href="/login"
            class="text-xs text-text-mute hover:text-text text-center transition-colors"
          >
            Ya tengo cuenta · Entrar
          </a>
        </div>
      </div>

      <!-- Cliente -->
      <div class="card flex flex-col">
        <div class="text-3xl mb-3">💪</div>
        <h3 class="text-lg font-semibold mb-1">Soy cliente</h3>
        <p class="text-sm text-text-mute mb-5 flex-1">
          Tu entrenador te invitó por email. Entra para ver tus entrenos, vídeos y citas.
        </p>
        <div class="flex flex-col gap-2">
          <a href="/login" class="btn-ghost w-full text-sm">Entrar</a>
          <span class="text-xs text-text-mute/70 text-center">
            Usa el email con el que te invitaron
          </span>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ============== Features ============== -->
<section id="features" class="py-24 sm:py-32 border-t border-text-mute/10">
  <div class="container-narrow">
    <div class="text-center mb-16 max-w-2xl mx-auto">
      <span class="eyebrow inline-block mb-4">cómo funciona</span>
      <h2 class="text-4xl sm:text-5xl font-display font-semibold tracking-tight mb-4">
        Tres cosas que cambian el día a día
      </h2>
      <p class="text-lg text-text-mute">
        Tres cosas bien hechas valen más que doscientas a medias.
      </p>
    </div>

    <div class="grid md:grid-cols-3 gap-6">
      {#each features as f}
        <div class="card text-center">
          <div class="text-5xl mb-4">{f.icon}</div>
          <h3 class="text-xl font-semibold mb-3">{f.title}</h3>
          <p class="text-text-mute text-sm leading-relaxed">{f.text}</p>
        </div>
      {/each}
    </div>
  </div>
</section>

<!-- ============== Pricing ============== -->
<section id="pricing" class="py-24 sm:py-32 border-t border-text-mute/10">
  <div class="container-narrow">
    <div class="text-center mb-16 max-w-2xl mx-auto">
      <span class="eyebrow inline-block mb-4">precios</span>
      <h2 class="text-4xl sm:text-5xl font-display font-semibold tracking-tight mb-4">
        Simple. Honesto. Sin sorpresas.
      </h2>
      <p class="text-lg text-text-mute">
        Empieza gratis. Cuando tengas 4 clientes pagándote, considera Pro.
      </p>
    </div>

    <div class="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
      {#each tiers as tier}
        <div class="card relative flex flex-col {tier.featured ? 'border-accent border-2' : ''}">
          {#if tier.featured}
            <span
              class="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white text-xs
                     uppercase tracking-wider font-semibold px-3 py-1 rounded-full"
            >
              Más elegido
            </span>
          {/if}

          <h3 class="text-2xl font-display font-semibold mb-2">{tier.name}</h3>
          <p class="text-sm text-text-mute mb-6">{tier.description}</p>

          <div class="mb-6">
            <span class="text-5xl font-display font-semibold">{tier.price}€</span>
            <span class="text-text-mute text-sm">/{tier.period}</span>
          </div>

          <ul class="space-y-3 mb-8 text-sm flex-1">
            {#each tier.features as feature}
              <li class="flex items-start gap-2">
                <span class="text-success mt-0.5">✓</span>
                <span class="text-text-mute">{feature}</span>
              </li>
            {/each}
          </ul>

          <a href="/register" class={tier.featured ? 'btn-primary w-full' : 'btn-ghost w-full'}>
            {tier.cta}
          </a>
        </div>
      {/each}
    </div>

    <p class="text-center text-sm text-text-mute mt-10">
      Todos los planes incluyen 14 días de prueba en Pro, sin tarjeta.
    </p>
  </div>
</section>

<!-- ============== CTA final ============== -->
<section class="py-24 sm:py-32 border-t border-text-mute/10">
  <div class="container-text text-center">
    <h2 class="text-4xl sm:text-5xl font-display font-semibold tracking-tight mb-6">
      ¿Listo para dejar el Excel?
    </h2>
    <p class="text-lg text-text-mute mb-10">
      En 5 minutos tienes tu primer ejercicio subido y tu primer cliente invitado.
    </p>
    <a href="/register" class="btn-primary text-base px-8 py-4">
      Empieza gratis
      <span class="text-text-mute/70">→</span>
    </a>
  </div>
</section>

<!-- ============== Footer ============== -->
<footer class="border-t border-text-mute/10 py-12 text-sm text-text-mute">
  <div class="container-narrow flex flex-col sm:flex-row items-center justify-between gap-6">
    <div class="flex items-center gap-2">
      <div
        class="w-7 h-7 rounded-md bg-accent grid place-items-center
               text-white font-display font-bold text-sm"
      >
        C
      </div>
      <span>© {new Date().getFullYear()} Coachify</span>
    </div>
    <nav class="flex flex-wrap items-center gap-x-6 gap-y-2">
      <a href="/legal/terminos" class="hover:text-text transition-colors">Términos</a>
      <a href="/legal/privacidad" class="hover:text-text transition-colors">Privacidad</a>
      <a href="/legal/cookies" class="hover:text-text transition-colors">Cookies</a>
      <a href="mailto:hola@coachify.app" class="hover:text-text transition-colors">Contacto</a>
    </nav>
  </div>
</footer>
