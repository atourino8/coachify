<script lang="ts">
  import { enhance } from '$app/forms';

  let { data, form } = $props();

  let selectedSlot = $state<string | null>(null);
  let modality = $state('presencial');
  let notes = $state('');
  let submitting = $state(false);

  const selected = $derived(
    data.bookable.find((s) => s.startsAt === selectedSlot) ?? null
  );

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
  const modalityLabel: Record<string, string> = {
    presencial: 'Presencial',
    online: 'Online',
    remoto: 'Remoto'
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
  <title>Calendario · Coachify</title>
</svelte:head>

<div class="space-y-8">
  <div>
    <span class="eyebrow">Tus citas</span>
    <h1 class="text-4xl font-bold tracking-tight mt-2">Calendario</h1>
  </div>

  {#if form?.error}
    <p class="text-sm text-danger bg-danger/10 border border-danger/20 rounded-md p-3">{form.error}</p>
  {/if}
  {#if form?.success && form?.requested}
    <p class="text-sm text-success bg-success/10 border border-success/20 rounded-md p-3">
      Cita solicitada. Tu entrenador la confirmará pronto.
    </p>
  {/if}

  {#if !data.hasCoach}
    <div class="card text-center py-16">
      <div class="text-6xl mb-4">🔗</div>
      <h2 class="text-xl font-semibold mb-2">Sin entrenador asignado</h2>
      <p class="text-sm text-text-mute max-w-md mx-auto">
        Cuando tu entrenador te vincule a su cuenta podrás solicitar citas aquí.
      </p>
    </div>
  {:else}
    <!-- Próximas citas -->
    <section class="space-y-3">
      <h2 class="text-lg font-semibold">Próximas citas</h2>
      {#if data.upcoming.length === 0}
        <p class="text-sm text-text-mute">No tienes citas próximas. Solicita una abajo.</p>
      {:else}
        {#each data.upcoming as s (s.id)}
          <div class="card space-y-3">
            <div class="flex items-center justify-between gap-4">
              <div>
                <div class="font-semibold capitalize">{fmt(s.starts_at)}</div>
                <div class="text-xs text-text-mute mt-1">
                  {modalityLabel[s.modality] ?? s.modality}{s.location ? ' · ' + s.location : ''}
                </div>
                {#if s.notes}<div class="text-xs text-text-mute mt-1 italic">{s.notes}</div>{/if}
              </div>
              <div class="flex flex-col items-end gap-2">
                <span class="text-xs px-2 py-1 rounded-full {statusClass[s.status]}">{statusLabel[s.status]}</span>
                <form method="POST" action="?/cancel" use:enhance>
                  <input type="hidden" name="session_id" value={s.id} />
                  <button type="submit" class="text-xs text-text-mute hover:text-danger transition-colors">
                    Cancelar
                  </button>
                </form>
              </div>
            </div>
            {#if s.workout}
              <a
                href="/today?date={s.workout.date}"
                class="flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-md px-3 py-2 hover:bg-primary/15 transition-colors"
              >
                <span class="text-lg">🏋️</span>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium truncate">{s.workout.title ?? 'Tu entreno'}</div>
                  <div class="text-xs text-text-mute">Entreno preparado para esta cita</div>
                </div>
                <span class="text-xs text-primary font-medium whitespace-nowrap">Ver →</span>
              </a>
            {/if}
          </div>
        {/each}
      {/if}
    </section>

    <!-- Solicitar cita -->
    <section class="space-y-3">
      <h2 class="text-lg font-semibold">Solicitar una cita</h2>
      {#if data.bookable.length === 0}
        <p class="text-sm text-text-mute">
          Tu entrenador no tiene huecos publicados por ahora. Vuelve más tarde.
        </p>
      {:else}
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {#each data.bookable as slot (slot.startsAt)}
            <button
              type="button"
              onclick={() => (selectedSlot = slot.startsAt)}
              class="card text-left text-sm capitalize transition-all {selectedSlot === slot.startsAt
                ? 'border-primary ring-2 ring-primary/20'
                : 'hover:border-primary/40'}"
            >
              {slot.label}
            </button>
          {/each}
        </div>

        {#if selected}
          <form method="POST" action="?/request" use:enhance={() => {
            submitting = true;
            return async ({ update }) => {
              await update();
              submitting = false;
              selectedSlot = null;
              notes = '';
            };
          }} class="card space-y-4 mt-2">
            <div class="font-semibold capitalize">{selected.label}</div>

            <div>
              <label for="modality" class="block text-xs uppercase tracking-wider text-text-mute mb-2">Modalidad</label>
              <select
                id="modality"
                bind:value={modality}
                name="modality"
                class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md focus:border-primary"
              >
                {#each selected.modalities as m}
                  <option value={m}>{modalityLabel[m] ?? m}</option>
                {/each}
              </select>
            </div>

            <div>
              <label for="notes" class="block text-xs uppercase tracking-wider text-text-mute mb-2">
                Nota (opcional)
              </label>
              <textarea
                id="notes"
                name="notes"
                bind:value={notes}
                rows="2"
                maxlength="300"
                placeholder="¿Algo que quieras comentarle a tu entrenador?"
                class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md focus:border-primary resize-none"
              ></textarea>
            </div>

            <input type="hidden" name="starts_at" value={selected.startsAt} />
            <input type="hidden" name="ends_at" value={selected.endsAt} />

            <button type="submit" disabled={submitting} class="btn-primary w-full">
              {submitting ? 'Enviando…' : 'Solicitar esta cita'}
            </button>
          </form>
        {/if}
      {/if}
    </section>

    <!-- Historial -->
    {#if data.past.length > 0}
      <section class="space-y-3">
        <h2 class="text-lg font-semibold">Historial</h2>
        {#each data.past as s (s.id)}
          <div class="flex items-center justify-between gap-4 text-sm py-2 border-b border-text-mute/10">
            <span class="text-text-mute capitalize">{fmt(s.starts_at)}</span>
            <span class="text-xs px-2 py-1 rounded-full {statusClass[s.status]}">{statusLabel[s.status]}</span>
          </div>
        {/each}
      </section>
    {/if}
  {/if}
</div>
