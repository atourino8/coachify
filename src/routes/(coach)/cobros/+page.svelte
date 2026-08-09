<script lang="ts">
  import { enhance } from '$app/forms';
  import { PAYMENT_METHOD_LABELS } from '$lib/supabase/types';

  let { data, form } = $props();

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

    <!-- Detalle
         Un año de cobros son cientos de filas, y a esta pantalla se viene a
         ver el resumen, no a leerlas una a una: el detalle se abre cuando se
         busca algo concreto.

         Con <details> nativo y no con un estado en Svelte a propósito: abre y
         cierra sin JavaScript, el navegador ya le da el rol y el teclado, y
         Ctrl+F del navegador lo despliega solo al encontrar una coincidencia
         dentro. Un desplegable hecho a mano con una variable pierde las tres
         cosas. -->
    <section>
      <details class="group">
        <summary
          class="flex flex-wrap items-center gap-x-3 gap-y-1 cursor-pointer list-none
                 border-b border-line pb-2 rounded-md
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <h2 class="text-lg font-display font-semibold">Todos los cobros</h2>
          <span class="text-sm text-text-mute">
            {data.pagos.length}
            {data.pagos.length === 1 ? 'cobro' : 'cobros'} en {data.anio}
          </span>
          <span class="ml-auto text-sm text-accent">
            <span class="group-open:hidden">Ver</span>
            <span class="hidden group-open:inline">Ocultar</span>
          </span>
        </summary>

        <div>
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
      </details>
    </section>
  {/if}

  <!-- ============ Pausar el acceso a quien no ha pagado ============ -->
  <section class="space-y-4 border-t border-line pt-8">
    <div>
      <h2 class="text-lg font-display font-semibold tracking-tight">Acceso de quien no paga</h2>
      <p class="text-sm text-text-mute mt-1 max-w-2xl">
        Si lo activas, el cliente con la cuota vencida más de {data.diasDeGracia} días deja de ver sus
        entrenos y sus vídeos de técnica hasta que lo actualices. Su historial de progreso y sus citas
        siguen abiertos: eso son datos suyos.
      </p>
    </div>

    {#if form?.error}
      <p
        role="alert"
        class="text-sm text-danger bg-danger/10 border border-danger/20 rounded-md p-3"
      >
        {form.error}
      </p>
    {/if}

    <!--
      La lista va ANTES del interruptor, y a propósito. Activar esto a ciegas
      es la peor forma de usarlo: si el entrenador ve primero los nombres,
      decide; si lo ve después, se entera cuando alguien le escriba enfadado.

      Y son los nombres de verdad, calculados con la misma función que hace el
      corte. Un resumen que dijera "2 clientes" no serviría: lo que hace parar
      a alguien es leer un nombre que sabe que sí le pagó.
    -->
    {#if data.afectados.length > 0}
      <div class="border border-warning/25 bg-warning/5 rounded-md p-4 space-y-3">
        <p class="text-sm font-medium text-warning">
          {#if data.bloqueoActivado}
            Ahora mismo {data.afectados.length === 1 ? 'está en pausa' : 'están en pausa'}
          {:else}
            Al activarlo, {data.afectados.length === 1 ? 'se pausaría' : 'se pausarían'}
          {/if}
        </p>
        <div>
          {#each data.afectados as a, i (a.nombre + i)}
            <div class="row text-sm {i === data.afectados.length - 1 ? 'border-b-0' : ''}">
              <span class="flex-1 min-w-0 font-medium">{a.nombre}</span>
              <span class="text-text-mute tabular-nums">
                {a.paidUntil ? 'venció el ' + fecha(a.paidUntil) : 'sin fecha de pago'}
              </span>
            </div>
          {/each}
        </div>
        <p class="text-2xs text-text-mute">
          Si alguno de estos ya te ha pagado y no lo has apuntado, actualízalo antes de activarlo.
        </p>
      </div>
    {:else}
      <p class="text-sm text-text-mute">Ahora mismo no hay nadie a quien esto afectaría.</p>
    {/if}

    <form method="POST" action="?/bloqueo" use:enhance>
      <input type="hidden" name="activar" value={data.bloqueoActivado ? 'no' : 'si'} />
      <button type="submit" class={data.bloqueoActivado ? 'action-danger' : 'action-primary'}>
        {data.bloqueoActivado ? 'Desactivar la pausa' : 'Activar la pausa'}
      </button>
    </form>

    <p class="text-2xs text-text-mute max-w-2xl">
      Está apagado de fábrica porque <code class="font-mono">pagado hasta</code> es lo que tú apuntas,
      no un cobro verificado. Mientras no haya pasarela, un retraso tuyo en registrar un pago le cierra
      la puerta a alguien que ya pagó, y quien queda mal delante de él eres tú.
    </p>
  </section>
</div>
