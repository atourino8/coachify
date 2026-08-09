<script lang="ts">
  import { PAYMENT_METHOD_LABELS } from '$lib/supabase/types';

  let { data } = $props();

  const eur = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

  function mesLargo(iso: string) {
    return new Date(iso + '-01T00:00:00').toLocaleDateString('es-ES', {
      month: 'long',
      year: 'numeric'
    });
  }
  function fecha(iso: string) {
    return new Date(iso + 'T00:00:00').toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    });
  }

  // El mes más alto del año marca la escala de las barras.
  const techo = $derived(Math.max(...data.meses.map((m) => m.total), data.prevision, 1));
</script>

<svelte:head>
  <title>Cobros · Treno</title>
</svelte:head>

<div class="space-y-8">
  <div class="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
    <div class="min-w-0">
      <p class="eyebrow">Tu facturación</p>
      <h1 class="text-2xl sm:text-3xl font-display font-semibold tracking-tight mt-2">Cobros</h1>
    </div>
    <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
      {#each data.anios as a (a)}
        <a
          href="?anio={a}"
          class="text-sm transition-colors {a === data.anio
            ? 'text-accent font-semibold'
            : 'text-text-mute hover:text-text'}"
        >
          {a}
        </a>
      {/each}
    </div>
  </div>

  <!-- Las tres cifras que un autónomo quiere de un vistazo. Van grandes
       porque en esta pantalla el número ES el contenido. -->
  <div class="grid grid-cols-3 gap-2 sm:gap-4 border-y border-line py-5">
    <div>
      <p class="text-2xl sm:text-3xl font-bold tabular-nums tracking-tight">
        {eur.format(data.cobradoEsteMes)}
      </p>
      <p class="text-2xs uppercase tracking-wider text-text-mute mt-1">cobrado este mes</p>
    </div>
    <div>
      <p class="text-2xl sm:text-3xl font-bold tabular-nums tracking-tight text-text-mute">
        {eur.format(data.prevision)}
      </p>
      <p class="text-2xs uppercase tracking-wider text-text-mute mt-1">
        si cobras todas las cuotas
      </p>
    </div>
    <div>
      <p class="text-2xl sm:text-3xl font-bold tabular-nums tracking-tight">
        {eur.format(data.totalAnio)}
      </p>
      <p class="text-2xs uppercase tracking-wider text-text-mute mt-1">en {data.anio}</p>
    </div>
  </div>

  <!-- Export -->
  <section class="grid sm:grid-cols-[1fr_auto] gap-4 items-center">
    <div>
      <h2 class="font-semibold">Llevar esto a tu gestoría</h2>
      <p class="text-sm text-text-mute mt-1">
        Se descarga en CSV, que se abre en Excel de doble clic con las columnas ya separadas.
      </p>
    </div>
    <div class="flex flex-wrap gap-3">
      <a href="/cobros/export?anio={data.anio}" class="btn-ghost" data-sveltekit-reload>
        Cobros {data.anio}
      </a>
      <a href="/cobros/export-clientes" class="btn-ghost" data-sveltekit-reload>Clientes</a>
    </div>
  </section>

  {#if data.meses.length === 0}
    <div class="card max-w-2xl space-y-3">
      <h2 class="text-2xl font-display font-semibold">Todavía no has registrado ningún cobro</h2>
      <p class="text-sm text-text-mute">
        Cada vez que un cliente te pague, apúntalo desde su ficha. A partir del segundo mes esta
        pantalla te dice cuánto facturas y podrás mandarle el año entero a tu gestoría en un
        fichero.
      </p>
      <a href="/clients" class="btn-primary">Ir a mis clientes</a>
    </div>
  {:else}
    <!-- Por meses -->
    <section>
      <h2 class="text-lg font-display font-semibold mb-2">Mes a mes</h2>
      <div class="border-t border-line">
        {#each data.meses as m (m.mes)}
          <div class="row">
            <span class="w-32 text-sm capitalize flex-shrink-0">{mesLargo(m.mes)}</span>
            <span class="flex-1 min-w-0 hidden sm:block">
              <span
                class="block h-2 rounded-full {m.mes === data.mesActual
                  ? 'bg-accent'
                  : 'bg-line-strong'}"
                style="width: {(m.total / techo) * 100}%"
              ></span>
            </span>
            <span class="text-2xs text-text-mute flex-shrink-0">
              {m.cobros}
              {m.cobros === 1 ? 'cobro' : 'cobros'}
            </span>
            <span class="text-base font-bold tabular-nums flex-shrink-0 w-24 text-right">
              {eur.format(m.total)}
            </span>
          </div>
        {/each}
      </div>
    </section>

    <!-- Detalle -->
    <section>
      <h2 class="text-lg font-display font-semibold mb-2">Todos los cobros</h2>
      <div class="border-t border-line">
        {#each data.pagos as p (p.id)}
          <div class="row">
            <span class="w-16 text-sm text-text-mute tabular-nums flex-shrink-0">
              {fecha(p.paid_on)}
            </span>
            <span class="flex-1 min-w-0">
              <a
                href="/clients/{p.client_id}"
                class="font-medium hover:text-accent transition-colors"
              >
                {p.cliente}
              </a>
              {#if p.notes}
                <span class="text-2xs text-text-mute block">{p.notes}</span>
              {/if}
            </span>
            <span class="pill-mute flex-shrink-0"
              >{PAYMENT_METHOD_LABELS[p.method] ?? p.method}</span
            >
            <span class="text-base font-bold tabular-nums flex-shrink-0 w-20 text-right">
              {eur.format(p.amount)}
            </span>
          </div>
        {/each}
      </div>
    </section>
  {/if}
</div>
