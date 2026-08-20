<script lang="ts">
  import { enhance } from '$app/forms';
  import { page } from '$app/state';
  import ConfirmModal from '$lib/components/ConfirmModal.svelte';
  import MenuFila from '$lib/components/MenuFila.svelte';
  import Icono from '$lib/components/Icono.svelte';

  let { data, form } = $props();

  let newName = $state('');
  let creating = $state(false);
  let nameError = $state('');
  // Se abre solo con ?new=1 (atajo desde el home).
  // svelte-ignore state_referenced_locally
  let showForm = $state(page.url.searchParams.get('new') === '1');
  let filterCat = $state('');

  // Modal de confirmación para borrar plantilla.
  let confirmOpen = $state(false);
  let toDelete = $state<{ id: string; name: string }>({ id: '', name: '' });
  function askDelete(id: string, name: string) {
    toDelete = { id, name };
    confirmOpen = true;
  }

  const catLabels: Record<string, string> = {
    hipertrofia: 'Hipertrofia',
    fuerza: 'Fuerza',
    resistencia: 'Resistencia',
    movilidad: 'Movilidad',
    perdida_grasa: 'Pérdida de grasa',
    rehabilitacion: 'Rehabilitación',
    otro: 'Otro'
  };

  // Categorías presentes en las plantillas actuales (para el filtro)
  const presentCats = $derived(
    [...new Set(data.templates.map((t) => t.category).filter(Boolean) as string[])].sort()
  );
  // Buscador de la lista (pantalla 8). Busca solo en el nombre: un
  // entrenamiento no tiene más texto que buscar, y la categoría ya tiene sus
  // pastillas justo al lado.
  let busqueda = $state('');
  const normalizar = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  const filtered = $derived.by(() => {
    const q = normalizar(busqueda.trim());
    return data.templates.filter((t) => {
      if (filterCat && t.category !== filterCat) return false;
      return q === '' || normalizar(t.name).includes(q);
    });
  });
</script>

<svelte:head>
  <title>Entrenamientos · Treno</title>
</svelte:head>

<div class="space-y-8">
  <!-- Pestañas Biblioteca -->
  <div class="flex gap-1 border-b border-line fila-desplazable">
    <a
      href="/exercises"
      class="px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap flex-shrink-0 border-transparent text-text-mute hover:text-text"
      >Ejercicios</a
    >
    <a
      href="/templates"
      class="px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap flex-shrink-0 border-accent text-accent -mb-px"
      >Entrenamientos</a
    >
  </div>

  <!-- El botón cae a su propia línea en móvil: junto al título no cabía y se
       salía de la pantalla. -->
  <div class="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
    <div class="min-w-0">
      <h1 class="text-2xl sm:text-3xl font-display font-semibold tracking-tight">Entrenamientos</h1>
      <p class="text-text-mute text-sm mt-2 max-w-lg">
        Entrenamientos predefinidos (hipertrofia principiante, cardio avanzado…) que reutilizas al
        programar los días de tus clientes.
      </p>
    </div>
    <button onclick={() => (showForm = !showForm)} class="btn-primary whitespace-nowrap">
      + Nuevo entrenamiento
    </button>
  </div>

  {#if form?.error}
    <p role="alert" class="text-sm text-danger bg-danger/10 border border-danger/20 rounded-md p-3">
      {form.error}
    </p>
  {/if}

  {#if showForm}
    <!-- El botón NO se deshabilita cuando falta el nombre: un botón muerto no
         explica nada, y en el móvil ni siquiera se aprecia que está apagado.
         Se deja pulsable y decimos qué falta. -->
    <form
      method="POST"
      action="?/create"
      onsubmit={(e) => {
        if (!newName.trim()) {
          e.preventDefault();
          nameError = 'Ponle un nombre al entrenamiento para poder crearlo.';
        }
      }}
      use:enhance={() => {
        creating = true;
        return async ({ update }) => {
          await update();
          creating = false;
          newName = '';
        };
      }}
      class="card space-y-3"
    >
      <div class="flex flex-col sm:flex-row gap-3 sm:items-end">
        <div class="flex-1">
          <label for="tpl-name" class="block text-xs uppercase tracking-wider text-text-mute mb-2">
            Nombre del entrenamiento
          </label>
          <input
            id="tpl-name"
            name="name"
            bind:value={newName}
            oninput={() => (nameError = '')}
            maxlength="80"
            aria-invalid={nameError ? 'true' : undefined}
            aria-describedby={nameError ? 'tpl-name-error' : undefined}
            placeholder="Ej: Hipertrofia principiante"
            class="w-full px-4 py-3 bg-bg border rounded-md focus:ring-2 focus:ring-accent/20 {nameError
              ? 'border-danger'
              : 'border-line focus:border-accent'}"
          />
        </div>
        <button type="submit" disabled={creating} class="btn-primary py-3">
          {creating ? 'Creando…' : 'Crear y editar'}
        </button>
      </div>
      {#if nameError}
        <p id="tpl-name-error" role="alert" class="text-sm text-danger">{nameError}</p>
      {/if}
    </form>
  {/if}

  {#if data.templates.length === 0}
    <div class="card max-w-2xl space-y-3">
      <h2 class="text-2xl font-display font-semibold">Aún no tienes entrenamientos</h2>
      <p class="text-sm text-text-mute">
        Un entrenamiento es una secuencia de ejercicios que montas una vez y reutilizas siempre: se
        lo aplicas a cualquier cliente, o a varios días de golpe, sin volver a armarlo. Es lo que
        convierte programar la semana en cuestión de segundos.
      </p>
      <button onclick={() => (showForm = true)} class="btn-primary">Crear el primero</button>
    </div>
  {:else}
    <!-- Filtro por categoría (solo si hay categorías en uso) -->
    {#if data.templates.length > 0}
      <div class="relative max-w-sm">
        <label for="buscar-tpl" class="sr-only">Buscar entrenamientos</label>
        <input
          id="buscar-tpl"
          type="search"
          bind:value={busqueda}
          placeholder="Buscar entrenamientos"
          class="w-full pl-9 pr-3 py-2 bg-bg border border-line rounded-md text-sm
                 focus:outline-none focus:border-accent"
        />
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-text-mute pointer-events-none">
          <Icono nombre="buscar" class="w-4 h-4" />
        </span>
      </div>
    {/if}

    {#if presentCats.length > 0}
      <div class="flex flex-wrap gap-2">
        <button
          onclick={() => (filterCat = '')}
          class="px-3 py-1.5 rounded-full text-sm border transition-colors {filterCat === ''
            ? 'bg-primary text-bg border-primary'
            : 'border-text-mute/20 text-text-mute hover:text-text'}"
        >
          Todas ({data.templates.length})
        </button>
        {#each presentCats as cat}
          <button
            onclick={() => (filterCat = cat)}
            class="px-3 py-1.5 rounded-full text-sm border transition-colors {filterCat === cat
              ? 'bg-primary text-bg border-primary'
              : 'border-text-mute/20 text-text-mute hover:text-text'}"
          >
            {catLabels[cat] ?? cat}
          </button>
        {/each}
      </div>
    {/if}

    <div class="border-t border-line">
      {#each filtered as t (t.id)}
        <div class="row">
          <a href="/templates/{t.id}" class="flex-1 min-w-0">
            <div class="font-medium truncate">{t.name}</div>
            <div class="text-xs text-text-mute">{t.itemCount} ejercicios</div>
          </a>
          {#if t.category}
            <span class="pill-mute flex-shrink-0">{catLabels[t.category] ?? t.category}</span>
          {/if}
          <MenuFila etiqueta={t.name}>
            <a href="/templates/{t.id}" class="block px-4 py-2.5 hover:bg-surface-2">Editar</a>
            <!-- data-cierra: no es un submit ni un enlace, pero abre un modal
                 y el menú tiene que quitarse de en medio igual. -->
            <button
              type="button"
              data-cierra
              onclick={() => askDelete(t.id, t.name)}
              class="block w-full text-left px-4 py-2.5 text-danger hover:bg-danger/10
                     border-t border-line"
            >
              Borrar
            </button>
          </MenuFila>
        </div>
      {/each}
      {#if filtered.length === 0}
        <p class="py-8 text-center text-sm text-text-mute">
          {busqueda.trim() ? 'Ningún entrenamiento con ese nombre.' : 'Ninguno en esta categoría.'}
        </p>
      {/if}
    </div>
  {/if}
</div>

<ConfirmModal
  bind:open={confirmOpen}
  action="?/delete"
  fields={{ template_id: toDelete.id }}
  title="Borrar entrenamiento"
  message={`Se borrará el entrenamiento "${toDelete.name}". No afecta a los entrenos ya asignados.`}
  confirmLabel="Borrar entrenamiento"
/>
