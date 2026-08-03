<script lang="ts">
  import { enhance } from '$app/forms';
  import ConfirmModal from '$lib/components/ConfirmModal.svelte';

  let { data, form } = $props();

  let showForm = $state(false);
  let creating = $state(false);
  let newName = $state('');

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
  <div class="flex items-center justify-between gap-4">
    <div>
      <span class="eyebrow">Gestión</span>
      <h1 class="text-3xl font-bold tracking-tight mt-2">Grupos</h1>
      <p class="text-text-mute text-sm mt-2 max-w-lg">
        Agrupa clientes para gestionarlos a la vez: invitarlos en masa o programarles
        el mismo entrenamiento. Cada uno conserva su ficha y su seguimiento individual.
      </p>
    </div>
    <button onclick={() => (showForm = !showForm)} class="btn-primary whitespace-nowrap">
      + Nuevo grupo
    </button>
  </div>

  {#if form?.error}
    <p role="alert" class="text-sm text-danger bg-danger/10 border border-danger/20 rounded-md p-3">{form.error}</p>
  {/if}
  {#if form?.success && form?.created}
    <p aria-live="polite" class="text-sm text-success bg-success/10 border border-success/20 rounded-md p-3">
      Grupo creado. Ya puedes añadirle clientes.
    </p>
  {/if}
  {#if form?.success && form?.deleted}
    <p aria-live="polite" class="text-sm text-success bg-success/10 border border-success/20 rounded-md p-3">
      Grupo eliminado. Los clientes siguen en tu cartera.
    </p>
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
          if (form?.success) showForm = false;
        };
      }}
      class="card grid sm:grid-cols-[1fr_1fr_auto] gap-3 sm:items-end"
    >
      <div>
        <label for="g-name" class="block text-xs uppercase tracking-wider text-text-mute mb-2">
          Nombre del grupo
        </label>
        <input
          id="g-name"
          name="name"
          bind:value={newName}
          required
          maxlength="80"
          placeholder="Ej: Empleadas de Talleres López"
          class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md focus:border-primary focus:ring-2 focus:ring-primary/20"
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
          class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <button type="submit" disabled={creating || !newName.trim()} class="btn-primary py-3">
        {creating ? 'Creando…' : 'Crear grupo'}
      </button>
    </form>
  {/if}

  {#if data.groups.length === 0}
    <div class="card text-center py-16">
      <div class="text-5xl mb-4" aria-hidden="true">👥</div>
      <h2 class="text-xl font-semibold mb-2">Sin grupos todavía</h2>
      <p class="text-sm text-text-mute max-w-md mx-auto">
        Crea un grupo cuando lleves a varias personas a la vez — por ejemplo, las
        empleadas de una empresa que te contrata.
      </p>
    </div>
  {:else}
    <div class="grid sm:grid-cols-2 gap-4">
      {#each data.groups as g (g.id)}
        <div class="card flex items-center justify-between gap-4 hover:border-primary/40 transition-all">
          <a href="/groups/{g.id}" class="flex-1 min-w-0">
            <div class="font-semibold truncate">{g.name}</div>
            {#if g.company}
              <div class="text-xs text-text-mute mt-0.5 truncate">{g.company}</div>
            {/if}
            <div class="text-xs text-text-mute mt-1">
              {g.memberCount} {g.memberCount === 1 ? 'persona' : 'personas'}
            </div>
          </a>
          <div class="flex items-center gap-3 flex-shrink-0">
            <a href="/groups/{g.id}" class="text-xs text-primary hover:underline">Abrir</a>
            <button
              type="button"
              class="text-text-mute hover:text-danger transition-colors text-lg leading-none"
              aria-label="Eliminar grupo {g.name}"
              onclick={() => askDelete(g.id, g.name)}
            >
              ×
            </button>
          </div>
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
