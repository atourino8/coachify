<script lang="ts">
  import { page } from '$app/state';
  const profile = $derived(page.data.profile);
  let { data } = $props();
</script>

<svelte:head>
  <title>Dashboard · Coachify</title>
</svelte:head>

<div class="space-y-8">
  <div>
    <span class="eyebrow">tu panel</span>
    <h1 class="text-4xl font-bold tracking-tight mt-2">
      Hola, {profile?.full_name ?? 'coach'} 👋
    </h1>
    <p class="text-text-mute mt-1">
      Bienvenido a Coachify. Estás en la versión inicial (Fase B.2).
    </p>
  </div>

  <div class="grid sm:grid-cols-3 gap-4">
    <a href="/exercises" class="card hover:border-primary/50 hover:shadow-glow group transition-all">
      <div class="flex items-start justify-between mb-3">
        <div class="text-3xl">📚</div>
        <div class="text-3xl font-bold text-primary">{data.counts.exercises}</div>
      </div>
      <h3 class="font-semibold mb-1">Ejercicios</h3>
      <p class="text-sm text-text-mute">Tu biblioteca personal de ejercicios con vídeos.</p>
    </a>

    <a href="/clients" class="card hover:border-primary/50 group transition-all">
      <div class="flex items-start justify-between mb-3">
        <div class="text-3xl">👥</div>
        <div class="text-3xl font-bold text-primary">{data.counts.clients}</div>
      </div>
      <h3 class="font-semibold mb-1">Clientes</h3>
      <p class="text-sm text-text-mute">Personas que entrenas con Coachify.</p>
    </a>

    <a href="/calendar" class="card hover:border-primary/50 group transition-all opacity-60">
      <div class="flex items-start justify-between mb-3">
        <div class="text-3xl">📅</div>
        <div class="text-xs uppercase tracking-wider text-text-mute mt-2">Pronto</div>
      </div>
      <h3 class="font-semibold mb-1">Calendario</h3>
      <p class="text-sm text-text-mute">Tus sesiones presenciales y online.</p>
    </a>
  </div>

  {#if data.counts.exercises === 0}
    <div class="card text-center bg-primary/5 border-primary/20">
      <h2 class="text-xl font-semibold mb-2">🚀 Empieza creando tu primer ejercicio</h2>
      <p class="text-sm text-text-mute mb-4">
        Crea tu biblioteca de ejercicios con vídeos. Luego podrás armar entrenos con ellos para cada cliente.
      </p>
      <a href="/exercises/new" class="btn-primary">Crear primer ejercicio</a>
    </div>
  {/if}
</div>
