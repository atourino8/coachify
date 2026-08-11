<script lang="ts">
  import type { PageData, ActionData } from './$types';
  /**
   * Calendario de entrenos del cliente: vista de catorce días o mensual, con
   * duplicar un día y programar una plantilla en varios.
   *
   * Es el panel más grande de los cinco y sigue siéndolo, pero ahora es UNA
   * cosa: antes compartía fichero con la ficha, el progreso, la técnica y el
   * historial. Ver PanelHistorial sobre las props.
   */
  import { goto } from '$app/navigation';
  import { navigating } from '$app/state';
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

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const view = $derived(data.view);

  // --- Vista de catorce días ---
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

  // "12–25 ago" o "28 jul – 10 ago": se omite el mes repetido porque leerlo
  // dos veces no aporta nada y la cabecera es estrecha en móvil.
  function windowRangeLabel() {
    const s = windowStartDate;
    const e = windowEndDate;
    const sm = s.toLocaleDateString('es-ES', { month: 'short' });
    const em = e.toLocaleDateString('es-ES', { month: 'short' });
    if (sm === em) return `${s.getDate()}–${e.getDate()} ${em}`;
    return `${s.getDate()} ${sm} – ${e.getDate()} ${em}`;
  }

  // --- Duplicar un día en otro ---
  const workoutDays = $derived(
    Object.entries(data.workoutsByDate)
      .map(([iso, w]) => ({ iso, ...w }))
      .sort((a, b) => a.iso.localeCompare(b.iso))
  );
  let dupSource = $state<string>('');
  let dupTarget = $state<string>('');
  let dupSubmitting = $state(false);

  // --- Programar una plantilla en varios días ---
  let showProgram = $state(false);
  let pgTemplate = $state('');
  let pgStart = $state('');
  let pgEnd = $state('');
  let pgDays = $state<number[]>([1, 3, 5]); // L, X, V por defecto
  let pgOverwrite = $state(false);
  let pgSubmitting = $state(false);

  const WEEKDAYS = [
    { v: 1, label: 'L' },
    { v: 2, label: 'M' },
    { v: 3, label: 'X' },
    { v: 4, label: 'J' },
    { v: 5, label: 'V' },
    { v: 6, label: 'S' },
    { v: 0, label: 'D' }
  ];
  function toggleDay(d: number) {
    pgDays = pgDays.includes(d) ? pgDays.filter((x) => x !== d) : [...pgDays, d];
  }
</script>

<!-- Toggle de vista (semana / mes) -->
<div class="flex justify-end">
  <div class="flex bg-bg border border-text-mute/15 rounded-lg p-1 text-sm">
    <button
      onclick={() => setView('window')}
      class="px-3 py-1.5 rounded-md transition-colors {view === 'window'
        ? 'bg-primary text-bg font-medium'
        : 'text-text-mute hover:text-text'}"
    >
      Semana
    </button>
    <button
      onclick={() => setView('month')}
      class="px-3 py-1.5 rounded-md transition-colors {view === 'month'
        ? 'bg-primary text-bg font-medium'
        : 'text-text-mute hover:text-text'}"
    >
      Mes
    </button>
  </div>
</div>

{#if navigating.to}
  <!-- Estado de carga al cambiar de vista/periodo -->
  <div class="grid place-items-center py-24 text-text-mute">
    <div
      class="h-8 w-8 rounded-full border-2 border-text-mute/25 border-t-primary animate-spin"
      role="status"
      aria-label="Cargando calendario"
    ></div>
    <p class="text-sm mt-3">Cargando…</p>
  </div>
{:else if view === 'window'}
  <!-- ===== VISTA SEMANA (7 días, con detalle de ejercicios) ===== -->
  <div class="flex items-center justify-between gap-4">
    <button onclick={() => gotoWindow(-1)} class="btn-ghost text-sm py-2 px-4"
      >← Semana anterior</button
    >
    <div class="text-center">
      <div class="text-xs uppercase tracking-wider text-text-mute">
        {isTodayWindow ? 'Próximos 7 días' : 'Semana'}
      </div>
      <div class="font-semibold">{windowRangeLabel()}</div>
      {#if !isTodayWindow}
        <button onclick={gotoToday} class="text-xs text-primary hover:underline mt-0.5"
          >← Volver a hoy</button
        >
      {/if}
    </div>
    <button onclick={() => gotoWindow(1)} class="btn-ghost text-sm py-2 px-4"
      >Semana siguiente →</button
    >
  </div>

  <div class="space-y-2">
    {#each windowCells as day (day.iso)}
      {@const workout = data.workoutsByDate[day.iso]}
      <a
        href="/clients/{data.client.id}/workouts/{day.iso}"
        class="card flex items-stretch gap-4 py-3 transition-all
            {day.isToday ? 'ring-2 ring-primary border-primary/40' : ''}
            {day.isPast ? 'opacity-55 hover:opacity-100' : 'hover:border-primary/50'}
            {workout && !day.isToday ? 'border-primary/30' : ''}"
      >
        <!-- Columna de fecha -->
        <div
          class="w-14 flex-shrink-0 text-center border-r border-text-mute/10 pr-3 flex flex-col justify-center"
        >
          <div
            class="text-2xs uppercase tracking-wider {day.isToday
              ? 'text-primary font-semibold'
              : 'text-text-mute'}"
          >
            {day.weekday}
          </div>
          <div
            class="text-2xl font-display font-semibold leading-tight {day.isToday
              ? 'text-primary'
              : ''}"
          >
            {day.dayNum}
          </div>
          {#if day.isToday}
            <div class="text-3xs font-bold uppercase tracking-wide text-primary">Hoy</div>
          {/if}
        </div>

        <!-- Detalle del entreno -->
        <div class="flex-1 min-w-0 flex flex-col justify-center">
          {#if workout}
            <div class="text-sm font-semibold flex items-center gap-1.5">
              {#if workout.done}<span class="text-success" title="Completado">✓</span>{/if}
              <span class="truncate">{workout.title ?? 'Entreno'}</span>
              <span class="text-xs text-text-mute font-normal flex-shrink-0"
                >· {workout.itemCount} ej.</span
              >
            </div>
            {#if workout.exercises.length > 0}
              <div class="text-xs text-text-mute mt-1 line-clamp-2">
                {workout.exercises.join(' · ')}
              </div>
            {/if}
          {:else}
            <div class="text-sm text-text-mute/60 flex items-center gap-1.5">
              <span class="text-lg leading-none">+</span> Añadir entreno
            </div>
          {/if}
        </div>

        <!-- Acción -->
        <div class="flex items-center text-xs text-primary flex-shrink-0">
          {workout ? 'Editar →' : ''}
        </div>
      </a>
    {/each}
  </div>
{:else}
  <!-- ===== VISTA MENSUAL ===== -->
  <div class="flex items-center justify-between gap-4">
    <button onclick={() => gotoMonth(-1)} class="btn-ghost text-sm py-2 px-4">← Mes anterior</button
    >
    <div class="text-center">
      <div class="font-semibold capitalize">{monthLabel(data.monthISO)}</div>
      {#if !isCurrentMonth}
        <button onclick={() => gotoMonth(0)} class="text-xs text-primary hover:underline mt-0.5"
          >Mes actual</button
        >
      {/if}
    </div>
    <button onclick={() => gotoMonth(1)} class="btn-ghost text-sm py-2 px-4">Mes siguiente →</button
    >
  </div>

  <!-- Siete columnas también en móvil (un calendario con menos no es un
           calendario), pero con celdas más bajas y menos relleno. -->
  <div class="grid grid-cols-7 gap-1 sm:gap-1.5">
    {#each weekdayHeaders as h}
      <div class="text-center text-xs uppercase tracking-wider text-text-mute pb-1">{h}</div>
    {/each}
    {#each monthCells as day (day.iso)}
      {@const workout = data.workoutsByDate[day.iso]}
      <a
        href="/clients/{data.client.id}/workouts/{day.iso}"
        class="card p-1.5 sm:p-2 min-h-[52px] sm:min-h-[84px] flex flex-col transition-all text-xs sm:text-sm
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
          <!-- En móvil no cabe el título: un punto basta para decir "aquí
                   hay entreno", y el nombre se lee al abrir el día. -->
          <div class="mt-auto">
            <span class="sm:hidden block h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true"
            ></span>
            <div class="hidden sm:block">
              <div class="text-2xs font-medium truncate">{workout.title ?? 'Entreno'}</div>
              <div class="text-3xs text-text-mute">{workout.itemCount} ej.</div>
            </div>
          </div>
        {/if}
      </a>
    {/each}
  </div>
{/if}

<!-- ===== PANEL PROGRAMAR CON PLANTILLA ===== -->
{#if data.templates.length > 0}
  <div class="card space-y-4">
    <div class="flex items-center justify-between gap-3">
      <div>
        <h2 class="font-semibold">Programar con un entrenamiento</h2>
        <p class="text-xs text-text-mute mt-0.5">
          Aplica un entrenamiento a varios días de golpe (ej. L/X/V de dos semanas).
        </p>
      </div>
      <button
        onclick={() => (showProgram = !showProgram)}
        class="text-sm text-primary hover:underline whitespace-nowrap"
      >
        {showProgram ? 'Cerrar' : 'Programar →'}
      </button>
    </div>

    {#if showProgram}
      <form
        method="POST"
        action="?/programTemplate"
        use:enhance={() => {
          pgSubmitting = true;
          return async ({ update }) => {
            await update();
            pgSubmitting = false;
          };
        }}
        class="space-y-4 border-t border-text-mute/10 pt-4"
      >
        <div>
          <label for="pg-tpl" class="block text-xs uppercase tracking-wider text-text-mute mb-2"
            >Entrenamiento</label
          >
          <select
            id="pg-tpl"
            name="template_id"
            bind:value={pgTemplate}
            required
            class="w-full px-3 py-2.5 bg-bg border border-text-mute/20 rounded-md text-sm focus:border-primary"
          >
            <option value="" disabled>Elige un entrenamiento…</option>
            {#each data.templates as t (t.id)}<option value={t.id}
                >{t.name} ({t.itemCount} ej.)</option
              >{/each}
          </select>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label for="pg-start" class="block text-xs uppercase tracking-wider text-text-mute mb-2"
              >Desde</label
            >
            <input
              id="pg-start"
              type="date"
              name="start_date"
              bind:value={pgStart}
              required
              class="w-full px-3 py-2.5 bg-bg border border-text-mute/20 rounded-md text-sm focus:border-primary"
            />
          </div>
          <div>
            <label for="pg-end" class="block text-xs uppercase tracking-wider text-text-mute mb-2"
              >Hasta</label
            >
            <input
              id="pg-end"
              type="date"
              name="end_date"
              bind:value={pgEnd}
              required
              class="w-full px-3 py-2.5 bg-bg border border-text-mute/20 rounded-md text-sm focus:border-primary"
            />
          </div>
        </div>

        <div>
          <span class="block text-xs uppercase tracking-wider text-text-mute mb-2"
            >Días de la semana</span
          >
          <div class="flex gap-2">
            {#each WEEKDAYS as d}
              <button
                type="button"
                onclick={() => toggleDay(d.v)}
                class="w-9 h-9 rounded-full text-sm font-medium border transition-colors {pgDays.includes(
                  d.v
                )
                  ? 'bg-primary text-bg border-primary'
                  : 'border-text-mute/20 text-text-mute hover:text-text'}"
              >
                {d.label}
              </button>
            {/each}
          </div>
          {#each pgDays as d}<input type="hidden" name="weekdays" value={d} />{/each}
        </div>

        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" bind:checked={pgOverwrite} name="overwrite" value="1" />
          Sobrescribir días que ya tengan entreno
        </label>

        <button
          type="submit"
          disabled={pgSubmitting || !pgTemplate || pgDays.length === 0}
          class="btn-primary w-full"
        >
          {pgSubmitting ? 'Programando…' : 'Programar'}
        </button>
        <!-- Si el botón está apagado, decimos por qué: si no, parece roto. -->
        {#if !pgTemplate || pgDays.length === 0}
          <p class="text-xs text-text-mute text-center">
            {!pgTemplate && pgDays.length === 0
              ? 'Elige un entrenamiento y marca al menos un día.'
              : !pgTemplate
                ? 'Elige un entrenamiento.'
                : 'Marca al menos un día de la semana.'}
          </p>
        {/if}
      </form>
    {/if}
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
        <label for="dup-src" class="block text-xs uppercase tracking-wider text-text-mute mb-2"
          >Entreno origen</label
        >
        <select
          id="dup-src"
          name="source_id"
          bind:value={dupSource}
          required
          class="w-full px-3 py-2.5 bg-bg border border-text-mute/20 rounded-md focus:border-primary text-sm"
        >
          <option value="" disabled>Elige un entreno…</option>
          {#each workoutDays as w (w.id)}
            <option value={w.id}
              >{formatHumanDate(w.iso)} · {w.title ?? 'Entreno'} ({w.itemCount} ej.)</option
            >
          {/each}
        </select>
      </div>
      <div>
        <label for="dup-tgt" class="block text-xs uppercase tracking-wider text-text-mute mb-2"
          >Fecha destino</label
        >
        <input
          id="dup-tgt"
          type="date"
          name="target_date"
          bind:value={dupTarget}
          required
          class="w-full px-3 py-2.5 bg-bg border border-text-mute/20 rounded-md focus:border-primary text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={dupSubmitting || !dupSource || !dupTarget}
        class="btn-primary py-2.5"
      >
        {dupSubmitting ? 'Duplicando…' : 'Duplicar'}
      </button>
    </form>
  </div>
{/if}
