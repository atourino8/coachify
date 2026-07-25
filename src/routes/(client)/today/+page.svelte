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
  <!-- Saludo -->
  <div>
    <span class="eyebrow capitalize">{dateLabel}</span>
    <h1 class="text-4xl font-bold tracking-tight mt-2">
      {#if data.isToday}
        Hola, {profile?.full_name?.split(' ')[0] ?? 'crack'} 💪
      {:else}
        {dateLabel}
      {/if}
    </h1>
  </div>

  {#if !data.workout}
    <div class="card text-center py-14 bg-gradient-to-br from-surface to-surface-2/40">
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
    <div class="card bg-gradient-to-br from-primary/10 to-accent/5 border-primary/20">
      <div class="flex items-center gap-5">
        <!-- Anillo de progreso SVG -->
        <div class="relative w-20 h-20 flex-shrink-0">
          <svg viewBox="0 0 36 36" class="w-20 h-20 -rotate-90">
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
