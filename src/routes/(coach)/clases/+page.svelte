<script lang="ts">
  import { enhance } from '$app/forms';
  import { diaConSemana, hora } from '$lib/formato';
  import Icono from '$lib/components/Icono.svelte';

  let { data, form } = $props();

  let showForm = $state(false);
  let creating = $state(false);
  let verPasadas = $state(false);

  // Días marcados = alta en lote. Vacío = una clase suelta, y entonces la
  // fecha de fin sobra: se oculta en vez de dejarla ahí sin efecto.
  let diasMarcados = $state<number[]>([]);
  const enLote = $derived(diasMarcados.length > 0);

  const DIAS = [
    { n: 1, label: 'L' },
    { n: 2, label: 'M' },
    { n: 3, label: 'X' },
    { n: 4, label: 'J' },
    { n: 5, label: 'V' },
    { n: 6, label: 'S' },
    { n: 0, label: 'D' }
  ];

  function alternarDia(n: number) {
    diasMarcados = diasMarcados.includes(n)
      ? diasMarcados.filter((d) => d !== n)
      : [...diasMarcados, n];
  }
</script>

<svelte:head>
  <title>Clases · Treno</title>
</svelte:head>

{#snippet fila(c: (typeof data.proximas)[number])}
  {@const libres = Math.max(0, c.capacity - c.ocupadas)}
  <a href="/clases/{c.id}" class="row-link">
    <div class="flex-1 min-w-0">
      <div class="font-medium truncate">
        {c.title}
        {#if c.status === 'cancelled'}
          <span class="text-xs text-danger">· cancelada</span>
        {/if}
      </div>
      <div class="text-xs text-text-mute truncate">
        {diaConSemana(c.starts_at)} · {hora(c.starts_at)}–{hora(c.ends_at)}
        {#if c.grupo}· solo {c.grupo}{/if}
        {#if c.location}· {c.location}{/if}
      </div>
    </div>

    <!-- El aforo es lo que se viene a mirar, así que va en tabular-nums para
         que la columna no baile de fila en fila. -->
    <span
      class="text-xs tabular-nums flex-shrink-0 {libres === 0 ? 'text-warning' : 'text-text-mute'}"
    >
      {c.ocupadas}/{c.capacity}
    </span>
    {#if c.enEspera > 0}
      <span class="text-xs px-2 py-0.5 rounded-full bg-surface-2 text-text-mute flex-shrink-0">
        +{c.enEspera} en espera
      </span>
    {/if}
    <span class="text-text-mute text-sm flex-shrink-0">→</span>
  </a>
{/snippet}

<div class="space-y-8">
  <div class="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
    <div class="min-w-0">
      <span class="eyebrow">Agenda</span>
      <h1 class="text-2xl sm:text-3xl font-display font-semibold tracking-tight mt-2">Clases</h1>
      <p class="text-text-mute text-sm mt-2 max-w-lg">
        Clases con plazas limitadas. Tus clientes las ven y se apuntan solos hasta que se llenan.
      </p>
    </div>
    <button onclick={() => (showForm = !showForm)} class="btn-primary whitespace-nowrap">
      {showForm ? 'Cancelar' : '+ Nueva clase'}
    </button>
  </div>

  {#if form?.error}
    <p role="alert" class="text-sm text-danger bg-danger/10 border border-danger/20 rounded-md p-3">
      {form.error}
    </p>
  {/if}
  {#if form?.success && form?.created}
    <p
      aria-live="polite"
      class="text-sm text-success bg-success/10 border border-success/20 rounded-md p-3"
    >
      {form.created === 1 ? 'Clase creada.' : `${form.created} clases creadas.`}
    </p>
  {/if}

  {#if showForm}
    <form
      method="POST"
      action="?/create"
      class="card space-y-5"
      use:enhance={() => {
        creating = true;
        return async ({ update }) => {
          creating = false;
          await update();
        };
      }}
    >
      <div class="grid gap-4 sm:grid-cols-2">
        <div class="sm:col-span-2">
          <label for="title" class="block text-xs uppercase tracking-wider text-text-mute mb-2">
            Nombre
          </label>
          <input
            id="title"
            name="title"
            required
            maxlength="80"
            placeholder="HIIT, Espalda sana, Iniciación…"
            class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <label
            for="start_date"
            class="block text-xs uppercase tracking-wider text-text-mute mb-2"
          >
            {enLote ? 'Desde' : 'Día'}
          </label>
          <input
            id="start_date"
            name="start_date"
            type="date"
            required
            class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div class:invisible={!enLote}>
          <label for="end_date" class="block text-xs uppercase tracking-wider text-text-mute mb-2">
            Hasta
          </label>
          <input
            id="end_date"
            name="end_date"
            type="date"
            class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <label
            for="start_time"
            class="block text-xs uppercase tracking-wider text-text-mute mb-2"
          >
            Empieza
          </label>
          <input
            id="start_time"
            name="start_time"
            type="time"
            required
            class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label for="end_time" class="block text-xs uppercase tracking-wider text-text-mute mb-2">
            Acaba
          </label>
          <input
            id="end_time"
            name="end_time"
            type="time"
            required
            class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <label for="capacity" class="block text-xs uppercase tracking-wider text-text-mute mb-2">
            Plazas
          </label>
          <input
            id="capacity"
            name="capacity"
            type="number"
            min="1"
            max="200"
            value="10"
            required
            class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md text-sm tabular-nums focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label for="location" class="block text-xs uppercase tracking-wider text-text-mute mb-2">
            Dónde
          </label>
          <input
            id="location"
            name="location"
            maxlength="80"
            placeholder="Sala 2, parque…"
            class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {#if data.grupos.length > 0}
          <div class="sm:col-span-2">
            <label
              for="group_id"
              class="block text-xs uppercase tracking-wider text-text-mute mb-2"
            >
              Quién la ve
            </label>
            <select
              id="group_id"
              name="group_id"
              class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Todos mis clientes</option>
              {#each data.grupos as g (g.id)}
                <option value={g.id}>Solo {g.name}</option>
              {/each}
            </select>
          </div>
        {/if}

        <fieldset class="sm:col-span-2">
          <legend class="block text-xs uppercase tracking-wider text-text-mute mb-2">
            Repetir estos días
          </legend>
          <div class="flex gap-2 flex-wrap">
            {#each DIAS as d (d.n)}
              <label
                class="w-10 h-10 grid place-items-center rounded-full border cursor-pointer text-sm transition-colors
                  {diasMarcados.includes(d.n)
                  ? 'border-accent bg-accent/10 text-text'
                  : 'border-line text-text-mute hover:text-text'}"
              >
                <input
                  type="checkbox"
                  name="weekdays"
                  value={d.n}
                  checked={diasMarcados.includes(d.n)}
                  onchange={() => alternarDia(d.n)}
                  class="sr-only"
                />
                {d.label}
                <span class="sr-only">
                  {['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'][d.n]}
                </span>
              </label>
            {/each}
          </div>
          <p class="text-xs text-text-mute mt-2">
            {enLote
              ? 'Se creará una clase por cada día marcado entre las dos fechas. Cada una es independiente: editar una no toca a las demás.'
              : 'Sin marcar nada se crea una sola clase.'}
          </p>
        </fieldset>

        <div class="sm:col-span-2">
          <label for="notes" class="block text-xs uppercase tracking-wider text-text-mute mb-2">
            Notas <span class="normal-case tracking-normal text-text-mute/70">(las ven ellos)</span>
          </label>
          <textarea
            id="notes"
            name="notes"
            rows="2"
            maxlength="500"
            placeholder="Trae esterilla. Nivel iniciación."
            class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md text-sm resize-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          ></textarea>
        </div>
      </div>

      <button type="submit" disabled={creating} class="btn-primary">
        {creating ? 'Creando…' : enLote ? 'Crear las clases' : 'Crear la clase'}
      </button>
    </form>
  {/if}

  <section class="space-y-3">
    <h2 class="text-sm uppercase tracking-wider text-text-mute">
      Próximas ({data.proximas.length})
    </h2>
    {#if data.proximas.length === 0}
      <div class="card text-center py-12">
        <div class="mx-auto w-10 h-10 text-text-mute mb-3">
          <Icono nombre="agenda" />
        </div>
        <h3 class="font-semibold mb-2">No tienes clases programadas</h3>
        <p class="text-sm text-text-mute max-w-md mx-auto">
          Una clase es un día, una hora y un número de plazas. Tus clientes la ven en sus Citas y se
          apuntan hasta que se llena.
        </p>
      </div>
    {:else}
      <div class="border-t border-line">
        {#each data.proximas as c (c.id)}
          {@render fila(c)}
        {/each}
      </div>
    {/if}
  </section>

  {#if data.pasadas.length > 0}
    <section class="space-y-3">
      <!-- Cerrado por defecto: lo pasado no se consulta a diario y con tres
           meses de clases sepulta a las próximas. -->
      <button
        onclick={() => (verPasadas = !verPasadas)}
        aria-expanded={verPasadas}
        class="text-sm uppercase tracking-wider text-text-mute hover:text-text transition-colors"
      >
        Pasadas ({data.pasadas.length})
        <span aria-hidden="true">{verPasadas ? '−' : '+'}</span>
      </button>
      {#if verPasadas}
        <div class="border-t border-line">
          {#each data.pasadas as c (c.id)}
            {@render fila(c)}
          {/each}
        </div>
      {/if}
    </section>
  {/if}
</div>
