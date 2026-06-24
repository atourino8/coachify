<script lang="ts">
  import { page } from '$app/state';
  const profile = $derived(page.data.profile);
  const today = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
</script>

<svelte:head>
  <title>Hoy · Coachify</title>
</svelte:head>

<div class="space-y-8">
  <div>
    <span class="eyebrow">{today}</span>
    <h1 class="text-4xl font-bold tracking-tight mt-2">
      Hola, {profile?.full_name ?? 'crack'} 💪
    </h1>
    <p class="text-text-mute mt-1">Tu entreno de hoy aparecerá aquí cuando tu coach lo prepare.</p>
  </div>

  <div class="card text-center py-16">
    <div class="text-6xl mb-4">🏋️</div>
    <h2 class="text-xl font-semibold mb-2">Aún no hay entreno para hoy</h2>
    <p class="text-sm text-text-mute max-w-md mx-auto">
      Esto es lo que verás cuando tu coach publique tu rutina diaria.
      Por ahora estamos validando que la cuenta funciona.
    </p>
  </div>
</div>
