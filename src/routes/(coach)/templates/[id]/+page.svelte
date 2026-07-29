<script lang="ts">
  import { enhance } from '$app/forms';
  import type { Exercise } from '$lib/supabase/types';

  let { data, form } = $props();

  type TplItem = {
    id: string; // id local para el #each
    exercise: Exercise;
    sets: number;
    reps_prescribed: string;
    weight_prescribed: string;
    rest_seconds: number | null;
    notes: string;
  };

  const CATEGORIES: { value: string; label: string }[] = [
    { value: 'hipertrofia', label: 'Hipertrofia' },
    { value: 'fuerza', label: 'Fuerza' },
    { value: 'resistencia', label: 'Resistencia' },
    { value: 'movilidad', label: 'Movilidad' },
    { value: 'perdida_grasa', label: 'Pérdida de grasa' },
    { value: 'rehabilitacion', label: 'Rehabilitación' },
    { value: 'otro', label: 'Otro' }
  ];

  // svelte-ignore state_referenced_locally
  let name = $state(data.template.name);
  // svelte-ignore state_referenced_locally
  let notes = $state(data.template.notes ?? '');
  // svelte-ignore state_referenced_locally
  let category = $state(data.template.category ?? '');
  // svelte-ignore state_referenced_locally
  let items = $state<TplItem[]>(
    (data.template.workout_template_items ?? []).map((it) => ({
      id: crypto.randomUUID(),
      exercise: it.exercise as Exercise,
      sets: it.sets,
      reps_prescribed: it.reps_prescribed ?? '',
      weight_prescribed: it.weight_prescribed ?? '',
      rest_seconds: it.rest_seconds,
      notes: it.notes ?? ''
    }))
  );

  let saving = $state(false);
  let filterText = $state('');
  let filterMuscle = $state('');

  const muscleLabels: Record<string, string> = {
    chest: 'Pecho', back: 'Espalda', legs: 'Pierna', shoulders: 'Hombro',
    arms: 'Brazo', core: 'Core', cardio: 'Cardio', full_body: 'Full body'
  };

  const filtered = $derived(
    data.exercises.filter((ex) => {
      if (filterText && !ex.name.toLowerCase().includes(filterText.toLowerCase())) return false;
      if (filterMuscle && ex.muscle_group !== filterMuscle) return false;
      return true;
    })
  );

  function addExercise(ex: Exercise) {
    items = [
      ...items,
      { id: crypto.randomUUID(), exercise: ex, sets: 4, reps_prescribed: '8-10', weight_prescribed: '', rest_seconds: 90, notes: '' }
    ];
  }
  function removeItem(id: string) {
    items = items.filter((it) => it.id !== id);
  }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const copy = [...items];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    items = copy;
  }
  function itemsJSON() {
    return JSON.stringify(
      items.map((it) => ({
        exercise_id: it.exercise.id,
        sets: it.sets,
        reps_prescribed: it.reps_prescribed,
        weight_prescribed: it.weight_prescribed,
        rest_seconds: it.rest_seconds,
        notes: it.notes
      }))
    );
  }
</script>

<svelte:head>
  <title>{name || 'Plantilla'} · Coachify</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between gap-4">
    <a href="/templates" class="text-sm text-text-mute hover:text-text">← Entrenos</a>
    <form
      method="POST"
      action="?/save"
      use:enhance={() => {
        saving = true;
        return async ({ update }) => { await update(); saving = false; };
      }}
    >
      <input type="hidden" name="name" value={name} />
      <input type="hidden" name="notes" value={notes} />
      <input type="hidden" name="category" value={category} />
      <input type="hidden" name="items" value={itemsJSON()} />
      <button type="submit" disabled={saving || !name.trim()} class="btn-primary py-2 px-5">
        {saving ? 'Guardando…' : 'Guardar plantilla'}
      </button>
    </form>
  </div>

  {#if form?.error}
    <p role="alert" class="text-sm text-danger bg-danger/10 border border-danger/20 rounded-md p-3">{form.error}</p>
  {/if}
  {#if form?.success}
    <p aria-live="polite" class="text-sm text-success bg-success/10 border border-success/20 rounded-md p-3">Plantilla guardada.</p>
  {/if}

  <!-- Cabecera editable -->
  <div class="card space-y-3">
    <input
      bind:value={name}
      maxlength="80"
      placeholder="Nombre de la plantilla"
      class="w-full bg-transparent text-2xl font-bold focus:outline-none placeholder:text-text-mute/40"
    />
    <textarea
      bind:value={notes}
      rows="2"
      maxlength="300"
      placeholder="Notas de la plantilla (opcional)"
      class="w-full bg-transparent text-sm text-text-mute focus:outline-none resize-none placeholder:text-text-mute/40"
    ></textarea>
    <div class="flex items-center gap-2 pt-1">
      <label for="tpl-cat" class="text-xs uppercase tracking-wider text-text-mute">Categoría</label>
      <select id="tpl-cat" bind:value={category}
        class="px-3 py-1.5 bg-bg border border-text-mute/20 rounded-md text-sm focus:border-primary">
        <option value="">Sin categoría</option>
        {#each CATEGORIES as c}<option value={c.value}>{c.label}</option>{/each}
      </select>
    </div>
  </div>

  <div class="grid md:grid-cols-2 gap-6">
    <!-- Biblioteca -->
    <aside class="card space-y-3">
      <h2 class="text-sm uppercase tracking-wider text-text-mute">Biblioteca</h2>
      <input
        bind:value={filterText}
        placeholder="🔍 Buscar ejercicio…"
        class="w-full px-3 py-2 bg-bg border border-text-mute/20 rounded-md text-sm focus:border-primary"
      />
      <select bind:value={filterMuscle} class="w-full px-3 py-2 bg-bg border border-text-mute/20 rounded-md text-sm focus:border-primary">
        <option value="">Todos los grupos</option>
        {#each Object.entries(muscleLabels) as [v, l]}<option value={v}>{l}</option>{/each}
      </select>

      {#if filtered.length === 0}
        <div class="text-center py-8 text-sm text-text-mute">
          {data.exercises.length === 0 ? 'No tienes ejercicios en la biblioteca.' : 'Ninguno coincide.'}
        </div>
      {:else}
        <div class="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {#each filtered as ex (ex.id)}
            <button
              type="button"
              onclick={() => addExercise(ex)}
              class="w-full text-left bg-bg border border-text-mute/10 rounded-md p-3 flex items-center gap-3 hover:border-primary/40 transition-colors group"
            >
              <div class="text-2xl">🏋️</div>
              <div class="flex-1 min-w-0">
                <div class="font-medium text-sm truncate">{ex.name}</div>
                {#if ex.muscle_group}<div class="text-xs text-text-mute">{muscleLabels[ex.muscle_group]}</div>{/if}
              </div>
              <span class="text-primary group-hover:text-accent text-lg font-bold">+</span>
            </button>
          {/each}
        </div>
      {/if}
    </aside>

    <!-- Ejercicios de la plantilla -->
    <section class="card space-y-4 min-h-[300px]">
      <h2 class="text-sm uppercase tracking-wider text-text-mute">Ejercicios · {items.length}</h2>
      {#if items.length === 0}
        <div class="min-h-[220px] grid place-items-center text-center border-2 border-dashed border-text-mute/20 rounded-md p-6">
          <div>
            <p class="text-sm text-text-mute mb-1">Añade ejercicios con el botón <span class="text-primary">+</span> ←</p>
            <p class="text-xs text-text-mute">Ordénalos con las flechas ↑↓</p>
          </div>
        </div>
      {:else}
        {#each items as item, i (item.id)}
          <div class="bg-bg border border-text-mute/20 rounded-md p-4 space-y-3">
            <div class="flex items-start gap-3">
              <div class="flex flex-col gap-0.5 pt-0.5">
                <button type="button" onclick={() => move(i, -1)} disabled={i === 0} aria-label="Subir ejercicio" class="text-text-mute hover:text-primary disabled:opacity-30 text-xs leading-none">▲</button>
                <button type="button" onclick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Bajar ejercicio" class="text-text-mute hover:text-primary disabled:opacity-30 text-xs leading-none">▼</button>
              </div>
              <div class="flex-1 min-w-0">
                <div class="font-medium truncate">{item.exercise.name}</div>
                {#if item.exercise.muscle_group}<div class="text-xs text-text-mute">{muscleLabels[item.exercise.muscle_group]}</div>{/if}
              </div>
              <button type="button" onclick={() => removeItem(item.id)} aria-label="Quitar ejercicio" class="text-text-mute hover:text-danger text-xl leading-none">×</button>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label for="s-{item.id}" class="text-[10px] uppercase tracking-wider text-text-mute">Series</label>
                <input id="s-{item.id}" type="number" min="1" max="20" bind:value={item.sets} class="w-full px-2 py-1 bg-surface border border-text-mute/20 rounded text-sm" />
              </div>
              <div>
                <label for="r-{item.id}" class="text-[10px] uppercase tracking-wider text-text-mute">Reps</label>
                <input id="r-{item.id}" type="text" bind:value={item.reps_prescribed} placeholder="8-10" class="w-full px-2 py-1 bg-surface border border-text-mute/20 rounded text-sm" />
              </div>
              <div>
                <label for="w-{item.id}" class="text-[10px] uppercase tracking-wider text-text-mute">Peso</label>
                <input id="w-{item.id}" type="text" bind:value={item.weight_prescribed} placeholder="80kg" class="w-full px-2 py-1 bg-surface border border-text-mute/20 rounded text-sm" />
              </div>
              <div>
                <label for="d-{item.id}" class="text-[10px] uppercase tracking-wider text-text-mute">Desc. (s)</label>
                <input id="d-{item.id}" type="number" min="0" step="15" bind:value={item.rest_seconds} placeholder="90" class="w-full px-2 py-1 bg-surface border border-text-mute/20 rounded text-sm" />
              </div>
            </div>
          </div>
        {/each}
      {/if}
    </section>
  </div>
</div>
