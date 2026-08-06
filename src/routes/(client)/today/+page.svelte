<script lang="ts">
  import { page } from '$app/state';
  import { enhance } from '$app/forms';
  import type { WorkoutItemWithRelations } from '$lib/supabase/types';

  let { data, form } = $props();

  const modalityLabel: Record<string, string> = {
    presencial: 'Presencial',
    online: 'Online',
    remoto: 'Remoto'
  };

  function fmtSession(iso: string) {
    return new Date(iso).toLocaleString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  const profile = $derived(page.data.profile);

  const dateLabel = $derived(
    new Date(data.date + 'T00:00:00').toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    })
  );

  function setsCompleted(item: WorkoutItemWithRelations) {
    return item.set_logs?.length ?? 0;
  }
  function isComplete(item: WorkoutItemWithRelations) {
    return setsCompleted(item) >= item.sets;
  }

  // Progreso global del entreno de hoy (para el anillo)
  const totalSets = $derived((data.workout?.workout_items ?? []).reduce((s, it) => s + it.sets, 0));
  const doneSets = $derived(
    (data.workout?.workout_items ?? []).reduce(
      (s, it) => s + Math.min(setsCompleted(it), it.sets),
      0
    )
  );
  const pct = $derived(totalSets > 0 ? Math.round((doneSets / totalSets) * 100) : 0);

  // --- Modal de contacto con el coach (en vez del diálogo del navegador) ---
  let showContact = $state(false);
  let copied = $state(false);

  async function copyEmail() {
    if (!data.coachEmail) return;
    try {
      await navigator.clipboard.writeText(data.coachEmail);
      copied = true;
      setTimeout(() => (copied = false), 2000);
    } catch {
      copied = false;
    }
  }

  function upcomingLabel(iso: string) {
    return new Date(iso + 'T00:00:00').toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  }
</script>

<svelte:head>
  <title>{data.isToday ? 'Hoy' : dateLabel} · Coachify</title>
</svelte:head>

<div class="space-y-6">
  <!-- Propuestas de cita: se confirman aquí mismo, sin ir al calendario -->
  {#if data.proposals.length > 0}
    <section class="border border-accent/25 bg-accent/5 rounded-lg px-4 py-3 space-y-3">
      <div class="flex items-center gap-2">
        <span class="pill-accent flex-shrink-0">Nueva</span>
        <span class="text-sm font-semibold">
          {data.proposals.length === 1
            ? 'Tu coach te propone una cita'
            : `Tu coach te propone ${data.proposals.length} citas`}
        </span>
      </div>
      {#each data.proposals as p (p.id)}
        <div class="flex flex-wrap items-center gap-3 border-t border-accent/20 pt-3">
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium capitalize">{fmtSession(p.starts_at)}</div>
            <div class="text-xs text-text-mute">
              {modalityLabel[p.modality] ?? p.modality}{p.location ? ' · ' + p.location : ''}
            </div>
            {#if p.notes}<div class="text-xs text-text-mute italic mt-0.5">{p.notes}</div>{/if}
          </div>
          <form method="POST" action="?/confirmSession" use:enhance class="flex-shrink-0">
            <input type="hidden" name="session_id" value={p.id} />
            <button type="submit" class="action-primary">Confirmar</button>
          </form>
          <form method="POST" action="?/rejectSession" use:enhance class="flex-shrink-0">
            <input type="hidden" name="session_id" value={p.id} />
            <button type="submit" class="action-danger">No puedo</button>
          </form>
        </div>
      {/each}
    </section>
  {/if}

  {#if form?.error}
    <p role="alert" class="text-sm text-danger bg-danger/10 border border-danger/20 rounded-md p-3">
      {form.error}
    </p>
  {/if}
  {#if form?.success && form?.confirmed}
    <p
      aria-live="polite"
      class="text-sm text-success bg-success/10 border border-success/20 rounded-md p-3"
    >
      Cita confirmada. Te la hemos guardado en tus citas.
    </p>
  {/if}
  {#if form?.success && form?.rejected}
    <p
      aria-live="polite"
      class="text-sm text-text-mute bg-surface-2 border border-line rounded-md p-3"
    >
      Le hemos avisado a tu coach de que no te viene bien.
    </p>
  {/if}

  <!-- Saludo -->
  <div>
    <span class="eyebrow capitalize">{dateLabel}</span>
    <h1 class="text-3xl sm:text-4xl font-display font-semibold tracking-tight mt-2">
      {#if data.isToday}
        Hola, {profile?.full_name?.split(' ')[0] ?? 'crack'}
      {:else}
        {dateLabel}
      {/if}
    </h1>
  </div>

  <!-- Acciones: tira compacta, sin tarjetas ni iconos decorativos -->
  <nav class="flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-line py-3 text-sm">
    <a href="/my-calendar?request=1" class="font-medium hover:text-accent transition-colors"
      >Pedir cita</a
    >
    <a href="/my-calendar" class="font-medium hover:text-accent transition-colors">Mis citas</a>
    <a href="/progress" class="font-medium hover:text-accent transition-colors">Mi progreso</a>
    {#if data.coachEmail}
      <button
        type="button"
        onclick={() => (showContact = true)}
        class="font-medium hover:text-accent transition-colors"
      >
        Contactar coach
      </button>
    {/if}
  </nav>

  <!-- Próxima cita confirmada: dato de una línea, sin tarjeta -->
  {#if data.nextSession}
    <p class="text-sm text-text-mute -mt-3">
      Próxima cita: <a
        href="/my-calendar"
        class="text-text font-medium capitalize hover:text-accent transition-colors"
        >{fmtSession(data.nextSession.starts_at)}</a
      >
      · {modalityLabel[data.nextSession.modality] ?? data.nextSession.modality}{data.nextSession
        .location
        ? ' · ' + data.nextSession.location
        : ''}
    </p>
  {/if}

  {#if !data.workout}
    <div class="card max-w-xl space-y-3">
      <h2 class="text-2xl font-display font-semibold">
        {data.isToday ? 'Día de descanso' : 'Sin entreno este día'}
      </h2>
      <p class="text-sm text-text-mute">
        {data.isToday
          ? 'Tu coach no ha publicado entreno para hoy. Aprovecha para recuperar, estirar o caminar.'
          : 'No hay nada programado para esta fecha.'}
      </p>
      <div class="flex flex-wrap gap-3 pt-1">
        <a href="/progress" class="btn-ghost">Ver mi progreso</a>
        <a href="/my-calendar?request=1" class="btn-ghost">Pedir cita</a>
      </div>
    </div>
  {:else}
    <!-- Hero del entreno con anillo de progreso -->
    <div class="card bg-accent/5 border-accent/20">
      <!-- En móvil el botón cae a una segunda línea a todo el ancho: es la
           acción principal del día y tiene que ser fácil de acertar. -->
      <div class="flex flex-wrap items-center gap-x-5 gap-y-4">
        <!-- Anillo de progreso SVG -->
        <div class="relative w-20 h-20 flex-shrink-0">
          <svg
            viewBox="0 0 36 36"
            class="w-20 h-20 -rotate-90"
            role="img"
            aria-label="Progreso del entreno: {pct}% completado"
          >
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              class="stroke-text-mute/15"
              stroke-width="3"
            />
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              class="stroke-primary transition-all"
              stroke-width="3"
              stroke-linecap="round"
              stroke-dasharray="{(pct / 100) * 97.4} 97.4"
            />
          </svg>
          <div class="absolute inset-0 grid place-items-center">
            <span class="text-lg font-bold">{pct}%</span>
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <h2 class="text-xl font-bold truncate">{data.workout.title ?? 'Tu entreno'}</h2>
          <p class="text-sm text-text-mute mt-0.5">
            {data.workout.workout_items?.length ?? 0} ejercicios · {doneSets}/{totalSets} series
          </p>
        </div>
        <!-- La acción principal del día: retomar donde lo dejó, sin buscar -->
        {#if data.nextItemId}
          <a
            href="/workout/{data.nextItemId}"
            class="btn-primary w-full sm:w-auto text-center flex-shrink-0 whitespace-nowrap"
          >
            {data.started ? 'Continuar' : 'Empezar'}
          </a>
        {:else}
          <span class="pill-ok flex-shrink-0">Completado</span>
        {/if}
      </div>
      {#if data.workout.notes}
        <div class="text-sm bg-bg border border-line rounded-md px-3 py-2 mt-4">
          <span class="text-xs uppercase tracking-wider text-text-mute block mb-1"
            >Nota de tu entrenador</span
          >
          {data.workout.notes}
        </div>
      {/if}
    </div>

    <!-- Lista de ejercicios -->
    <div class="space-y-3">
      {#each data.workout.workout_items as item, i (item.id)}
        {@const done = setsCompleted(item)}
        {@const complete = isComplete(item)}
        <a
          href="/workout/{item.id}"
          class="card block hover:border-primary/40 transition-all {complete
            ? 'border-success/30'
            : ''}"
        >
          <div class="flex items-start gap-3 mb-3">
            <div
              class="w-8 h-8 rounded-lg grid place-items-center text-sm font-bold flex-shrink-0
                {complete ? 'bg-success/20 text-success' : 'bg-primary/15 text-primary'}"
            >
              {#if complete}✓{:else}{i + 1}{/if}
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-semibold truncate">{item.exercise.name}</div>
              <div class="text-sm text-text-mute mt-1">
                {item.sets} series · {item.reps_prescribed ?? '?'} reps
                {#if item.weight_prescribed}· {item.weight_prescribed}{/if}
                {#if item.rest_seconds}· {item.rest_seconds}s desc.{/if}
              </div>
            </div>
            {#if item.exercise.video_url}
              <div class="text-xl text-text-mute">▶</div>
            {/if}
          </div>

          <div class="flex gap-1.5">
            {#each Array(item.sets) as _, idx}
              <div
                class="h-2 flex-1 rounded-full {idx < done ? 'bg-primary' : 'bg-text-mute/15'}"
              ></div>
            {/each}
          </div>
          <div class="text-xs text-text-mute mt-1.5">{done} / {item.sets} series registradas</div>
        </a>
      {/each}
    </div>
  {/if}

  <!-- Próximos entrenos: filas densas, la fecha manda -->
  {#if data.upcoming.length > 0}
    <section class="pt-2">
      <h2 class="text-sm uppercase tracking-wider text-text-mute mb-2">Próximos entrenos</h2>
      <div class="border-t border-line">
        {#each data.upcoming as w (w.id)}
          <a href="/today?date={w.date}" class="row-link">
            <span class="w-24 text-sm text-text-mute capitalize flex-shrink-0"
              >{upcomingLabel(w.date)}</span
            >
            <span class="flex-1 min-w-0 truncate">
              <span class="font-medium">{w.title ?? 'Entreno'}</span>
              <span class="text-text-mute text-sm"> · {w.itemCount} ejercicios</span>
            </span>
            {#if w.done}<span class="pill-ok flex-shrink-0">Empezado</span>{/if}
            <span class="text-text-mute text-sm flex-shrink-0">→</span>
          </a>
        {/each}
      </div>
    </section>
  {/if}
</div>

<!-- Modal: contactar con el coach -->
<svelte:window
  onkeydown={(e) => {
    if (showContact && e.key === 'Escape') showContact = false;
  }}
/>
{#if showContact && data.coachEmail}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-[200] grid place-items-center bg-black/60 backdrop-blur-sm p-4"
    role="presentation"
    onclick={() => (showContact = false)}
  >
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
    <div
      class="card w-full max-w-sm space-y-4"
      role="dialog"
      tabindex="-1"
      aria-modal="true"
      aria-labelledby="contact-title"
      onclick={(e) => e.stopPropagation()}
    >
      <div>
        <h3 id="contact-title" class="text-lg font-semibold">
          Contactar con {data.coachName ?? 'tu entrenador'}
        </h3>
        <p class="text-sm text-text-mute mt-1">
          Escríbele a este correo para cualquier duda sobre tus entrenos o tus citas.
        </p>
      </div>

      <div
        class="bg-bg border border-text-mute/20 rounded-md px-4 py-3 flex items-center justify-between gap-3"
      >
        <span class="text-sm font-medium truncate">{data.coachEmail}</span>
        <button type="button" onclick={copyEmail} class="action-neutral flex-shrink-0">
          {copied ? '✓ Copiado' : 'Copiar'}
        </button>
      </div>

      <div class="flex justify-end gap-3 pt-1">
        <button type="button" class="action-neutral" onclick={() => (showContact = false)}
          >Cerrar</button
        >
        <a href="mailto:{data.coachEmail}" class="action-primary">Abrir mi correo</a>
      </div>
    </div>
  </div>
{/if}
