<script lang="ts">
  import { page } from '$app/state';
  import { formatDateISO } from '$lib/week';

  let { data } = $props();
  const profile = $derived(page.data.profile);

  const dateLabel = $derived(
    new Date(data.date + 'T00:00:00').toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    })
  );

  function setsCompleted(item: typeof data.workout.workout_items[number]) {
    return item.set_logs?.length ?? 0;
  }

  function isComplete(item: typeof data.workout.workout_items[number]) {
    return setsCompleted(item) >= item.sets;
  }
</script>

<svelte:head>
  <title>Hoy · Coachify</title>
</svelte:head>

<div class="space-y-6">
  <div>
    <span class="eyebrow capitalize">{dateLabel}</span>
    <h1 class="text-4xl font-bold tracking-tight mt-2">
      Hola, {profile?.full_name?.split(' ')[0] ?? 'crack'} 💪
    </h1>
  </div>

  {#if !data.workout}
    <div class="card text-center py-16">
      <div class="text-6xl mb-4">🏖️</div>
      <h2 class="text-xl font-semibold mb-2">Sin entreno para hoy</h2>
      <p class="text-sm text-text-mute max-w-md mx-auto">
        Tu coach todavía no ha publicado nada para esta fecha. Descansa o estira.
      </p>
    </div>
  {:else}
    <!-- Título del workout + nota del coach -->
    <div class="card">
      {#if data.workout.title}
        <h2 class="text-xl font-bold mb-2">{data.workout.title}</h2>
      {/if}
      {#if data.workout.notes}
        <div class="text-sm bg-primary/10 border-l-2 border-primary rounded-r px-3 py-2 italic">
          {data.workout.notes}
        </div>
      {/if}
      <div class="text-xs text-text-mute mt-3">
        {data.workout.workout_items?.length ?? 0} ejercicios
      </div>
    </div>

    <!-- Lista de ejercicios -->
    {#each data.workout.workout_items as item, i (item.id)}
      {@const done = setsCompleted(item)}
      {@const complete = isComplete(item)}
      <a
        href="/workout/{item.id}"
        class="card block hover:border-primary/40 transition-all {complete
          ? 'opacity-60 border-success/30'
          : ''}"
      >
        <div class="flex items-start gap-3 mb-3">
          <div class="text-primary font-bold w-6 mt-0.5">#{i + 1}</div>
          <div class="flex-1">
            <div class="font-semibold flex items-center gap-2">
              {item.exercise.name}
              {#if complete}<span class="text-success text-sm">✓</span>{/if}
            </div>
            <div class="text-sm text-text-mute mt-1">
              {item.sets} series · {item.reps_prescribed ?? '?'} reps
              {#if item.weight_prescribed}· {item.weight_prescribed}{/if}
              {#if item.rest_seconds}· descanso {item.rest_seconds}s{/if}
            </div>
          </div>
          {#if item.exercise.video_url}
            <div class="text-2xl">▶</div>
          {/if}
        </div>

        <!-- Indicador de series completadas -->
        <div class="flex gap-1.5 mt-2">
          {#each Array(item.sets) as _, idx}
            <div
              class="h-2 flex-1 rounded-full {idx < done ? 'bg-primary' : 'bg-surface-2'}"
            ></div>
          {/each}
        </div>
        <div class="text-xs text-text-mute mt-1.5">
          {done} / {item.sets} series
        </div>
      </a>
    {/each}
  {/if}
</div>
