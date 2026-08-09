<script lang="ts">
  // Landing pública de Coachify.
  //
  // DIRECCIÓN (ver DISENO.md): la landing habla el idioma de la herramienta,
  // no el de las landings. Filas densas, líneas finas y números grandes: lo
  // mismo que hay dentro del producto. Eso consigue dos cosas:
  //   · Es imposible que se parezca a otra: nadie más tiene nuestro contenido.
  //   · Es honesta. Lo que se ve aquí es literalmente lo que hay al entrar.
  //
  // Se evitan a propósito los tres patrones que delatan una página generada:
  // el héroe centrado, las tres tarjetas de características con icono, y la
  // tabla de precios con el plan del medio elevado y su etiqueta "Popular".
  // Todo va en rejillas asimétricas que además alternan de lado.

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

  // Planes alineados con NEGOCIO.md. Ojo: el precio de Pro sigue pendiente de
  // confirmar con las primeras conversaciones, así que puede moverse.
  const planes = [
    {
      nombre: 'Prueba',
      precio: '0',
      periodo: '14 días',
      para: 'Para verlo con un cliente real antes de pagar nada.',
      cta: 'Empezar',
      incluye: ['Todo lo de Pro', 'Sin tarjeta', 'Sin límite de clientes']
    },
    {
      nombre: 'Pro',
      precio: '29',
      periodo: 'al mes',
      para: 'Para el entrenador que vive de esto.',
      cta: 'Empezar los 14 días',
      incluye: [
        'Clientes ilimitados',
        'Citas, entrenos y corrección por vídeo',
        'Tu marca y tus colores',
        'Soporte por correo'
      ]
    },
    {
      nombre: 'Studio',
      precio: '79',
      periodo: 'al mes',
      para: 'Para estudios y convenios de empresa.',
      cta: 'Escríbenos',
      incluye: ['Todo lo de Pro', 'Varios entrenadores', 'Grupos y facturación conjunta']
    }
  ];
</script>

<svelte:head>
  <!-- Se inyecta con {@html} porque Svelte trataría un <script> escrito tal
       cual como código del propio componente. El contenido es nuestro y no
       incorpora nada que venga del usuario. -->
  {@html `<script type="application/ld+json">${jsonLd}<\/script>`}
</svelte:head>

<!-- ============== Cabecera ============== -->
<header class="sticky top-0 z-50 bg-bg/85 backdrop-blur-md border-b border-line">
  <div class="container-narrow flex items-center justify-between py-3.5">
    <a href="/" class="flex items-center gap-2.5">
      <div class="w-7 h-7 rounded-md bg-accent grid place-items-center text-bg font-bold text-sm">
        C
      </div>
      <span class="font-semibold tracking-tight">Coachify</span>
    </a>

    <nav class="flex items-center gap-5 sm:gap-7 text-sm">
      <a href="#como" class="hidden sm:inline text-text-mute hover:text-text transition-colors">
        Cómo funciona
      </a>
      <a href="#precio" class="hidden sm:inline text-text-mute hover:text-text transition-colors">
        Precio
      </a>
      <a href="/login" class="text-accent font-medium hover:underline">Entrar</a>
      <a href="/register" class="btn-primary py-2 px-4 text-sm">Empezar</a>
    </nav>
  </div>
</header>

<!--
  ============== Héroe ==============
  Rejilla 5/7 y nada centrado: el texto ocupa MENOS que el material. Es la
  decisión que más se nota; un bloque centrado es lo que sale por defecto.
-->
<section class="container-narrow pt-14 pb-16 sm:pt-24 sm:pb-24">
  <div class="grid lg:grid-cols-[5fr_7fr] gap-10 lg:gap-14 items-end">
    <div>
      <p class="eyebrow">Para entrenadores presenciales</p>
      <h1 class="text-4xl sm:text-5xl font-bold tracking-tight mt-4 mb-5 leading-tight">
        La semana de tus clientes, montada en diez minutos.
      </h1>
      <p class="text-text-mute leading-relaxed max-w-md">
        Programa, gestiona y corrige la técnica desde el mismo sitio. Ellos entrenan mirando el
        móvil; tú ves si han levantado más que el mes pasado.
      </p>
      <div class="flex flex-wrap items-center gap-x-5 gap-y-3 mt-7">
        <a href="/register" class="btn-primary">Empezar gratis</a>
        <span class="text-sm text-text-mute">14 días, sin tarjeta</span>
      </div>
    </div>

    <!-- Material real del producto: la misma fila, la misma tipografía y los
         mismos números que se ven al entrar. No es una captura dentro de un
         marco de navegador, que es el otro cliché. -->
    <div class="border border-line rounded-lg bg-surface overflow-hidden">
      <p class="text-3xs uppercase tracking-wider text-text-mute px-4 py-3 border-b border-line">
        Miércoles · Carla Otero · Fuerza tren inferior
      </p>
      <div class="px-4">
        <div class="row">
          <span class="text-2xl font-bold tabular-nums tracking-tight w-20 flex-shrink-0">
            60<span class="text-sm text-text-mute font-semibold">kg</span>
          </span>
          <span class="flex-1 min-w-0 text-sm">Sentadilla trasera</span>
          <span class="text-2xs font-bold text-success">4/4 ✓</span>
        </div>
        <div class="row">
          <span class="text-2xl font-bold tabular-nums tracking-tight w-20 flex-shrink-0">
            45<span class="text-sm text-text-mute font-semibold">kg</span>
          </span>
          <span class="flex-1 min-w-0 text-sm">Peso muerto rumano</span>
          <span class="text-2xs font-bold text-success">4/4 ✓</span>
        </div>
        <div class="row">
          <span class="text-2xl font-bold tabular-nums tracking-tight w-20 flex-shrink-0">
            20<span class="text-sm text-text-mute font-semibold">kg</span>
          </span>
          <span class="flex-1 min-w-0 text-sm">Zancadas</span>
          <span class="text-2xs text-text-mute">2/4</span>
        </div>
        <div class="row border-b-0">
          <span
            class="text-2xl font-bold tabular-nums tracking-tight text-accent w-20 flex-shrink-0"
          >
            +20<span class="text-sm font-semibold">kg</span>
          </span>
          <span class="flex-1 min-w-0 text-sm text-text-mute">en sentadilla desde junio</span>
        </div>
      </div>
    </div>
  </div>
</section>

<!--
  ============== Cómo funciona ==============
  Tres franjas, no tres tarjetas. Cada una enseña su función CON el material
  que la hace, y alternan de lado para que la página no sea una columna.
-->
<section id="como" class="border-t border-line">
  <div class="container-narrow divide-y divide-line">
    <!-- 1 · Técnica por vídeo -->
    <div class="grid lg:grid-cols-[7fr_5fr] gap-10 items-center py-16 sm:py-20">
      <div class="grid grid-cols-2 gap-3">
        <div class="border border-line rounded-md overflow-hidden">
          <p
            class="text-3xs uppercase tracking-wider text-text-mute px-3 py-2 border-b border-line"
          >
            Su primer vídeo · 15 jul
          </p>
          <div class="h-28 bg-bg grid place-items-center text-line-strong">▶</div>
        </div>
        <div class="border border-line rounded-md overflow-hidden">
          <p
            class="text-3xs uppercase tracking-wider text-text-mute px-3 py-2 border-b border-line"
          >
            Ahora · hace 2 días
          </p>
          <div class="h-28 bg-bg grid place-items-center text-line-strong">▶</div>
        </div>
      </div>
      <div>
        <h2 class="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
          Le corriges la postura sin estar delante.
        </h2>
        <p class="text-text-mute leading-relaxed">
          Tu cliente graba un minuto con el móvil. Tú lo ves al lado del primero que te mandó y le
          escribes qué cambiar.
        </p>
        <p class="text-sm text-text-mute mt-4 border-l-2 border-accent pl-4 leading-relaxed">
          Se guardan dos por ejercicio: el primero y el último. Ni se te llena la cuenta ni se
          pierde la comparación.
        </p>
      </div>
    </div>

    <!-- 2 · Progreso · invertida respecto a la anterior -->
    <div class="grid lg:grid-cols-[5fr_7fr] gap-10 items-center py-16 sm:py-20">
      <div class="lg:order-2 border border-line rounded-lg bg-surface p-5">
        <div class="flex items-baseline justify-between gap-4 mb-4">
          <span class="text-sm font-semibold">Press de banca</span>
          <span class="text-2xs text-text-mute">8 semanas</span>
        </div>
        <div class="flex items-end gap-1.5 h-24">
          {#each [40, 42.5, 45, 45, 47.5, 52.5, 55, 60] as kg, i (i)}
            <div class="flex-1 flex flex-col items-center gap-1.5">
              <div
                class="w-full rounded-sm {i === 7 ? 'bg-accent' : 'bg-line-strong'}"
                style="height: {((kg - 35) / 27) * 100}%"
              ></div>
            </div>
          {/each}
        </div>
        <div class="flex items-baseline justify-between mt-3 pt-3 border-t border-line">
          <span class="text-2xs text-text-mute">40 kg en junio</span>
          <span class="text-lg font-bold tabular-nums text-accent">60 kg hoy</span>
        </div>
      </div>
      <div class="lg:order-1">
        <h2 class="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
          Ves el estancamiento antes que él.
        </h2>
        <p class="text-text-mute leading-relaxed">
          Cada serie que registra tu cliente alimenta su curva. Tú entras y ves de un vistazo quién
          sube, quién lleva tres semanas con el mismo peso y a quién toca cambiarle el plan.
        </p>
      </div>
    </div>

    <!-- 3 · Agenda -->
    <div class="grid lg:grid-cols-[7fr_5fr] gap-10 items-center py-16 sm:py-20">
      <div class="border border-line rounded-lg bg-surface overflow-hidden">
        <p class="text-3xs uppercase tracking-wider text-text-mute px-4 py-3 border-b border-line">
          Te han pedido cita
        </p>
        <div class="px-4">
          <div class="row">
            <span class="flex-1 min-w-0">
              <span class="font-medium text-sm block">Marcos Vidal</span>
              <span class="text-2xs text-text-mute">Viernes 7 · 10:00 · presencial</span>
            </span>
            <span class="action-primary">Confirmar</span>
            <span class="action-danger">Rechazar</span>
          </div>
          <div class="row border-b-0">
            <span class="flex-1 min-w-0">
              <span class="font-medium text-sm block">Nadia Ferrer</span>
              <span class="text-2xs text-text-mute">Sábado 8 · 09:00 · Parque del Oeste</span>
            </span>
            <span class="action-primary">Confirmar</span>
            <span class="action-danger">Rechazar</span>
          </div>
        </div>
      </div>
      <div>
        <h2 class="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
          Se acabó cuadrar horarios por WhatsApp.
        </h2>
        <p class="text-text-mute leading-relaxed">
          Publicas cuándo puedes y tus clientes piden hueco ahí. Confirmas de un toque, y el entreno
          de esa sesión ya les aparece preparado.
        </p>
      </div>
    </div>
  </div>
</section>

<!--
  ============== Precio ==============
  En filas y sin plan destacado. La tabla de tres tarjetas con la del medio
  elevada y su etiqueta "Popular" es de los patrones más reconocibles que hay.
-->
<section id="precio" class="border-t border-line py-16 sm:py-24">
  <div class="container-narrow">
    <div class="grid lg:grid-cols-[5fr_7fr] gap-10">
      <div>
        <p class="eyebrow">Precio</p>
        <h2 class="text-2xl sm:text-3xl font-bold tracking-tight mt-4 mb-3">
          Una cuota fija, no un peaje por cliente.
        </h2>
        <p class="text-text-mute leading-relaxed">
          El resto cobra más según cuánta gente lleves, justo cuando más te cuesta llegar. Aquí
          pagas lo mismo con cinco clientes que con treinta.
        </p>
      </div>

      <div class="border-t border-line">
        {#each planes as plan (plan.nombre)}
          <div class="py-6 border-b border-line grid sm:grid-cols-[auto_1fr_auto] gap-x-6 gap-y-3">
            <div class="sm:w-32">
              <p class="font-semibold">{plan.nombre}</p>
              <p class="mt-1">
                <span class="text-3xl font-bold tabular-nums tracking-tight">{plan.precio}€</span>
                <span class="text-sm text-text-mute"> / {plan.periodo}</span>
              </p>
            </div>
            <div class="min-w-0">
              <p class="text-sm text-text-mute mb-2">{plan.para}</p>
              <ul class="text-sm space-y-1">
                {#each plan.incluye as item (item)}
                  <li class="text-text-mute">· {item}</li>
                {/each}
              </ul>
            </div>
            <div class="sm:self-center">
              <a href="/register" class="btn-ghost whitespace-nowrap">{plan.cta}</a>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
</section>

<!-- ============== Acceso ============== -->
<section class="border-t border-line py-16 sm:py-20">
  <div class="container-narrow grid lg:grid-cols-[5fr_7fr] gap-10">
    <div>
      <h2 class="text-2xl sm:text-3xl font-bold tracking-tight">¿Y si soy el cliente?</h2>
    </div>
    <div class="border-t border-line">
      <div class="row">
        <span class="flex-1 min-w-0">
          <span class="font-medium block">Soy entrenador</span>
          <span class="text-sm text-text-mute">Creas tu cuenta y empiezas con tus clientes.</span>
        </span>
        <a href="/register" class="action-primary">Crear cuenta</a>
      </div>
      <div class="row border-b-0">
        <span class="flex-1 min-w-0">
          <span class="font-medium block">Soy cliente de un entrenador</span>
          <span class="text-sm text-text-mute">
            No te registras aquí: tu entrenador te invita por correo y entras con ese enlace.
          </span>
        </span>
        <a href="/login" class="action-neutral">Ya tengo cuenta</a>
      </div>
    </div>
  </div>
</section>

<!-- ============== Cierre ============== -->
<section class="border-t border-line py-16 sm:py-24">
  <div class="container-narrow grid lg:grid-cols-[5fr_7fr] gap-10 items-center">
    <div>
      <h2 class="text-2xl sm:text-3xl font-bold tracking-tight">Tu primer entreno, hoy.</h2>
    </div>
    <div class="flex flex-wrap items-center gap-x-6 gap-y-3">
      <a href="/register" class="btn-primary">Empezar gratis</a>
      <p class="text-sm text-text-mute">
        Cargamos 48 ejercicios el primer día. Invitas a un cliente y le programas la semana.
      </p>
    </div>
  </div>
</section>

<!-- ============== Pie ============== -->
<footer class="border-t border-line py-10 text-sm text-text-mute">
  <div class="container-narrow flex flex-col sm:flex-row items-center justify-between gap-6">
    <div class="flex items-center gap-2">
      <div class="w-6 h-6 rounded-md bg-accent grid place-items-center text-bg font-bold text-2xs">
        C
      </div>
      <span>© {new Date().getFullYear()} Coachify</span>
    </div>
    <nav class="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
      <a href="/legal/terminos" class="hover:text-text transition-colors">Términos</a>
      <a href="/legal/privacidad" class="hover:text-text transition-colors">Privacidad</a>
      <a href="/legal/cookies" class="hover:text-text transition-colors">Cookies</a>
      <a href="mailto:hola@coachify.app" class="hover:text-text transition-colors">Contacto</a>
    </nav>
  </div>
</footer>
