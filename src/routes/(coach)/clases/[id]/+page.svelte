<script lang="ts">
  import { enhance } from '$app/forms';
  import ConfirmModal from '$lib/components/ConfirmModal.svelte';
  import { diaLargo, hora } from '$lib/formato';
  import { estadoDeClase } from '$lib/clases';

  let { data, form } = $props();

  const estado = $derived(estadoDeClase(data.clase, data.apuntados.length));
  const libres = $derived(estado.libres);

  let editandoAforo = $state(false);
  let verBajas = $state(false);

  let confirmarQuitar = $state(false);
  let aQuitar = $state<{ client_id: string; nombre: string }>({ client_id: '', nombre: '' });
  function preguntarQuitar(client_id: string, nombre: string) {
    aQuitar = { client_id, nombre };
    confirmarQuitar = true;
  }

  let confirmarCancelar = $state(false);
</script>

<svelte:head>
  <title>{data.clase.title} · Treno</title>
</svelte:head>

{#snippet persona(p: { client_id: string; nombre: string; faltas: number }, quitable: boolean)}
  <div class="row">
    <div
      class="w-9 h-9 rounded-full bg-surface-2 grid place-items-center text-sm font-semibold text-text-mute flex-shrink-0"
    >
      {p.nombre.charAt(0).toUpperCase()}
    </div>
    <div class="flex-1 min-w-0">
      <a href="/clients/{p.client_id}" class="font-medium truncate hover:text-primary">
        {p.nombre}
      </a>
    </div>
    {#if p.faltas > 0}
      <!-- El número va aquí y no en un panel aparte porque el momento en que
           importa es este: al mirar quién viene. -->
      <span
        class="text-xs px-2 py-0.5 rounded-full bg-warning/15 text-warning flex-shrink-0"
        title="Ha soltado la plaza tarde {p.faltas} {p.faltas === 1
          ? 'vez'
          : 'veces'} en los últimos meses"
      >
        {p.faltas}
        {p.faltas === 1 ? 'falta' : 'faltas'}
      </span>
    {/if}
    {#if quitable}
      <button
        type="button"
        onclick={() => preguntarQuitar(p.client_id, p.nombre)}
        class="action-neutral flex-shrink-0"
      >
        Quitar
      </button>
    {/if}
  </div>
{/snippet}

<div class="space-y-8">
  <div>
    <a href="/clases" class="text-sm text-text-mute hover:text-text transition-colors">
      ← Clases
    </a>
    <div class="flex flex-wrap items-end justify-between gap-x-4 gap-y-3 mt-2">
      <div class="min-w-0">
        <span class="eyebrow">Clase</span>
        <h1 class="text-2xl sm:text-3xl font-display font-semibold tracking-tight mt-2">
          {data.clase.title}
        </h1>
        <p class="text-text-mute text-sm mt-2">
          {diaLargo(data.clase.starts_at)} · {hora(data.clase.starts_at)}–{hora(data.clase.ends_at)}
          {#if data.clase.location}· {data.clase.location}{/if}
          {#if data.clase.grupo}· solo {data.clase.grupo}{/if}
        </p>
      </div>
      <div class="text-right">
        <div class="text-2xl font-semibold tabular-nums">
          {data.apuntados.length}/{data.clase.capacity}
        </div>
        <div class="text-xs text-text-mute">
          {#if estado.cancelada}
            clase cancelada
          {:else if libres === 0}
            completa
          {:else}
            {libres}
            {libres === 1 ? 'plaza libre' : 'plazas libres'}
          {/if}
        </div>
      </div>
    </div>
  </div>

  {#if form?.error}
    <p role="alert" class="text-sm text-danger bg-danger/10 border border-danger/20 rounded-md p-3">
      {form.error}
    </p>
  {/if}
  {#if form?.success}
    <p
      aria-live="polite"
      class="text-sm text-success bg-success/10 border border-success/20 rounded-md p-3"
    >
      {#if form.quitado}
        Fuera de la clase. Si había lista de espera, ha entrado el primero.
      {:else if form.aforo}
        Aforo cambiado. Nadie de la lista de espera sube solo: métele tú si quieres.
      {:else if form.cancelada}
        Clase cancelada. Los apuntados la verán marcada como cancelada.
      {:else if form.reabierta}
        Clase reabierta.
      {/if}
    </p>
  {/if}

  {#if estado.cancelada}
    <div class="card border-danger/30 flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm text-text-mute">Esta clase está cancelada. Nadie puede apuntarse.</p>
      <form method="POST" action="?/reabrir" use:enhance>
        <button type="submit" class="action-neutral">Reabrir</button>
      </form>
    </div>
  {/if}

  {#if data.clase.notes}
    <div class="card">
      <h2 class="text-xs uppercase tracking-wider text-text-mute mb-2">Notas</h2>
      <p class="text-sm whitespace-pre-line">{data.clase.notes}</p>
    </div>
  {/if}

  <section class="space-y-3">
    <div class="flex items-center justify-between gap-3">
      <h2 class="text-sm uppercase tracking-wider text-text-mute">
        Apuntados ({data.apuntados.length})
      </h2>
      {#if !editandoAforo}
        <button
          onclick={() => (editandoAforo = true)}
          class="text-sm text-text-mute hover:text-text"
        >
          Cambiar aforo
        </button>
      {/if}
    </div>

    {#if editandoAforo}
      <form
        method="POST"
        action="?/aforo"
        class="card flex flex-wrap items-end gap-3"
        use:enhance={() => {
          return async ({ update }) => {
            editandoAforo = false;
            await update();
          };
        }}
      >
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
            value={data.clase.capacity}
            class="w-28 px-4 py-3 bg-bg border border-text-mute/20 rounded-md text-sm tabular-nums focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <button type="submit" class="btn-primary">Guardar</button>
        <button type="button" onclick={() => (editandoAforo = false)} class="action-neutral">
          Cancelar
        </button>
        <p class="text-xs text-text-mute w-full">
          Bajar el aforo no echa a nadie: solo impide que entren más hasta que se vacíe.
        </p>
      </form>
    {/if}

    {#if data.apuntados.length === 0}
      <p class="card text-sm text-text-mute text-center py-8">Todavía no se ha apuntado nadie.</p>
    {:else}
      <div class="border-t border-line">
        {#each data.apuntados as p (p.id)}
          {@render persona(p, !estado.pasada)}
        {/each}
      </div>
    {/if}
  </section>

  {#if data.enEspera.length > 0}
    <section class="space-y-3">
      <h2 class="text-sm uppercase tracking-wider text-text-mute">
        Lista de espera ({data.enEspera.length})
      </h2>
      <p class="text-xs text-text-mute">
        Por orden de petición. Cuando alguien suelta su plaza, entra el primero automáticamente.
      </p>
      <div class="border-t border-line">
        {#each data.enEspera as p (p.id)}
          {@render persona(p, !estado.pasada)}
        {/each}
      </div>
    </section>
  {/if}

  {#if data.bajas.length > 0}
    <section class="space-y-3">
      <button
        onclick={() => (verBajas = !verBajas)}
        aria-expanded={verBajas}
        class="text-sm uppercase tracking-wider text-text-mute hover:text-text transition-colors"
      >
        Se salieron ({data.bajas.length})
        <span aria-hidden="true">{verBajas ? '−' : '+'}</span>
      </button>
      {#if verBajas}
        <div class="border-t border-line">
          {#each data.bajas as p (p.id)}
            {@render persona(p, false)}
          {/each}
        </div>
      {/if}
    </section>
  {/if}

  <div class="flex flex-wrap gap-3 pt-4 border-t border-line">
    {#if !estado.cancelada}
      <button onclick={() => (confirmarCancelar = true)} class="action-danger">
        Cancelar la clase
      </button>
    {/if}
    {#if data.apuntados.length === 0 && data.enEspera.length === 0}
      <!-- Borrar solo mientras no haya nadie dentro. Con gente apuntada, lo
           correcto es cancelarla: borrarla la haría desaparecer de sus Citas
           sin explicación. -->
      <form method="POST" action="?/borrar" use:enhance>
        <button type="submit" class="action-neutral">Borrar</button>
      </form>
    {/if}
  </div>
</div>

<ConfirmModal
  bind:open={confirmarQuitar}
  action="?/quitar"
  fields={{ client_id: aQuitar.client_id }}
  title="Quitar a {aQuitar.nombre}"
  message="Se queda fuera de esta clase. Si hay lista de espera, entrará el primero en su lugar. No le cuenta como falta: la decisión es tuya, no suya."
  confirmLabel="Quitar"
/>

<ConfirmModal
  bind:open={confirmarCancelar}
  action="?/cancelar"
  title="Cancelar la clase"
  message="Nadie podrá apuntarse y los que están la verán marcada como cancelada. Puedes reabrirla después."
  confirmLabel="Cancelar la clase"
/>
