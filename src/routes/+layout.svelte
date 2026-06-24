<script lang="ts">
  import '../app.css';
  import { invalidate } from '$app/navigation';
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

{@render children()}
