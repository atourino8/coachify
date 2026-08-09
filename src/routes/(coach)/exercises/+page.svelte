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

  // Filtro por grupo muscular (mismo patrón que el de categorías en
  // Entrenamientos, para que la biblioteca se comporte igual en las dos pestañas).
  let filterGroup = $state('');
  const presentGroups = $derived(
    [...new Set(data.exercises.map((e) => e.muscle_group).filter(Boolean) as string[])].sort(
      (a, b) => (muscleLabels[a] ?? a).localeCompare(muscleLabels[b] ?? b)
    )
  );
  const filtered = $derived(
    filterGroup ? data.exercises.filter((e) => e.muscle_group === filterGroup) : data.exercises
  );
</script>

<svelte:head>
  <title>Ejercicios · Treno</title>
</svelte:head>

<div class="space-y-8">
  <!-- Pestañas Biblioteca -->
  <div class="flex gap-1 border-b border-line overflow-x-auto">
    <a
      href="/exercises"
      class="px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap flex-shrink-0 border-accent text-accent -mb-px"
      >Ejercicios</a
    >
    <a
      href="/templates"
      class="px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap flex-shrink-0 border-transparent text-text-mute hover:text-text"
      >Entrenamientos</a
    >
  </div>

  <!-- En móvil las acciones caen a su propia línea: en horizontal no caben
       junto al título y el botón principal se salía de la pantalla. -->
  <div class="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
    <div class="min-w-0">
      <h1 class="text-2xl sm:text-3xl font-display font-semibold tracking-tight">Ejercicios</h1>
      <p class="text-text-mute mt-1">
        {data.exercises.length}
        {data.exercises.length === 1 ? 'ejercicio' : 'ejercicios'} activos
      </p>
    </div>
    <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
      <!-- La carga de la biblioteca base está siempre disponible, no solo con
           la biblioteca vacía: es idempotente y solo añade los que falten. -->
      <form
        method="POST"
        action="?/seedLibrary"
        use:enhance={() => {
          seeding = true;
          return async ({ update }) => {
            await update();
            seeding = false;
          };
        }}
      >
        <button
          type="submit"
          disabled={seeding}
          class="text-sm text-text-mute hover:text-primary transition-colors whitespace-nowrap"
        >
          {seeding ? 'Cargando…' : 'Cargar biblioteca base'}
        </button>
      </form>
      <a href="/exercises/new" class="btn-primary whitespace-nowrap">+ Nuevo ejercicio</a>
    </div>
  </div>

  {#if form?.success && form?.seeded}
    <p
      aria-live="polite"
      class="text-sm text-success bg-success/10 border border-success/20 rounded-md p-3"
    >
      {form.seeded} ejercicios añadidos a tu biblioteca. Edítalos o añade los tuyos cuando quieras.
    </p>
  {/if}
  {#if form?.success && form?.alreadyHad}
    <p
      aria-live="polite"
      class="text-sm text-text-mute bg-surface-2 border border-text-mute/20 rounded-md p-3"
    >
      Ya tenías todos los ejercicios de la biblioteca base.
    </p>
  {/if}

  {#if data.exercises.length === 0}
    <!-- Estado vacío útil: explica qué gana y da el atajo, en vez de decorar. -->
    <div class="card max-w-2xl space-y-5">
      <div>
        <h2 class="text-2xl font-display font-semibold">Empieza con la biblioteca base</h2>
        <p class="text-sm text-text-mute mt-2">
          Sin ejercicios no puedes montar entrenamientos, y sin entrenamientos no puedes programarle
          nada a un cliente. Cargamos {SEED_EXERCISES.length} ejercicios básicos —con su grupo muscular
          y material— para que puedas armar el primer entreno en un minuto. Son tuyos: edítalos, bórralos
          o añádeles tu vídeo.
        </p>
      </div>

      <form
        method="POST"
        action="?/seedLibrary"
        use:enhance={() => {
          seeding = true;
          return async ({ update }) => {
            await update();
            seeding = false;
          };
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
    <!-- Filtro por grupo muscular: con la biblioteca base son casi 50, y en un
         móvil recorrerlos todos a mano no es viable. -->
    {#if presentGroups.length > 1}
      <div class="flex flex-wrap gap-2">
        <button
          onclick={() => (filterGroup = '')}
          class="px-3 py-1.5 rounded-full text-sm border transition-colors {filterGroup === ''
            ? 'bg-primary text-bg border-primary'
            : 'border-line text-text-mute hover:text-text'}"
        >
          Todos ({data.exercises.length})
        </button>
        {#each presentGroups as g (g)}
          <button
            onclick={() => (filterGroup = g)}
            class="px-3 py-1.5 rounded-full text-sm border transition-colors {filterGroup === g
              ? 'bg-primary text-bg border-primary'
              : 'border-line text-text-mute hover:text-text'}"
          >
            {muscleLabels[g] ?? g}
          </button>
        {/each}
      </div>
    {/if}

    <!-- Filas densas en vez de tarjetas: no hay miniatura real que enseñar
         (el hueco se rellenaba con un emoji), y una rejilla de 48 tarjetas
         con un placeholder de 190px es scroll infinito en el móvil. -->
    <div class="border-t border-line">
      {#each filtered as ex (ex.id)}
        <a href="/exercises/{ex.id}" class="row-link">
          <span class="flex-1 min-w-0">
            <span class="font-medium block truncate">{ex.name}</span>
            {#if !ex.video_url}
              <span class="text-xs text-warning">sin vídeo</span>
            {/if}
          </span>
          {#if ex.muscle_group}
            <span class="pill-mute flex-shrink-0">
              {muscleLabels[ex.muscle_group] ?? ex.muscle_group}
            </span>
          {/if}
          {#if ex.video_url}
            <span class="text-xs text-text-mute flex-shrink-0" title="Tiene vídeo">▶</span>
          {/if}
          <span class="text-xs text-accent flex-shrink-0">Editar</span>
        </a>
      {/each}
    </div>
  {/if}
</div>
