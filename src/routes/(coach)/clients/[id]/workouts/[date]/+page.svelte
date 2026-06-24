<script lang="ts">
  import { dndzone, type DndEvent } from 'svelte-dnd-action';
  import { flip } from 'svelte/animate';
  import { enhance } from '$app/forms';
  import { formatHumanDate } from '$lib/week';
  import type { Exercise } from '$lib/supabase/types';

  let { data, form } = $props();

  // Tipo del item del día: copia del exercise + parámetros prescritos.
  type DayItem = {
    id: string; // dnd-id (necesario único por item, no por exercise)
    exercise: Exercise;
    sets: number;
    reps_prescribed: string;
    weight_prescribed: string;
    rest_seconds: number | null;
    notes: string;
  };

  // Estado: lista de ejercicios del día.
  // Iniciamos desde data.workout?.workout_items si existe.
  let dayItems = $state<DayItem[]>(
    (data.workout?.workout_items ?? []).map((it) => ({
      id: crypto.randomUUID(),
      exercise: it.exercise as Exercise,
      sets: it.sets,
      reps_prescribed: it.reps_prescribed ?? '',
      weight_prescribed: it.weight_prescribed ?? '',
      rest_seconds: it.rest_seconds,
      notes: it.notes ?? ''
    }))
  );

  let title = $state(data.workout?.title ?? '');
  let notes = $state(data.workout?.notes ?? '');
  let saving = $state(false);
  let filterText = $state('');
  let filterMuscle = $state<string>('');

  // Biblioteca filtrada
  const filteredExercises = $derived(
    data.exercises.filter((ex) => {
      if (filterText && !ex.name.toLowerCase().includes(filterText.toLowerCase())) return false;
      if (filterMuscle && ex.muscle_group !== filterMuscle) return false;
      return true;
    })
  );

  // Drag&drop: la biblioteca solo es FUENTE (clonamos al day). El día es destino.
  function handleDayConsider(e: CustomEvent<DndEvent<DayItem>>) {
    dayItems = e.detail.items;
  }
  function handleDayFinalize(e: CustomEvent<DndEvent<DayItem>>) {
    // Si el item viene de la biblioteca (no tiene los campos extra), lo "envolvemos"
    dayItems = e.detail.items.map((it) => {
      // dnd a veces inyecta los exercises crudos cuando vienen de la biblioteca.
      // Detectamos por shape y los normalizamos.
      const asAny = it as unknown as Record<string, unknown>;
      if (!('exercise' in asAny) && 'name' in asAny && 'coach_id' in asAny) {
        return {
          id: crypto.randomUUID(),
          exercise: asAny as unknown as Exercise,
          sets: 4,
          reps_prescribed: '8-10',
          weight_prescribed: '',
          rest_seconds: 90,
          notes: ''
        };
      }
      return it;
    });
  }

  function removeItem(id: string) {
    dayItems = dayItems.filter((it) => it.id !== id);
  }

  function addExercise(ex: Exercise) {
    // Atajo: añade al final por tap (alternativa a drag&drop, útil en móvil)
    dayItems = [
      ...dayItems,
      {
        id: crypto.randomUUID(),
        exercise: ex,
        sets: 4,
        reps_prescribed: '8-10',
        weight_prescribed: '',
        rest_seconds: 90,
        notes: ''
      }
    ];
  }

  // Para el form submit: serializamos los items
  function itemsJSON() {
    return JSON.stringify(
      dayItems.map((it) => ({
        exercise_id: it.exercise.id,
        sets: it.sets,
        reps_prescribed: it.reps_prescribed,
        weight_prescribed: it.weight_prescribed,
        rest_seconds: it.rest_seconds,
        notes: it.notes
      }))
    );
  }

  const muscleLabels: Record<string, string> = {
    chest: 'Pecho',
    back: 'Espalda',
    legs: 'Pierna',
    shoulders: 'Hombro',
    arms: 'Brazo',
    core: 'Core',
    cardio: 'Cardio',
    full_body: 'Full body'
  };
</script>

<svelte:head>
  <title>{formatHumanDate(data.date)} · {data.client.full_name}</title>
</svelte:head>

<div class="space-y-6">
  <!-- Cabecera -->
  <div class="flex items-center justify-between">
    <div>
      <a href="/clients/{data.client.id}" class="text-sm text-text-mute hover:text-text">
        ← {data.client.full_name}
      </a>
      <h1 class="text-2xl font-bold tracking-tight mt-2 capitalize">
        {formatHumanDate(data.date)}
      </h1>
    </div>
    <form
      method="POST"
      action="?/save"
      use:enhance={() => {
        saving = true;
        return async ({ update }) => {
          await update();
          saving = false;
        };
      }}
    >
      <input type="hidden" name="title" value={title} />
      <input type="hidden" name="notes" value={notes} />
      <input type="hidden" name="items" value={itemsJSON()} />
      <button type="submit" disabled={saving} class="btn-primary">
        {saving ? 'Guardando…' : 'Guardar entreno'}
      </button>
    </form>
  </div>

  {#if form?.success}
    <div class="bg-success/10 border border-success/30 text-success text-sm p-3 rounded-md">
      ✓ Entreno guardado.
    </div>
  {/if}
  {#if form?.error}
    <div class="bg-danger/10 border border-danger/30 text-danger text-sm p-3 rounded-md">
      {form.error}
    </div>
  {/if}

  <!-- Datos generales del workout -->
  <div class="card space-y-3">
    <input
      type="text"
      bind:value={title}
      placeholder="Título del día (ej: PIERNA — Bloque hipertrofia)"
      class="w-full bg-transparent border-0 text-lg font-semibold focus:outline-none placeholder:text-text-mute/40"
    />
    <textarea
      bind:value={notes}
      placeholder="Notas para tu cliente (calienta bien, ojo al hombro derecho...)"
      rows="2"
      class="w-full bg-transparent border-0 text-sm text-text-mute focus:outline-none resize-none placeholder:text-text-mute/40"
    ></textarea>
  </div>

  <!-- Cuerpo: biblioteca + día -->
  <div class="grid lg:grid-cols-[1fr_1.5fr] gap-6">
    <!-- BIBLIOTECA -->
    <aside class="card space-y-4">
      <div>
        <h2 class="text-sm uppercase tracking-wider text-text-mute mb-3">Biblioteca</h2>
        <input
          type="search"
          bind:value={filterText}
          placeholder="🔍 Buscar ejercicio..."
          class="w-full px-3 py-2 bg-bg border border-text-mute/20 rounded-md text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 mb-2"
        />
        <select
          bind:value={filterMuscle}
          class="w-full px-3 py-2 bg-bg border border-text-mute/20 rounded-md text-sm focus:border-primary"
        >
          <option value="">Todos los grupos</option>
          {#each Object.entries(muscleLabels) as [v, l]}
            <option value={v}>{l}</option>
          {/each}
        </select>
      </div>

      {#if filteredExercises.length === 0}
        <div class="text-center py-10 text-sm text-text-mute">
          {data.exercises.length === 0
            ? 'No tienes ejercicios. Crea algunos en la biblioteca.'
            : 'Ningún ejercicio coincide.'}
        </div>
      {:else}
        <div
          class="space-y-2 max-h-[600px] overflow-y-auto pr-1"
          use:dndzone={{
            items: filteredExercises,
            type: 'exercise',
            dropFromOthersDisabled: true,
            dragDisabled: false,
            morphDisabled: true
          }}
          onconsider={(e) => {
            /* la biblioteca no acepta drops, solo emite */
          }}
          onfinalize={(e) => {
            /* idem */
          }}
        >
          {#each filteredExercises as ex (ex.id)}
            <div
              animate:flip={{ duration: 200 }}
              class="bg-bg border border-text-mute/10 rounded-md p-3 flex items-center gap-3
                     hover:border-primary/40 cursor-grab active:cursor-grabbing"
            >
              <div class="text-2xl">🏋️</div>
              <div class="flex-1 min-w-0">
                <div class="font-medium text-sm truncate">{ex.name}</div>
                {#if ex.muscle_group}
                  <div class="text-xs text-text-mute">{muscleLabels[ex.muscle_group]}</div>
                {/if}
              </div>
              <button
                onclick={() => addExercise(ex)}
                class="text-primary hover:text-accent text-lg font-bold"
                title="Añadir al día"
              >
                +
              </button>
            </div>
          {/each}
        </div>
      {/if}
    </aside>

    <!-- DÍA -->
    <section class="card space-y-4 min-h-[400px]">
      <h2 class="text-sm uppercase tracking-wider text-text-mute">
        Ejercicios del día · {dayItems.length}
      </h2>

      <div
        class="space-y-3 min-h-[300px] rounded-md transition-colors {dayItems.length === 0
          ? 'border-2 border-dashed border-text-mute/20 p-6 grid place-items-center'
          : ''}"
        use:dndzone={{
          items: dayItems,
          type: 'exercise',
          flipDurationMs: 200,
          dropTargetStyle: { outline: '2px dashed #38bdf8' }
        }}
        onconsider={handleDayConsider}
        onfinalize={handleDayFinalize}
      >
        {#each dayItems as item, i (item.id)}
          <div
            animate:flip={{ duration: 200 }}
            class="bg-bg border border-text-mute/20 rounded-md p-4 space-y-3"
          >
            <div class="flex items-start gap-3">
              <div class="text-primary font-bold mt-0.5 w-6">#{i + 1}</div>
              <div class="flex-1">
                <div class="font-semibold">{item.exercise.name}</div>
                {#if item.exercise.muscle_group}
                  <div class="text-xs text-text-mute">
                    {muscleLabels[item.exercise.muscle_group]}
                  </div>
                {/if}
              </div>
              <button
                type="button"
                onclick={() => removeItem(item.id)}
                class="text-text-mute hover:text-danger text-xl"
                title="Quitar"
              >
                ×
              </button>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label class="text-[10px] uppercase tracking-wider text-text-mute">Series</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  bind:value={item.sets}
                  class="w-full px-2 py-1 bg-surface border border-text-mute/20 rounded text-sm"
                />
              </div>
              <div>
                <label class="text-[10px] uppercase tracking-wider text-text-mute">Reps</label>
                <input
                  type="text"
                  bind:value={item.reps_prescribed}
                  placeholder="8-10"
                  class="w-full px-2 py-1 bg-surface border border-text-mute/20 rounded text-sm"
                />
              </div>
              <div>
                <label class="text-[10px] uppercase tracking-wider text-text-mute">Peso</label>
                <input
                  type="text"
                  bind:value={item.weight_prescribed}
                  placeholder="80kg"
                  class="w-full px-2 py-1 bg-surface border border-text-mute/20 rounded text-sm"
                />
              </div>
              <div>
                <label class="text-[10px] uppercase tracking-wider text-text-mute">Desc. (s)</label>
                <input
                  type="number"
                  min="0"
                  step="15"
                  bind:value={item.rest_seconds}
                  placeholder="90"
                  class="w-full px-2 py-1 bg-surface border border-text-mute/20 rounded text-sm"
                />
              </div>
            </div>

            <input
              type="text"
              bind:value={item.notes}
              placeholder="Nota técnica (opcional)..."
              class="w-full px-2 py-1 bg-surface border border-text-mute/20 rounded text-xs text-text-mute placeholder:text-text-mute/40"
            />
          </div>
        {:else}
          <div class="text-center text-text-mute text-sm">
            <p class="mb-1">Arrastra ejercicios desde la biblioteca →</p>
            <p class="text-xs">o usa el botón <span class="text-primary">+</span> de cada uno</p>
          </div>
        {/each}
      </div>
    </section>
  </div>

  {#if data.workout}
    <form method="POST" action="?/delete" class="text-center pt-4">
      <button
        type="submit"
        onclick={(e) => !confirm('¿Borrar este entreno entero? No se puede deshacer.') && e.preventDefault()}
        class="text-sm text-danger hover:text-danger/80"
      >
        Borrar entreno del día
      </button>
    </form>
  {/if}
</div>

<style>
  /* Estilos sutiles para el drag */
  :global(.dndzone) {
    transition: outline 0.15s ease;
  }
</style>
