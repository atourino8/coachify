<script lang="ts">
  import { diaConSemana } from '$lib/formato';
  import { enhance } from '$app/forms';
  import { page } from '$app/state';
  import ConfirmModal from '$lib/components/ConfirmModal.svelte';

  let { data, form } = $props();

  // Timeline único: pendientes + confirmadas próximas, ordenadas cronológicamente.
  const upcoming = $derived(
    [...data.pending, ...data.confirmed].sort((a, b) => a.starts_at.localeCompare(b.starts_at))
  );

  // Etiqueta de estado para cada fila del timeline.
  function badge(s: { status: string; proposedByCoach: boolean }) {
    if (s.status === 'confirmed') return { label: 'Confirmada', cls: 'bg-success/15 text-success' };
    if (s.proposedByCoach)
      return { label: 'Esperando al cliente', cls: 'bg-primary/15 text-primary' };
    return { label: 'Pendiente', cls: 'bg-warning/15 text-warning' };
  }

  function clientName(s: { client: { full_name: string | null } | null }) {
    return s.client?.full_name ?? 'el cliente';
  }

  // --- Modal de confirmación reutilizable ---
  type ConfirmData = {
    action: string;
    fields: Record<string, string>;
    title: string;
    message: string;
    confirmLabel: string;
    danger: boolean;
  };
  let confirmOpen = $state(false);
  let confirmData = $state<ConfirmData>({
    action: '',
    fields: {},
    title: '',
    message: '',
    confirmLabel: 'Confirmar',
    danger: true
  });
  function ask(d: Partial<ConfirmData> & { action: string }) {
    confirmData = {
      fields: {},
      title: '',
      message: '',
      confirmLabel: 'Confirmar',
      danger: true,
      ...d
    };
    confirmOpen = true;
  }

  // --- Menú de acciones (⋮) y paneles colapsables por fila ---
  let openMenu = $state<string | null>(null); // id de la cita con el menú abierto
  let showWorkout = $state<string | null>(null); // id de la cita con el panel "asignar entreno" abierto

  // --- Proponer cita (coach) ---
  // Se abre solo si venimos con ?propose=1 (atajo desde el home).
  // svelte-ignore state_referenced_locally
  let showPropose = $state(page.url.searchParams.get('propose') === '1');
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

  const edStartsAt = $derived(
    edDate && edTime ? new Date(`${edDate}T${edTime}`).toISOString() : ''
  );
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

  // Etiqueta autogenerada de un entreno: "sáb 25 jul, Paco Paquez" y, si el
  // coach le puso título (ej. "día 1"), se añade detrás: "… · día 1".
  // El título que escribe el coach se guarda tal cual; esto es solo la etiqueta
  // que se muestra, así que reeditar no duplica el prefijo.
  function workoutLabel(
    date: string,
    clientName: string | null | undefined,
    title: string | null
  ): string {
    const base = `${diaConSemana(date)}, ${clientName ?? 'Cliente'}`;
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
  <title>Agenda · Treno</title>
</svelte:head>

{#snippet rescheduleBlock(s: (typeof data.pending)[number])}
  {#if editingId === s.id}
    <form
      method="POST"
      action="?/reschedule"
      use:enhance={() => {
        return async ({ update }) => {
          await update();
          editingId = null;
        };
      }}
      class="border-t border-text-mute/10 pt-3 mt-1 flex flex-wrap items-end gap-2"
    >
      <div>
        <label
          for="ed-date-{s.id}"
          class="block text-3xs uppercase tracking-wider text-text-mute mb-1">Fecha</label
        >
        <input
          id="ed-date-{s.id}"
          type="date"
          bind:value={edDate}
          required
          class="px-2 py-1.5 bg-bg border border-text-mute/20 rounded-md text-sm focus:border-primary"
        />
      </div>
      <div>
        <label
          for="ed-time-{s.id}"
          class="block text-3xs uppercase tracking-wider text-text-mute mb-1">Hora</label
        >
        <input
          id="ed-time-{s.id}"
          type="time"
          bind:value={edTime}
          required
          class="px-2 py-1.5 bg-bg border border-text-mute/20 rounded-md text-sm focus:border-primary"
        />
      </div>
      <div>
        <label
          for="ed-dur-{s.id}"
          class="block text-3xs uppercase tracking-wider text-text-mute mb-1">Duración</label
        >
        <select
          id="ed-dur-{s.id}"
          bind:value={edDur}
          class="px-2 py-1.5 bg-bg border border-text-mute/20 rounded-md text-sm focus:border-primary"
        >
          <option value="30">30</option><option value="45">45</option>
          <option value="60">60</option><option value="90">90</option>
        </select>
      </div>
      <input type="hidden" name="session_id" value={s.id} />
      <input type="hidden" name="starts_at" value={edStartsAt} />
      <input type="hidden" name="ends_at" value={edEndsAt} />
      <button type="submit" disabled={!edStartsAt} class="btn-primary text-sm py-1.5 px-3"
        >Guardar</button
      >
      <button
        type="button"
        onclick={() => (editingId = null)}
        class="text-xs text-text-mute hover:text-text">Cancelar</button
      >
    </form>
  {/if}
{/snippet}

{#snippet workoutBlock(s: (typeof data.pending)[number])}
  {@const clientWorkouts = sortedWorkouts(s.client_id)}
  <div class="border-t border-text-mute/10 pt-3 mt-2 space-y-2">
    <span class="text-xs uppercase tracking-wider text-text-mute">Asignar entreno</span>

    {#if data.templates.length > 0}
      <form method="POST" action="?/assignTemplate" use:enhance class="flex items-center gap-2">
        <input type="hidden" name="session_id" value={s.id} />
        <select
          name="template_id"
          required
          class="flex-1 px-3 py-1.5 bg-bg border border-text-mute/20 rounded-md text-sm focus:border-primary"
        >
          <option value="" disabled selected>Usar un entrenamiento…</option>
          {#each data.templates as t (t.id)}
            <option value={t.id}>{t.name} ({t.itemCount} ej.)</option>
          {/each}
        </select>
        <button type="submit" class="text-xs text-primary hover:underline whitespace-nowrap"
          >Usar</button
        >
      </form>
    {/if}

    {#if clientWorkouts.length > 0}
      <form method="POST" action="?/assignWorkout" use:enhance class="flex items-center gap-2">
        <input type="hidden" name="session_id" value={s.id} />
        <select
          name="workout_id"
          required
          class="flex-1 px-3 py-1.5 bg-bg border border-text-mute/20 rounded-md text-sm focus:border-primary"
        >
          <option value="" disabled selected>Asignar un entreno existente…</option>
          {#each clientWorkouts as w (w.id)}
            <option value={w.id}>{workoutLabel(w.date, s.client?.full_name, w.title)}</option>
          {/each}
        </select>
        <button type="submit" class="text-xs text-primary hover:underline whitespace-nowrap"
          >Asignar</button
        >
      </form>
    {/if}

    <a
      href="/clients/{s.client_id}/workouts/{sessionDate(s.starts_at)}?session={s.id}"
      class="inline-block text-xs text-primary hover:underline"
    >
      + Crear entreno desde cero
    </a>
  </div>
{/snippet}

<div class="space-y-8">
  <div class="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
    <div class="min-w-0">
      <span class="eyebrow">Citas</span>
      <h1 class="text-2xl sm:text-3xl font-display font-semibold tracking-tight mt-2">Agenda</h1>
    </div>
    <div class="flex items-center gap-3">
      <a
        href="/availability"
        class="text-sm text-text-mute hover:text-primary transition-colors whitespace-nowrap"
        >⚙ Mis huecos</a
      >
      {#if data.clients.length > 0}
        <button onclick={() => (showPropose = !showPropose)} class="btn-primary whitespace-nowrap">
          + Proponer cita
        </button>
      {/if}
    </div>
  </div>

  {#if form?.error}
    <p role="alert" class="text-sm text-danger bg-danger/10 border border-danger/20 rounded-md p-3">
      {form.error}
    </p>
  {/if}
  {#if form?.success && form?.proposed}
    <p
      aria-live="polite"
      class="text-sm text-success bg-success/10 border border-success/20 rounded-md p-3"
    >
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
          npClient = '';
          npDate = '';
          npTime = '';
          npTemplate = '';
          showPropose = false;
        };
      }}
      class="card space-y-4"
    >
      <h2 class="font-semibold">Proponer una cita</h2>
      <div class="grid sm:grid-cols-2 gap-3">
        <div>
          <label for="np-client" class="block text-xs uppercase tracking-wider text-text-mute mb-2"
            >Cliente</label
          >
          <select
            id="np-client"
            bind:value={npClient}
            name="client_id"
            required
            class="w-full px-3 py-2.5 bg-bg border border-text-mute/20 rounded-md text-sm focus:border-primary"
          >
            <option value="" disabled>Elige un cliente…</option>
            {#each data.clients as c (c.id)}<option value={c.id}>{c.full_name ?? 'Cliente'}</option
              >{/each}
          </select>
        </div>
        <div>
          <label for="np-mod" class="block text-xs uppercase tracking-wider text-text-mute mb-2"
            >Modalidad</label
          >
          <select
            id="np-mod"
            bind:value={npModality}
            class="w-full px-3 py-2.5 bg-bg border border-text-mute/20 rounded-md text-sm focus:border-primary"
          >
            <option value="presencial">Presencial</option>
            <option value="online">Online</option>
          </select>
        </div>
        <div>
          <label for="np-date" class="block text-xs uppercase tracking-wider text-text-mute mb-2"
            >Fecha</label
          >
          <input
            id="np-date"
            type="date"
            bind:value={npDate}
            required
            class="w-full px-3 py-2.5 bg-bg border border-text-mute/20 rounded-md text-sm focus:border-primary"
          />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label for="np-time" class="block text-xs uppercase tracking-wider text-text-mute mb-2"
              >Hora</label
            >
            <input
              id="np-time"
              type="time"
              bind:value={npTime}
              required
              class="w-full px-3 py-2.5 bg-bg border border-text-mute/20 rounded-md text-sm focus:border-primary"
            />
          </div>
          <div>
            <label for="np-dur" class="block text-xs uppercase tracking-wider text-text-mute mb-2"
              >Duración</label
            >
            <select
              id="np-dur"
              bind:value={npDur}
              class="w-full px-3 py-2.5 bg-bg border border-text-mute/20 rounded-md text-sm focus:border-primary"
            >
              <option value="30">30 min</option><option value="45">45 min</option>
              <option value="60">60 min</option><option value="90">90 min</option>
            </select>
          </div>
        </div>
      </div>
      {#if data.templates.length > 0}
        <div>
          <label for="np-tpl" class="block text-xs uppercase tracking-wider text-text-mute mb-2"
            >Entreno (opcional)</label
          >
          <select
            id="np-tpl"
            bind:value={npTemplate}
            name="template_id"
            class="w-full px-3 py-2.5 bg-bg border border-text-mute/20 rounded-md text-sm focus:border-primary"
          >
            <option value="">Sin entreno por ahora</option>
            {#each data.templates as t (t.id)}<option value={t.id}
                >📋 {t.name} ({t.itemCount} ej.)</option
              >{/each}
          </select>
        </div>
      {/if}
      <input type="hidden" name="starts_at" value={npStartsAt} />
      <input type="hidden" name="ends_at" value={npEndsAt} />
      <button
        type="submit"
        disabled={proposing || !npClient || !npStartsAt}
        class="btn-primary w-full"
      >
        {proposing ? 'Proponiendo…' : 'Proponer cita al cliente'}
      </button>
    </form>
  {/if}

  <!-- Timeline de próximas citas (pendientes + confirmadas, cronológico) -->
  <section class="space-y-3">
    <h2 class="text-lg font-semibold flex items-center gap-2">
      Próximas citas
      {#if upcoming.length > 0}
        <span class="text-xs px-2 py-0.5 rounded-full bg-surface-2 text-text-mute"
          >{upcoming.length}</span
        >
      {/if}
    </h2>
    {#if upcoming.length === 0}
      <p class="text-sm text-text-mute">No hay citas próximas. Propón una a un cliente.</p>
    {:else}
      {#each upcoming as s (s.id)}
        {@const b = badge(s)}
        <div class="card p-3">
          <div class="flex items-center justify-between gap-3">
            <!-- Info compacta de la cita -->
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span class="text-2xs px-2 py-0.5 rounded-full flex-shrink-0 {b.cls}"
                  >{b.label}</span
                >
                <span class="font-semibold truncate">{s.client?.full_name ?? 'Cliente'}</span>
              </div>
              <div class="text-xs text-text-mute capitalize mt-0.5">
                {fmt(s.starts_at)} · {modalityLabel[s.modality] ?? s.modality}
              </div>
              <div class="text-xs mt-1 flex items-center gap-1.5 min-w-0">
                {#if s.workout}
                  <span class="text-primary flex-shrink-0" aria-hidden="true">🏋️</span>
                  <a
                    href="/clients/{s.client_id}/workouts/{s.workout.date}"
                    class="text-primary hover:underline truncate"
                  >
                    {s.workout.title ?? 'Entreno'}
                  </a>
                {:else}
                  <span class="text-text-mute/60">Sin entreno</span>
                  <button
                    type="button"
                    onclick={() => (showWorkout = showWorkout === s.id ? null : s.id)}
                    class="text-primary hover:underline">asignar</button
                  >
                {/if}
              </div>
            </div>

            <!-- Acciones: Confirmar (si lo pidió el cliente) + menú ⋮ -->
            <div class="flex items-center gap-1.5 flex-shrink-0">
              {#if s.status === 'requested' && !s.proposedByCoach}
                <form method="POST" action="?/confirm" use:enhance>
                  <input type="hidden" name="session_id" value={s.id} />
                  <button type="submit" class="action-primary">Confirmar</button>
                </form>
              {/if}

              <div class="relative">
                <button
                  type="button"
                  aria-label="Más acciones"
                  aria-haspopup="menu"
                  aria-expanded={openMenu === s.id}
                  onclick={() => (openMenu = openMenu === s.id ? null : s.id)}
                  class="h-8 w-8 grid place-items-center rounded-md text-text-mute hover:text-text hover:bg-surface-2 transition-colors"
                >
                  <svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <circle cx="12" cy="5" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle
                      cx="12"
                      cy="19"
                      r="1.6"
                    />
                  </svg>
                </button>

                {#if openMenu === s.id}
                  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
                  <div
                    class="fixed inset-0 z-10"
                    role="presentation"
                    onclick={() => (openMenu = null)}
                  ></div>
                  <div
                    class="absolute right-0 top-full mt-1 z-20 w-52 bg-surface-2 border border-text-mute/20 rounded-md shadow-lg py-1 text-sm"
                    role="menu"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      class="w-full text-left px-3 py-2 hover:bg-bg transition-colors"
                      onclick={() => {
                        openEdit(s);
                        openMenu = null;
                      }}
                    >
                      Reprogramar
                    </button>
                    {#if s.workout}
                      <a
                        href="/clients/{s.client_id}/workouts/{s.workout.date}"
                        role="menuitem"
                        class="block px-3 py-2 hover:bg-bg transition-colors"
                      >
                        Editar entreno
                      </a>
                      <button
                        type="button"
                        role="menuitem"
                        class="w-full text-left px-3 py-2 text-danger hover:bg-danger/10 transition-colors"
                        onclick={() => {
                          openMenu = null;
                          ask({
                            action: '?/unassignWorkout',
                            fields: { session_id: s.id },
                            title: 'Quitar entreno',
                            message:
                              'Se desligará el entreno de esta cita. Podrás volver a asignarlo cuando quieras.',
                            confirmLabel: 'Quitar entreno'
                          });
                        }}
                      >
                        Quitar entreno
                      </button>
                    {:else}
                      <button
                        type="button"
                        role="menuitem"
                        class="w-full text-left px-3 py-2 hover:bg-bg transition-colors"
                        onclick={() => {
                          showWorkout = s.id;
                          openMenu = null;
                        }}
                      >
                        Asignar entreno
                      </button>
                    {/if}

                    <div class="my-1 border-t border-text-mute/10"></div>

                    {#if s.status === 'confirmed'}
                      <button
                        type="button"
                        role="menuitem"
                        class="w-full text-left px-3 py-2 hover:bg-bg transition-colors"
                        onclick={() => {
                          openMenu = null;
                          ask({
                            action: '?/complete',
                            fields: { session_id: s.id },
                            title: 'Marcar como hecha',
                            message: `¿Marcar la cita con ${clientName(s)} como completada?`,
                            confirmLabel: 'Marcar hecha',
                            danger: false
                          });
                        }}
                      >
                        Marcar hecha
                      </button>
                    {/if}
                    {#if s.status === 'requested' && !s.proposedByCoach}
                      <button
                        type="button"
                        role="menuitem"
                        class="w-full text-left px-3 py-2 text-danger hover:bg-danger/10 transition-colors"
                        onclick={() => {
                          openMenu = null;
                          ask({
                            action: '?/reject',
                            fields: { session_id: s.id },
                            title: 'Rechazar solicitud',
                            message: `Vas a rechazar la solicitud de cita de ${clientName(s)}. Se le notificará.`,
                            confirmLabel: 'Rechazar'
                          });
                        }}
                      >
                        Rechazar
                      </button>
                    {/if}
                    <button
                      type="button"
                      role="menuitem"
                      class="w-full text-left px-3 py-2 text-danger hover:bg-danger/10 transition-colors"
                      onclick={() => {
                        openMenu = null;
                        ask(
                          s.proposedByCoach
                            ? {
                                action: '?/cancel',
                                fields: { session_id: s.id },
                                title: 'Cancelar propuesta',
                                message: `Se retirará la propuesta de cita enviada a ${clientName(s)}.`,
                                confirmLabel: 'Cancelar propuesta'
                              }
                            : {
                                action: '?/cancel',
                                fields: { session_id: s.id },
                                title: 'Cancelar cita',
                                message: `Se cancelará la cita con ${clientName(s)}. Se le notificará.`,
                                confirmLabel: 'Sí, cancelar'
                              }
                        );
                      }}
                    >
                      {s.proposedByCoach ? 'Cancelar propuesta' : 'Cancelar cita'}
                    </button>
                  </div>
                {/if}
              </div>
            </div>
          </div>

          {#if s.notes}<div class="text-sm bg-bg rounded-md p-2 italic mt-2">{s.notes}</div>{/if}
          {#if showWorkout === s.id && !s.workout}{@render workoutBlock(s)}{/if}
          {@render rescheduleBlock(s)}
        </div>
      {/each}
    {/if}
  </section>
</div>

<ConfirmModal
  bind:open={confirmOpen}
  action={confirmData.action}
  fields={confirmData.fields}
  title={confirmData.title}
  message={confirmData.message}
  confirmLabel={confirmData.confirmLabel}
  danger={confirmData.danger}
/>
