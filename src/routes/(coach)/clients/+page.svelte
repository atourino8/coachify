<script lang="ts">
  import { enhance } from '$app/forms';
  import ConfirmModal from '$lib/components/ConfirmModal.svelte';

  let { data, form } = $props();

  let tab = $state<'active' | 'pending'>('active');
  let showInvite = $state(false);
  let inviting = $state(false);

  // Modal de cancelar invitación.
  let cancelOpen = $state(false);
  let toCancel = $state<{ id: string; name: string }>({ id: '', name: '' });
  function askCancel(id: string, name: string) {
    toCancel = { id, name };
    cancelOpen = true;
  }

  function fmtDate(iso: string | null) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  }
</script>

<svelte:head>
  <title>Clientes · Coachify</title>
</svelte:head>

<svelte:window
  onkeydown={(e) => {
    if (showInvite && e.key === 'Escape') showInvite = false;
  }}
/>

<div class="space-y-6">
  <div class="flex items-center justify-between gap-4">
    <div>
      <span class="eyebrow">tu cartera</span>
      <h1 class="text-3xl font-bold tracking-tight mt-2">Clientes</h1>
    </div>
    <button class="btn-primary" onclick={() => (showInvite = true)}>+ Invitar cliente</button>
  </div>

  {#if form?.success && form?.invited_email}
    <p aria-live="polite" class="text-sm text-success bg-success/10 border border-success/20 rounded-md p-3">
      Invitación enviada a {form.invited_email}. Aparecerá en “Pendientes” hasta que la acepte.
    </p>
  {/if}
  {#if form?.success && form?.resent_email}
    <p aria-live="polite" class="text-sm text-success bg-success/10 border border-success/20 rounded-md p-3">
      Invitación reenviada a {form.resent_email}.
    </p>
  {/if}
  {#if form?.success && form?.cancelled}
    <p aria-live="polite" class="text-sm text-success bg-success/10 border border-success/20 rounded-md p-3">
      Invitación cancelada.
    </p>
  {/if}

  <!-- Pestañas -->
  <div class="flex gap-1 border-b border-text-mute/10">
    <button
      onclick={() => (tab = 'active')}
      class="px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors
        {tab === 'active' ? 'border-primary text-text' : 'border-transparent text-text-mute hover:text-text'}"
    >
      Activos ({data.active.length})
    </button>
    <button
      onclick={() => (tab = 'pending')}
      class="px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2
        {tab === 'pending' ? 'border-primary text-text' : 'border-transparent text-text-mute hover:text-text'}"
    >
      Pendientes
      {#if data.pending.length > 0}
        <span class="text-xs px-2 py-0.5 rounded-full bg-warning/15 text-warning">{data.pending.length}</span>
      {/if}
    </button>
  </div>

  {#if tab === 'active'}
    {#if data.active.length === 0}
      <div class="card text-center py-16">
        <div class="text-6xl mb-4" aria-hidden="true">👥</div>
        <h2 class="text-xl font-semibold mb-2">Aún no tienes clientes activos</h2>
        <p class="text-sm text-text-mute max-w-md mx-auto">
          Invita a tu primer cliente por email. Cuando acepte la invitación, aparecerá aquí.
        </p>
      </div>
    {:else}
      <div class="space-y-2">
        {#each data.active as client (client.id)}
          <a
            href="/clients/{client.id}"
            class="card flex items-center gap-4 hover:border-primary/50 transition-all"
          >
            <div class="w-12 h-12 rounded-full bg-surface-2 grid place-items-center text-lg font-semibold text-text-mute">
              {client.full_name?.charAt(0).toUpperCase() ?? '?'}
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-semibold truncate">{client.full_name ?? 'Sin nombre'}</div>
              <div class="text-xs text-text-mute truncate">{client.email ?? ''}</div>
            </div>
            <span class="text-text-mute hover:text-text text-sm flex-shrink-0">Ver →</span>
          </a>
        {/each}
      </div>
    {/if}
  {:else}
    {#if data.pending.length === 0}
      <div class="card text-center py-16">
        <div class="text-5xl mb-4" aria-hidden="true">📭</div>
        <h2 class="text-xl font-semibold mb-2">No hay invitaciones pendientes</h2>
        <p class="text-sm text-text-mute max-w-md mx-auto">
          Cuando invites a alguien, aparecerá aquí hasta que acepte y ponga su contraseña.
        </p>
      </div>
    {:else}
      <div class="space-y-2">
        {#each data.pending as client (client.id)}
          <div class="card p-4 flex items-center gap-4">
            <div class="w-11 h-11 rounded-full bg-warning/10 grid place-items-center text-warning flex-shrink-0" aria-hidden="true">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" stroke-linecap="round" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-semibold truncate">{client.full_name ?? 'Sin nombre'}</div>
              <div class="text-xs text-text-mute truncate">{client.email ?? '—'}</div>
              <div class="text-[11px] text-text-mute mt-0.5">Invitado el {fmtDate(client.invited_at)}</div>
            </div>
            <span class="text-[11px] px-2 py-0.5 rounded-full bg-warning/15 text-warning flex-shrink-0">
              Pendiente de aceptar
            </span>
            <div class="flex flex-col gap-1.5 flex-shrink-0">
              <form method="POST" action="?/resendInvite" use:enhance>
                <input type="hidden" name="email" value={client.email ?? ''} />
                <input type="hidden" name="full_name" value={client.full_name ?? ''} />
                <button type="submit" class="action-neutral w-full">Reenviar</button>
              </form>
              <button
                type="button"
                class="action-danger"
                onclick={() => askCancel(client.id, client.full_name ?? client.email ?? 'este cliente')}
              >
                Cancelar
              </button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  {/if}
</div>

<!-- Modal: invitar cliente -->
{#if showInvite}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-[200] grid place-items-center bg-black/60 backdrop-blur-sm p-4"
    role="presentation"
    onclick={() => (showInvite = false)}
  >
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
    <div
      class="card w-full max-w-md space-y-4"
      role="dialog"
      tabindex="-1"
      aria-modal="true"
      aria-labelledby="invite-title"
      onclick={(e) => e.stopPropagation()}
    >
      <div>
        <h3 id="invite-title" class="text-lg font-semibold">Invitar nuevo cliente</h3>
        <p class="text-sm text-text-mute mt-1">
          Le mandamos un email con un enlace. Cuando lo acepte, queda vinculado a ti automáticamente.
        </p>
      </div>

      <form
        method="POST"
        action="?/invite"
        use:enhance={() => {
          inviting = true;
          return async ({ update }) => {
            await update();
            inviting = false;
            if (form?.success) showInvite = false;
          };
        }}
        class="space-y-4"
      >
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
          <label for="email" class="block text-xs uppercase tracking-wider text-text-mute mb-2">Email</label>
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

        {#if form?.error}
          <p role="alert" class="text-sm text-danger bg-danger/10 border border-danger/20 rounded-md p-3">
            {form.error}
          </p>
        {/if}

        <div class="flex gap-3 justify-end pt-1">
          <button type="button" class="action-neutral" onclick={() => (showInvite = false)}>Cancelar</button>
          <button type="submit" disabled={inviting} class="btn-primary py-2 px-5">
            {inviting ? 'Enviando…' : 'Enviar invitación'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<ConfirmModal
  bind:open={cancelOpen}
  action="?/cancelInvite"
  fields={{ client_id: toCancel.id }}
  title="Cancelar invitación"
  message={`Se cancelará la invitación de ${toCancel.name} y se eliminará su acceso pendiente. Podrás volver a invitarle cuando quieras.`}
  confirmLabel="Cancelar invitación"
/>
