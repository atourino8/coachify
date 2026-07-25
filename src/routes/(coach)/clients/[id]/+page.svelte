<script lang="ts">
  import { goto } from '$app/navigation';
  import { enhance } from '$app/forms';
  import {
    formatDateISO,
    addDays,
    rollingDays,
    todayISOLocal,
    monthGrid,
    shiftMonth,
    monthLabel,
    currentMonthISO,
    formatHumanDate
  } from '$lib/week';

  let { data, form } = $props();

  // --- Vista actual ---
  const view = $derived(data.view);

  // --- Vista ventana (14 días) ---
  const windowCells = $derived(rollingDays(data.windowStart, data.windowDays));
  const windowStartDate = $derived(new Date(data.windowStart + 'T00:00:00'));
  const windowEndDate = $derived(addDays(windowStartDate, data.windowDays - 1));
  const isTodayWindow = $derived(data.windowStart === todayISOLocal());

  // --- Vista mensual ---
  const monthCells = $derived(monthGrid(data.monthISO));
  const isCurrentMonth = $derived(data.monthISO === currentMonthISO());

  const weekdayHeaders = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  function gotoWindow(offset: number) {
    const newStart = addDays(windowStartDate, offset * data.windowDays);
    goto(`?view=window&start=${formatDateISO(newStart)}`, { replaceState: false });
  }
  function gotoToday() {
    goto(`?view=window&start=${todayISOLocal()}`, { replaceState: false });
  }
  function gotoMonth(delta: number) {
    goto(`?view=month&month=${shiftMonth(data.monthISO, delta)}`, { replaceState: false });
  }
  function setView(v: 'window' | 'month') {
    if (v === 'month') goto(`?view=month&month=${currentMonthISO()}`);
    else goto(`?view=window&start=${todayISOLocal()}`);
  }

  function windowRangeLabel() {
    const s = windowStartDate;
    const e = windowEndDate;
    const sm = s.toLocaleDateString('es-ES', { month: 'short' });
    const em = e.toLocaleDateString('es-ES', { month: 'short' });
    if (sm === em) return `${s.getDate()}–${e.getDate()} ${em}`;
    return `${s.getDate()} ${sm} – ${e.getDate()} ${em}`;
  }

  // --- Panel duplicar ---
  // Lista de días con entreno en la vista actual (para el select de origen).
  const workoutDays = $derived(
    Object.entries(data.workoutsByDate)
      .map(([iso, w]) => ({ iso, ...w }))
      .sort((a, b) => a.iso.localeCompare(b.iso))
  );
  let dupSource = $state<string>('');
  let dupTarget = $state<string>('');
  let dupSubmitting = $state(false);
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

    <!-- Toggle de vista -->
    <div class="flex bg-bg border border-text-mute/15 rounded-lg p-1 text-sm">
      <button
        onclick={() => setView('window')}
        class="px-3 py-1.5 rounded-md transition-colors {view === 'window' ? 'bg-primary text-bg font-medium' : 'text-text-mute hover:text-text'}"
      >
        Próximos días
      </button>
      <button
        onclick={() => setView('month')}
        class="px-3 py-1.5 rounded-md transition-colors {view === 'month' ? 'bg-primary text-bg font-medium' : 'text-text-mute hover:text-text'}"
      >
        Mes
      </button>
    </div>
  </div>

  {#if form?.error}
    <p class="text-sm text-danger bg-danger/10 border border-danger/20 rounded-md p-3">{form.error}</p>
  {/if}
  {#if form?.success && form?.duplicated}
    <p class="text-sm text-success bg-success/10 border border-success/20 rounded-md p-3">
      Entreno duplicado a {formatHumanDate(form.targetDate)}.
    </p>
  {/if}

  {#if view === 'window'}
    <!-- ===== VISTA VENTANA (14 días) ===== -->
    <div class="flex items-center justify-between gap-4">
      <button onclick={() => gotoWindow(-1)} class="btn-ghost text-sm py-2 px-4">← Anterior</button>
      <div class="text-center">
        <div class="text-xs uppercase tracking-wider text-text-mute">
          {isTodayWindow ? 'Próximas 2 semanas' : 'Periodo'}
        </div>
        <div class="font-semibold">{windowRangeLabel()}</div>
        {#if !isTodayWindow}
          <button onclick={gotoToday} class="text-xs text-primary hover:underline mt-0.5">← Volver a hoy</button>
        {/if}
      </div>
      <button onclick={() => gotoWindow(1)} class="btn-ghost text-sm py-2 px-4">Siguiente →</button>
    </div>

    <div class="grid grid-cols-7 gap-2">
      {#each windowCells as day (day.iso)}
        {@const workout = data.workoutsByDate[day.iso]}
        <a
          href="/clients/{data.client.id}/workouts/{day.iso}"
          class="card transition-all min-h-[150px] flex flex-col relative
            {day.isToday ? 'ring-2 ring-primary border-primary/40' : ''}
            {day.isPast ? 'opacity-45 hover:opacity-80' : 'hover:border-primary/50'}
            {workout && !day.isToday ? 'border-primary/30' : ''}"
        >
          <div class="flex items-center justify-between mb-1">
            <div class="text-xs uppercase tracking-wider {day.isToday ? 'text-primary font-semibold' : 'text-text-mute'}">{day.weekday}</div>
            {#if day.isToday}
              <span class="text-[10px] font-bold uppercase tracking-wide bg-primary text-bg px-1.5 py-0.5 rounded">Hoy</span>
            {/if}
          </div>
          <div class="text-2xl font-bold {day.isToday ? 'text-primary' : ''}">{day.dayNum}</div>

          {#if workout}
            <div class="mt-2 flex-1">
              <div class="text-sm font-medium truncate flex items-center gap-1">
                {#if workout.done}<span class="text-success" title="Completado">✓</span>{/if}
                {workout.title ?? 'Entreno'}
              </div>
              <div class="text-xs text-text-mute mt-1">{workout.itemCount} ej.</div>
            </div>
            <div class="text-xs text-primary mt-2">Editar →</div>
          {:else}
            <div class="flex-1 grid place-items-center text-text-mute/40 text-2xl">+</div>
            <div class="text-xs text-text-mute mt-1 text-center">Añadir</div>
          {/if}
        </a>
      {/each}
    </div>
  {:else}
    <!-- ===== VISTA MENSUAL ===== -->
    <div class="flex items-center justify-between gap-4">
      <button onclick={() => gotoMonth(-1)} class="btn-ghost text-sm py-2 px-4">← Mes anterior</button>
      <div class="text-center">
        <div class="font-semibold capitalize">{monthLabel(data.monthISO)}</div>
        {#if !isCurrentMonth}
          <button onclick={() => gotoMonth(0)} class="text-xs text-primary hover:underline mt-0.5">Mes actual</button>
        {/if}
      </div>
      <button onclick={() => gotoMonth(1)} class="btn-ghost text-sm py-2 px-4">Mes siguiente →</button>
    </div>

    <div class="grid grid-cols-7 gap-1.5">
      {#each weekdayHeaders as h}
        <div class="text-center text-xs uppercase tracking-wider text-text-mute pb-1">{h}</div>
      {/each}
      {#each monthCells as day (day.iso)}
        {@const workout = data.workoutsByDate[day.iso]}
        <a
          href="/clients/{data.client.id}/workouts/{day.iso}"
          class="card p-2 min-h-[84px] flex flex-col transition-all text-sm
            {!day.inMonth ? 'opacity-30' : ''}
            {day.isToday ? 'ring-2 ring-primary border-primary/40' : ''}
            {day.isPast && day.inMonth ? 'opacity-55 hover:opacity-90' : 'hover:border-primary/50'}
            {workout && !day.isToday ? 'border-primary/30' : ''}"
        >
          <div class="flex items-center justify-between">
            <span class="font-semibold {day.isToday ? 'text-primary' : ''}">{day.dayNum}</span>
            {#if workout?.done}<span class="text-success text-xs" title="Completado">✓</span>{/if}
          </div>
          {#if workout}
            <div class="mt-auto">
              <div class="text-[11px] font-medium truncate">{workout.title ?? 'Entreno'}</div>
              <div class="text-[10px] text-text-mute">{workout.itemCount} ej.</div>
            </div>
          {/if}
        </a>
      {/each}
    </div>
  {/if}

  <!-- ===== PANEL DUPLICAR ENTRENO ===== -->
  {#if workoutDays.length > 0}
    <div class="card space-y-4">
      <h2 class="font-semibold">Duplicar un entreno</h2>
      <p class="text-xs text-text-mute -mt-2">
        Copia un entreno existente (con sus ejercicios) a otra fecha. Útil para repetir rutinas.
      </p>
      <form
        method="POST"
        action="?/duplicate"
        use:enhance={() => {
          dupSubmitting = true;
          return async ({ update }) => {
            await update();
            dupSubmitting = false;
            dupSource = '';
            dupTarget = '';
          };
        }}
        class="grid sm:grid-cols-3 gap-3 items-end"
      >
        <div>
          <label for="dup-src" class="block text-xs uppercase tracking-wider text-text-mute mb-2">Entreno origen</label>
          <select id="dup-src" name="source_id" bind:value={dupSource} required
            class="w-full px-3 py-2.5 bg-bg border border-text-mute/20 rounded-md focus:border-primary text-sm">
            <option value="" disabled>Elige un entreno…</option>
            {#each workoutDays as w (w.id)}
              <option value={w.id}>{formatHumanDate(w.iso)} · {w.title ?? 'Entreno'} ({w.itemCount} ej.)</option>
            {/each}
          </select>
        </div>
        <div>
          <label for="dup-tgt" class="block text-xs uppercase tracking-wider text-text-mute mb-2">Fecha destino</label>
          <input id="dup-tgt" type="date" name="target_date" bind:value={dupTarget} required
            class="w-full px-3 py-2.5 bg-bg border border-text-mute/20 rounded-md focus:border-primary text-sm" />
        </div>
        <button type="submit" disabled={dupSubmitting || !dupSource || !dupTarget} class="btn-primary py-2.5">
          {dupSubmitting ? 'Duplicando…' : 'Duplicar'}
        </button>
      </form>
    </div>
  {/if}

  <div class="card text-center bg-primary/5 border-primary/20">
    <p class="text-sm text-text-mute">
      Click en un día para abrir el constructor y añadir ejercicios de tu biblioteca.
    </p>
  </div>
</div>
