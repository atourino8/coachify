<script lang="ts">
  import { enhance } from '$app/forms';
  import { untrack } from 'svelte';
  import type { ClaseEtiqueta } from '$lib/tags';

  let { data, form } = $props();

  let nombre = $state(untrack(() => data.nombre));
  let guardando = $state(false);
  let renombrando = $state<string | null>(null);
  let textoNuevo = $state('');

  // Cada vocabulario, con lo del base y lo propio junto y marcado. El base no
  // se puede borrar —lo usa la biblioteca precargada— pero sí renombrar.
  const vocabularios = $derived([
    {
      kind: 'muscle' as ClaseEtiqueta,
      titulo: 'Grupos musculares',
      ayuda: 'Lo que trabaja cada ejercicio. Con estos se filtra tu biblioteca.',
      base: data.vocabulario.baseMuscle,
      mapa: data.vocabulario.muscle
    },
    {
      kind: 'equipment' as ClaseEtiqueta,
      titulo: 'Material',
      ayuda: 'Lo que hace falta para hacerlo.',
      base: data.vocabulario.baseEquipment,
      mapa: data.vocabulario.equipment
    }
  ]);

  const propiasDe = (kind: ClaseEtiqueta) => data.propias.filter((p) => p.kind === kind);

  function abrirRenombrar(clave: string, actual: string) {
    renombrando = clave;
    textoNuevo = actual;
  }

  function trasGuardar() {
    guardando = true;
    return async ({ update }: { update: (o?: { reset?: boolean }) => Promise<void> }) => {
      await update({ reset: false });
      renombrando = null;
      guardando = false;
    };
  }
</script>

<svelte:head>
  <title>Ajustes · Treno</title>
</svelte:head>

<div class="max-w-2xl space-y-10">
  <header>
    <h1 class="h-display text-2xl sm:text-3xl">Ajustes</h1>
  </header>

  {#if form?.error}
    <p role="alert" class="text-sm text-danger bg-danger/10 border border-danger/20 rounded-md p-3">
      {form.error}
    </p>
  {/if}
  {#if form?.success}
    <p
      aria-live="polite"
      class="text-sm text-success bg-success/10 border border-success/20 rounded-md p-3"
    >
      {#if form.guardado === 'nombre'}
        Guardado. Tus clientes verán el nombre nuevo la próxima vez que abran la aplicación.
      {:else if form.creada}
        Etiqueta «{form.creada}» añadida.
      {:else if form.renombrada}
        Renombrada a «{form.renombrada}».
      {:else if form.borrada}
        Etiqueta borrada{form.quitadaDe ? ` y quitada de ${form.quitadaDe} ejercicios` : ''}.
      {:else}
        Guardado.
      {/if}
    </p>
  {/if}

  <!-- ================= Perfil ================= -->
  <section class="space-y-3">
    <div>
      <h2 class="text-lg font-display font-semibold">Perfil</h2>
      <p class="text-sm text-text-mute">Lo que ven tus clientes.</p>
    </div>

    <form method="POST" action="?/nombre" use:enhance={trasGuardar} class="card space-y-4">
      <div>
        <label for="full_name" class="block text-xs uppercase tracking-wider text-text-mute mb-2">
          Tu nombre
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          bind:value={nombre}
          maxlength="80"
          class="w-full px-4 py-3 bg-bg border border-line rounded-md
                 focus:outline-none focus:border-accent"
        />
        <!-- Se dice para qué sirve, y no es adorno: hasta hace poco el nombre
             era un dato interno y ahora preside la pantalla de sus clientes.
             Quien lo rellenó pensando que daba igual necesita saberlo. -->
        <p class="text-2xs text-text-mute mt-2">
          Preside la cabecera de la aplicación de tus clientes, encima de sus entrenos.
        </p>
      </div>
      <button type="submit" class="btn-primary" disabled={guardando || nombre.trim().length < 2}>
        {guardando ? 'Guardando…' : 'Guardar'}
      </button>
    </form>

    <div class="border-t border-line">
      <a href="/marca" class="row-link">
        <span class="flex-1 min-w-0">
          <span class="font-medium block">Tu marca</span>
          <span class="text-sm text-text-mute">
            {data.tieneMarca
              ? 'Tus clientes ven la aplicación con tu color'
              : 'Sin configurar: tus clientes ven los colores de Treno'}
          </span>
        </span>
        <span class="text-xs text-accent flex-shrink-0">Cambiar</span>
      </a>
    </div>
  </section>

  <!-- ================= Etiquetas ================= -->
  <section class="space-y-6">
    <div>
      <h2 class="text-lg font-display font-semibold">Etiquetas</h2>
      <p class="text-sm text-text-mute">
        Tu vocabulario. Empiezas con el nuestro y le añades lo que te falte: un entrenador de
        rehabilitación necesita «suelo pélvico» y uno de crossfit «anillas», y meter eso en «Otro»
        deja el filtro inservible justo para quien más lo usaría.
      </p>
    </div>

    {#each vocabularios as v (v.kind)}
      <div class="space-y-3">
        <div>
          <h3 class="font-semibold">{v.titulo}</h3>
          <p class="text-sm text-text-mute">{v.ayuda}</p>
        </div>

        <div class="border-t border-line">
          {#each Object.entries(v.mapa) as [slug, label] (slug)}
            {@const esBase = v.base.includes(slug)}
            {@const clave = v.kind + ':' + slug}
            <div class="row">
              {#if renombrando === clave}
                <form
                  method="POST"
                  action="?/renombrarEtiqueta"
                  use:enhance={trasGuardar}
                  class="flex flex-wrap items-center gap-2 flex-1 min-w-0"
                >
                  <input type="hidden" name="kind" value={v.kind} />
                  <input type="hidden" name="slug" value={slug} />
                  <input
                    name="label"
                    bind:value={textoNuevo}
                    maxlength="40"
                    aria-label="Nombre nuevo"
                    class="flex-1 min-w-0 bg-surface-2 border border-line rounded-md px-3 py-1.5 text-sm
                           focus:outline-none focus:border-accent"
                  />
                  <button type="submit" class="action-primary" disabled={guardando}>Guardar</button>
                  <button type="button" onclick={() => (renombrando = null)} class="action-neutral">
                    Cancelar
                  </button>
                </form>
              {:else}
                <span class="flex-1 min-w-0">
                  <span class="font-medium block truncate">{label}</span>
                  {#if !esBase}
                    <span class="text-2xs text-text-mute">Tuya</span>
                  {/if}
                </span>
                <button
                  onclick={() => abrirRenombrar(clave, label)}
                  class="action-neutral flex-shrink-0"
                >
                  Renombrar
                </button>
                <!-- Las del base no se borran: las usa la biblioteca
                     precargada de casi cincuenta ejercicios, y borrarlas
                     dejaría media biblioteca sin clasificar. Renombrarlas sí,
                     que es lo que de verdad se quiere ("Piernas", no "Pierna"). -->
                {#if !esBase}
                  <form method="POST" action="?/borrarEtiqueta" use:enhance={trasGuardar}>
                    <input type="hidden" name="kind" value={v.kind} />
                    <input type="hidden" name="slug" value={slug} />
                    <button type="submit" class="action-danger" disabled={guardando}>Borrar</button>
                  </form>
                {/if}
              {/if}
            </div>
          {/each}
        </div>

        <form
          method="POST"
          action="?/crearEtiqueta"
          use:enhance={() => {
            guardando = true;
            return async ({ update }) => {
              await update();
              guardando = false;
            };
          }}
          class="flex flex-wrap items-center gap-2"
        >
          <input type="hidden" name="kind" value={v.kind} />
          <input
            name="label"
            maxlength="40"
            placeholder={v.kind === 'muscle' ? 'Suelo pélvico' : 'Anillas'}
            aria-label="Añadir a {v.titulo.toLowerCase()}"
            class="flex-1 min-w-0 bg-surface-2 border border-line rounded-md px-3 py-2 text-sm
                   focus:outline-none focus:border-accent"
          />
          <button type="submit" class="action-primary" disabled={guardando}>Añadir</button>
        </form>

        {#if propiasDe(v.kind).length > 0}
          <p class="text-2xs text-text-mute">
            Al borrar una etiqueta tuya se quita de los ejercicios que la tuvieran. No se borra
            ningún ejercicio.
          </p>
        {/if}
      </div>
    {/each}
  </section>

  <!-- ================= Cobros ================= -->
  <section class="space-y-3">
    <div>
      <h2 class="text-lg font-display font-semibold">Cobros</h2>
      <p class="text-sm text-text-mute">Cuotas, historial y qué pasa con quien no paga.</p>
    </div>
    <div class="border-t border-line">
      <a href="/cobros" class="row-link">
        <span class="flex-1 min-w-0 font-medium">Ir a Cobros</span>
        <span class="text-xs text-accent flex-shrink-0">Abrir</span>
      </a>
    </div>
  </section>

  <!-- ================= Cuenta ================= -->
  <section class="space-y-3">
    <h2 class="text-lg font-display font-semibold">Cuenta</h2>
    <div class="row border-b-0">
      <span class="flex-1 min-w-0 text-sm text-text-mute break-words">{data.email}</span>
      <form method="POST" action="/logout">
        <button type="submit" class="action-danger">Cerrar sesión</button>
      </form>
    </div>
  </section>
</div>
