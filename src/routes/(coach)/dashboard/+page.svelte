<script lang="ts">
  let { data } = $props();

  function fmtTime(iso: string) {
    return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }
  function fmtDay(iso: string) {
    return new Date(iso).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
  }
  const modalityLabel: Record<string, string> = {
    presencial: 'Presencial',
    online: 'Online',
    remoto: 'Remoto'
  };
</script>

<svelte:head>
  <title>Inicio · Coachify</title>
</svelte:head>

<div class="space-y-8">
  <div>
    <span class="eyebrow">Tu día</span>
    <h1 class="text-4xl font-display font-semibold tracking-tight mt-2">
      Hola{data.firstName ? ', ' + data.firstName : ''} 👋
    </h1>
  </div>

  <!-- Acciones rápidas -->
  <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
    <a href="/agenda?propose=1" class="card p-4 flex flex-col gap-2 hover:border-primary/50 transition-all">
      <span class="h-9 w-9 grid place-items-center rounded-lg bg-primary/15 text-primary" aria-hidden="true">
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18M12 14v4M10 16h4" stroke-linecap="round" /></svg>
      </span>
      <span class="text-sm font-medium">Proponer cita</span>
    </a>
    <a href="/clients?invite=1" class="card p-4 flex flex-col gap-2 hover:border-primary/50 transition-all">
      <span class="h-9 w-9 grid place-items-center rounded-lg bg-primary/15 text-primary" aria-hidden="true">
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="9" cy="8" r="3.5" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M19 8v6M22 11h-6" stroke-linecap="round" /></svg>
      </span>
      <span class="text-sm font-medium">Invitar cliente</span>
    </a>
    <a href="/templates?new=1" class="card p-4 flex flex-col gap-2 hover:border-primary/50 transition-all">
      <span class="h-9 w-9 grid place-items-center rounded-lg bg-primary/15 text-primary" aria-hidden="true">
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 7h6M9 11h6M9 15h4" stroke-linecap="round" /></svg>
      </span>
      <span class="text-sm font-medium">Crear entrenamiento</span>
    </a>
    <a href="/exercises/new" class="card p-4 flex flex-col gap-2 hover:border-primary/50 transition-all">
      <span class="h-9 w-9 grid place-items-center rounded-lg bg-primary/15 text-primary" aria-hidden="true">
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M6.5 6.5l11 11M4 9l-1.5 1.5a2 2 0 000 3L4 15M20 9l1.5 1.5a2 2 0 010 3L20 15M9 4L7.5 5.5M15 20l1.5-1.5" stroke-linecap="round" /></svg>
      </span>
      <span class="text-sm font-medium">Nuevo ejercicio</span>
    </a>
  </div>

  {#if !data.hasClients}
    <!-- Onboarding: aún no hay clientes -->
    <div class="card text-center py-16 bg-primary/5 border-primary/20">
      <div class="text-6xl mb-4">🚀</div>
      <h2 class="text-xl font-semibold mb-2">Empieza por aquí</h2>
      <p class="text-sm text-text-mute max-w-md mx-auto mb-6">
        Crea tu biblioteca de ejercicios, arma algún entrenamiento y luego invita a tus clientes.
      </p>
      <div class="flex gap-3 justify-center flex-wrap">
        <a href="/exercises/new" class="btn-primary">Crear ejercicio</a>
        <a href="/clients" class="btn-ghost">Invitar cliente</a>
      </div>
    </div>
  {:else}
    <!-- Citas de hoy -->
    <section class="space-y-3">
      <h2 class="text-lg font-semibold">Hoy</h2>
      {#if data.todaySessions.length === 0}
        <p class="text-sm text-text-mute">No tienes citas confirmadas para hoy.</p>
      {:else}
        {#each data.todaySessions as s (s.id)}
          <div class="card flex items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <div class="text-lg font-bold text-primary w-14">{fmtTime(s.starts_at)}</div>
              <div>
                <div class="font-semibold">{s.client?.full_name ?? 'Cliente'}</div>
                <div class="text-xs text-text-mute">{modalityLabel[s.modality] ?? s.modality}</div>
              </div>
            </div>
            {#if s.workout}
              <a href="/clients/{s.client_id}/workouts/{s.workout.date}" class="text-xs text-primary hover:underline">
                Ver entreno →
              </a>
            {:else}
              <span class="text-xs text-warning">Sin entreno</span>
            {/if}
          </div>
        {/each}
      {/if}
    </section>

    <!-- Solicitudes de cliente por confirmar -->
    {#if data.pendingRequests.length > 0}
      <section class="space-y-3">
        <h2 class="text-lg font-semibold flex items-center gap-2">
          Solicitudes por confirmar
          <span class="text-xs px-2 py-0.5 rounded-full bg-warning/15 text-warning">{data.pendingRequests.length}</span>
        </h2>
        {#each data.pendingRequests as s (s.id)}
          <a href="/agenda" class="card flex items-center justify-between gap-4 hover:border-primary/40 transition-all">
            <div>
              <div class="font-semibold">{s.client?.full_name ?? 'Cliente'}</div>
              <div class="text-xs text-text-mute capitalize">{fmtDay(s.starts_at)} · {fmtTime(s.starts_at)}</div>
            </div>
            <span class="text-xs text-primary">Responder →</span>
          </a>
        {/each}
      </section>
    {/if}

    <!-- Propuestas tuyas esperando al cliente -->
    {#if data.pendingProposals.length > 0}
      <section class="space-y-3">
        <h2 class="text-lg font-semibold">Esperando a que confirmen</h2>
        {#each data.pendingProposals as s (s.id)}
          <div class="flex items-center justify-between gap-4 text-sm py-2 border-b border-text-mute/10">
            <span>{s.client?.full_name ?? 'Cliente'} · <span class="text-text-mute capitalize">{fmtDay(s.starts_at)}</span></span>
            <span class="text-xs text-text-mute">Pendiente del cliente</span>
          </div>
        {/each}
      </section>
    {/if}

    <!-- Clientes sin entreno esta semana -->
    {#if data.clientsWithoutWorkout.length > 0}
      <section class="space-y-3">
        <h2 class="text-lg font-semibold flex items-center gap-2">
          Sin entreno esta semana
          <span class="text-xs px-2 py-0.5 rounded-full bg-danger/15 text-danger">{data.clientsWithoutWorkout.length}</span>
        </h2>
        <p class="text-xs text-text-mute -mt-1">Clientes a los que no has programado nada en los próximos 7 días.</p>
        <div class="grid sm:grid-cols-2 gap-2">
          {#each data.clientsWithoutWorkout as c (c.id)}
            <a href="/clients/{c.id}" class="card flex items-center justify-between gap-3 py-3 hover:border-primary/40 transition-all">
              <span class="font-medium truncate">{c.full_name ?? 'Cliente'}</span>
              <span class="text-xs text-primary whitespace-nowrap">Programar →</span>
            </a>
          {/each}
        </div>
      </section>
    {/if}
  {/if}
</div>
