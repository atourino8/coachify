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

  let dialogEl: HTMLDialogElement;

  // El <dialog> nativo da gratis lo que antes había que montar a mano: Escape
  // para cerrar, foco atrapado dentro y el hueco de fondo. Solo hay que
  // mantenerlo sincronizado con `open`.
  $effect(() => {
    if (open) dialogEl?.showModal();
    else dialogEl?.close();
  });

  function close() {
    open = false;
  }

  function runCallback() {
    onconfirm?.();
    close();
  }
</script>

<dialog
  bind:this={dialogEl}
  onclose={close}
  onclick={(e) => {
    if (e.target === dialogEl) close();
  }}
  aria-labelledby="confirm-title"
  aria-describedby="confirm-msg"
  class="card w-full max-w-sm space-y-4"
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
      <button
        type="button"
        class={danger ? 'action-danger-solid' : 'action-primary'}
        onclick={runCallback}
      >
        {confirmLabel}
      </button>
    {/if}
  </div>
</dialog>

<style>
  /* El navegador da al <dialog> su propio color y fondo por defecto; .card ya
     resuelve fondo, borde y relleno, pero el color de texto hay que heredarlo
     a mano porque la hoja de estilos del navegador gana si no se dice nada. */
  dialog {
    color: inherit;
  }
  dialog::backdrop {
    background: rgb(0 0 0 / 0.6);
    backdrop-filter: blur(4px);
  }
</style>
