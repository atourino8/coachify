<script lang="ts">
  // Gráfica de progresión de peso de un ejercicio.
  //
  // La usan las dos partes: el cliente en su /progress y el entrenador en la
  // ficha del cliente. Vive aquí para que no se desincronicen.
  //
  // Sobre el SVG: usamos preserveAspectRatio="none" para que la curva llene el
  // ancho disponible sea cual sea. El efecto secundario es que cualquier forma
  // se deforma con el contenedor (en un móvil estrecho y bajo, un círculo sale
  // como un huevo). Por eso los puntos NO son círculos, sino marcas verticales
  // con stroke no escalable: se ven igual de bien a 340px que a 1100px.

  export type ProgressPoint = { date: string; maxWeight: number; totalReps: number };

  let {
    points,
    height = 180
  }: {
    points: ProgressPoint[];
    height?: number;
  } = $props();

  const W = 100;
  const H = 100;
  const PAD = 8;

  const chart = $derived.by(() => {
    if (points.length === 0) return null;
    const weights = points.map((p) => p.maxWeight);
    const minW = Math.min(...weights);
    const maxW = Math.max(...weights);
    const range = maxW - minW || 1;
    const n = points.length;

    const coords = points.map((p, i) => {
      const x = n === 1 ? W / 2 : PAD + (i / (n - 1)) * (W - 2 * PAD);
      const y = H - PAD - ((p.maxWeight - minW) / range) * (H - 2 * PAD);
      return { x, y, ...p };
    });

    const line = coords
      .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
      .join(' ');

    const area =
      `M ${coords[0].x.toFixed(1)} ${(H - PAD).toFixed(1)} ` +
      coords.map((c) => `L ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ') +
      ` L ${coords[coords.length - 1].x.toFixed(1)} ${(H - PAD).toFixed(1)} Z`;

    return { coords, line, area, minW, maxW };
  });

  function fmtDate(iso: string) {
    return new Date(iso + 'T00:00:00').toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    });
  }
</script>

{#if chart}
  <div>
    <!-- Escala vertical fuera del dibujo: encima se solapaba con la curva -->
    <div class="flex gap-2">
      <div
        class="flex flex-col justify-between text-[10px] text-text-mute tabular-nums flex-shrink-0 py-px"
        style="height:{height}px"
      >
        <span>{chart.maxW} kg</span>
        {#if chart.maxW !== chart.minW}
          <span>{chart.minW} kg</span>
        {/if}
      </div>

      <svg
        viewBox="0 0 {W} {H}"
        class="w-full"
        style="height:{height}px"
        preserveAspectRatio="none"
        role="img"
        aria-label="Progresión del peso: de {chart.minW} a {chart.maxW} kg en {points.length} sesiones."
      >
        <path d={chart.area} fill="currentColor" class="text-accent/10" />
        <path
          d={chart.line}
          fill="none"
          stroke="currentColor"
          class="text-accent"
          stroke-width="1.5"
          stroke-linejoin="round"
          stroke-linecap="round"
          vector-effect="non-scaling-stroke"
        />
        {#each chart.coords as c (c.date)}
          <line
            x1={c.x}
            y1={c.y}
            x2={c.x}
            y2={c.y}
            stroke="currentColor"
            class="text-accent"
            stroke-width="5"
            stroke-linecap="round"
            vector-effect="non-scaling-stroke"
          />
        {/each}
      </svg>
    </div>

    <div class="flex justify-between text-[10px] text-text-mute mt-1 pl-11">
      <span>{fmtDate(points[0].date)}</span>
      {#if points.length > 1}
        <span>{fmtDate(points[points.length - 1].date)}</span>
      {/if}
    </div>
  </div>
{:else}
  <p class="text-sm text-text-mute">Aún no hay series registradas de este ejercicio.</p>
{/if}
