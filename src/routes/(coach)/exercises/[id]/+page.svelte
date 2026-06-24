<script lang="ts">
  import { enhance } from '$app/forms';
  let { data, form } = $props();
  let saving = $state(false);

  const muscleGroups = [
    { value: 'chest', label: 'Pecho' },
    { value: 'back', label: 'Espalda' },
    { value: 'legs', label: 'Pierna' },
    { value: 'shoulders', label: 'Hombro' },
    { value: 'arms', label: 'Brazo' },
    { value: 'core', label: 'Core' },
    { value: 'cardio', label: 'Cardio' },
    { value: 'full_body', label: 'Full body' }
  ];
  const equipmentOptions = [
    { value: 'barbell', label: 'Barra' },
    { value: 'dumbbell', label: 'Mancuerna' },
    { value: 'machine', label: 'Máquina' },
    { value: 'bodyweight', label: 'Peso corporal' },
    { value: 'kettlebell', label: 'Kettlebell' },
    { value: 'band', label: 'Banda' },
    { value: 'other', label: 'Otro' }
  ];

  // Helper para extraer ID YouTube y mostrar thumbnail
  function youtubeId(url: string | null): string | null {
    if (!url) return null;
    const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([\w-]{11})/);
    return m ? m[1] : null;
  }
  const ytId = $derived(youtubeId(data.exercise.video_url));
</script>

<svelte:head>
  <title>{data.exercise.name} · Coachify</title>
</svelte:head>

<div class="max-w-2xl mx-auto space-y-8">
  <div>
    <a href="/exercises" class="text-sm text-text-mute hover:text-text">← Volver a ejercicios</a>
    <h1 class="text-3xl font-bold tracking-tight mt-4">Editar ejercicio</h1>
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

    <div class="grid sm:grid-cols-2 gap-4">
      <div>
        <label for="muscle_group" class="block text-xs uppercase tracking-wider text-text-mute mb-2">
          Grupo muscular
        </label>
        <select
          id="muscle_group"
          name="muscle_group"
          class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md focus:border-primary focus:ring-2 focus:ring-primary/20"
        >
          <option value="">— Sin especificar —</option>
          {#each muscleGroups as g}
            <option value={g.value} selected={data.exercise.muscle_group === g.value}>
              {g.label}
            </option>
          {/each}
        </select>
      </div>
      <div>
        <label for="equipment" class="block text-xs uppercase tracking-wider text-text-mute mb-2">
          Equipamiento
        </label>
        <select
          id="equipment"
          name="equipment"
          class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md focus:border-primary focus:ring-2 focus:ring-primary/20"
        >
          <option value="">— Sin especificar —</option>
          {#each equipmentOptions as e}
            <option value={e.value} selected={data.exercise.equipment === e.value}>
              {e.label}
            </option>
          {/each}
        </select>
      </div>
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
      >{data.exercise.description ?? ''}</textarea>
    </div>

    {#if form?.error}
      <p class="text-sm text-danger bg-danger/10 border border-danger/20 rounded-md p-3">
        {form.error}
      </p>
    {/if}
    {#if form?.success}
      <p class="text-sm text-success bg-success/10 border border-success/20 rounded-md p-3">
        ✓ Cambios guardados.
      </p>
    {/if}

    <div class="flex gap-3">
      <button type="submit" disabled={saving} class="btn-primary flex-1">
        {saving ? 'Guardando…' : 'Guardar cambios'}
      </button>
    </div>
  </form>

  <form method="POST" action="?/archive" class="text-center">
    <button
      type="submit"
      onclick={(e) => {
        if (!confirm('¿Archivar este ejercicio? No aparecerá más en la biblioteca, pero quedará en los workouts antiguos.'))
          e.preventDefault();
      }}
      class="text-sm text-danger hover:text-danger/80 transition-colors"
    >
      Archivar ejercicio
    </button>
  </form>
</div>
