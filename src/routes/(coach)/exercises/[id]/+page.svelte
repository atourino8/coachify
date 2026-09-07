<script lang="ts">
  import { enhance } from '$app/forms';
  import { untrack } from 'svelte';
  import ConfirmModal from '$lib/components/ConfirmModal.svelte';
  import SelectorEtiquetas from '$lib/components/SelectorEtiquetas.svelte';
  import CampoMedio from '$lib/components/CampoMedio.svelte';
  import SelectorVideo from '$lib/components/SelectorVideo.svelte';
  import { page } from '$app/state';
  import { env } from '$env/dynamic/public';
  let { data, form } = $props();
  let saving = $state(false);
  let confirmArchive = $state(false);

  // El valor inicial sale de la base con untrack: a partir de ahí manda lo que
  // el entrenador esté tocando, y recargar los datos tras guardar no debe
  // pisarle la selección.
  let grupos = $state<string[]>(untrack(() => data.exercise.muscle_groups) ?? []);
  let materiales = $state<string[]>(untrack(() => data.exercise.equipment_types) ?? []);

  let videoId = $state<string | null>(untrack(() => data.exercise.video_id));
  let videoDesde = $state<number | null>(untrack(() => data.exercise.video_desde));
  let videoHasta = $state<number | null>(untrack(() => data.exercise.video_hasta));
  let videoNota = $state<string | null>(untrack(() => data.exercise.video_nota));
  let imagenUrl = $state<string | null>(untrack(() => data.exercise.image_url));
  let imagenPath = $state<string | null>(untrack(() => data.exercise.image_path));

  // Qué se está a punto de borrar, para poder decir a cuántos ejercicios
  // afecta antes de hacerlo.
  let confirmBorrarVideo = $state(false);
  const videoActual = $derived(data.videos.find((v) => v.id === videoId) ?? null);
  const usosDelActual = $derived(videoId ? (data.usosDeVideo[videoId] ?? 0) : 0);
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

    <SelectorVideo
      coachId={data.exercise.coach_id}
      supabase={page.data.supabase}
      supabaseUrl={env.PUBLIC_SUPABASE_URL}
      disponibles={data.videos}
      usos={data.usosDeVideo}
      bind:videoId
      bind:desde={videoDesde}
      bind:hasta={videoHasta}
      bind:nota={videoNota}
    />

    <CampoMedio
      titulo="Imagen"
      exerciseId={data.exercise.id}
      coachId={data.exercise.coach_id}
      supabase={page.data.supabase}
      supabaseUrl={env.PUBLIC_SUPABASE_URL}
      bind:url={imagenUrl}
      bind:path={imagenPath}
      firmada={data.imagenFirmada}
      ayuda="Para tu cliente que ya se ha visto el vídeo y solo necesita recordar la posición."
    />

    <div class="space-y-5">
      <SelectorEtiquetas
        name="muscle_groups"
        titulo="Grupos musculares"
        opciones={data.vocabulario.muscle}
        bind:seleccion={grupos}
        ayuda="Marca todos los que trabaje. El primero es el principal y es el que ve tu cliente en su entreno."
      />
      <SelectorEtiquetas
        name="equipment_types"
        titulo="Material"
        opciones={data.vocabulario.equipment}
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

    <div class="flex gap-3">
      <button type="submit" disabled={saving} class="btn-primary flex-1">
        {saving ? 'Guardando…' : 'Guardar cambios'}
      </button>
    </div>
  </form>

  <!-- Borrar el vídeo de la biblioteca es OTRA cosa que quitarlo de aquí, y
       por eso vive fuera del formulario y abajo, con lo destructivo.

       Quitarlo arriba solo desengancha este ejercicio. Esto lo borra para
       todos, y por eso hay que decir a cuántos afecta ANTES de preguntar. -->
  <div class="flex flex-col items-center gap-3 text-center">
    {#if videoActual}
      <button
        type="button"
        onclick={() => (confirmBorrarVideo = true)}
        class="text-sm text-danger hover:text-danger/80 transition-colors"
      >
        Borrar «{videoActual.nombre}» de mi biblioteca
      </button>
    {/if}
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
  bind:open={confirmBorrarVideo}
  action="?/borrarVideo"
  fields={{ video_id: videoId ?? '' }}
  title="Borrar el vídeo"
  message={usosDelActual > 1
    ? `Lo usan ${usosDelActual} ejercicios y todos se quedarán sin vídeo. El fichero se borra y no se puede recuperar.`
    : 'Se borra el fichero y no se puede recuperar. Este ejercicio se quedará sin vídeo.'}
  confirmLabel="Borrar el vídeo"
/>

<ConfirmModal
  bind:open={confirmArchive}
  action="?/archive"
  title="Archivar ejercicio"
  message="No aparecerá más en la biblioteca, pero quedará en los entrenos antiguos donde ya se usó."
  confirmLabel="Archivar ejercicio"
/>
