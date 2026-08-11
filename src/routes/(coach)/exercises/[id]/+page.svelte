<script lang="ts">
  import { enhance } from '$app/forms';
  import { untrack } from 'svelte';
  import ConfirmModal from '$lib/components/ConfirmModal.svelte';
  import SelectorEtiquetas from '$lib/components/SelectorEtiquetas.svelte';
  import { MUSCLE_GROUP_LABELS, EQUIPMENT_LABELS } from '$lib/supabase/types';
  let { data, form } = $props();
  let saving = $state(false);
  let confirmArchive = $state(false);

  // El valor inicial sale de la base con untrack: a partir de ahí manda lo que
  // el entrenador esté tocando, y recargar los datos tras guardar no debe
  // pisarle la selección.
  let grupos = $state<string[]>(untrack(() => data.exercise.muscle_groups) ?? []);
  let materiales = $state<string[]>(untrack(() => data.exercise.equipment_types) ?? []);

  // Helper para extraer ID YouTube y mostrar thumbnail
  function youtubeId(url: string | null): string | null {
    if (!url) return null;
    const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([\w-]{11})/);
    return m ? m[1] : null;
  }
  const ytId = $derived(youtubeId(data.exercise.video_url));
</script>

<svelte:head>
  <title>{data.exercise.name} · Treno</title>
</svelte:head>

<div class="max-w-2xl mx-auto space-y-8">
  <div>
    <a href="/exercises" class="text-sm text-text-mute hover:text-text">← Volver a ejercicios</a>
    <h1 class="text-2xl sm:text-3xl font-display font-semibold tracking-tight mt-4">
      Editar ejercicio
    </h1>
  </div>

  {#if ytId}
    <div class="aspect-video rounded-md overflow-hidden bg-black">
      <iframe
        src="https://www.youtube.com/embed/{ytId}"
        title="Vista previa"
        class="w-full h-full"
        allowfullscreen
      ></iframe>
    </div>
  {/if}

  <form
    method="POST"
    action="?/update"
    use:enhance={() => {
      saving = true;
      return async ({ update }) => {
        await update();
        saving = false;
      };
    }}
    class="card space-y-5"
  >
    <div>
      <label for="name" class="block text-xs uppercase tracking-wider text-text-mute mb-2">
        Nombre *
      </label>
      <input
        id="name"
        name="name"
        type="text"
        required
        maxlength="100"
        value={data.exercise.name}
        class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </div>

    <div>
      <label for="video_url" class="block text-xs uppercase tracking-wider text-text-mute mb-2">
        URL del vídeo
      </label>
      <input
        id="video_url"
        name="video_url"
        type="url"
        value={data.exercise.video_url ?? ''}
        placeholder="https://youtu.be/..."
        class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </div>

    <div class="space-y-5">
      <SelectorEtiquetas
        name="muscle_groups"
        titulo="Grupos musculares"
        opciones={MUSCLE_GROUP_LABELS}
        bind:seleccion={grupos}
        ayuda="Marca todos los que trabaje. El primero es el principal y es el que ve tu cliente en su entreno."
      />
      <SelectorEtiquetas
        name="equipment_types"
        titulo="Material"
        opciones={EQUIPMENT_LABELS}
        bind:seleccion={materiales}
      />
    </div>

    <div>
      <label for="description" class="block text-xs uppercase tracking-wider text-text-mute mb-2">
        Descripción / técnica
      </label>
      <textarea
        id="description"
        name="description"
        rows="4"
        maxlength="1000"
        class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
        >{data.exercise.description ?? ''}</textarea
      >
    </div>

    {#if form?.error}
      <p
        role="alert"
        class="text-sm text-danger bg-danger/10 border border-danger/20 rounded-md p-3"
      >
        {form.error}
      </p>
    {/if}
    {#if form?.success}
      <p
        aria-live="polite"
        class="text-sm text-success bg-success/10 border border-success/20 rounded-md p-3"
      >
        ✓ Cambios guardados.
      </p>
    {/if}

    <div class="flex gap-3">
      <button type="submit" disabled={saving} class="btn-primary flex-1">
        {saving ? 'Guardando…' : 'Guardar cambios'}
      </button>
    </div>
  </form>

  <div class="text-center">
    <button
      type="button"
      onclick={() => (confirmArchive = true)}
      class="text-sm text-danger hover:text-danger/80 transition-colors"
    >
      Archivar ejercicio
    </button>
  </div>
</div>

<ConfirmModal
  bind:open={confirmArchive}
  action="?/archive"
  title="Archivar ejercicio"
  message="No aparecerá más en la biblioteca, pero quedará en los entrenos antiguos donde ya se usó."
  confirmLabel="Archivar ejercicio"
/>
