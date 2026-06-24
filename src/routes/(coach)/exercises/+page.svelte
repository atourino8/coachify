<script lang="ts">
  import type { Exercise } from '$lib/supabase/types';
  let { data } = $props();

  // Labels en español de los enums
  const muscleLabels: Record<string, string> = {
    chest: 'Pecho',
    back: 'Espalda',
    legs: 'Pierna',
    shoulders: 'Hombro',
    arms: 'Brazo',
    core: 'Core',
    cardio: 'Cardio',
    full_body: 'Full body'
  };
</script>

<svelte:head>
  <title>Ejercicios · Coachify</title>
</svelte:head>

<div class="space-y-8">
  <div class="flex items-center justify-between">
    <div>
      <span class="eyebrow">tu biblioteca</span>
      <h1 class="text-3xl font-bold tracking-tight mt-2">Ejercicios</h1>
      <p class="text-text-mute mt-1">
        {data.exercises.length} {data.exercises.length === 1 ? 'ejercicio' : 'ejercicios'} activos
      </p>
    </div>
    <a href="/exercises/new" class="btn-primary">+ Nuevo ejercicio</a>
  </div>

  {#if data.exercises.length === 0}
    <div class="card text-center py-16">
      <div class="text-6xl mb-4">📚</div>
      <h2 class="text-xl font-semibold mb-2">Tu biblioteca está vacía</h2>
      <p class="text-sm text-text-mute max-w-md mx-auto mb-6">
        Crea tu primer ejercicio con un vídeo de técnica para empezar a armar entrenos.
      </p>
      <a href="/exercises/new" class="btn-primary">Crear primer ejercicio</a>
    </div>
  {:else}
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each data.exercises as ex (ex.id)}
        <a
          href="/exercises/{ex.id}"
          class="card group hover:border-primary/50 transition-all"
        >
          <div class="aspect-video bg-bg rounded-md mb-4 grid place-items-center text-text-mute/40 text-4xl">
            {#if ex.video_url}
              ▶
            {:else}
              🏋️
            {/if}
          </div>
          <h3 class="font-semibold mb-1 group-hover:text-primary transition-colors">{ex.name}</h3>
          <div class="flex items-center gap-2 text-xs text-text-mute">
            {#if ex.muscle_group}
              <span class="bg-bg px-2 py-1 rounded">{muscleLabels[ex.muscle_group] ?? ex.muscle_group}</span>
            {/if}
            {#if !ex.video_url}
              <span class="text-warning">sin vídeo</span>
            {/if}
          </div>
        </a>
      {/each}
    </div>
  {/if}
</div>
