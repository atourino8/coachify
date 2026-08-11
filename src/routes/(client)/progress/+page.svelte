<script lang="ts">
  import ProgressChart from '$lib/components/ProgressChart.svelte';

  let { data } = $props();

  // Ejercicio seleccionado para la gráfica (por defecto, el que más sesiones tiene)
  // svelte-ignore state_referenced_locally
  let selectedId = $state<string | null>(data.exercises[0]?.id ?? null);

  const selected = $derived(data.exercises.find((e) => e.id === selectedId) ?? null);

  function fmtDate(iso: string) {
    return new Date(iso + 'T00:00:00').toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    });
  }

  // El diccionario viene del layout: incluye el vocabulario base MÁS las
  // etiquetas que se haya inventado el entrenador (migración 0019). Estaba
  // copiado a mano en cuatro pantallas, y una decía "Pierna" donde otra
  // decía "Piernas".
  const muscleLabels = $derived(data.vocabulario.muscle);
</script>

<svelte:head>
  <title>Progreso · Treno</title>
</svelte:head>

<div class="space-y-8">
  <div>
    <span class="eyebrow">Tu evolución</span>
    <h1 class="text-3xl sm:text-4xl font-display font-semibold tracking-tight mt-2">Progreso</h1>
  </div>

  <!-- Tarjetas de resumen. En móvil van tres en fila igualmente, pero con
       menos relleno y número más pequeño: un volumen de 5 cifras no cabe. -->
  <div class="grid grid-cols-3 gap-2 sm:gap-3">
    <div class="card p-3 sm:p-5 text-center">
      <div class="text-xl sm:text-2xl font-display font-semibold text-text">
        {data.stats.totalSets}
      </div>
      <div class="text-xs text-text-mute mt-1">series registradas</div>
    </div>
    <div class="card p-3 sm:p-5 text-center">
      <div class="text-xl sm:text-2xl font-display font-semibold text-text">
        {data.stats.exerciseCount}
      </div>
      <div class="text-xs text-text-mute mt-1">ejercicios</div>
    </div>
    <div class="card p-3 sm:p-5 text-center">
      <div class="text-xl sm:text-2xl font-display font-semibold text-text">
        {data.stats.totalVolume.toLocaleString('es-ES')}
      </div>
      <div class="text-xs text-text-mute mt-1">kg · volumen total</div>
    </div>
  </div>

  {#if data.exercises.length === 0}
    <div class="card text-center py-16">
      <div class="text-6xl mb-4">📊</div>
      <h2 class="text-xl font-semibold mb-2">Aún no hay datos</h2>
      <p class="text-sm text-text-mute max-w-md mx-auto">
        Cuando registres las series de tus entrenos, aquí verás cómo evoluciona tu fuerza en cada
        ejercicio.
      </p>
    </div>
  {:else}
    <!-- Selector de ejercicio -->
    <div>
      <label for="ex-select" class="block text-xs uppercase tracking-wider text-text-mute mb-2">
        Ejercicio
      </label>
      <select
        id="ex-select"
        bind:value={selectedId}
        class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md focus:border-primary focus:ring-2 focus:ring-primary/20"
      >
        {#each data.exercises as ex (ex.id)}
          <option value={ex.id}>{ex.name} ({ex.sessions} sesiones)</option>
        {/each}
      </select>
    </div>

    {#if selected}
      <div class="card space-y-5">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="text-xl font-bold">{selected.name}</h2>
            {#if selected.muscleGroup}
              <span class="text-xs text-text-mute"
                >{muscleLabels[selected.muscleGroup] ?? selected.muscleGroup}</span
              >
            {/if}
          </div>
          <div class="text-right">
            <div class="text-2xl font-display font-semibold text-primary">
              {selected.bestWeight ?? '—'} kg
            </div>
            <div class="text-xs text-text-mute">mejor marca</div>
          </div>
        </div>

        <ProgressChart points={selected.points} />

        <!-- Tabla de las últimas sesiones -->
        <div class="border-t border-line pt-4">
          <div class="text-xs uppercase tracking-wider text-text-mute mb-2">Historial</div>
          <div class="space-y-1.5 max-h-48 overflow-y-auto">
            {#each [...selected.points].reverse() as p (p.date)}
              <div class="flex items-center justify-between text-sm">
                <span class="text-text-mute">{fmtDate(p.date)}</span>
                <span class="font-semibold">{p.maxWeight} kg</span>
                <span class="text-xs text-text-mute">{p.totalReps} reps</span>
              </div>
            {/each}
          </div>
        </div>
      </div>
    {/if}
  {/if}
</div>
