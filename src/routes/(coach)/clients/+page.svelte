<script lang="ts">
  import { enhance } from '$app/forms';
  import { page } from '$app/state';
  import ConfirmModal from '$lib/components/ConfirmModal.svelte';

  let { data, form } = $props();

  let tab = $state<'active' | 'pending'>('active');
  // Se abre solo con ?invite=1 (atajo desde el home o desde un grupo).
  // svelte-ignore state_referenced_locally
  let showInvite = $state(page.url.searchParams.get('invite') === '1');
  let inviting = $state(false);

  // Modo de invitación: una persona o una lista pegada. Si venimos de un grupo
  // (?group=…), lo natural es abrir directamente en masa.
  // svelte-ignore state_referenced_locally
  let inviteMode = $state<'one' | 'bulk'>(
    page.url.searchParams.get('group') ? 'bulk' : 'one'
  );
  // Grupo preseleccionado si venimos de /groups/[id].
  // svelte-ignore state_referenced_locally
  let inviteGroup = $state(page.url.searchParams.get('group') ?? '');
  let bulkEmails = $state('');
  const bulkCount = $derived(
    bulkEmails.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean).length
  );

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
    <div class="flex items-center gap-3">
      <a href="/groups" class="text-sm text-text-mute hover:text-primary transition-colors whitespace-nowrap">
        Grupos
      </a>
      <button class="btn-primary whitespace-nowrap" onclick={() => (showInvite = true)}>+ Invitar cliente</button>
    </div>
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
  {#if form?.success && form?.bulk}
    <div aria-live="polite" class="text-sm bg-success/10 border border-success/20 rounded-md p-3 space-y-1">
      <p class="text-success font-medium">
        {form.sent} de {form.total} invitaciones enviadas.
      </p>
      {#if form.errors && form.errors.length > 0}
        <p class="text-danger text-xs">No se pudieron enviar:</p>
        <ul class="text-xs text-text-mute list-disc pl-5">
          {#each form.errors as e}
            <li>{e.email} — {e.reason}</li>
          {/each}
        </ul>
      {/if}
    </div>
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
        <h3 id="invite-title" class="text-lg font-semibold">Invitar clientes</h3>
        <p class="text-sm text-text-mute mt-1">
          Les mandamos un email con un enlace. Cuando lo acepten, quedan vinculados a ti.
        </p>
      </div>

      <!-- Selector de modo -->
      <div class="flex gap-1 border-b border-text-mute/10">
        <button
          type="button"
          onclick={() => (inviteMode = 'one')}
          class="px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors
            {inviteMode === 'one' ? 'border-primary text-text' : 'border-transparent text-text-mute hover:text-text'}"
        >
          Una persona
        </button>
        <button
          type="button"
          onclick={() => (inviteMode = 'bulk')}
          class="px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors
            {inviteMode === 'bulk' ? 'border-primary text-text' : 'border-transparent text-text-mute hover:text-text'}"
        >
          Varias a la vez
        </button>
      </div>

      {#if inviteMode === 'bulk'}
        <form
          method="POST"
          action="?/inviteBulk"
          use:enhance={() => {
            inviting = true;
            return async ({ update }) => {
              await update();
              inviting = false;
              if (form?.success) { bulkEmails = ''; showInvite = false; }
            };
          }}
          class="space-y-4"
        >
          <div>
            <label for="bulk-emails" class="block text-xs uppercase tracking-wider text-text-mute mb-2">
              Emails
            </label>
            <textarea
              id="bulk-emails"
              name="emails"
              bind:value={bulkEmails}
              rows="6"
              required
              placeholder={'ana@empresa.com\nlucia@empresa.com\nMarta Ruiz <marta@empresa.com>'}
              class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md text-sm font-mono
                     focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
            ></textarea>
            <p class="text-[11px] text-text-mute mt-1">
              Uno por línea (o separados por comas). Puedes poner “Nombre &lt;email&gt;”.
              {#if bulkCount > 0}<span class="text-primary"> · {bulkCount} detectados</span>{/if}
            </p>
          </div>

          {#if data.groups.length > 0}
            <div>
              <label for="bulk-group" class="block text-xs uppercase tracking-wider text-text-mute mb-2">
                Añadir al grupo <span class="normal-case tracking-normal text-text-mute/70">(opcional)</span>
              </label>
              <select id="bulk-group" name="group_id" bind:value={inviteGroup}
                class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md text-sm focus:border-primary">
                <option value="">Sin grupo</option>
                {#each data.groups as g (g.id)}<option value={g.id}>{g.name}</option>{/each}
              </select>
            </div>
          {/if}

          <p class="text-[11px] text-text-mute bg-warning/10 border border-warning/20 rounded-md p-2.5">
            Enviar muchas invitaciones de golpe puede topar con el límite de envío del
            proveedor de correo. Te diremos cuáles salieron y cuáles no.
          </p>

          {#if form?.error}
            <p role="alert" class="text-sm text-danger bg-danger/10 border border-danger/20 rounded-md p-3">
              {form.error}
            </p>
          {/if}

          <div class="flex gap-3 justify-end pt-1">
            <button type="button" class="action-neutral" onclick={() => (showInvite = false)}>Cancelar</button>
            <button type="submit" disabled={inviting || bulkCount === 0} class="btn-primary py-2 px-5">
              {inviting ? 'Enviando…' : `Invitar ${bulkCount || ''}`}
            </button>
          </div>
        </form>
      {:else}
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
      {/if}
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
