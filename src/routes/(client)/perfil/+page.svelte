<script lang="ts">
  import { enhance } from '$app/forms';
  import { untrack } from 'svelte';
  import Avatar from '$lib/components/Avatar.svelte';

  let { data, form } = $props();

  let nombre = $state(untrack(() => data.nombre));
  let subiendo = $state(false);
  let guardando = $state(false);
</script>

<svelte:head>
  <title>Tu perfil · Treno</title>
</svelte:head>

<div class="space-y-8">
  <div>
    <span class="eyebrow">Tu cuenta</span>
    <h1 class="text-2xl sm:text-3xl font-display font-semibold tracking-tight mt-2">Tu perfil</h1>
  </div>

  {#if form?.error}
    <p role="alert" class="text-sm text-danger bg-danger/10 border border-danger/20 rounded-md p-3">
      {form.error}
    </p>
  {/if}

  <form
    method="POST"
    action="?/foto"
    enctype="multipart/form-data"
    class="card flex flex-wrap items-center gap-4"
    use:enhance={() => {
      subiendo = true;
      return async ({ update }) => {
        subiendo = false;
        await update();
      };
    }}
  >
    <Avatar url={data.avatar} nombre={data.nombre} tamano="xl" />
    <div class="flex-1 min-w-[12rem] space-y-2">
      <label for="foto" class="block text-xs uppercase tracking-wider text-text-mute">Tu foto</label
      >
      <input
        id="foto"
        name="foto"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onchange={(e) => (e.currentTarget.form as HTMLFormElement).requestSubmit()}
        class="block w-full text-sm text-text-mute file:mr-3 file:py-2 file:px-4
               file:rounded-md file:border file:border-line file:bg-surface-2
               file:text-text file:text-sm file:cursor-pointer"
      />
      <!-- Se dice quién la ve. Es su cara: merece saber dónde acaba antes de
           subirla, no después. -->
      <p class="text-2xs text-text-mute">
        La ve tu entrenador. JPG, PNG o WEBP, hasta 5 MB.
        {#if subiendo}<span class="text-accent">Subiendo…</span>{/if}
      </p>
    </div>
    {#if data.tieneFoto}
      <button type="submit" name="quitar" value="1" class="action-neutral">Quitar</button>
    {/if}
  </form>

  <form
    method="POST"
    action="?/nombre"
    class="card space-y-4"
    use:enhance={() => {
      guardando = true;
      return async ({ update }) => {
        guardando = false;
        await update();
      };
    }}
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
        class="w-full px-4 py-3 bg-bg border border-line rounded-md focus:outline-none focus:border-accent"
      />
    </div>
    <div>
      <p class="block text-xs uppercase tracking-wider text-text-mute mb-2">Tu correo</p>
      <p class="text-sm text-text-mute">{data.email}</p>
      <p class="text-2xs text-text-mute mt-2">
        Para cambiarlo, habla con tu entrenador: es con lo que entras.
      </p>
    </div>
    <button type="submit" disabled={guardando} class="btn-primary">
      {guardando ? 'Guardando…' : 'Guardar'}
    </button>
  </form>
</div>
