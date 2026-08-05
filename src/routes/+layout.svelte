<script lang="ts">
  import '../app.css';
  import { invalidate } from '$app/navigation';
  import { navigating } from '$app/state';
  import { onMount } from 'svelte';

  let { data, children } = $props();

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
  <title>Coachify · La app de entrenamiento personal para coaches modernos</title>
  <meta
    name="description"
    content="Coachify es la app para entrenadores personales: gestiona clientes, arma rutinas con vídeos propios y sigue el progreso. Sin Excel, sin WhatsApp, sin caos."
  />
</svelte:head>

{#if navigating.to}
  <!-- Barra de progreso global: feedback de carga en cualquier navegación -->
  <div
    class="fixed top-0 left-0 right-0 z-[100] h-0.5 bg-primary/15 overflow-hidden"
    role="status"
    aria-label="Cargando página"
  >
    <div class="h-full w-1/3 bg-primary loading-bar"></div>
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
