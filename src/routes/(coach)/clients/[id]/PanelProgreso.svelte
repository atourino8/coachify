<script lang="ts">
  import type { PageData } from './$types';
  /** Gráfica de progreso por ejercicio. Ver PanelHistorial sobre las props. */
  import ProgressChart from '$lib/components/ProgressChart.svelte';

  let { data }: { data: PageData } = $props();

  // Por defecto el ejercicio con más sesiones: es el único que da una curva
  // con forma en vez de dos puntos sueltos.
  let progresoSel = $state<string | null>(null);
  const progresoActual = $derived(
    data.progress.find((e) => e.id === progresoSel) ?? data.progress[0] ?? null
  );
</script>

<!-- ===== PROGRESO ===== -->
{#if data.progress.length === 0}
  <div class="card max-w-2xl space-y-3">
    <h2 class="text-2xl font-display font-semibold">Todavía no hay nada que medir</h2>
    <p class="text-sm text-text-mute">
      Aquí verás cómo evoluciona {data.client.full_name?.split(' ')[0] ?? 'tu cliente'} en cada ejercicio,
      en cuanto empiece a registrar las series de sus entrenos. Es el dato que convierte "creo que va
      mejor" en "ha subido 12 kg en dos meses".
    </p>
  </div>
{:else}
  <div class="space-y-6">
    <!-- Resumen: qué ejercicios suben y cuáles están estancados. Esto es lo
             que decide si toca cambiar la programación. -->
    <section>
      <h2 class="text-lg font-display font-semibold mb-2">Evolución por ejercicio</h2>
      <div class="border-t border-line">
        {#each data.progress as ex (ex.id)}
          <button
            type="button"
            onclick={() => (progresoSel = ex.id)}
            class="row w-full text-left {progresoSel === ex.id ? 'bg-surface-2/60' : ''}"
          >
            <span class="flex-1 min-w-0">
              <span class="font-medium block truncate">{ex.name}</span>
              <span class="text-xs text-text-mute">
                {ex.sessions}
                {ex.sessions === 1 ? 'sesión' : 'sesiones'}
              </span>
            </span>
            <span class="text-sm tabular-nums flex-shrink-0">{ex.bestWeight ?? '—'} kg</span>
            {#if ex.delta !== null && ex.delta !== 0}
              <span class="flex-shrink-0 {ex.delta > 0 ? 'pill-ok' : 'pill-warn'}">
                {ex.delta > 0 ? '+' : ''}{ex.delta} kg
              </span>
            {:else if ex.delta === 0}
              <span class="pill-mute flex-shrink-0">estancado</span>
            {/if}
          </button>
        {/each}
      </div>
    </section>

    {#if progresoActual}
      <section class="card space-y-4">
        <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h3 class="font-semibold min-w-0 truncate">{progresoActual.name}</h3>
          <span class="text-sm text-text-mute">
            {progresoActual.points.length} sesiones · mejor marca {progresoActual.bestWeight} kg
          </span>
        </div>
        <ProgressChart points={progresoActual.points} />
      </section>
    {/if}
  </div>
{/if}
