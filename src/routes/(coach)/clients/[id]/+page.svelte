<script lang="ts">
  /**
   * Ficha del cliente.
   *
   * Esto tenía 1095 líneas y hacía de todo: calendario, ficha, progreso,
   * técnica, historial y cobros. Cada retoque obligaba a abrir un fichero
   * enorme y buscar, y las cinco pestañas compartían un bloque de estado donde
   * no se veía qué era de quién.
   *
   * Ahora esta página solo hace de MARCO: cabecera del cliente, estado de pago,
   * pestañas y mensajes de resultado. Cada pestaña es un fichero, y el estado
   * que solo usa una vive dentro de ella.
   *
   * Los paneles NO son componentes reutilizables y no pretenden serlo: son
   * secciones de esta pantalla. Por eso reciben `data` entera en vez de un
   * contrato de props que habría que rehacer cada vez que cambie la consulta.
   */
  import { enhance } from '$app/forms';
  import { page } from '$app/state';
  import { fechaCorta } from '$lib/formato';
  import { todayISOLocal, formatHumanDate } from '$lib/week';
  import { paymentStatus } from '$lib/supabase/types';

  import CobroRapido from './CobroRapido.svelte';
  import Avatar from '$lib/components/Avatar.svelte';
  import PanelEntrenos from './PanelEntrenos.svelte';
  import PanelFicha from './PanelFicha.svelte';
  import PanelProgreso from './PanelProgreso.svelte';
  import PanelTecnica from './PanelTecnica.svelte';
  import PanelHistorial from './PanelHistorial.svelte';

  let { data, form } = $props();

  // La pestaña inicial se puede fijar por URL (?tab=tecnica) para que los
  // avisos aterricen directamente donde está la acción.
  type Tab = 'entrenos' | 'ficha' | 'progreso' | 'tecnica' | 'historial';
  const TABS: Tab[] = ['entrenos', 'ficha', 'progreso', 'tecnica', 'historial'];
  const inicial = page.url.searchParams.get('tab') as Tab | null;
  // svelte-ignore state_referenced_locally
  let tab = $state<Tab>(inicial && TABS.includes(inicial) ? inicial : 'entrenos');

  // Nº de ejercicios con vídeo sin revisar, para el distintivo de la pestaña.
  const pendingTechnique = $derived(data.technique.filter((t) => t.pending).length);

  const payStatus = $derived(paymentStatus(data.info, todayISOLocal()));
  const PAY_LABELS: Record<string, { text: string; cls: string }> = {
    al_dia: { text: 'Al día', cls: 'bg-success/15 text-success' },
    vence_pronto: { text: 'Vence pronto', cls: 'bg-warning/15 text-warning' },
    vencido: { text: 'Pago vencido', cls: 'bg-danger/15 text-danger' },
    sin_cuota: { text: 'Sin cuota', cls: 'bg-surface-2 text-text-mute' }
  };
  const payLabel = $derived(PAY_LABELS[payStatus]);
  let registrandoCobro = $state(false);
  let cambiandoFoto = $state(false);
  let subiendoFoto = $state(false);
</script>

<svelte:head>
  <title>{data.client.full_name} · Treno</title>
</svelte:head>

<div class="space-y-8">
  <div class="flex flex-wrap items-start justify-between gap-4">
    <div class="min-w-0">
      <a href="/clients" class="text-sm text-text-mute hover:text-text">← Clientes</a>

      <!-- La foto y el nombre en la misma línea, como en el wireframe. El
           formulario de cambiarla se despliega al pulsar la foto: está a mano
           sin ocupar sitio permanente en una cabecera que ya lleva el estado
           de pago, las faltas y cinco pestañas. -->
      <div class="flex items-center gap-3 mt-3">
        <button
          type="button"
          onclick={() => (cambiandoFoto = !cambiandoFoto)}
          title="Cambiar la foto"
          class="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <Avatar url={data.avatar} nombre={data.client.full_name} tamano="lg" />
          <span class="sr-only">Cambiar la foto de {data.client.full_name}</span>
        </button>
        <h1 class="text-2xl sm:text-3xl font-display font-semibold tracking-tight">
          {data.client.full_name}
        </h1>
      </div>
      <p class="text-text-mute text-sm mt-1">
        Cliente desde {fechaCorta(data.client.created_at)}
      </p>
      {#if data.faltas > 0}
        <!-- Aquí y no en una pestaña: es contexto para leer todo lo demás, no
             una sección que se visite. -->
        <p class="text-xs text-warning mt-2">
          Ha soltado la plaza de una clase tarde {data.faltas}
          {data.faltas === 1 ? 'vez' : 'veces'} en los últimos meses.
        </p>
      {/if}
    </div>

    {#if payStatus !== 'sin_cuota'}
      <div class="text-right flex-shrink-0">
        <span class="text-2xs px-2 py-1 rounded-full {payLabel.cls}">{payLabel.text}</span>
        {#if data.info?.paid_until}
          <p class="text-2xs text-text-mute mt-1.5">
            Pagado hasta {fechaCorta(data.info.paid_until)}
          </p>
        {/if}
        <button
          type="button"
          onclick={() => (registrandoCobro = !registrandoCobro)}
          class="action-neutral mt-1.5"
        >
          {registrandoCobro ? 'Cancelar' : 'Registrar cobro'}
        </button>
      </div>
    {/if}
  </div>

  {#if cambiandoFoto}
    <form
      method="POST"
      action="?/foto"
      enctype="multipart/form-data"
      class="card flex flex-wrap items-end gap-3"
      use:enhance={() => {
        subiendoFoto = true;
        return async ({ update }) => {
          subiendoFoto = false;
          cambiandoFoto = false;
          await update();
        };
      }}
    >
      <div class="flex-1 min-w-[14rem]">
        <label for="foto" class="block text-xs uppercase tracking-wider text-text-mute mb-2">
          Foto de {data.client.full_name}
        </label>
        <input
          id="foto"
          name="foto"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          class="block w-full text-sm text-text-mute file:mr-3 file:py-2 file:px-4
                 file:rounded-md file:border file:border-line file:bg-surface-2
                 file:text-text file:text-sm file:cursor-pointer"
        />
        <!-- Se dice que él también puede cambiarla: la foto es suya, y el
             entrenador la pone para no depender de que lo haga. -->
        <p class="text-2xs text-text-mute mt-2">
          Hasta 5 MB. Tu cliente puede cambiarla desde su perfil.
        </p>
      </div>
      <button type="submit" disabled={subiendoFoto} class="btn-primary">
        {subiendoFoto ? 'Subiendo…' : 'Guardar foto'}
      </button>
      <button type="button" onclick={() => (cambiandoFoto = false)} class="action-neutral">
        Cancelar
      </button>
    </form>
  {/if}

  <CobroRapido {data} {form} bind:abierto={registrandoCobro} />

  <!-- Pestañas -->
  <div class="flex gap-1 border-b border-line overflow-x-auto">
    {#each [{ v: 'entrenos', l: 'Entrenos' }, { v: 'ficha', l: 'Ficha' }, { v: 'progreso', l: 'Progreso' }, { v: 'tecnica', l: 'Técnica' }, { v: 'historial', l: 'Historial' }] as t (t.v)}
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
    <PanelEntrenos {data} {form} />
  {:else if tab === 'ficha'}
    <PanelFicha {data} {form} />
  {:else if tab === 'progreso'}
    <PanelProgreso {data} />
  {:else if tab === 'tecnica'}
    <PanelTecnica {data} {form} />
  {:else}
    <PanelHistorial {data} />
  {/if}
</div>
