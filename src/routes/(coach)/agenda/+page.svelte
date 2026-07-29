<script lang="ts">
  import { enhance } from '$app/forms';

  let { data, form } = $props();

  // --- Proponer cita (coach) ---
  let showPropose = $state(false);
  let npClient = $state('');
  let npDate = $state('');
  let npTime = $state('');
  let npDur = $state('60');
  let npModality = $state('presencial');
  let npTemplate = $state('');
  let proposing = $state(false);

  // starts_at / ends_at en ISO, calculados en el navegador (zona horaria local
  // del coach = correcta). new Date('YYYY-MM-DDTHH:MM') se interpreta como local.
  const npStartsAt = $derived(
    npDate && npTime ? new Date(`${npDate}T${npTime}`).toISOString() : ''
  );
  const npEndsAt = $derived.by(() => {
    if (!npStartsAt) return '';
    const d = new Date(npStartsAt);
    d.setMinutes(d.getMinutes() + Number(npDur || 60));
    return d.toISOString();
  });

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

  // --- Reprogramar cita ---
  let editingId = $state<string | null>(null);
  let edDate = $state('');
  let edTime = $state('');
  let edDur = $state('60');

  const edStartsAt = $derived(edDate && edTime ? new Date(`${edDate}T${edTime}`).toISOString() : '');
  const edEndsAt = $derived.by(() => {
    if (!edStartsAt) return '';
    const d = new Date(edStartsAt);
    d.setMinutes(d.getMinutes() + Number(edDur || 60));
    return d.toISOString();
  });

  function openEdit(s: { id: string; starts_at: string; ends_at: string }) {
    const d = new Date(s.starts_at);
    const p = (n: number) => n.toString().padStart(2, '0');
    edDate = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
    edTime = `${p(d.getHours())}:${p(d.getMinutes())}`;
    const dur = Math.round((new Date(s.ends_at).getTime() - d.getTime()) / 60000);
    edDur = String(dur > 0 ? dur : 60);
    editingId = s.id;
  }

  // Fecha corta y legible para el desplegable de entrenos: "sáb 25 jul".
  function shortDate(iso: string): string {
    return new Date(iso + 'T00:00:00').toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  }

  // Etiqueta autogenerada de un entreno: "sáb 25 jul, Paco Paquez" y, si el
  // coach le puso título (ej. "día 1"), se añade detrás: "… · día 1".
  // El título que escribe el coach se guarda tal cual; esto es solo la etiqueta
  // que se muestra, así que reeditar no duplica el prefijo.
  function workoutLabel(date: string, clientName: string | null | undefined, title: string | null): string {
    const base = `${shortDate(date)}, ${clientName ?? 'Cliente'}`;
    return title && title.trim() ? `${base} · ${title.trim()}` : base;
  }

  // Entrenos de un cliente, siempre ordenados por fecha descendente (más
  // reciente primero) para que el orden del desplegable no varíe.
  function sortedWorkouts(clientId: string) {
    return [...(data.workoutsByClient[clientId] ?? [])].sort((a, b) =>
      b.date.localeCompare(a.date)
    );
  }
</script>

<svelte:head>
  <title>Agenda · Coachify</title>
</svelte:head>

{#snippet rescheduleBlock(s: (typeof data.pending)[number])}
  {#if editingId === s.id}
    <form method="POST" action="?/reschedule" use:enhance={() => {
      return async ({ update }) => { await update(); editingId = null; };
    }} class="border-t border-text-mute/10 pt-3 mt-1 flex flex-wrap items-end gap-2">
      <div>
        <label for="ed-date-{s.id}" class="block text-[10px] uppercase tracking-wider text-text-mute mb-1">Fecha</label>
        <input id="ed-date-{s.id}" type="date" bind:value={edDate} required
          class="px-2 py-1.5 bg-bg border border-text-mute/20 rounded-md text-sm focus:border-primary" />
      </div>
      <div>
        <label for="ed-time-{s.id}" class="block text-[10px] uppercase tracking-wider text-text-mute mb-1">Hora</label>
        <input id="ed-time-{s.id}" type="time" bind:value={edTime} required
          class="px-2 py-1.5 bg-bg border border-text-mute/20 rounded-md text-sm focus:border-primary" />
      </div>
      <div>
        <label for="ed-dur-{s.id}" class="block text-[10px] uppercase tracking-wider text-text-mute mb-1">Duración</label>
        <select id="ed-dur-{s.id}" bind:value={edDur}
          class="px-2 py-1.5 bg-bg border border-text-mute/20 rounded-md text-sm focus:border-primary">
          <option value="30">30</option><option value="45">45</option>
          <option value="60">60</option><option value="90">90</option>
        </select>
      </div>
      <input type="hidden" name="session_id" value={s.id} />
      <input type="hidden" name="starts_at" value={edStartsAt} />
      <input type="hidden" name="ends_at" value={edEndsAt} />
      <button type="submit" disabled={!edStartsAt} class="btn-primary text-sm py-1.5 px-3">Guardar</button>
      <button type="button" onclick={() => (editingId = null)} class="text-xs text-text-mute hover:text-text">Cancelar</button>
    </form>
  {:else}
    <button type="button" onclick={() => openEdit(s)} class="text-xs text-text-mute hover:text-primary transition-colors">
      ✎ Cambiar fecha/hora
    </button>
  {/if}
{/snippet}

{#snippet workoutBlock(s: (typeof data.pending)[number])}
  {@const clientWorkouts = sortedWorkouts(s.client_id)}
  <div class="border-t border-text-mute/10 pt-3 mt-1">
    {#if s.workout}
      <!-- Ya tiene entreno ligado -->
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-2 text-sm min-w-0">
          <span class="text-primary">🏋️</span>
          <span class="font-medium truncate">{workoutLabel(s.workout.date, s.client?.full_name, s.workout.title)}</span>
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
      <!-- Sin entreno: usar plantilla, asignar existente, o crear desde cero -->
      <div class="space-y-2">
        <span class="text-xs uppercase tracking-wider text-text-mute">Entreno de la cita</span>

        {#if data.templates.length > 0}
          <form method="POST" action="?/assignTemplate" use:enhance class="flex items-center gap-2">
            <input type="hidden" name="session_id" value={s.id} />
            <select name="template_id" required
              class="flex-1 px-3 py-1.5 bg-bg border border-text-mute/20 rounded-md text-sm focus:border-primary">
              <option value="" disabled selected>📋 Usar una plantilla…</option>
              {#each data.templates as t (t.id)}
                <option value={t.id}>{t.name} ({t.itemCount} ej.)</option>
              {/each}
            </select>
            <button type="submit" class="text-xs text-primary hover:underline whitespace-nowrap">Usar</button>
          </form>
        {/if}

        {#if clientWorkouts.length > 0}
          <form method="POST" action="?/assignWorkout" use:enhance class="flex items-center gap-2">
            <input type="hidden" name="session_id" value={s.id} />
            <select name="workout_id" required
              class="flex-1 px-3 py-1.5 bg-bg border border-text-mute/20 rounded-md text-sm focus:border-primary">
              <option value="" disabled selected>Asignar un entreno existente…</option>
              {#each clientWorkouts as w (w.id)}
                <option value={w.id}>{workoutLabel(w.date, s.client?.full_name, w.title)}</option>
              {/each}
            </select>
            <button type="submit" class="text-xs text-primary hover:underline whitespace-nowrap">Asignar</button>
          </form>
        {/if}

        <a
          href="/clients/{s.client_id}/workouts/{sessionDate(s.starts_at)}?session={s.id}"
          class="inline-block text-xs text-primary hover:underline"
        >
          + Crear entreno desde cero
        </a>
      </div>
    {/if}
  </div>
{/snippet}

<div class="space-y-8 max-w-2xl">
  <div class="flex items-start justify-between gap-4">
    <div>
      <span class="eyebrow">Citas</span>
      <h1 class="text-4xl font-bold tracking-tight mt-2">Agenda</h1>
    </div>
    <div class="flex items-center gap-3">
      <a href="/availability" class="text-sm text-text-mute hover:text-primary transition-colors whitespace-nowrap">⚙ Mis huecos</a>
      {#if data.clients.length > 0}
        <button onclick={() => (showPropose = !showPropose)} class="btn-primary py-2 px-4 whitespace-nowrap">
          + Proponer cita
        </button>
      {/if}
    </div>
  </div>

  {#if form?.error}
    <p class="text-sm text-danger bg-danger/10 border border-danger/20 rounded-md p-3">{form.error}</p>
  {/if}
  {#if form?.success && form?.proposed}
    <p class="text-sm text-success bg-success/10 border border-success/20 rounded-md p-3">
      Cita propuesta. El cliente la verá y podrá confirmarla.
    </p>
  {/if}

  {#if showPropose}
    <form
      method="POST"
      action="?/createSession"
      use:enhance={() => {
        proposing = true;
        return async ({ update }) => {
          await update();
          proposing = false;
          npClient = ''; npDate = ''; npTime = ''; npTemplate = '';
          showPropose = false;
        };
      }}
      class="card space-y-4"
    >
      <h2 class="font-semibold">Proponer una cita</h2>
      <div class="grid sm:grid-cols-2 gap-3">
        <div>
          <label for="np-client" class="block text-xs uppercase tracking-wider text-text-mute mb-2">Cliente</label>
          <select id="np-client" bind:value={npClient} name="client_id" required
            class="w-full px-3 py-2.5 bg-bg border border-text-mute/20 rounded-md text-sm focus:border-primary">
            <option value="" disabled>Elige un cliente…</option>
            {#each data.clients as c (c.id)}<option value={c.id}>{c.full_name ?? 'Cliente'}</option>{/each}
          </select>
        </div>
        <div>
          <label for="np-mod" class="block text-xs uppercase tracking-wider text-text-mute mb-2">Modalidad</label>
          <select id="np-mod" bind:value={npModality}
            class="w-full px-3 py-2.5 bg-bg border border-text-mute/20 rounded-md text-sm focus:border-primary">
            <option value="presencial">Presencial</option>
            <option value="online">Online</option>
          </select>
        </div>
        <div>
          <label for="np-date" class="block text-xs uppercase tracking-wider text-text-mute mb-2">Fecha</label>
          <input id="np-date" type="date" bind:value={npDate} required
            class="w-full px-3 py-2.5 bg-bg border border-text-mute/20 rounded-md text-sm focus:border-primary" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label for="np-time" class="block text-xs uppercase tracking-wider text-text-mute mb-2">Hora</label>
            <input id="np-time" type="time" bind:value={npTime} required
              class="w-full px-3 py-2.5 bg-bg border border-text-mute/20 rounded-md text-sm focus:border-primary" />
          </div>
          <div>
            <label for="np-dur" class="block text-xs uppercase tracking-wider text-text-mute mb-2">Duración</label>
            <select id="np-dur" bind:value={npDur}
              class="w-full px-3 py-2.5 bg-bg border border-text-mute/20 rounded-md text-sm focus:border-primary">
              <option value="30">30 min</option><option value="45">45 min</option>
              <option value="60">60 min</option><option value="90">90 min</option>
            </select>
          </div>
        </div>
      </div>
      {#if data.templates.length > 0}
        <div>
          <label for="np-tpl" class="block text-xs uppercase tracking-wider text-text-mute mb-2">Entreno (opcional)</label>
          <select id="np-tpl" bind:value={npTemplate} name="template_id"
            class="w-full px-3 py-2.5 bg-bg border border-text-mute/20 rounded-md text-sm focus:border-primary">
            <option value="">Sin entreno por ahora</option>
            {#each data.templates as t (t.id)}<option value={t.id}>📋 {t.name} ({t.itemCount} ej.)</option>{/each}
          </select>
        </div>
      {/if}
      <input type="hidden" name="starts_at" value={npStartsAt} />
      <input type="hidden" name="ends_at" value={npEndsAt} />
      <button type="submit" disabled={proposing || !npClient || !npStartsAt} class="btn-primary w-full">
        {proposing ? 'Proponiendo…' : 'Proponer cita al cliente'}
      </button>
    </form>
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
            <span class="text-xs px-2 py-1 rounded-full {s.proposedByCoach ? 'bg-primary/15 text-primary' : statusClass[s.status]}">
              {s.proposedByCoach ? 'Esperando al cliente' : statusLabel[s.status]}
            </span>
          </div>

          {#if s.proposedByCoach}
            <!-- La propuso el coach: no la confirma él, solo puede cancelarla. -->
            <div class="flex items-center justify-between gap-2">
              <p class="text-xs text-text-mute">Tu cliente debe confirmarla o rechazarla.</p>
              <form method="POST" action="?/cancel" use:enhance>
                <input type="hidden" name="session_id" value={s.id} />
                <button type="submit" class="text-xs text-text-mute hover:text-danger transition-colors">Cancelar propuesta</button>
              </form>
            </div>
          {:else}
            <!-- La pidió el cliente: el coach confirma o rechaza. -->
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
          {/if}
          {@render workoutBlock(s)}
          {@render rescheduleBlock(s)}
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
          {@render rescheduleBlock(s)}
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
