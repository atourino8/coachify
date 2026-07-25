<script lang="ts">
  import { enhance } from '$app/forms';

  let { data, form } = $props();

  let newName = $state('');
  let creating = $state(false);
  let showForm = $state(false);
</script>

<svelte:head>
  <title>Entrenos · Coachify</title>
</svelte:head>

<div class="space-y-8">
  <!-- Pestañas Biblioteca -->
  <div class="flex gap-1 border-b border-text-mute/10">
    <a href="/exercises" class="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-text-mute hover:text-text">Ejercicios</a>
    <a href="/templates" class="px-4 py-2 text-sm font-medium border-b-2 border-primary text-primary -mb-px">Plantillas</a>
  </div>

  <div class="flex items-center justify-between gap-4">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Plantillas de entreno</h1>
      <p class="text-text-mute text-sm mt-2 max-w-lg">
        Entrenos predefinidos (hipertrofia principiante, cardio avanzado…) que
        reutilizas al programar los días de tus clientes.
      </p>
    </div>
    <button onclick={() => (showForm = !showForm)} class="btn-primary py-2 px-5 whitespace-nowrap">
      + Nueva plantilla
    </button>
  </div>

  {#if form?.error}
    <p class="text-sm text-danger bg-danger/10 border border-danger/20 rounded-md p-3">{form.error}</p>
  {/if}

  {#if showForm}
    <form
      method="POST"
      action="?/create"
      use:enhance={() => {
        creating = true;
        return async ({ update }) => {
          await update();
          creating = false;
          newName = '';
        };
      }}
      class="card flex flex-col sm:flex-row gap-3 sm:items-end"
    >
      <div class="flex-1">
        <label for="tpl-name" class="block text-xs uppercase tracking-wider text-text-mute mb-2">
          Nombre de la plantilla
        </label>
        <input
          id="tpl-name"
          name="name"
          bind:value={newName}
          required
          maxlength="80"
          placeholder="Ej: Hipertrofia principiante"
          class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <button type="submit" disabled={creating || !newName.trim()} class="btn-primary py-3">
        {creating ? 'Creando…' : 'Crear y editar'}
      </button>
    </form>
  {/if}

  {#if data.templates.length === 0}
    <div class="card text-center py-16">
      <div class="text-6xl mb-4">📋</div>
      <h2 class="text-xl font-semibold mb-2">Sin plantillas todavía</h2>
      <p class="text-sm text-text-mute max-w-md mx-auto">
        Crea tu primera plantilla para tener entrenos listos que aplicar a cualquier cliente en segundos.
      </p>
    </div>
  {:else}
    <div class="grid sm:grid-cols-2 gap-4">
      {#each data.templates as t (t.id)}
        <div class="card flex items-center justify-between gap-4 hover:border-primary/40 transition-all">
          <a href="/templates/{t.id}" class="flex-1 min-w-0">
            <div class="font-semibold truncate">{t.name}</div>
            <div class="text-xs text-text-mute mt-1">{t.itemCount} ejercicios</div>
          </a>
          <div class="flex items-center gap-3 flex-shrink-0">
            <a href="/templates/{t.id}" class="text-xs text-primary hover:underline">Editar</a>
            <form method="POST" action="?/delete" use:enhance>
              <input type="hidden" name="template_id" value={t.id} />
              <button
                type="submit"
                class="text-text-mute hover:text-danger transition-colors text-lg leading-none"
                title="Borrar plantilla"
                onclick={(e) => {
                  if (!confirm('¿Borrar esta plantilla? No afecta a los entrenos ya asignados.')) e.preventDefault();
                }}
              >
                ×
              </button>
            </form>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
