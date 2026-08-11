<script lang="ts">
  import { enhance } from '$app/forms';
  import { untrack } from 'svelte';

  let { data, form } = $props();

  let nombre = $state(untrack(() => data.nombre));
  let guardando = $state(false);
</script>

<svelte:head>
  <title>Ajustes · Treno</title>
</svelte:head>

<div class="max-w-2xl space-y-8">
  <header class="space-y-2">
    <h1 class="h-display text-2xl sm:text-3xl">Ajustes</h1>
  </header>

  {#if form?.error}
    <p role="alert" class="text-sm text-danger bg-danger/10 border border-danger/20 rounded-md p-3">
      {form.error}
    </p>
  {/if}
  {#if form?.success}
    <p
      aria-live="polite"
      class="text-sm text-success bg-success/10 border border-success/20 rounded-md p-3"
    >
      Guardado. Tus clientes verán el nombre nuevo la próxima vez que abran la aplicación.
    </p>
  {/if}

  <form
    method="POST"
    action="?/nombre"
    use:enhance={() => {
      guardando = true;
      return async ({ update }) => {
        await update({ reset: false });
        guardando = false;
      };
    }}
    class="card space-y-4"
  >
    <div>
      <label for="full_name" class="block text-xs uppercase tracking-wider text-text-mute mb-2">
        Tu nombre
      </label>
      <input
        id="full_name"
        name="full_name"
        type="text"
        bind:value={nombre}
        maxlength="80"
        class="w-full px-4 py-3 bg-bg border border-line rounded-md
               focus:outline-none focus:border-accent"
      />
      <!-- Se dice para qué sirve, y no es adorno: hasta ahora el nombre era un
           dato interno y ahora es lo que preside la pantalla de sus clientes.
           Quien lo rellenó pensando que daba igual necesita saberlo. -->
      <p class="text-2xs text-text-mute mt-2">
        Es lo que ven tus clientes en la cabecera de su aplicación, encima de sus entrenos.
      </p>
    </div>
    <button type="submit" class="btn-primary" disabled={guardando || nombre.trim().length < 2}>
      {guardando ? 'Guardando…' : 'Guardar'}
    </button>
  </form>

  <div class="space-y-3">
    <h2 class="text-lg font-display font-semibold">Tu espacio</h2>
    <div class="border-t border-line">
      <a href="/marca" class="row-link">
        <span class="flex-1 min-w-0">
          <span class="font-medium block">Tu marca</span>
          <span class="text-sm text-text-mute">
            {data.tieneMarca
              ? 'Tus clientes ven la aplicación con tu color'
              : 'Sin configurar: tus clientes ven los colores de Treno'}
          </span>
        </span>
        <span class="text-xs text-accent flex-shrink-0">Cambiar</span>
      </a>
    </div>
  </div>

  <div class="space-y-3">
    <h2 class="text-lg font-display font-semibold">Cuenta</h2>
    <div class="row border-b-0">
      <span class="flex-1 min-w-0 text-sm text-text-mute break-words">{data.email}</span>
      <form method="POST" action="/logout">
        <button type="submit" class="action-danger">Cerrar sesión</button>
      </form>
    </div>
  </div>
</div>
