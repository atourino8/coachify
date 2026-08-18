<script lang="ts">
  import { enhance } from '$app/forms';
  import { untrack } from 'svelte';
  import type { ClaseEtiqueta } from '$lib/tags';
  import Avatar from '$lib/components/Avatar.svelte';

  let { data, form } = $props();

  let nombre = $state(untrack(() => data.nombre));
  let sitio = $state(untrack(() => data.sitio));
  let guardando = $state(false);
  let subiendoFoto = $state(false);
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
    },
    {
      kind: 'client' as ClaseEtiqueta,
      titulo: 'Etiquetas de cliente',
      ayuda: 'Para encontrar a alguien cuando la lista pasa de treinta nombres.',
      // Sin base: los grupos musculares son anatomía y el material son
      // hierros, iguales para todos. Cómo clasificas a tu gente no lo es.
      base: [] as string[],
      mapa: data.vocabulario.client,
      ejemplos: ['VIP', 'Online', 'Presencial', 'Mañanas', 'Rehabilitación']
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

    <!-- La foto, en su propia tarjeta y antes que el nombre: es lo primero
         que se ve en el cajón y en la cabecera del cliente. -->
    <form
      method="POST"
      action="?/foto"
      enctype="multipart/form-data"
      class="card flex flex-wrap items-center gap-4"
      use:enhance={() => {
        subiendoFoto = true;
        return async ({ update }) => {
          subiendoFoto = false;
          await update();
        };
      }}
    >
      <Avatar url={data.avatar} nombre={data.nombre} tamano="xl" />
      <div class="flex-1 min-w-[12rem] space-y-2">
        <label for="foto" class="block text-xs uppercase tracking-wider text-text-mute"
          >Tu foto</label
        >
        <input
          id="foto"
          name="foto"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onchange={(e) => (e.currentTarget.form as HTMLFormElement).requestSubmit()}
          class="block w-full text-sm text-text-mute file:mr-3 file:py-2 file:px-4
                 file:rounded-md file:border file:border-line file:bg-surface-2
                 file:text-text file:text-sm file:cursor-pointer"
        />
        <p class="text-2xs text-text-mute">
          JPG, PNG o WEBP, hasta 5 MB. Sin foto se ve tu inicial.
          {#if subiendoFoto}<span class="text-accent">Subiendo…</span>{/if}
        </p>
      </div>
      {#if data.tieneFoto}
        <button type="submit" name="quitar" value="1" class="action-neutral">Quitar</button>
      {/if}
    </form>

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
      <div>
        <label
          for="default_location"
          class="block text-xs uppercase tracking-wider text-text-mute mb-2"
        >
          Dónde entrenas habitualmente
        </label>
        <input
          id="default_location"
          name="default_location"
          type="text"
          bind:value={sitio}
          maxlength="60"
          placeholder="Gimnasio Pepe"
          class="w-full px-4 py-3 bg-bg border border-line rounded-md
                 focus:outline-none focus:border-accent"
        />
        <p class="text-2xs text-text-mute mt-2">
          Opcional. Sale bajo tu nombre y viene propuesto al crear una cita, pero cada cita puede
          tener el suyo: si trabajas en dos sitios o vas a domicilio, no pasa nada.
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

        <!-- Estado vacío con ejemplos de un toque. Un campo de texto en blanco
             y la palabra "etiqueta" no le dicen a nadie para qué sirve esto;
             cinco ejemplos reales sí, y siguen siendo suyos porque los añade
             él. -->
        {#if v.ejemplos && Object.keys(v.mapa).length === 0}
          <div class="space-y-2">
            <p class="text-sm text-text-mute">Todavía no tienes ninguna. Por ejemplo:</p>
            <div class="flex flex-wrap gap-2">
              {#each v.ejemplos as ejemplo (ejemplo)}
                <form method="POST" action="?/crearEtiqueta" use:enhance={trasGuardar}>
                  <input type="hidden" name="kind" value={v.kind} />
                  <input type="hidden" name="label" value={ejemplo} />
                  <button
                    type="submit"
                    class="px-3 py-1.5 rounded-full text-sm border border-line text-text-mute
                           hover:text-text hover:border-line-strong transition-colors"
                    disabled={guardando}
                  >
                    + {ejemplo}
                  </button>
                </form>
              {/each}
            </div>
          </div>
        {/if}

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
            placeholder={v.kind === 'muscle'
              ? 'Suelo pélvico'
              : v.kind === 'equipment'
                ? 'Anillas'
                : 'Corporativo'}
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

  <!-- ================= Pagos ================= -->
  <section class="space-y-3">
    <div>
      <h2 class="text-lg font-display font-semibold">Pagos</h2>
      <p class="text-sm text-text-mute">Cuotas, historial y qué pasa con quien no paga.</p>
    </div>
    <div class="border-t border-line">
      <a href="/pagos" class="row-link">
        <span class="flex-1 min-w-0 font-medium">Ir a Pagos</span>
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
