<script lang="ts">
  import { enhance } from '$app/forms';

  let { data, form } = $props();

  const modalityLabel: Record<string, string> = {
    presencial: 'Presencial',
    online: 'Online',
    remoto: 'Remoto'
  };
  const statusLabel: Record<string, string> = {
    requested: 'Pendiente',
    confirmed: 'Confirmada',
    rejected: 'Rechazada',
    cancelled: 'Cancelada',
    completed: 'Completada'
  };
  const statusClass: Record<string, string> = {
    requested: 'bg-warning/15 text-warning',
    confirmed: 'bg-success/15 text-success',
    rejected: 'bg-danger/15 text-danger',
    cancelled: 'bg-text-mute/15 text-text-mute',
    completed: 'bg-primary/15 text-primary'
  };

  function fmt(iso: string) {
    return new Date(iso).toLocaleString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Fecha local (YYYY-MM-DD) de una cita, para enlazar al constructor de ese día.
  function sessionDate(iso: string): string {
    const d = new Date(iso);
    const p = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }
</script>

<svelte:head>
  <title>Agenda · Coachify</title>
</svelte:head>

{#snippet workoutBlock(s: (typeof data.pending)[number])}
  {@const clientWorkouts = data.workoutsByClient[s.client_id] ?? []}
  <div class="border-t border-text-mute/10 pt-3 mt-1">
    {#if s.workout}
      <!-- Ya tiene entreno ligado -->
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-2 text-sm min-w-0">
          <span class="text-primary">🏋️</span>
          <span class="font-medium truncate">{s.workout.title ?? 'Entreno'}</span>
          <span class="text-xs text-text-mute">({s.workout.date})</span>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0">
          <a href="/clients/{s.client_id}/workouts/{s.workout.date}" class="text-xs text-primary hover:underline">
            Editar
          </a>
          <form method="POST" action="?/unassignWorkout" use:enhance>
            <input type="hidden" name="session_id" value={s.id} />
            <button type="submit" class="text-xs text-text-mute hover:text-danger">Quitar</button>
          </form>
        </div>
      </div>
    {:else}
      <!-- Sin entreno: asignar existente o crear desde la cita -->
      <div class="flex flex-col sm:flex-row sm:items-center gap-2">
        <span class="text-xs uppercase tracking-wider text-text-mute">Entreno</span>
        {#if clientWorkouts.length > 0}
          <form method="POST" action="?/assignWorkout" use:enhance class="flex items-center gap-2 flex-1">
            <input type="hidden" name="session_id" value={s.id} />
            <select name="workout_id" required
              class="flex-1 px-3 py-1.5 bg-bg border border-text-mute/20 rounded-md text-sm focus:border-primary">
              <option value="" disabled selected>Asignar uno existente…</option>
              {#each clientWorkouts as w (w.id)}
                <option value={w.id}>{w.date} · {w.title ?? 'Entreno'}</option>
              {/each}
            </select>
            <button type="submit" class="text-xs text-primary hover:underline whitespace-nowrap">Asignar</button>
          </form>
        {/if}
        <a
          href="/clients/{s.client_id}/workouts/{sessionDate(s.starts_at)}?session={s.id}"
          class="text-xs text-primary hover:underline whitespace-nowrap"
        >
          + Crear desde esta cita
        </a>
      </div>
    {/if}
  </div>
{/snippet}

<div class="space-y-8 max-w-2xl">
  <div>
    <span class="eyebrow">Citas</span>
    <h1 class="text-4xl font-bold tracking-tight mt-2">Agenda</h1>
  </div>

  {#if form?.error}
    <p class="text-sm text-danger bg-danger/10 border border-danger/20 rounded-md p-3">{form.error}</p>
  {/if}

  <!-- Pendientes -->
  <section class="space-y-3">
    <h2 class="text-lg font-semibold flex items-center gap-2">
      Pendientes
      {#if data.pending.length > 0}
        <span class="text-xs px-2 py-0.5 rounded-full bg-warning/15 text-warning">{data.pending.length}</span>
      {/if}
    </h2>
    {#if data.pending.length === 0}
      <p class="text-sm text-text-mute">No hay solicitudes pendientes.</p>
    {:else}
      {#each data.pending as s (s.id)}
        <div class="card space-y-3">
          <div class="flex items-start justify-between gap-4">
            <div>
              <div class="font-semibold">{s.client?.full_name ?? 'Cliente'}</div>
              <div class="text-sm text-text-mute capitalize mt-0.5">{fmt(s.starts_at)}</div>
              <div class="text-xs text-text-mute mt-1">{modalityLabel[s.modality] ?? s.modality}</div>
              {#if s.notes}<div class="text-sm mt-2 bg-bg rounded-md p-2 italic">{s.notes}</div>{/if}
            </div>
            <span class="text-xs px-2 py-1 rounded-full {statusClass[s.status]}">{statusLabel[s.status]}</span>
          </div>
          <div class="flex gap-2">
            <form method="POST" action="?/confirm" use:enhance class="flex-1">
              <input type="hidden" name="session_id" value={s.id} />
              <button type="submit" class="btn-primary w-full text-sm py-2">Confirmar</button>
            </form>
            <form method="POST" action="?/reject" use:enhance>
              <input type="hidden" name="session_id" value={s.id} />
              <button type="submit" class="px-4 py-2 text-sm rounded-md border border-danger/30 text-danger hover:bg-danger/10 transition-colors">
                Rechazar
              </button>
            </form>
          </div>
          {@render workoutBlock(s)}
        </div>
      {/each}
    {/if}
  </section>

  <!-- Confirmadas próximas -->
  <section class="space-y-3">
    <h2 class="text-lg font-semibold">Próximas confirmadas</h2>
    {#if data.confirmed.length === 0}
      <p class="text-sm text-text-mute">No hay citas confirmadas próximas.</p>
    {:else}
      {#each data.confirmed as s (s.id)}
        <div class="card space-y-3">
          <div class="flex items-center justify-between gap-4">
            <div>
              <div class="font-semibold">{s.client?.full_name ?? 'Cliente'}</div>
              <div class="text-sm text-text-mute capitalize mt-0.5">{fmt(s.starts_at)}</div>
              <div class="text-xs text-text-mute mt-1">{modalityLabel[s.modality] ?? s.modality}</div>
            </div>
            <div class="flex flex-col gap-1.5 items-end">
              <form method="POST" action="?/complete" use:enhance>
                <input type="hidden" name="session_id" value={s.id} />
                <button type="submit" class="text-xs text-primary hover:underline">Marcar hecha</button>
              </form>
              <form method="POST" action="?/cancel" use:enhance>
                <input type="hidden" name="session_id" value={s.id} />
                <button type="submit" class="text-xs text-text-mute hover:text-danger transition-colors">Cancelar</button>
              </form>
            </div>
          </div>
          {@render workoutBlock(s)}
        </div>
      {/each}
    {/if}
  </section>

  <!-- Historial -->
  {#if data.history.length > 0}
    <section class="space-y-3">
      <h2 class="text-lg font-semibold">Historial</h2>
      {#each data.history as s (s.id)}
        <div class="flex items-center justify-between gap-4 text-sm py-2 border-b border-text-mute/10">
          <span class="capitalize">{s.client?.full_name ?? 'Cliente'} · <span class="text-text-mute">{fmt(s.starts_at)}</span></span>
          <span class="text-xs px-2 py-1 rounded-full {statusClass[s.status]}">{statusLabel[s.status]}</span>
        </div>
      {/each}
    </section>
  {/if}
</div>
