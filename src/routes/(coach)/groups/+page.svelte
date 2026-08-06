<script lang="ts">
  import { enhance } from '$app/forms';
  import ConfirmModal from '$lib/components/ConfirmModal.svelte';

  let { data, form } = $props();

  let showForm = $state(false);
  let creating = $state(false);
  let newName = $state('');
  let nameError = $state('');

  let confirmOpen = $state(false);
  let toDelete = $state<{ id: string; name: string }>({ id: '', name: '' });
  function askDelete(id: string, name: string) {
    toDelete = { id, name };
    confirmOpen = true;
  }
</script>

<svelte:head>
  <title>Grupos · Coachify</title>
</svelte:head>

<div class="space-y-8">
  <div class="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
    <div class="min-w-0">
      <span class="eyebrow">Gestión</span>
      <h1 class="text-2xl sm:text-3xl font-display font-semibold tracking-tight mt-2">Grupos</h1>
      <p class="text-text-mute text-sm mt-2 max-w-lg">
        Agrupa clientes para gestionarlos a la vez: invitarlos en masa o programarles el mismo
        entrenamiento. Cada uno conserva su ficha y su seguimiento individual.
      </p>
    </div>
    <button onclick={() => (showForm = !showForm)} class="btn-primary whitespace-nowrap">
      + Nuevo grupo
    </button>
  </div>

  {#if form?.error}
    <p role="alert" class="text-sm text-danger bg-danger/10 border border-danger/20 rounded-md p-3">
      {form.error}
    </p>
  {/if}
  {#if form?.success && form?.created}
    <p
      aria-live="polite"
      class="text-sm text-success bg-success/10 border border-success/20 rounded-md p-3"
    >
      Grupo creado. Ya puedes añadirle clientes.
    </p>
  {/if}
  {#if form?.success && form?.deleted}
    <p
      aria-live="polite"
      class="text-sm text-success bg-success/10 border border-success/20 rounded-md p-3"
    >
      Grupo eliminado. Los clientes siguen en tu cartera.
    </p>
  {/if}

  {#if showForm}
    <!-- El botón se queda pulsable aunque falte el nombre: así podemos decir
         qué falta en vez de no reaccionar. -->
    <form
      method="POST"
      action="?/create"
      onsubmit={(e) => {
        if (!newName.trim()) {
          e.preventDefault();
          nameError = 'Ponle un nombre al grupo para poder crearlo.';
        }
      }}
      use:enhance={() => {
        creating = true;
        return async ({ update }) => {
          await update();
          creating = false;
          newName = '';
          if (form?.success) showForm = false;
        };
      }}
      class="card space-y-3"
    >
      <div class="grid sm:grid-cols-[1fr_1fr_auto] gap-3 sm:items-end">
        <div>
          <label for="g-name" class="block text-xs uppercase tracking-wider text-text-mute mb-2">
            Nombre del grupo
          </label>
          <input
            id="g-name"
            name="name"
            bind:value={newName}
            oninput={() => (nameError = '')}
            maxlength="80"
            aria-invalid={nameError ? 'true' : undefined}
            aria-describedby={nameError ? 'g-name-error' : undefined}
            placeholder="Ej: Empleadas de Talleres López"
            class="w-full px-4 py-3 bg-bg border rounded-md focus:ring-2 focus:ring-accent/20 {nameError
              ? 'border-danger'
              : 'border-line focus:border-accent'}"
          />
        </div>
        <div>
          <label for="g-company" class="block text-xs uppercase tracking-wider text-text-mute mb-2">
            Empresa <span class="normal-case tracking-normal text-text-mute/70">(opcional)</span>
          </label>
          <input
            id="g-company"
            name="company"
            maxlength="120"
            placeholder="Para facturación"
            class="w-full px-4 py-3 bg-bg border border-line rounded-md focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <button type="submit" disabled={creating} class="btn-primary py-3">
          {creating ? 'Creando…' : 'Crear grupo'}
        </button>
      </div>
      {#if nameError}
        <p id="g-name-error" role="alert" class="text-sm text-danger">{nameError}</p>
      {/if}
    </form>
  {/if}

  {#if data.groups.length === 0}
    <div class="card max-w-2xl space-y-3">
      <h2 class="text-2xl font-display font-semibold">Aún no tienes grupos</h2>
      <p class="text-sm text-text-mute">
        Un grupo te ahorra el trabajo repetido cuando llevas a varias personas a la vez: las invitas
        de golpe pegando sus correos y les programas el mismo entrenamiento en un clic. Es lo que
        necesitas si una empresa te contrata para sus empleadas.
      </p>
      <button onclick={() => (showForm = true)} class="btn-primary">Crear el primero</button>
    </div>
  {:else}
    <div class="border-t border-line">
      {#each data.groups as g (g.id)}
        <div class="row">
          <a href="/groups/{g.id}" class="flex-1 min-w-0">
            <div class="font-medium truncate">{g.name}</div>
            <div class="text-xs text-text-mute truncate">
              {g.memberCount}
              {g.memberCount === 1 ? 'persona' : 'personas'}{g.company ? ' · ' + g.company : ''}
            </div>
          </a>
          <a href="/groups/{g.id}" class="text-xs text-accent hover:underline flex-shrink-0"
            >Abrir</a
          >
          <button
            type="button"
            class="text-text-mute hover:text-danger transition-colors text-lg leading-none flex-shrink-0"
            aria-label="Eliminar grupo {g.name}"
            onclick={() => askDelete(g.id, g.name)}
          >
            ×
          </button>
        </div>
      {/each}
    </div>
  {/if}
</div>

<ConfirmModal
  bind:open={confirmOpen}
  action="?/delete"
  fields={{ group_id: toDelete.id }}
  title="Eliminar grupo"
  message={`Se eliminará el grupo "${toDelete.name}". Los clientes seguirán en tu cartera, solo dejan de estar agrupados.`}
  confirmLabel="Eliminar grupo"
/>
