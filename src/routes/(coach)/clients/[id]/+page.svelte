<script lang="ts">
  import { goto } from '$app/navigation';
  import { formatDateISO, addDays, rollingDays, todayISOLocal } from '$lib/week';

  let { data } = $props();

  const days = $derived(rollingDays(data.windowStart, data.windowDays));
  const windowStartDate = $derived(new Date(data.windowStart + 'T00:00:00'));
  const windowEndDate = $derived(addDays(windowStartDate, data.windowDays - 1));
  const isTodayWindow = $derived(data.windowStart === todayISOLocal());

  function gotoWindow(offset: number) {
    const newStart = addDays(windowStartDate, offset * data.windowDays);
    goto(`?start=${formatDateISO(newStart)}`, { replaceState: false });
  }

  function gotoToday() {
    goto(`?start=${todayISOLocal()}`, { replaceState: false });
  }

  function rangeLabel() {
    const s = windowStartDate;
    const e = windowEndDate;
    const sm = s.toLocaleDateString('es-ES', { month: 'short' });
    const em = e.toLocaleDateString('es-ES', { month: 'short' });
    if (sm === em) return `${s.getDate()}–${e.getDate()} ${em}`;
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

  <!-- Selector de ventana (7 días desde hoy por defecto) -->
  <div class="flex items-center justify-between gap-4">
    <button onclick={() => gotoWindow(-1)} class="btn-ghost text-sm py-2 px-4">
      ← Anterior
    </button>
    <div class="text-center">
      <div class="text-xs uppercase tracking-wider text-text-mute">
        {isTodayWindow ? 'Próximos 7 días' : 'Semana'}
      </div>
      <div class="font-semibold">{rangeLabel()}</div>
      {#if !isTodayWindow}
        <button onclick={gotoToday} class="text-xs text-primary hover:underline mt-0.5">
          ← Volver a hoy
        </button>
      {/if}
    </div>
    <button onclick={() => gotoWindow(1)} class="btn-ghost text-sm py-2 px-4">
      Siguiente →
    </button>
  </div>

  <!-- Días -->
  <div class="grid grid-cols-7 gap-2">
    {#each days as day (day.iso)}
      {@const workout = data.workoutsByDate[day.iso]}
      <a
        href="/clients/{data.client.id}/workouts/{day.iso}"
        class="card transition-all min-h-[180px] flex flex-col relative
          {day.isToday ? 'ring-2 ring-primary border-primary/40' : ''}
          {day.isPast ? 'opacity-45 hover:opacity-80' : 'hover:border-primary/50'}
          {workout && !day.isToday ? 'border-primary/30' : ''}"
      >
        <div class="flex items-center justify-between mb-1">
          <div class="text-xs uppercase tracking-wider {day.isToday ? 'text-primary font-semibold' : 'text-text-mute'}">
            {day.weekday}
          </div>
          {#if day.isToday}
            <span class="text-[10px] font-bold uppercase tracking-wide bg-primary text-bg px-1.5 py-0.5 rounded">Hoy</span>
          {/if}
        </div>
        <div class="text-2xl font-bold {day.isToday ? 'text-primary' : ''}">{day.dayNum}</div>

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
      Click en un día para abrir el constructor y añadir ejercicios de tu biblioteca.
    </p>
  </div>
</div>
