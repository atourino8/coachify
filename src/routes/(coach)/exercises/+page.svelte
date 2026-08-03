<script lang="ts">
  import { enhance } from '$app/forms';
  import { SEED_EXERCISES } from '$lib/seed-exercises';
  import type { Exercise } from '$lib/supabase/types';
  let { data, form } = $props();

  let seeding = $state(false);

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
  <!-- Pestañas Biblioteca -->
  <div class="flex gap-1 border-b border-text-mute/10">
    <a href="/exercises" class="px-4 py-2 text-sm font-medium border-b-2 border-primary text-primary -mb-px">Ejercicios</a>
    <a href="/templates" class="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-text-mute hover:text-text">Entrenamientos</a>
  </div>

  <div class="flex items-center justify-between gap-4">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Ejercicios</h1>
      <p class="text-text-mute mt-1">
        {data.exercises.length} {data.exercises.length === 1 ? 'ejercicio' : 'ejercicios'} activos
      </p>
    </div>
    <div class="flex items-center gap-3">
      <!-- La carga de la biblioteca base está siempre disponible, no solo con
           la biblioteca vacía: es idempotente y solo añade los que falten. -->
      <form
        method="POST"
        action="?/seedLibrary"
        use:enhance={() => {
          seeding = true;
          return async ({ update }) => { await update(); seeding = false; };
        }}
      >
        <button type="submit" disabled={seeding}
          class="text-sm text-text-mute hover:text-primary transition-colors whitespace-nowrap">
          {seeding ? 'Cargando…' : 'Cargar biblioteca base'}
        </button>
      </form>
      <a href="/exercises/new" class="btn-primary whitespace-nowrap">+ Nuevo ejercicio</a>
    </div>
  </div>

  {#if form?.success && form?.seeded}
    <p aria-live="polite" class="text-sm text-success bg-success/10 border border-success/20 rounded-md p-3">
      {form.seeded} ejercicios añadidos a tu biblioteca. Edítalos o añade los tuyos cuando quieras.
    </p>
  {/if}
  {#if form?.success && form?.alreadyHad}
    <p aria-live="polite" class="text-sm text-text-mute bg-surface-2 border border-text-mute/20 rounded-md p-3">
      Ya tenías todos los ejercicios de la biblioteca base.
    </p>
  {/if}

  {#if data.exercises.length === 0}
    <!-- Estado vacío útil: explica qué gana y da el atajo, en vez de decorar. -->
    <div class="card max-w-2xl space-y-5">
      <div>
        <h2 class="text-2xl font-bold">Empieza con la biblioteca base</h2>
        <p class="text-sm text-text-mute mt-2">
          Sin ejercicios no puedes montar entrenamientos, y sin entrenamientos no puedes
          programarle nada a un cliente. Cargamos {SEED_EXERCISES.length} ejercicios básicos
          —con su grupo muscular y material— para que puedas armar el primer entreno en un minuto.
          Son tuyos: edítalos, bórralos o añádeles tu vídeo.
        </p>
      </div>

      <form
        method="POST"
        action="?/seedLibrary"
        use:enhance={() => {
          seeding = true;
          return async ({ update }) => { await update(); seeding = false; };
        }}
        class="flex flex-wrap items-center gap-3"
      >
        <button type="submit" disabled={seeding} class="btn-primary">
          {seeding ? 'Cargando…' : `Cargar ${SEED_EXERCISES.length} ejercicios`}
        </button>
        <a href="/exercises/new" class="text-sm text-text-mute hover:text-text transition-colors">
          o crear el mío desde cero
        </a>
      </form>
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
