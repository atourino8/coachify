<script lang="ts">
  let { data } = $props();
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
        {data.clients.length} {data.clients.length === 1 ? 'cliente activo' : 'clientes activos'}
      </p>
    </div>
    <button
      class="btn-ghost cursor-not-allowed opacity-50"
      title="La invitación de clientes llega en Fase B.3"
      disabled
    >
      + Invitar cliente (próximamente)
    </button>
  </div>

  {#if data.clients.length === 0}
    <div class="card text-center py-16">
      <div class="text-6xl mb-4">👥</div>
      <h2 class="text-xl font-semibold mb-2">Aún no tienes clientes</h2>
      <p class="text-sm text-text-mute max-w-md mx-auto">
        En la próxima fase (B.3) podrás invitar a tus clientes por email. Te llegará
        un link que ellos abren para crear su cuenta y quedar vinculados a ti.
      </p>
    </div>
  {:else}
    <div class="space-y-2">
      {#each data.clients as client (client.id)}
        <div class="card flex items-center gap-4">
          <div
            class="w-12 h-12 rounded-full bg-surface-2 grid place-items-center text-lg font-semibold text-text-mute"
          >
            {client.full_name?.charAt(0).toUpperCase() ?? '?'}
          </div>
          <div class="flex-1">
            <div class="font-semibold">{client.full_name ?? 'Sin nombre'}</div>
            <div class="text-xs text-text-mute">Cliente desde {new Date(client.created_at).toLocaleDateString('es-ES')}</div>
          </div>
          <button class="text-text-mute hover:text-text text-sm">Ver perfil</button>
        </div>
      {/each}
    </div>
  {/if}
</div>
