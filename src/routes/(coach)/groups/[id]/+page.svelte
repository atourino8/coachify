<script lang="ts">
  import { enhance } from '$app/forms';

  let { data, form } = $props();

  let showAdd = $state(false);
  let selected = $state<string[]>([]);
  let adding = $state(false);

  // Programación masiva
  let pgTemplate = $state('');
  let pgStart = $state('');
  let pgEnd = $state('');
  let pgDays = $state<number[]>([1, 3, 5]);
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
  function toggleClient(id: string) {
    selected = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
  }
</script>

<svelte:head>
  <title>{data.group.name} · Treno</title>
</svelte:head>

<div class="space-y-8">
  <div>
    <a href="/groups" class="text-sm text-text-mute hover:text-text">← Grupos</a>
    <h1 class="text-2xl sm:text-3xl font-display font-semibold tracking-tight mt-3">
      {data.group.name}
    </h1>
    <p class="text-text-mute text-sm mt-1">
      {data.members.length}
      {data.members.length === 1 ? 'persona' : 'personas'}{data.group.company
        ? ' · ' + data.group.company
        : ''}
    </p>
  </div>

  {#if form?.error}
    <p role="alert" class="text-sm text-danger bg-danger/10 border border-danger/20 rounded-md p-3">
      {form.error}
    </p>
  {/if}
  {#if form?.success && form?.added}
    <p
      aria-live="polite"
      class="text-sm text-success bg-success/10 border border-success/20 rounded-md p-3"
    >
      {form.added}
      {form.added === 1 ? 'persona añadida' : 'personas añadidas'} al grupo.
    </p>
  {/if}
  {#if form?.success && form?.programmedGroup}
    <p
      aria-live="polite"
      class="text-sm text-success bg-success/10 border border-success/20 rounded-md p-3"
    >
      Programado para {form.clients}
      {form.clients === 1 ? 'persona' : 'personas'}:
      {form.created}
      {form.created === 1 ? 'entreno creado' : 'entrenos creados'}{form.skipped > 0
        ? ` · ${form.skipped} omitidos porque ya tenían entreno`
        : ''}{form.failedCount > 0 ? ` · ${form.failedCount} con error` : ''}.
    </p>
  {/if}

  <!-- ===== PROGRAMAR A TODO EL GRUPO ===== -->
  {#if data.templates.length > 0 && data.members.length > 0}
    <div class="card space-y-4">
      <div>
        <h2 class="font-semibold">Programar a todo el grupo</h2>
        <p class="text-xs text-text-mute mt-0.5">
          Asigna el mismo entrenamiento a las {data.members.length} personas del grupo de una vez. Después
          puedes ajustar a cualquiera individualmente.
        </p>
      </div>

      <form
        method="POST"
        action="?/programGroup"
        use:enhance={() => {
          pgSubmitting = true;
          return async ({ update }) => {
            await update();
            pgSubmitting = false;
          };
        }}
        class="space-y-4 border-t border-text-mute/10 pt-4"
      >
        <div class="grid sm:grid-cols-3 gap-3">
          <div class="sm:col-span-3">
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
              {#each data.templates as t (t.id)}
                <option value={t.id}>{t.name} ({t.itemCount} ej.)</option>
              {/each}
            </select>
          </div>
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
          <div>
            <span class="block text-xs uppercase tracking-wider text-text-mute mb-2">Días</span>
            <div class="flex gap-1">
              {#each WEEKDAYS as d (d.v)}
                <button
                  type="button"
                  onclick={() => toggleDay(d.v)}
                  class="w-8 h-9 rounded-md text-sm font-medium transition-colors {pgDays.includes(
                    d.v
                  )
                    ? 'bg-primary text-white'
                    : 'bg-bg border border-text-mute/20 text-text-mute hover:text-text'}"
                >
                  {d.label}
                </button>
              {/each}
            </div>
            {#each pgDays as d}<input type="hidden" name="weekdays" value={d} />{/each}
          </div>
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
          {pgSubmitting ? 'Programando…' : `Programar a ${data.members.length} personas`}
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
    </div>
  {/if}

  <!-- ===== MIEMBROS ===== -->
  <section class="space-y-3">
    <div class="flex items-center justify-between gap-4">
      <h2 class="text-lg font-semibold">Personas del grupo</h2>
      <div class="flex items-center gap-3">
        <a
          href="/clients?invite=1&group={data.group.id}"
          class="text-sm text-primary hover:underline whitespace-nowrap"
        >
          + Invitar nuevas
        </a>
        {#if data.available.length > 0}
          <button onclick={() => (showAdd = !showAdd)} class="action-neutral">
            {showAdd ? 'Cerrar' : 'Añadir existentes'}
          </button>
        {/if}
      </div>
    </div>

    {#if showAdd}
      <form
        method="POST"
        action="?/addMembers"
        use:enhance={() => {
          adding = true;
          return async ({ update }) => {
            await update();
            adding = false;
            selected = [];
            showAdd = false;
          };
        }}
        class="card space-y-3"
      >
        <p class="text-xs uppercase tracking-wider text-text-mute">
          Clientes que aún no están en el grupo
        </p>
        <div class="grid sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
          {#each data.available as c (c.id)}
            <label
              class="flex items-center gap-2 text-sm bg-bg border border-text-mute/15 rounded-md px-3 py-2 cursor-pointer"
            >
              <input
                type="checkbox"
                name="client_ids"
                value={c.id}
                checked={selected.includes(c.id)}
                onchange={() => toggleClient(c.id)}
              />
              <span class="truncate">{c.name}</span>
            </label>
          {/each}
        </div>
        <button type="submit" disabled={adding || selected.length === 0} class="btn-primary">
          {adding ? 'Añadiendo…' : `Añadir ${selected.length || ''}`}
        </button>
        {#if selected.length === 0}
          <p class="text-xs text-text-mute">Marca al menos una persona de la lista.</p>
        {/if}
      </form>
    {/if}

    {#if data.members.length === 0}
      <div class="card text-center py-12">
        <p class="text-sm text-text-mute max-w-md mx-auto">
          Este grupo aún no tiene a nadie. Invita nuevas personas o añade clientes que ya tengas.
        </p>
      </div>
    {:else}
      <div class="border-t border-line">
        {#each data.members as m (m.id)}
          <div class="row">
            <a href="/clients/{m.id}" class="flex items-center gap-3 flex-1 min-w-0">
              <span
                class="w-8 h-8 rounded-full bg-surface-2 grid place-items-center text-xs font-semibold text-text-mute flex-shrink-0"
              >
                {m.name.charAt(0).toUpperCase()}
              </span>
              <span class="font-medium truncate">{m.name}</span>
            </a>
            <a href="/clients/{m.id}" class="text-xs text-accent hover:underline flex-shrink-0"
              >Ver ficha</a
            >
            <form method="POST" action="?/removeMember" use:enhance class="flex-shrink-0">
              <input type="hidden" name="client_id" value={m.id} />
              <button
                type="submit"
                class="text-xs text-text-mute hover:text-danger transition-colors"
              >
                Quitar
              </button>
            </form>
          </div>
        {/each}
      </div>
    {/if}
  </section>
</div>
