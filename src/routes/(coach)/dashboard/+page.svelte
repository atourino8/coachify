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

  const hoy = new Date().toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long'
  });
</script>

<svelte:head>
  <title>Inicio · Coachify</title>
</svelte:head>

<div class="space-y-8">
  <!-- Cabecera: la jerarquía la marca el tipo, no la decoración -->
  <div>
    <span class="eyebrow capitalize">{hoy}</span>
    <h1 class="text-4xl font-display font-semibold tracking-tight mt-1.5">
      Hola{data.firstName ? ', ' + data.firstName : ''}
    </h1>
  </div>

  <!-- Acciones: tira compacta de texto, sin tarjetas ni iconos decorativos -->
  <nav class="flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-line py-3 text-sm">
    <span class="text-xs uppercase tracking-wider text-text-mute">Crear</span>
    <a href="/agenda?propose=1" class="font-medium hover:text-accent transition-colors">Cita</a>
    <a href="/templates?new=1" class="font-medium hover:text-accent transition-colors">Entrenamiento</a>
    <a href="/exercises/new" class="font-medium hover:text-accent transition-colors">Ejercicio</a>
    <a href="/clients?invite=1" class="font-medium hover:text-accent transition-colors">Invitar cliente</a>
  </nav>

  {#if !data.hasClients}
    <!-- Arranque en frío: qué gana y por dónde empezar, sin adornos -->
    <div class="card max-w-2xl space-y-4">
      <h2 class="text-2xl font-display font-semibold">Monta tu primer entreno en cinco minutos</h2>
      <p class="text-sm text-text-mute">
        El orden que funciona: carga la biblioteca de ejercicios, arma un entrenamiento
        con ellos y luego invita a tu primer cliente para asignárselo.
      </p>
      <div class="flex flex-wrap gap-3">
        <a href="/exercises" class="btn-primary">Cargar biblioteca base</a>
        <a href="/clients?invite=1" class="btn-ghost">Invitar cliente</a>
      </div>
    </div>
  {:else}
    <!-- ===== HOY ===== -->
    <section>
      <h2 class="text-lg font-display font-semibold mb-2">Hoy</h2>
      {#if data.todaySessions.length === 0}
        <p class="text-sm text-text-mute border-t border-line pt-3">
          Sin citas confirmadas para hoy.
        </p>
      {:else}
        <div class="border-t border-line">
          {#each data.todaySessions as s (s.id)}
            <div class="row">
              <span class="w-14 tabular-nums font-display font-semibold flex-shrink-0">
                {fmtTime(s.starts_at)}
              </span>
              <div class="flex-1 min-w-0">
                <div class="font-medium truncate">{s.client?.full_name ?? 'Cliente'}</div>
                <div class="text-xs text-text-mute">{modalityLabel[s.modality] ?? s.modality}</div>
              </div>
              {#if s.workout}
                <a href="/clients/{s.client_id}/workouts/{s.workout.date}"
                   class="text-xs text-accent hover:underline flex-shrink-0">
                  {s.workout.title ?? 'Ver entreno'} →
                </a>
              {:else}
                <span class="pill-warn flex-shrink-0">Sin entreno</span>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </section>

    <!-- ===== REQUIERE TU ATENCIÓN ===== -->
    {#if data.pendingRequests.length > 0 || data.clientsWithoutWorkout.length > 0}
      <section>
        <h2 class="text-lg font-display font-semibold mb-2">Requiere tu atención</h2>
        <div class="border-t border-line">
          {#each data.pendingRequests as s (s.id)}
            <a href="/agenda" class="row-link">
              <span class="pill-warn flex-shrink-0">Confirmar</span>
              <span class="flex-1 min-w-0 truncate">
                <span class="font-medium">{s.client?.full_name ?? 'Cliente'}</span>
                <span class="text-text-mute text-sm capitalize"> pidió cita · {fmtDay(s.starts_at)} {fmtTime(s.starts_at)}</span>
              </span>
              <span class="text-text-mute text-sm flex-shrink-0">→</span>
            </a>
          {/each}

          {#each data.clientsWithoutWorkout as c (c.id)}
            <a href="/clients/{c.id}" class="row-link">
              <span class="pill-mute flex-shrink-0">Programar</span>
              <span class="flex-1 min-w-0 truncate">
                <span class="font-medium">{c.full_name ?? 'Cliente'}</span>
                <span class="text-text-mute text-sm"> no tiene entrenos esta semana</span>
              </span>
              <span class="text-text-mute text-sm flex-shrink-0">→</span>
            </a>
          {/each}
        </div>
      </section>
    {/if}

    <!-- ===== ESPERANDO AL CLIENTE ===== -->
    {#if data.pendingProposals.length > 0}
      <section>
        <h2 class="text-lg font-display font-semibold mb-2">Esperando a que confirmen</h2>
        <div class="border-t border-line">
          {#each data.pendingProposals as s (s.id)}
            <div class="row text-sm">
              <span class="flex-1 min-w-0 truncate">
                <span class="font-medium">{s.client?.full_name ?? 'Cliente'}</span>
                <span class="text-text-mute capitalize"> · {fmtDay(s.starts_at)}</span>
              </span>
              <span class="text-xs text-text-mute flex-shrink-0">Pendiente del cliente</span>
            </div>
          {/each}
        </div>
      </section>
    {/if}
  {/if}
</div>
