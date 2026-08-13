<script lang="ts">
  import { enhance } from '$app/forms';
  import { cancelarSeriaTarde, estadoDeClase, DIAS_DE_AVISO } from '$lib/clases';
  import { page } from '$app/state';

  let { data, form } = $props();

  let selectedSlot = $state<string | null>(null);
  let modality = $state('presencial');
  let notes = $state('');
  let submitting = $state(false);

  // Modal "Pedir cita" (se abre solo con ?request=1 desde el home).
  // svelte-ignore state_referenced_locally
  let showRequest = $state(page.url.searchParams.get('request') === '1');
  // Historial colapsado por defecto (menos prominente).
  let showHistory = $state(false);

  const selected = $derived(data.bookable.find((s) => s.startsAt === selectedSlot) ?? null);

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

  // Clases grupales. La cuenta atrás de «cancelar tarde» se calcula en el
  // navegador con la MISMA regla que aplica la base al cancelar, para que el
  // aviso salga antes de pulsar y no después.
  const clasesFuturas = $derived(data.clases ?? []);

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
  <title>Citas · Treno</title>
</svelte:head>

<div class="space-y-8">
  <div class="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
    <div class="min-w-0">
      <span class="eyebrow">Tu agenda</span>
      <h1 class="text-2xl sm:text-3xl font-display font-semibold tracking-tight mt-2">Citas</h1>
    </div>
    {#if data.hasCoach}
      <button onclick={() => (showRequest = true)} class="btn-primary whitespace-nowrap"
        >+ Pedir cita</button
      >
    {/if}
  </div>

  {#if form?.error}
    <p role="alert" class="text-sm text-danger bg-danger/10 border border-danger/20 rounded-md p-3">
      {form.error}
    </p>
  {/if}
  {#if form?.success && form?.apuntado}
    <p
      aria-live="polite"
      class="text-sm text-success bg-success/10 border border-success/20 rounded-md p-3"
    >
      Tienes plaza. Si no puedes ir, avisa con {DIAS_DE_AVISO} días para que la coja otro.
    </p>
  {/if}
  {#if form?.success && form?.enEspera}
    <p
      aria-live="polite"
      class="text-sm text-warning bg-warning/10 border border-warning/20 rounded-md p-3"
    >
      La clase está completa: estás en la lista de espera. Si alguien suelta su plaza y eres el
      primero, entras automáticamente.
    </p>
  {/if}
  {#if form?.success && form?.salido}
    <p
      aria-live="polite"
      class="text-sm {form.tarde
        ? 'text-warning bg-warning/10 border-warning/20'
        : 'text-success bg-success/10 border-success/20'} border rounded-md p-3"
    >
      {#if form.tarde}
        Fuera de la clase. Como quedaban menos de {DIAS_DE_AVISO} días, le consta a tu entrenador.
      {:else}
        Fuera de la clase. Gracias por avisar con tiempo.
      {/if}
    </p>
  {/if}
  {#if form?.success && form?.requested}
    <p
      aria-live="polite"
      class="text-sm text-success bg-success/10 border border-success/20 rounded-md p-3"
    >
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
    <!-- Propuestas del coach por confirmar (arriba del todo) -->
    {#if data.proposals.length > 0}
      <section class="space-y-3">
        <h2 class="text-lg font-semibold flex items-center gap-2">
          Propuestas de tu coach
          <span class="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary"
            >{data.proposals.length}</span
          >
        </h2>
        {#each data.proposals as s (s.id)}
          <div class="card space-y-3 border-primary/30 bg-primary/5">
            <div class="flex items-center justify-between gap-4">
              <div>
                <div class="font-semibold capitalize">{fmt(s.starts_at)}</div>
                <div class="text-xs text-text-mute mt-1">
                  {modalityLabel[s.modality] ?? s.modality}{s.location ? ' · ' + s.location : ''}
                </div>
                {#if s.notes}<div class="text-xs text-text-mute mt-1 italic">{s.notes}</div>{/if}
              </div>
              <span
                class="text-xs px-2 py-1 rounded-full bg-primary/15 text-primary whitespace-nowrap"
                >Nueva propuesta</span
              >
            </div>

            {#if s.workout}
              <a
                href="/today?date={s.workout.date}"
                class="flex items-center gap-3 bg-bg/60 border border-primary/20 rounded-md px-3 py-2 hover:bg-bg transition-colors"
              >
                <span class="text-lg">🏋️</span>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium truncate">{s.workout.title ?? 'Tu entreno'}</div>
                  <div class="text-xs text-text-mute">Mira el entreno antes de confirmar</div>
                </div>
                <span class="text-xs text-primary font-medium whitespace-nowrap">Ver →</span>
              </a>
            {/if}

            <div class="flex gap-2">
              <form method="POST" action="?/confirm" use:enhance class="flex-1">
                <input type="hidden" name="session_id" value={s.id} />
                <button type="submit" class="btn-primary w-full text-sm py-2">Confirmar cita</button
                >
              </form>
              <form method="POST" action="?/reject" use:enhance>
                <input type="hidden" name="session_id" value={s.id} />
                <button
                  type="submit"
                  class="px-4 py-2 text-sm rounded-md border border-danger/30 text-danger hover:bg-danger/10 transition-colors"
                >
                  Rechazar
                </button>
              </form>
            </div>
          </div>
        {/each}
      </section>
    {/if}

    <!-- Próximas citas (confirmadas o pedidas por el cliente) -->
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
                <span class="text-xs px-2 py-1 rounded-full {statusClass[s.status]}"
                  >{statusLabel[s.status]}</span
                >
                <form method="POST" action="?/cancel" use:enhance>
                  <input type="hidden" name="session_id" value={s.id} />
                  <button
                    type="submit"
                    class="text-xs text-text-mute hover:text-danger transition-colors"
                    >Cancelar</button
                  >
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

    <!-- Clases grupales. Van DEBAJO de las citas porque una cita ya es suya y
         una clase todavía hay que cogerla: lo propio antes que lo disponible. -->
    {#if clasesFuturas.length > 0}
      <section class="space-y-3">
        <h2 class="text-lg font-semibold">Clases</h2>
        {#if data.misFaltas > 0}
          <p class="text-xs text-warning">
            Has soltado la plaza tarde {data.misFaltas}
            {data.misFaltas === 1 ? 'vez' : 'veces'} en los últimos meses. Avisar con {DIAS_DE_AVISO}
            días deja la plaza libre para otro.
          </p>
        {/if}

        {#each clasesFuturas as c (c.id)}
          {@const estado = estadoDeClase(c, c.ocupadas)}
          <div class="card space-y-3">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="font-semibold">{c.title}</div>
                <div class="text-xs text-text-mute mt-1 capitalize">
                  {fmt(c.starts_at)}{c.location ? ' · ' + c.location : ''}
                </div>
                {#if c.notes}
                  <div class="text-xs text-text-mute mt-1 italic">{c.notes}</div>
                {/if}
              </div>
              <div class="text-right flex-shrink-0">
                {#if estado.cancelada}
                  <span class="text-xs px-2 py-1 rounded-full bg-danger/15 text-danger">
                    Cancelada
                  </span>
                {:else if c.inscripcion === 'seat'}
                  <span class="text-xs px-2 py-1 rounded-full bg-success/15 text-success">
                    Tienes plaza
                  </span>
                {:else if c.inscripcion === 'waitlist'}
                  <span class="text-xs px-2 py-1 rounded-full bg-warning/15 text-warning">
                    En lista de espera
                  </span>
                {:else}
                  <span class="text-xs text-text-mute tabular-nums">
                    {estado.libres === 0
                      ? 'Completa'
                      : `${estado.libres} ${estado.libres === 1 ? 'plaza' : 'plazas'}`}
                  </span>
                {/if}
              </div>
            </div>

            {#if !estado.cancelada}
              {#if c.inscripcion}
                <form method="POST" action="?/salirse" use:enhance class="flex items-center gap-3">
                  <input type="hidden" name="class_id" value={c.id} />
                  <button type="submit" class="action-neutral">
                    {c.inscripcion === 'seat' ? 'Soltar la plaza' : 'Salir de la lista'}
                  </button>
                  <!-- El aviso va JUNTO al botón y no en el mensaje de después:
                       para que sirva de algo tiene que leerse antes de pulsar. -->
                  {#if c.inscripcion === 'seat' && cancelarSeriaTarde(c.starts_at)}
                    <span class="text-xs text-warning">
                      Quedan menos de {DIAS_DE_AVISO} días: le constará a tu entrenador.
                    </span>
                  {/if}
                </form>
              {:else if data.acceso.pausado}
                <!-- Con el acceso en pausa el botón fallaría en el servidor.
                     Se dice antes de pulsar, que es cuando sirve de algo. -->
                <p class="text-xs text-text-mute">
                  Tu acceso está en pausa: habla con tu entrenador para apuntarte.
                </p>
              {:else}
                <form method="POST" action="?/apuntarse" use:enhance>
                  <input type="hidden" name="class_id" value={c.id} />
                  <button type="submit" class={estado.llena ? 'action-neutral' : 'btn-primary'}>
                    {estado.llena ? 'Apuntarme a la lista de espera' : 'Apuntarme'}
                  </button>
                </form>
              {/if}
            {/if}
          </div>
        {/each}
      </section>
    {/if}

    <!-- Historial (colapsado, menos prominente) -->
    {#if data.past.length > 0}
      <section>
        <button
          type="button"
          onclick={() => (showHistory = !showHistory)}
          class="text-sm text-text-mute hover:text-text transition-colors flex items-center gap-1.5"
          aria-expanded={showHistory}
        >
          <svg
            class="h-4 w-4 transition-transform {showHistory ? 'rotate-90' : ''}"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
            ><path d="m9 6 6 6-6 6" stroke-linecap="round" stroke-linejoin="round" /></svg
          >
          {showHistory ? 'Ocultar' : 'Ver'} historial ({data.past.length})
        </button>
        {#if showHistory}
          <div class="mt-3 space-y-0">
            {#each data.past as s (s.id)}
              <div
                class="flex items-center justify-between gap-4 text-sm py-2 border-b border-line"
              >
                <span class="text-text-mute capitalize">{fmt(s.starts_at)}</span>
                <span class="text-xs px-2 py-1 rounded-full {statusClass[s.status]}"
                  >{statusLabel[s.status]}</span
                >
              </div>
            {/each}
          </div>
        {/if}
      </section>
    {/if}
  {/if}
</div>

<!-- Modal: pedir cita -->
<svelte:window
  onkeydown={(e) => {
    if (showRequest && e.key === 'Escape') showRequest = false;
  }}
/>
{#if showRequest}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-[200] grid place-items-center bg-black/60 backdrop-blur-sm p-4"
    role="presentation"
    onclick={() => (showRequest = false)}
  >
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
    <div
      class="card w-full max-w-lg max-h-[85vh] overflow-y-auto space-y-4"
      role="dialog"
      tabindex="-1"
      aria-modal="true"
      aria-labelledby="req-title"
      onclick={(e) => e.stopPropagation()}
    >
      <div class="flex items-center justify-between gap-4">
        <h3 id="req-title" class="text-lg font-semibold">Pedir cita</h3>
        <button type="button" class="action-neutral" onclick={() => (showRequest = false)}
          >Cerrar</button
        >
      </div>

      {#if data.bookable.length === 0}
        <p class="text-sm text-text-mute">
          Tu entrenador no tiene huecos publicados por ahora. Vuelve más tarde.
        </p>
      {:else}
        <div>
          <p class="text-xs uppercase tracking-wider text-text-mute mb-2">Elige un hueco</p>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {#each data.bookable as slot (slot.startsAt)}
              <button
                type="button"
                onclick={() => (selectedSlot = slot.startsAt)}
                class="card p-3 text-left text-sm capitalize transition-all {selectedSlot ===
                slot.startsAt
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'hover:border-primary/40'}"
              >
                {slot.label}
              </button>
            {/each}
          </div>
        </div>

        {#if selected}
          <form
            method="POST"
            action="?/request"
            use:enhance={() => {
              submitting = true;
              return async ({ update }) => {
                await update();
                submitting = false;
                selectedSlot = null;
                notes = '';
                showRequest = false;
              };
            }}
            class="space-y-4 border-t border-text-mute/10 pt-4"
          >
            <div class="font-semibold capitalize">{selected.label}</div>

            <div>
              <label
                for="modality"
                class="block text-xs uppercase tracking-wider text-text-mute mb-2">Modalidad</label
              >
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
    </div>
  </div>
{/if}
