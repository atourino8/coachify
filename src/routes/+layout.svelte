<script lang="ts">
  import '../app.css';
  import { invalidate } from '$app/navigation';
  import { navigating, page } from '$app/state';
  import { onMount } from 'svelte';

  let { data, children } = $props();

  const TITULO = 'Coachify · La app de entrenamiento personal para coaches modernos';
  const DESCRIPCION =
    'Coachify es la app para entrenadores personales: gestiona clientes, arma rutinas con vídeos propios y sigue el progreso. Sin Excel, sin WhatsApp, sin caos.';

  const urlActual = $derived(page.url.origin + page.url.pathname);
  const imagenOG = $derived(page.url.origin + '/og-image.png');

  // Cuando Supabase Auth detecta un cambio (login/logout/refresh), invalidamos
  // la query para que el layout server se vuelva a ejecutar y refresque la sesión.
  onMount(() => {
    const { data: subscription } = data.supabase.auth.onAuthStateChange((_, newSession) => {
      if (newSession?.expires_at !== data.session?.expires_at) {
        invalidate('supabase:auth');
      }
    });
    return () => subscription.subscription.unsubscribe();
  });
</script>

<svelte:head>
  <title>{TITULO}</title>
  <meta name="description" content={DESCRIPCION} />

  <!-- Open Graph / Twitter. Las redes exigen URLs ABSOLUTAS en og:image; con
       una ruta relativa no se previsualiza nada. Por eso se compone con el
       origen de la petición en vez de escribirla a mano: así funciona igual en
       local, en las previsualizaciones de Vercel y en el dominio final. -->
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Coachify" />
  <meta property="og:locale" content="es_ES" />
  <meta property="og:title" content={TITULO} />
  <meta property="og:description" content={DESCRIPCION} />
  <meta property="og:url" content={urlActual} />
  <meta property="og:image" content={imagenOG} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta
    property="og:image:alt"
    content="Coachify · tus clientes, tus entrenos y tu agenda en un sitio"
  />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={TITULO} />
  <meta name="twitter:description" content={DESCRIPCION} />
  <meta name="twitter:image" content={imagenOG} />

  <link rel="canonical" href={urlActual} />
</svelte:head>

{#if navigating.to}
  <!-- Barra de progreso global: feedback de carga en cualquier navegación.
       En el móvil hace MÁS falta que en el escritorio, no menos: la latencia
       de una 4G floja en un gimnasio no se parece al wifi de casa. Por eso
       va en acento y con grosor suficiente para verse a un palmo de la cara;
       a 2px y en tinta pasaba desapercibida. -->
  <div
    class="fixed top-0 left-0 right-0 z-[100] h-1 bg-accent/15 overflow-hidden"
    role="status"
    aria-label="Cargando página"
  >
    <div class="h-full w-1/3 bg-accent loading-bar"></div>
  </div>
{/if}

{@render children()}

<style>
  .loading-bar {
    animation: loading-slide 1s ease-in-out infinite;
  }
  @keyframes loading-slide {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(400%);
    }
  }
</style>
