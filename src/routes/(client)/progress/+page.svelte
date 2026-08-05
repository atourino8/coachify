<script lang="ts">
  let { data } = $props();

  // Ejercicio seleccionado para la gráfica (por defecto, el que más sesiones tiene)
  // svelte-ignore state_referenced_locally
  let selectedId = $state<string | null>(data.exercises[0]?.id ?? null);

  const selected = $derived(data.exercises.find((e) => e.id === selectedId) ?? null);

  // Construir el path SVG de la línea de progresión de peso.
  // viewBox 0..100 x 0..100, con padding. Y invertido (SVG crece hacia abajo).
  const CHART_W = 100;
  const CHART_H = 100;
  const PAD = 8;

  const chart = $derived.by(() => {
    if (!selected || selected.points.length === 0) return null;
    const pts = selected.points;
    const weights = pts.map((p) => p.maxWeight);
    const minW = Math.min(...weights);
    const maxW = Math.max(...weights);
    const range = maxW - minW || 1;

    const n = pts.length;
    const coords = pts.map((p, i) => {
      const x = n === 1 ? CHART_W / 2 : PAD + (i / (n - 1)) * (CHART_W - 2 * PAD);
      const y = CHART_H - PAD - ((p.maxWeight - minW) / range) * (CHART_H - 2 * PAD);
      return { x, y, ...p };
    });

    const line = coords
      .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
      .join(' ');
    // Área bajo la curva para relleno suave
    const area =
      `M ${coords[0].x.toFixed(1)} ${(CHART_H - PAD).toFixed(1)} ` +
      coords.map((c) => `L ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ') +
      ` L ${coords[coords.length - 1].x.toFixed(1)} ${(CHART_H - PAD).toFixed(1)} Z`;

    return { coords, line, area, minW, maxW };
  });

  function fmtDate(iso: string) {
    return new Date(iso + 'T00:00:00').toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    });
  }

  const muscleLabels: Record<string, string> = {
    chest: 'Pecho',
    back: 'Espalda',
    legs: 'Piernas',
    shoulders: 'Hombros',
    arms: 'Brazos',
    core: 'Core',
    cardio: 'Cardio',
    full_body: 'Cuerpo completo'
  };
</script>

<svelte:head>
  <title>Progreso · Coachify</title>
</svelte:head>

<div class="space-y-8">
  <div>
    <span class="eyebrow">Tu evolución</span>
    <h1 class="text-4xl font-display font-semibold tracking-tight mt-2">Progreso</h1>
  </div>

  <!-- Tarjetas de resumen -->
  <div class="grid grid-cols-3 gap-3">
    <div class="card text-center">
      <div class="text-2xl font-display font-semibold text-primary">{data.stats.totalSets}</div>
      <div class="text-xs text-text-mute mt-1">series registradas</div>
    </div>
    <div class="card text-center">
      <div class="text-2xl font-display font-semibold text-primary">{data.stats.exerciseCount}</div>
      <div class="text-xs text-text-mute mt-1">ejercicios</div>
    </div>
    <div class="card text-center">
      <div class="text-2xl font-display font-semibold text-primary">
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

        {#if chart}
          <!-- Gráfica de progresión (SVG inline) -->
          <div class="relative">
            <svg
              viewBox="0 0 {CHART_W} {CHART_H}"
              class="w-full"
              style="height:200px"
              preserveAspectRatio="none"
              role="img"
              aria-label="Gráfica de progresión de peso en {selected.name}. Mejor marca: {selected.bestWeight ??
                'sin datos'} kg."
            >
              <!-- área -->
              <path d={chart.area} fill="currentColor" class="text-primary/10" />
              <!-- línea -->
              <path
                d={chart.line}
                fill="none"
                stroke="currentColor"
                class="text-primary"
                stroke-width="1.5"
                stroke-linejoin="round"
                stroke-linecap="round"
                vector-effect="non-scaling-stroke"
              />
              <!-- puntos -->
              {#each chart.coords as c}
                <circle
                  cx={c.x}
                  cy={c.y}
                  r="1.6"
                  fill="currentColor"
                  class="text-primary"
                  vector-effect="non-scaling-stroke"
                />
              {/each}
            </svg>
            <div class="flex justify-between text-[10px] text-text-mute mt-1">
              <span>{fmtDate(selected.points[0].date)}</span>
              {#if selected.points.length > 1}
                <span>{fmtDate(selected.points[selected.points.length - 1].date)}</span>
              {/if}
            </div>
            <div class="absolute top-0 left-0 text-[10px] text-text-mute">{chart.maxW} kg</div>
            <div class="absolute bottom-5 left-0 text-[10px] text-text-mute">{chart.minW} kg</div>
          </div>

          <!-- Tabla de las últimas sesiones -->
          <div class="border-t border-text-mute/10 pt-4">
            <div class="text-xs uppercase tracking-wider text-text-mute mb-2">Historial</div>
            <div class="space-y-1.5 max-h-48 overflow-y-auto">
              {#each [...selected.points].reverse() as p}
                <div class="flex items-center justify-between text-sm">
                  <span class="text-text-mute">{fmtDate(p.date)}</span>
                  <span class="font-semibold">{p.maxWeight} kg</span>
                  <span class="text-xs text-text-mute">{p.totalReps} reps</span>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {/if}
  {/if}
</div>
