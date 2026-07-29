<script lang="ts">
  import { dndzone, type DndEvent } from 'svelte-dnd-action';
  import { flip } from 'svelte/animate';
  import { enhance } from '$app/forms';
  import { formatHumanDate } from '$lib/week';
  import ConfirmModal from '$lib/components/ConfirmModal.svelte';
  import type { Exercise, WorkoutItemWithRelations } from '$lib/supabase/types';

  let { data, form } = $props();

  // Modales de confirmación (cargar plantilla local / borrar entreno POST).
  let confirmTpl = $state(false);
  let confirmDelete = $state(false);

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
  // svelte-ignore state_referenced_locally
  let dayItems = $state<DayItem[]>(
    (data.workout?.workout_items ?? []).map((it: WorkoutItemWithRelations) => ({
      id: crypto.randomUUID(),
      exercise: it.exercise,
      sets: it.sets,
      reps_prescribed: it.reps_prescribed ?? '',
      weight_prescribed: it.weight_prescribed ?? '',
      rest_seconds: it.rest_seconds,
      notes: it.notes ?? ''
    }))
  );

  // svelte-ignore state_referenced_locally
  let title = $state(data.workout?.title ?? '');
  // svelte-ignore state_referenced_locally
  let notes = $state(data.workout?.notes ?? '');
  let saving = $state(false);
  let filterText = $state('');
  let filterMuscle = $state<string>('');
  let selectedTemplate = $state('');

  // Cargar los ejercicios de una plantilla en el día (reemplaza los actuales).
  // Si ya hay ejercicios, pide confirmación en modal antes de reemplazar.
  function loadTemplate() {
    const tpl = data.templates?.find((t) => t.id === selectedTemplate);
    if (!tpl) return;
    if (dayItems.length > 0) {
      confirmTpl = true;
      return;
    }
    applyTemplate();
  }
  function applyTemplate() {
    const tpl = data.templates?.find((t) => t.id === selectedTemplate);
    if (!tpl) return;
    dayItems = tpl.items.map((it) => ({
      id: crypto.randomUUID(),
      exercise: it.exercise as Exercise,
      sets: it.sets,
      reps_prescribed: it.reps_prescribed,
      weight_prescribed: it.weight_prescribed,
      rest_seconds: it.rest_seconds,
      notes: it.notes
    }));
    selectedTemplate = '';
  }

  // Biblioteca filtrada
  const filteredExercises = $derived(
    data.exercises.filter((ex) => {
      if (filterText && !ex.name.toLowerCase().includes(filterText.toLowerCase())) return false;
      if (filterMuscle && ex.muscle_group !== filterMuscle) return false;
      return true;
    })
  );

  // Drag&drop SOLO para reordenar dentro del día (la biblioteca añade con "+").
  function handleDayConsider(e: CustomEvent<DndEvent<DayItem>>) {
    dayItems = e.detail.items;
  }
  function handleDayFinalize(e: CustomEvent<DndEvent<DayItem>>) {
    dayItems = e.detail.items;
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
  <div class="card space-y-4">
    <div>
      <label for="w-title" class="block text-xs uppercase tracking-wider text-text-mute mb-2">
        Título del día
      </label>
      <input
        id="w-title"
        type="text"
        bind:value={title}
        placeholder="ej: PIERNA — Bloque hipertrofia"
        class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md text-lg font-semibold
               focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all
               placeholder:font-normal placeholder:text-text-mute/40"
      />
    </div>
    <div>
      <label for="w-notes" class="block text-xs uppercase tracking-wider text-text-mute mb-2">
        Notas para tu cliente
      </label>
      <textarea
        id="w-notes"
        bind:value={notes}
        placeholder="ej: calienta bien, ojo al hombro derecho..."
        rows="2"
        class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md text-sm
               focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none
               placeholder:text-text-mute/40"
      ></textarea>
    </div>
  </div>

  <!-- Cargar plantilla -->
  {#if data.templates && data.templates.length > 0}
    <div class="card flex flex-col sm:flex-row sm:items-center gap-3">
      <span class="text-xs uppercase tracking-wider text-text-mute whitespace-nowrap">Cargar plantilla</span>
      <select
        bind:value={selectedTemplate}
        onchange={loadTemplate}
        class="flex-1 px-3 py-2 bg-bg border border-text-mute/20 rounded-md text-sm focus:border-primary"
      >
        <option value="">Elige una plantilla para rellenar el día…</option>
        {#each data.templates as t (t.id)}
          <option value={t.id}>{t.name} ({t.items.length} ej.)</option>
        {/each}
      </select>
      <a href="/templates" class="text-xs text-primary hover:underline whitespace-nowrap">Gestionar plantillas →</a>
    </div>
  {/if}

  <!-- Cuerpo: biblioteca + día -->
  <div class="grid lg:grid-cols-[1fr_1.5fr] gap-6">
    <!-- BIBLIOTECA -->
    <aside class="card space-y-4">
      <div>
        <h2 class="text-sm uppercase tracking-wider text-text-mute mb-3">Biblioteca</h2>
        <div class="relative mb-2">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-mute pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" stroke-linecap="round" />
          </svg>
          <input
            type="search"
            bind:value={filterText}
            placeholder="Buscar ejercicio..."
            class="w-full pl-9 pr-3 py-2 bg-bg border border-text-mute/20 rounded-md text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
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
        <div class="space-y-2 max-h-[600px] overflow-y-auto pr-1">
          {#each filteredExercises as ex (ex.id)}
            <button
              type="button"
              onclick={() => addExercise(ex)}
              class="w-full text-left bg-bg border border-text-mute/10 rounded-md p-3 flex items-center gap-3
                     hover:border-primary/40 transition-colors group"
              title="Añadir al día"
            >
              <div class="text-2xl">🏋️</div>
              <div class="flex-1 min-w-0">
                <div class="font-medium text-sm truncate">{ex.name}</div>
                {#if ex.muscle_group}
                  <div class="text-xs text-text-mute">{muscleLabels[ex.muscle_group]}</div>
                {/if}
              </div>
              <span class="text-primary group-hover:text-accent text-lg font-bold">+</span>
            </button>
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
          dropFromOthersDisabled: true,
          dropTargetStyle: {}
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
                <label for="sets-{item.id}" class="text-[10px] uppercase tracking-wider text-text-mute">Series</label>
                <input
                  id="sets-{item.id}"
                  type="number"
                  min="1"
                  max="20"
                  bind:value={item.sets}
                  class="w-full px-2 py-1 bg-surface border border-text-mute/20 rounded text-sm"
                />
              </div>
              <div>
                <label for="reps-{item.id}" class="text-[10px] uppercase tracking-wider text-text-mute">Reps</label>
                <input
                  id="reps-{item.id}"
                  type="text"
                  bind:value={item.reps_prescribed}
                  placeholder="8-10"
                  class="w-full px-2 py-1 bg-surface border border-text-mute/20 rounded text-sm"
                />
              </div>
              <div>
                <label for="weight-{item.id}" class="text-[10px] uppercase tracking-wider text-text-mute">Peso</label>
                <input
                  id="weight-{item.id}"
                  type="text"
                  bind:value={item.weight_prescribed}
                  placeholder="80kg"
                  class="w-full px-2 py-1 bg-surface border border-text-mute/20 rounded text-sm"
                />
              </div>
              <div>
                <label for="rest-{item.id}" class="text-[10px] uppercase tracking-wider text-text-mute">Desc. (s)</label>
                <input
                  id="rest-{item.id}"
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
            <p class="mb-1">Añade ejercicios con el botón <span class="text-primary">+</span> de la biblioteca ←</p>
            <p class="text-xs">luego arrástralos aquí para reordenarlos</p>
          </div>
        {/each}
      </div>
    </section>
  </div>

  {#if data.workout}
    <div class="text-center pt-4">
      <button
        type="button"
        onclick={() => (confirmDelete = true)}
        class="text-sm text-danger hover:text-danger/80"
      >
        Borrar entreno del día
      </button>
    </div>
  {/if}
</div>

<ConfirmModal
  bind:open={confirmTpl}
  title="Cargar plantilla"
  message="Esto reemplazará los ejercicios actuales del día por los de la plantilla."
  confirmLabel="Reemplazar"
  danger={false}
  onconfirm={applyTemplate}
/>

<ConfirmModal
  bind:open={confirmDelete}
  action="?/delete"
  title="Borrar entreno del día"
  message="Se borrará el entreno completo de este día. No se puede deshacer."
  confirmLabel="Borrar entreno"
/>

<style>
  /* Estilos sutiles para el drag */
  :global(.dndzone) {
    transition: outline 0.15s ease;
  }
</style>
