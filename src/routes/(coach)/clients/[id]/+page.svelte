<script lang="ts">
  import { goto } from '$app/navigation';
  import { navigating, page } from '$app/state';
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
  import { paymentStatus } from '$lib/supabase/types';

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

  // --- Pestañas (Entrenos / Ficha / Técnica / Historial) ---
  // La pestaña inicial se puede fijar por URL (?tab=tecnica) para que los
  // avisos del inicio aterricen directamente donde está la acción.
  type Tab = 'entrenos' | 'ficha' | 'tecnica' | 'historial';
  const TABS: Tab[] = ['entrenos', 'ficha', 'tecnica', 'historial'];
  const initialTab = page.url.searchParams.get('tab') as Tab | null;
  // svelte-ignore state_referenced_locally
  let tab = $state<Tab>(initialTab && TABS.includes(initialTab) ? initialTab : 'entrenos');

  // Nº de ejercicios con vídeo pendiente de revisar (para el badge).
  const pendingTechnique = $derived(data.technique.filter((t) => t.pending).length);

  // --- Estado de pago (derivado de la cuota y de "pagado hasta") ---
  const payStatus = $derived(paymentStatus(data.info, todayISOLocal()));
  const PAY_LABELS: Record<string, { text: string; cls: string }> = {
    al_dia: { text: 'Al día', cls: 'bg-success/15 text-success' },
    vence_pronto: { text: 'Vence pronto', cls: 'bg-warning/15 text-warning' },
    vencido: { text: 'Pago vencido', cls: 'bg-danger/15 text-danger' },
    sin_cuota: { text: 'Sin cuota', cls: 'bg-surface-2 text-text-mute' }
  };
  const payLabel = $derived(PAY_LABELS[payStatus]);

  // --- Ficha del cliente ---
  const LEVELS = [
    { value: 'principiante', label: 'Principiante' },
    { value: 'intermedio', label: 'Intermedio' },
    { value: 'avanzado', label: 'Avanzado' }
  ];
  let savingInfo = $state(false);
  // svelte-ignore state_referenced_locally
  let levelSel = $state(data.info?.level ?? '');

  function ageFrom(birth: string | null | undefined): number | null {
    if (!birth) return null;
    const b = new Date(birth);
    if (isNaN(b.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - b.getFullYear();
    const m = now.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
    return age;
  }

  // --- Historial ---
  const sessionStatusLabel: Record<string, string> = {
    requested: 'Pendiente',
    confirmed: 'Confirmada',
    rejected: 'Rechazada',
    cancelled: 'Cancelada',
    completed: 'Completada'
  };
  const sessionStatusClass: Record<string, string> = {
    requested: 'bg-warning/15 text-warning',
    confirmed: 'bg-success/15 text-success',
    rejected: 'bg-danger/15 text-danger',
    cancelled: 'bg-text-mute/15 text-text-mute',
    completed: 'bg-primary/15 text-primary'
  };
  function fmtDateTime(iso: string) {
    return new Date(iso).toLocaleString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

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

  // --- Programar plantilla en varios días ---
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

<svelte:head>
  <title>{data.client.full_name} · Coachify</title>
</svelte:head>

<div class="space-y-8">
  <div class="flex flex-wrap items-start justify-between gap-4">
    <div class="min-w-0">
      <a href="/clients" class="text-sm text-text-mute hover:text-text">← Clientes</a>
      <h1 class="text-2xl sm:text-3xl font-display font-semibold tracking-tight mt-3">
        {data.client.full_name}
      </h1>
      <p class="text-text-mute text-sm mt-1">
        Cliente desde {new Date(data.client.created_at).toLocaleDateString('es-ES')}
      </p>
    </div>

    {#if payStatus !== 'sin_cuota'}
      <div class="text-right flex-shrink-0">
        <span class="text-[11px] px-2 py-1 rounded-full {payLabel.cls}">{payLabel.text}</span>
        {#if data.info?.paid_until}
          <p class="text-[11px] text-text-mute mt-1.5">
            Pagado hasta {new Date(data.info.paid_until + 'T00:00:00').toLocaleDateString('es-ES')}
          </p>
        {/if}
        <form method="POST" action="?/markPaid" use:enhance class="mt-1.5">
          <button type="submit" class="action-neutral">Registrar un mes</button>
        </form>
      </div>
    {/if}
  </div>

  <!-- Pestañas -->
  <div class="flex gap-1 border-b border-line overflow-x-auto">
    {#each [{ v: 'entrenos', l: 'Entrenos' }, { v: 'ficha', l: 'Ficha' }, { v: 'tecnica', l: 'Técnica' }, { v: 'historial', l: 'Historial' }] as t (t.v)}
      <button
        onclick={() => (tab = t.v as typeof tab)}
        class="px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap flex-shrink-0 -mb-px transition-colors flex items-center gap-2
          {tab === t.v
          ? 'border-accent text-text'
          : 'border-transparent text-text-mute hover:text-text'}"
      >
        {t.l}
        {#if t.v === 'tecnica' && pendingTechnique > 0}
          <span class="text-xs px-2 py-0.5 rounded-full bg-warning/15 text-warning"
            >{pendingTechnique}</span
          >
        {/if}
      </button>
    {/each}
  </div>

  {#if form?.error}
    <p role="alert" class="text-sm text-danger bg-danger/10 border border-danger/20 rounded-md p-3">
      {form.error}
    </p>
  {/if}
  {#if form?.success && form?.duplicated}
    <p
      aria-live="polite"
      class="text-sm text-success bg-success/10 border border-success/20 rounded-md p-3"
    >
      Entreno duplicado a {formatHumanDate(form.targetDate)}.
    </p>
  {/if}
  {#if form?.success && form?.programmed}
    <p
      aria-live="polite"
      class="text-sm text-success bg-success/10 border border-success/20 rounded-md p-3"
    >
      Programado: {form.created} entreno{form.created === 1 ? '' : 's'} creado{form.created === 1
        ? ''
        : 's'}{form.skipped > 0
        ? ` · ${form.skipped} día(s) omitido(s) porque ya tenían entreno`
        : ''}.
    </p>
  {/if}
  {#if form?.success && form?.infoSaved}
    <p
      aria-live="polite"
      class="text-sm text-success bg-success/10 border border-success/20 rounded-md p-3"
    >
      Ficha guardada.
    </p>
  {/if}
  {#if form?.success && form?.paidUntil}
    <p
      aria-live="polite"
      class="text-sm text-success bg-success/10 border border-success/20 rounded-md p-3"
    >
      Pago registrado. Ahora está al día hasta el {new Date(
        form.paidUntil + 'T00:00:00'
      ).toLocaleDateString('es-ES')}.
    </p>
  {/if}
  {#if form?.success && form?.commented}
    <p
      aria-live="polite"
      class="text-sm text-success bg-success/10 border border-success/20 rounded-md p-3"
    >
      Corrección guardada. Tu cliente la verá junto a su vídeo.
    </p>
  {/if}

  {#if tab === 'entrenos'}
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
                class="text-[11px] uppercase tracking-wider {day.isToday
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
                <div class="text-[9px] font-bold uppercase tracking-wide text-primary">Hoy</div>
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
        <button onclick={() => gotoMonth(-1)} class="btn-ghost text-sm py-2 px-4"
          >← Mes anterior</button
        >
        <div class="text-center">
          <div class="font-semibold capitalize">{monthLabel(data.monthISO)}</div>
          {#if !isCurrentMonth}
            <button onclick={() => gotoMonth(0)} class="text-xs text-primary hover:underline mt-0.5"
              >Mes actual</button
            >
          {/if}
        </div>
        <button onclick={() => gotoMonth(1)} class="btn-ghost text-sm py-2 px-4"
          >Mes siguiente →</button
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
                  <div class="text-[11px] font-medium truncate">{workout.title ?? 'Entreno'}</div>
                  <div class="text-[10px] text-text-mute">{workout.itemCount} ej.</div>
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
                <label
                  for="pg-start"
                  class="block text-xs uppercase tracking-wider text-text-mute mb-2">Desde</label
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
                <label
                  for="pg-end"
                  class="block text-xs uppercase tracking-wider text-text-mute mb-2">Hasta</label
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
  {:else if tab === 'ficha'}
    <!-- ===== FICHA DEL CLIENTE ===== -->
    <form
      method="POST"
      action="?/saveInfo"
      use:enhance={() => {
        savingInfo = true;
        return async ({ update }) => {
          await update();
          savingInfo = false;
        };
      }}
      class="card space-y-5 max-w-2xl"
    >
      <div class="grid sm:grid-cols-2 gap-4">
        <div class="sm:col-span-2">
          <label for="goals" class="block text-xs uppercase tracking-wider text-text-mute mb-2"
            >Objetivos</label
          >
          <textarea
            id="goals"
            name="goals"
            rows="2"
            maxlength="500"
            placeholder="ej: ganar masa muscular, preparar una carrera de 10k…"
            class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
            >{data.info?.goals ?? ''}</textarea
          >
        </div>
        <div class="sm:col-span-2">
          <label for="injuries" class="block text-xs uppercase tracking-wider text-text-mute mb-2"
            >Lesiones / limitaciones</label
          >
          <textarea
            id="injuries"
            name="injuries"
            rows="2"
            maxlength="500"
            placeholder="ej: hombro derecho delicado, evitar impacto en rodillas…"
            class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
            >{data.info?.injuries ?? ''}</textarea
          >
        </div>
        <div>
          <label for="freq" class="block text-xs uppercase tracking-wider text-text-mute mb-2"
            >Días de entreno / semana</label
          >
          <input
            id="freq"
            name="training_days_per_week"
            type="number"
            min="0"
            max="14"
            value={data.info?.training_days_per_week ?? ''}
            class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label for="level" class="block text-xs uppercase tracking-wider text-text-mute mb-2"
            >Nivel</label
          >
          <select
            id="level"
            name="level"
            bind:value={levelSel}
            class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md text-sm focus:border-primary"
          >
            <option value="">Sin especificar</option>
            {#each LEVELS as l (l.value)}<option value={l.value}>{l.label}</option>{/each}
          </select>
        </div>
        <div>
          <label for="height" class="block text-xs uppercase tracking-wider text-text-mute mb-2"
            >Altura (cm)</label
          >
          <input
            id="height"
            name="height_cm"
            type="number"
            min="50"
            max="260"
            value={data.info?.height_cm ?? ''}
            class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label for="birth" class="block text-xs uppercase tracking-wider text-text-mute mb-2"
            >Fecha de nacimiento</label
          >
          <input
            id="birth"
            name="birth_date"
            type="date"
            value={data.info?.birth_date ?? ''}
            class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          {#if ageFrom(data.info?.birth_date)}
            <p class="text-xs text-text-mute mt-1">{ageFrom(data.info?.birth_date)} años</p>
          {/if}
        </div>
        <div class="sm:col-span-2 border-t border-text-mute/10 pt-4">
          <p class="text-xs uppercase tracking-wider text-text-mute mb-3">Cuota</p>
          <div class="grid sm:grid-cols-2 gap-4">
            <div>
              <label for="fee" class="block text-xs uppercase tracking-wider text-text-mute mb-2">
                Cuota mensual (€)
              </label>
              <input
                id="fee"
                name="fee_amount"
                type="number"
                min="0"
                step="1"
                value={data.info?.fee_amount ?? ''}
                placeholder="ej: 120"
                class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label
                for="paid-until"
                class="block text-xs uppercase tracking-wider text-text-mute mb-2"
              >
                Pagado hasta
              </label>
              <input
                id="paid-until"
                name="paid_until"
                type="date"
                value={data.info?.paid_until ?? ''}
                class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>

        <div class="sm:col-span-2">
          <label for="notes" class="block text-xs uppercase tracking-wider text-text-mute mb-2">
            Notas privadas <span class="normal-case tracking-normal text-text-mute/70"
              >(solo tú las ves)</span
            >
          </label>
          <textarea
            id="notes"
            name="coach_notes"
            rows="3"
            maxlength="1000"
            placeholder="Cualquier apunte para ti: preferencias, contexto, recordatorios…"
            class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
            >{data.info?.coach_notes ?? ''}</textarea
          >
        </div>
      </div>
      <button type="submit" disabled={savingInfo} class="btn-primary">
        {savingInfo ? 'Guardando…' : 'Guardar ficha'}
      </button>
    </form>
  {:else if tab === 'tecnica'}
    <!-- ===== VÍDEOS DE TÉCNICA ===== -->
    {#if data.technique.length === 0}
      <div class="card text-center py-16">
        <div class="text-5xl mb-4" aria-hidden="true">🎥</div>
        <h2 class="text-xl font-semibold mb-2">Sin vídeos de técnica</h2>
        <p class="text-sm text-text-mute max-w-md mx-auto">
          Cuando {data.client.full_name?.split(' ')[0] ?? 'tu cliente'} suba un vídeo ejecutando un ejercicio,
          aparecerá aquí para que le corrijas la postura.
        </p>
      </div>
    {:else}
      <div class="space-y-4">
        {#each data.technique as g (g.exerciseId)}
          {@const newest = g.latest ?? g.first}
          <div class="card space-y-4">
            <div class="flex items-center justify-between gap-3">
              <h2 class="font-semibold">{g.exerciseName}</h2>
              {#if g.pending}
                <span
                  class="text-[11px] px-2 py-0.5 rounded-full bg-warning/15 text-warning whitespace-nowrap"
                >
                  Por revisar
                </span>
              {:else}
                <span
                  class="text-[11px] px-2 py-0.5 rounded-full bg-success/15 text-success whitespace-nowrap"
                >
                  Revisado
                </span>
              {/if}
            </div>

            <!-- Antes / después -->
            <div class="grid {g.latest && g.first ? 'sm:grid-cols-2' : ''} gap-3">
              {#each [{ v: g.first, label: g.latest ? 'Primer vídeo' : 'Vídeo', k: 'f' }, { v: g.latest, label: 'Más reciente', k: 'l' }] as slot (slot.k)}
                {#if slot.v}
                  <div class="space-y-1.5">
                    <div class="flex items-center justify-between gap-2">
                      <span class="text-xs uppercase tracking-wider text-text-mute"
                        >{slot.label}</span
                      >
                      <span class="text-[11px] text-text-mute">
                        {new Date(slot.v.created_at).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                    {#if slot.v.url}
                      <!-- svelte-ignore a11y_media_has_caption -->
                      <video
                        src={slot.v.url}
                        controls
                        playsinline
                        preload="metadata"
                        class="w-full max-h-80 rounded-md bg-black"
                      ></video>
                    {:else}
                      <p class="text-xs text-text-mute italic">No se pudo cargar el vídeo.</p>
                    {/if}
                  </div>
                {/if}
              {/each}
            </div>

            <!-- Corrección del coach sobre el vídeo más reciente -->
            {#if newest}
              <form
                method="POST"
                action="?/commentVideo"
                use:enhance
                class="border-t border-text-mute/10 pt-3 space-y-2"
              >
                <input type="hidden" name="video_id" value={newest.id} />
                <label
                  for="cmt-{g.exerciseId}"
                  class="block text-xs uppercase tracking-wider text-text-mute"
                >
                  Corrección para tu cliente
                </label>
                <textarea
                  id="cmt-{g.exerciseId}"
                  name="comment"
                  rows="2"
                  maxlength="600"
                  placeholder="ej: baja más la cadera y mantén la espalda neutra…"
                  class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md text-sm
                       focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
                  >{newest.coach_comment ?? ''}</textarea
                >
                <div class="flex items-center justify-between gap-3">
                  <span class="text-[11px] text-text-mute">
                    {#if newest.coach_comment_at}
                      Comentado el {new Date(newest.coach_comment_at).toLocaleDateString('es-ES')}
                    {/if}
                  </span>
                  <button type="submit" class="action-primary">Guardar corrección</button>
                </div>
              </form>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  {:else}
    <!-- ===== HISTORIAL ===== -->
    <div class="space-y-8">
      <section class="space-y-3">
        <h2 class="text-lg font-semibold">Entrenos anteriores</h2>
        {#if data.historyWorkouts.length === 0}
          <p class="text-sm text-text-mute">Todavía no hay entrenos pasados.</p>
        {:else}
          <div class="space-y-2">
            {#each data.historyWorkouts as w (w.id)}
              <a
                href="/clients/{data.client.id}/workouts/{w.date}"
                class="card p-3 flex items-center justify-between gap-3"
              >
                <div class="min-w-0">
                  <div class="font-medium text-sm truncate flex items-center gap-1.5">
                    {#if w.done}<span class="text-success" title="Completado">✓</span>{/if}
                    {w.title ?? 'Entreno'}
                  </div>
                  <div class="text-xs text-text-mute mt-0.5">
                    {formatHumanDate(w.date)} · {w.itemCount} ej.
                  </div>
                </div>
                <span class="text-xs flex-shrink-0 {w.done ? 'text-success' : 'text-text-mute'}">
                  {w.done ? 'Hecho' : 'Sin registrar'}
                </span>
              </a>
            {/each}
          </div>
        {/if}
      </section>

      <section class="space-y-3">
        <h2 class="text-lg font-semibold">Citas anteriores</h2>
        {#if data.historySessions.length === 0}
          <p class="text-sm text-text-mute">No hay citas pasadas.</p>
        {:else}
          <div class="space-y-1.5">
            {#each data.historySessions as s (s.id)}
              <div
                class="flex items-center justify-between gap-3 text-sm py-2 border-b border-line"
              >
                <span class="capitalize text-text-mute">{fmtDateTime(s.starts_at)}</span>
                <span class="text-xs px-2 py-0.5 rounded-full {sessionStatusClass[s.status] ?? ''}">
                  {sessionStatusLabel[s.status] ?? s.status}
                </span>
              </div>
            {/each}
          </div>
        {/if}
      </section>
    </div>
  {/if}
</div>
