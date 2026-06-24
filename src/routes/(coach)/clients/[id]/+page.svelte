<script lang="ts">
  import { goto } from '$app/navigation';
  import { weekDays, formatDateISO, addDays } from '$lib/week';

  let { data } = $props();

  const days = $derived(weekDays(new Date(data.weekStart + 'T00:00:00')));
  const weekStartDate = $derived(new Date(data.weekStart + 'T00:00:00'));
  const weekEndDate = $derived(addDays(weekStartDate, 6));

  function gotoWeek(offset: number) {
    const newStart = addDays(weekStartDate, offset * 7);
    goto(`?week=${formatDateISO(newStart)}`, { replaceState: false });
  }

  function rangeLabel() {
    const s = weekStartDate;
    const e = weekEndDate;
    const sm = s.toLocaleDateString('es-ES', { month: 'short' });
    const em = e.toLocaleDateString('es-ES', { month: 'short' });
    if (sm === em) return `${s.getDate()}-${e.getDate()} ${em}`;
    return `${s.getDate()} ${sm} – ${e.getDate()} ${em}`;
  }
</script>

<svelte:head>
  <title>{data.client.full_name} · Coachify</title>
</svelte:head>

<div class="space-y-8">
  <div class="flex items-center justify-between">
    <div>
      <a href="/clients" class="text-sm text-text-mute hover:text-text">← Clientes</a>
      <h1 class="text-3xl font-bold tracking-tight mt-3">{data.client.full_name}</h1>
      <p class="text-text-mute text-sm mt-1">
        Cliente desde {new Date(data.client.created_at).toLocaleDateString('es-ES')}
      </p>
    </div>
  </div>

  <!-- Selector de semana -->
  <div class="flex items-center justify-between gap-4">
    <button onclick={() => gotoWeek(-1)} class="btn-ghost text-sm py-2 px-4">
      ← Semana anterior
    </button>
    <div class="text-center">
      <div class="text-xs uppercase tracking-wider text-text-mute">Semana</div>
      <div class="font-semibold">{rangeLabel()}</div>
    </div>
    <button onclick={() => gotoWeek(1)} class="btn-ghost text-sm py-2 px-4">
      Semana siguiente →
    </button>
  </div>

  <!-- Días de la semana -->
  <div class="grid grid-cols-7 gap-2">
    {#each days as day}
      {@const workout = data.workoutsByDate[day.iso]}
      <a
        href="/clients/{data.client.id}/workouts/{day.iso}"
        class="card hover:border-primary/50 transition-all min-h-[180px] flex flex-col {workout
          ? 'border-primary/30'
          : 'opacity-80'}"
      >
        <div class="text-xs uppercase tracking-wider text-text-mute mb-1">
          {day.label}
        </div>
        <div class="text-2xl font-bold">{new Date(day.iso + 'T00:00:00').getDate()}</div>

        {#if workout}
          <div class="mt-3 flex-1">
            <div class="text-sm font-medium truncate">
              {workout.title ?? 'Entrenamiento'}
            </div>
            <div class="text-xs text-text-mute mt-1">
              {workout.workout_items?.length ?? 0} ej.
            </div>
          </div>
          <div class="text-xs text-primary mt-2">Editar →</div>
        {:else}
          <div class="flex-1 grid place-items-center text-text-mute/40 text-2xl">+</div>
          <div class="text-xs text-text-mute mt-2 text-center">Añadir entreno</div>
        {/if}
      </a>
    {/each}
  </div>

  <div class="card text-center bg-primary/5 border-primary/20">
    <p class="text-sm text-text-mute">
      Click en un día para abrir el constructor y arrastrar ejercicios desde tu biblioteca.
    </p>
  </div>
</div>
