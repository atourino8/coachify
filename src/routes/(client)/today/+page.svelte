<script lang="ts">
  import { page } from '$app/state';
  import type { WorkoutItemWithRelations } from '$lib/supabase/types';

  let { data } = $props();
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
  const totalSets = $derived(
    (data.workout?.workout_items ?? []).reduce((s, it) => s + it.sets, 0)
  );
  const doneSets = $derived(
    (data.workout?.workout_items ?? []).reduce((s, it) => s + Math.min(setsCompleted(it), it.sets), 0)
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
  <!-- Aviso de propuestas de cita pendientes -->
  {#if data.proposalCount > 0}
    <a
      href="/my-calendar"
      class="flex items-center gap-3 bg-primary/10 border border-primary/30 rounded-lg px-4 py-3 hover:bg-primary/15 transition-colors"
    >
      <span class="text-xl">📅</span>
      <div class="flex-1 min-w-0">
        <div class="text-sm font-semibold">
          {data.proposalCount === 1
            ? 'Tu coach te ha propuesto una cita'
            : `Tu coach te ha propuesto ${data.proposalCount} citas`}
        </div>
        <div class="text-xs text-text-mute">Revísala y confírmala en tu calendario</div>
      </div>
      <span class="text-xs text-primary font-medium whitespace-nowrap">Ver →</span>
    </a>
  {/if}

  <!-- Saludo -->
  <div>
    <span class="eyebrow capitalize">{dateLabel}</span>
    <h1 class="text-4xl font-display font-semibold tracking-tight mt-2">
      {#if data.isToday}
        Hola, {profile?.full_name?.split(' ')[0] ?? 'crack'} 💪
      {:else}
        {dateLabel}
      {/if}
    </h1>
  </div>

  <!-- Acciones rápidas -->
  <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
    <a href="/my-calendar?request=1" class="card p-4 flex flex-col gap-2 hover:border-primary/50 transition-all">
      <span class="h-9 w-9 grid place-items-center rounded-lg bg-primary/15 text-primary" aria-hidden="true">
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18M12 14v4M10 16h4" stroke-linecap="round" /></svg>
      </span>
      <span class="text-sm font-medium">Pedir cita</span>
    </a>
    <a href="/my-calendar" class="card p-4 flex flex-col gap-2 hover:border-primary/50 transition-all">
      <span class="h-9 w-9 grid place-items-center rounded-lg bg-primary/15 text-primary" aria-hidden="true">
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" stroke-linecap="round" /></svg>
      </span>
      <span class="text-sm font-medium">Mis citas</span>
    </a>
    <a href="/progress" class="card p-4 flex flex-col gap-2 hover:border-primary/50 transition-all">
      <span class="h-9 w-9 grid place-items-center rounded-lg bg-primary/15 text-primary" aria-hidden="true">
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M4 19V5M4 19h16M8 16l3-4 3 2 4-6" stroke-linecap="round" stroke-linejoin="round" /></svg>
      </span>
      <span class="text-sm font-medium">Mi progreso</span>
    </a>
    {#if data.coachEmail}
      <button type="button" onclick={() => (showContact = true)} class="card p-4 flex flex-col gap-2 text-left hover:border-primary/50 transition-all">
        <span class="h-9 w-9 grid place-items-center rounded-lg bg-primary/15 text-primary" aria-hidden="true">
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" stroke-linecap="round" /></svg>
        </span>
        <span class="text-sm font-medium">Contactar coach</span>
      </button>
    {/if}
  </div>

  {#if !data.workout}
    <div class="card text-center py-14">
      <div class="text-6xl mb-4">🏖️</div>
      <h2 class="text-xl font-semibold mb-2">
        {data.isToday ? 'Día de descanso' : 'Sin entreno este día'}
      </h2>
      <p class="text-sm text-text-mute max-w-md mx-auto">
        {data.isToday
          ? 'Tu coach no ha publicado entreno para hoy. Aprovecha para recuperar, estirar o caminar.'
          : 'No hay nada programado para esta fecha.'}
      </p>
    </div>
  {:else}
    <!-- Hero del entreno con anillo de progreso -->
    <div class="card bg-accent/5 border-accent/20">
      <div class="flex items-center gap-5">
        <!-- Anillo de progreso SVG -->
        <div class="relative w-20 h-20 flex-shrink-0">
          <svg viewBox="0 0 36 36" class="w-20 h-20 -rotate-90" role="img" aria-label="Progreso del entreno: {pct}% completado">
            <circle cx="18" cy="18" r="15.5" fill="none" class="stroke-text-mute/15" stroke-width="3" />
            <circle
              cx="18" cy="18" r="15.5" fill="none"
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
      </div>
      {#if data.workout.notes}
        <div class="text-sm bg-bg/60 border-l-2 border-primary rounded-r px-3 py-2 italic mt-4">
          💬 {data.workout.notes}
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
              <div class="h-2 flex-1 rounded-full {idx < done ? 'bg-primary' : 'bg-text-mute/15'}"></div>
            {/each}
          </div>
          <div class="text-xs text-text-mute mt-1.5">{done} / {item.sets} series registradas</div>
        </a>
      {/each}
    </div>
  {/if}

  <!-- Próximos entrenos -->
  {#if data.upcoming.length > 0}
    <section class="space-y-3 pt-2">
      <h2 class="text-sm uppercase tracking-wider text-text-mute">Próximos entrenos</h2>
      {#each data.upcoming as w (w.id)}
        <a
          href="/today?date={w.date}"
          class="card flex items-center gap-4 hover:border-primary/40 transition-all py-3"
        >
          <div class="w-10 h-10 rounded-lg bg-primary/10 grid place-items-center flex-shrink-0">
            <span class="text-lg">🗓️</span>
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium truncate flex items-center gap-2">
              {#if w.done}<span class="text-success text-sm">✓</span>{/if}
              {w.title ?? 'Entreno'}
            </div>
            <div class="text-xs text-text-mute capitalize">{upcomingLabel(w.date)} · {w.itemCount} ej.</div>
          </div>
          <span class="text-text-mute">→</span>
        </a>
      {/each}
    </section>
  {/if}
</div>

<!-- Modal: contactar con el coach -->
<svelte:window onkeydown={(e) => { if (showContact && e.key === 'Escape') showContact = false; }} />
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

      <div class="bg-bg border border-text-mute/20 rounded-md px-4 py-3 flex items-center justify-between gap-3">
        <span class="text-sm font-medium truncate">{data.coachEmail}</span>
        <button type="button" onclick={copyEmail} class="action-neutral flex-shrink-0">
          {copied ? '✓ Copiado' : 'Copiar'}
        </button>
      </div>

      <div class="flex justify-end gap-3 pt-1">
        <button type="button" class="action-neutral" onclick={() => (showContact = false)}>Cerrar</button>
        <a href="mailto:{data.coachEmail}" class="action-primary">Abrir mi correo</a>
      </div>
    </div>
  </div>
{/if}
