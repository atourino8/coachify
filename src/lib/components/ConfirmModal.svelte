<script lang="ts">
  // Modal de confirmación reutilizable para acciones destructivas.
  // Envía un POST a `action` con los `fields` como inputs ocultos, así que
  // funciona con progressive enhancement (use:enhance).
  import { enhance } from '$app/forms';

  // Dos modos: POST (pasa `action`) o callback JS local (pasa `onconfirm`).
  let {
    open = $bindable(false),
    action = '',
    fields = {},
    title,
    message,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    danger = true,
    onconfirm
  }: {
    open?: boolean;
    action?: string;
    fields?: Record<string, string>;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
    onconfirm?: () => void;
  } = $props();

  function close() {
    open = false;
  }

  function runCallback() {
    onconfirm?.();
    close();
  }
</script>

<svelte:window
  onkeydown={(e) => {
    if (open && e.key === 'Escape') close();
  }}
/>

{#if open}
  <!-- Fondo. El click cierra; el teclado ya tiene Escape (svelte:window). -->
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-[200] grid place-items-center bg-black/60 backdrop-blur-sm p-4"
    role="presentation"
    onclick={close}
  >
    <!-- Diálogo. stopPropagation evita que un click dentro cierre el modal. -->
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
    <div
      class="card w-full max-w-sm space-y-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-msg"
      onclick={(e) => e.stopPropagation()}
    >
      <h3 id="confirm-title" class="text-lg font-semibold">{title}</h3>
      <p id="confirm-msg" class="text-sm text-text-mute">{message}</p>
      <div class="flex justify-end gap-3 pt-1">
        <button type="button" class="action-neutral" onclick={close}>{cancelLabel}</button>
        {#if action}
          <form
            method="POST"
            {action}
            use:enhance={() => {
              return async ({ update }) => {
                await update();
                close();
              };
            }}
          >
            {#each Object.entries(fields) as [k, v] (k)}
              <input type="hidden" name={k} value={v} />
            {/each}
            <button type="submit" class={danger ? 'action-danger-solid' : 'action-primary'}>
              {confirmLabel}
            </button>
          </form>
        {:else}
          <button type="button" class={danger ? 'action-danger-solid' : 'action-primary'} onclick={runCallback}>
            {confirmLabel}
          </button>
        {/if}
      </div>
    </div>
  </div>
{/if}
