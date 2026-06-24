<script lang="ts">
  import { enhance } from '$app/forms';
  let { data, form } = $props();
  let showInvite = $state(false);
  let loading = $state(false);
</script>

<svelte:head>
  <title>Clientes · Coachify</title>
</svelte:head>

<div class="space-y-8">
  <div class="flex items-center justify-between">
    <div>
      <span class="eyebrow">tu cartera</span>
      <h1 class="text-3xl font-bold tracking-tight mt-2">Clientes</h1>
      <p class="text-text-mute mt-1">
        {data.clients.length}
        {data.clients.length === 1 ? 'cliente activo' : 'clientes activos'}
      </p>
    </div>
    <button class="btn-primary" onclick={() => (showInvite = !showInvite)}>
      {showInvite ? 'Cancelar' : '+ Invitar cliente'}
    </button>
  </div>

  {#if showInvite}
    <form
      method="POST"
      action="?/invite"
      use:enhance={() => {
        loading = true;
        return async ({ update }) => {
          await update();
          loading = false;
          if (form?.success) showInvite = false;
        };
      }}
      class="card space-y-4 border-primary/30"
    >
      <h3 class="font-semibold">Invitar nuevo cliente</h3>
      <p class="text-sm text-text-mute">
        Le mandamos un email con un link mágico. Cuando lo acepte, queda
        vinculado a ti automáticamente.
      </p>

      <div class="grid sm:grid-cols-2 gap-4">
        <div>
          <label for="full_name" class="block text-xs uppercase tracking-wider text-text-mute mb-2">
            Nombre completo
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            required
            maxlength="80"
            placeholder="Ej: Pepe García"
            class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label for="email" class="block text-xs uppercase tracking-wider text-text-mute mb-2">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            maxlength="100"
            placeholder="pepe@email.com"
            class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {#if form?.error}
        <p class="text-sm text-danger bg-danger/10 border border-danger/20 rounded-md p-3">
          {form.error}
        </p>
      {/if}

      <button type="submit" disabled={loading} class="btn-primary w-full">
        {loading ? 'Enviando invitación…' : 'Enviar invitación'}
      </button>
    </form>
  {/if}

  {#if form?.success}
    <div class="card bg-success/10 border-success/30 text-success text-center">
      <p class="font-medium">✓ Invitación enviada a {form.invited_email}</p>
      <p class="text-sm mt-2 opacity-80">
        Recibirá un email con un link mágico. Cuando lo acepte aparecerá aquí.
      </p>
    </div>
  {/if}

  {#if data.clients.length === 0}
    <div class="card text-center py-16">
      <div class="text-6xl mb-4">👥</div>
      <h2 class="text-xl font-semibold mb-2">Aún no tienes clientes</h2>
      <p class="text-sm text-text-mute max-w-md mx-auto">
        Invita a tu primer cliente por email para empezar a armarle entrenos.
      </p>
    </div>
  {:else}
    <div class="space-y-2">
      {#each data.clients as client (client.id)}
        <a
          href="/clients/{client.id}"
          class="card flex items-center gap-4 hover:border-primary/50 transition-all"
        >
          <div
            class="w-12 h-12 rounded-full bg-surface-2 grid place-items-center text-lg font-semibold text-text-mute"
          >
            {client.full_name?.charAt(0).toUpperCase() ?? '?'}
          </div>
          <div class="flex-1">
            <div class="font-semibold">{client.full_name ?? 'Sin nombre'}</div>
            <div class="text-xs text-text-mute">
              Cliente desde {new Date(client.created_at).toLocaleDateString('es-ES')}
            </div>
          </div>
          <span class="text-text-mute hover:text-text text-sm">Ver →</span>
        </a>
      {/each}
    </div>
  {/if}
</div>
