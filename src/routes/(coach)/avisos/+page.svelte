<script lang="ts">
  import { enhance } from '$app/forms';
  import { untrack } from 'svelte';

  let { data, form } = $props();

  // La pestaña activa arranca en la primera que tenga algo sin ver. Empezar
  // siempre en la misma obliga a mirar tres pestañas vacías para descubrir que
  // lo pendiente estaba en la cuarta.
  // untrack porque queremos el valor inicial y solo ese: en cuanto el
  // entrenador cambia de pestaña manda su elección, y recargar los datos tras
  // marcar algo como visto no debe devolverle a otra pestaña.
  let activa = $state(
    untrack(() => data.porTipo.find((g) => g.sinVer.length > 0)?.tipo ?? data.porTipo[0].tipo)
  );

  const grupo = $derived(data.porTipo.find((g) => g.tipo === activa) ?? data.porTipo[0]);
</script>

<svelte:head>
  <title>Avisos · Treno</title>
</svelte:head>

<div class="space-y-6">
  <header>
    <h1 class="h-display text-2xl sm:text-3xl">Avisos</h1>
    <p class="text-text-mute mt-1">
      {#if data.total === 0}
        No hay nada esperándote.
      {:else}
        {data.total}
        {data.total === 1 ? 'cosa espera' : 'cosas esperan'} algo tuyo.
      {/if}
    </p>
  </header>

  {#if form?.error}
    <p role="alert" class="text-sm text-danger bg-danger/10 border border-danger/20 rounded-md p-3">
      {form.error}
    </p>
  {/if}

  <!-- Pestañas con el número al lado. El número es lo SIN VER, no el total:
       lo que ya has mirado no debería seguir pidiéndote atención. -->
  <div class="flex gap-1 border-b border-line overflow-x-auto">
    {#each data.porTipo as g (g.tipo)}
      <button
        onclick={() => (activa = g.tipo)}
        aria-current={activa === g.tipo ? 'page' : undefined}
        class="px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap flex-shrink-0 -mb-px
               transition-colors {activa === g.tipo
          ? 'border-accent text-accent'
          : 'border-transparent text-text-mute hover:text-text'}"
      >
        {g.etiqueta}
        {#if g.sinVer.length > 0}
          <span class="ml-1 tabular-nums">{g.sinVer.length}</span>
        {/if}
      </button>
    {/each}
  </div>

  {#if grupo.sinVer.length === 0 && grupo.vistos.length === 0}
    <p class="text-text-mute">Nada por aquí.</p>
  {/if}

  {#if grupo.sinVer.length > 0}
    <div>
      <div class="border-t border-line">
        {#each grupo.sinVer as a (a.id)}
          <div class="row">
            <a href={a.href} class="flex-1 min-w-0 group">
              <span class="font-semibold block truncate group-hover:text-accent transition-colors">
                {a.titulo}
              </span>
              <span class="text-sm text-text-mute block">{a.detalle}</span>
            </a>
            <!-- Marcar uno a uno, y no solo "marcar todos": lo normal es que
                 de cinco cuotas vencidas haya una de la que ya te has ocupado
                 y cuatro que no. -->
            <form method="POST" action="?/marcar" use:enhance class="flex-shrink-0">
              <input type="hidden" name="kind" value={a.tipo} />
              <input type="hidden" name="entity_id" value={a.id} />
              <button type="submit" class="action-neutral">Visto</button>
            </form>
          </div>
        {/each}
      </div>

      {#if grupo.sinVer.length > 1}
        <form method="POST" action="?/marcar" use:enhance class="pt-3">
          <input type="hidden" name="kind" value={grupo.tipo} />
          {#each grupo.sinVer as a (a.id)}
            <input type="hidden" name="entity_id" value={a.id} />
          {/each}
          <button type="submit" class="text-sm text-text-mute hover:text-text transition-colors">
            Marcar los {grupo.sinVer.length} como vistos
          </button>
        </form>
      {/if}
    </div>
  {/if}

  {#if grupo.vistos.length > 0}
    <!--
      Los vistos no se esconden del todo: siguen siendo cosas por hacer.
      Marcar como visto silencia el aviso, no resuelve el problema, y una cuota
      vencida sigue vencida aunque la hayas mirado. Aquí abajo y en gris, que
      es lo que hace el wireframe.
    -->
    <div class="space-y-2">
      <div class="flex flex-wrap items-baseline justify-between gap-3 border-t border-line pt-4">
        <p class="text-sm text-text-mute">Ya vistos ({grupo.vistos.length})</p>
        <form method="POST" action="?/desmarcar" use:enhance>
          <input type="hidden" name="kind" value={grupo.tipo} />
          <button type="submit" class="text-sm text-text-mute hover:text-text transition-colors">
            Volver a marcarlos sin ver
          </button>
        </form>
      </div>
      <div>
        {#each grupo.vistos as a (a.id)}
          <a href={a.href} class="row-link opacity-60">
            <span class="flex-1 min-w-0">
              <span class="font-medium block truncate">{a.titulo}</span>
              <span class="text-sm text-text-mute block">{a.detalle}</span>
            </span>
          </a>
        {/each}
      </div>
    </div>
  {/if}

  <p class="text-2xs text-text-mute border-t border-line pt-4">
    Los avisos salen de tus datos, no de una bandeja aparte: en cuanto confirmes la cita o corrijas
    el vídeo desaparecen solos, los hayas marcado o no.
  </p>
</div>
