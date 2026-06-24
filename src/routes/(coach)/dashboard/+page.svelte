<script lang="ts">
  import { page } from '$app/state';
  const profile = $derived(page.data.profile);
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
      Bienvenido a Coachify. Estás en la versión inicial (Fase B.1 — auth funcional).
    </p>
  </div>

  <div class="grid sm:grid-cols-3 gap-4">
    <a href="/exercises" class="card hover:border-primary/50 hover:shadow-glow group">
      <div class="text-3xl mb-3">📚</div>
      <h3 class="font-semibold mb-1">Ejercicios</h3>
      <p class="text-sm text-text-mute">Tu biblioteca personal de ejercicios con vídeos.</p>
      <p class="text-xs text-text-mute/60 mt-3">Próximamente (Fase C)</p>
    </a>
    <a href="/clients" class="card hover:border-primary/50 group">
      <div class="text-3xl mb-3">👥</div>
      <h3 class="font-semibold mb-1">Clientes</h3>
      <p class="text-sm text-text-mute">Invita y gestiona a las personas a las que entrenas.</p>
      <p class="text-xs text-text-mute/60 mt-3">Próximamente</p>
    </a>
    <a href="/calendar" class="card hover:border-primary/50 group">
      <div class="text-3xl mb-3">📅</div>
      <h3 class="font-semibold mb-1">Calendario</h3>
      <p class="text-sm text-text-mute">Tus sesiones presenciales y online.</p>
      <p class="text-xs text-text-mute/60 mt-3">Próximamente</p>
    </a>
  </div>

  <div class="card text-center bg-primary/5 border-primary/20">
    <h2 class="text-xl font-semibold mb-2">🎉 Estás dentro</h2>
    <p class="text-sm text-text-mute">
      Auth funcionando. En las próximas fases iremos añadiendo: biblioteca de ejercicios,
      clientes, calendario con citas, plantillas, etc.
    </p>
  </div>
</div>
