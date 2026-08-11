<script lang="ts">
  import { enhance } from '$app/forms';
  import SelectorEtiquetas from '$lib/components/SelectorEtiquetas.svelte';
  import { MUSCLE_GROUP_LABELS, EQUIPMENT_LABELS } from '$lib/supabase/types';
  let { form } = $props();
  let loading = $state(false);

  // Un ejercicio trabaja varios grupos: un press de banca es pecho, hombro y
  // brazo. El PRIMERO que se marca es el principal, y es el que se ve en las
  // pantallas que solo enseñan una etiqueta.
  let grupos = $state<string[]>([]);
  let materiales = $state<string[]>([]);
</script>

<svelte:head>
  <title>Nuevo ejercicio · Treno</title>
</svelte:head>

<div class="max-w-2xl mx-auto space-y-8">
  <div>
    <a href="/exercises" class="text-sm text-text-mute hover:text-text">← Volver a ejercicios</a>
    <h1 class="text-2xl sm:text-3xl font-display font-semibold tracking-tight mt-4">
      Nuevo ejercicio
    </h1>
    <p class="text-text-mute mt-1">
      Por ahora puedes pegar una URL de YouTube/Vimeo como vídeo. La subida directa llega en Fase C.
    </p>
  </div>

  <form
    method="POST"
    use:enhance={() => {
      loading = true;
      return async ({ update }) => {
        await update();
        loading = false;
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
        placeholder="Ej: Press banca con barra"
        class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </div>

    <div>
      <label for="video_url" class="block text-xs uppercase tracking-wider text-text-mute mb-2">
        URL del vídeo (opcional)
      </label>
      <input
        id="video_url"
        name="video_url"
        type="url"
        placeholder="https://youtu.be/... o https://vimeo.com/..."
        class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </div>

    <div class="space-y-5">
      <SelectorEtiquetas
        name="muscle_groups"
        titulo="Grupos musculares"
        opciones={MUSCLE_GROUP_LABELS}
        bind:seleccion={grupos}
        ayuda="Marca todos los que trabaje. El primero que marques es el principal."
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
        Descripción / técnica (opcional)
      </label>
      <textarea
        id="description"
        name="description"
        rows="4"
        maxlength="1000"
        placeholder="Notas técnicas, errores frecuentes, postura correcta…"
        class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
      ></textarea>
    </div>

    {#if form?.error}
      <p
        role="alert"
        class="text-sm text-danger bg-danger/10 border border-danger/20 rounded-md p-3"
      >
        {form.error}
      </p>
    {/if}

    <div class="flex gap-3">
      <button type="submit" disabled={loading} class="btn-primary flex-1">
        {loading ? 'Creando…' : 'Crear ejercicio'}
      </button>
      <a href="/exercises" class="btn-ghost">Cancelar</a>
    </div>
  </form>
</div>
