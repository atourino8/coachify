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
</script>

<svelte:head>
  <title>Agenda · Coachify</title>
</svelte:head>

<div class="space-y-8 max-w-2xl">
  <div>
    <span class="eyebrow">Citas</span>
    <h1 class="text-4xl font-bold tracking-tight mt-2">Agenda</h1>
  </div>

  {#if form?.error}
    <p class="text-sm text-danger bg-danger/10 border border-danger/20 rounded-md p-3">{form.error}</p>
  {/if}

  <!-- Pendientes de confirmar -->
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
        <div class="card flex items-center justify-between gap-4">
          <div>
            <div class="font-semibold">{s.client?.full_name ?? 'Cliente'}</div>
            <div class="text-sm text-text-mute capitalize mt-0.5">{fmt(s.starts_at)}</div>
            <div class="text-xs text-text-mute mt-1">{modalityLabel[s.modality] ?? s.modality}</div>
          </div>
          <div class="flex flex-col gap-1.5">
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
