<script lang="ts">
  import { enhance } from '$app/forms';
  let { form } = $props();
  let loading = $state(false);

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
</script>

<svelte:head>
  <title>Nuevo ejercicio · Coachify</title>
</svelte:head>

<div class="max-w-2xl mx-auto space-y-8">
  <div>
    <a href="/exercises" class="text-sm text-text-mute hover:text-text">← Volver a ejercicios</a>
    <h1 class="text-3xl font-bold tracking-tight mt-4">Nuevo ejercicio</h1>
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
            <option value={g.value}>{g.label}</option>
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
            <option value={e.value}>{e.label}</option>
          {/each}
        </select>
      </div>
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
      <p class="text-sm text-danger bg-danger/10 border border-danger/20 rounded-md p-3">
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
