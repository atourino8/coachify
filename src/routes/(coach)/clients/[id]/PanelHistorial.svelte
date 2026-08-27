<script lang="ts">
  import type { PageData } from './$types';
  /**
   * Historial del cliente: entrenos pasados y citas pasadas.
   *
   * Recibe `data` de la página entera y no props sueltas a propósito: estos
   * paneles no son componentes reutilizables, son las secciones de UNA pantalla
   * partidas para poder abrirlas sin desplazarse por mil líneas. Inventarles un
   * contrato de props que habría que rehacer cada vez que cambie la consulta
   * sería trabajo sin ganancia.
   *
   * Lo que sí se muda con cada panel es su ESTADO: lo que solo usa una pestaña
   * vive en su fichero, no en el de la página.
   */
  import { formatHumanDate } from '$lib/week';
  import { diaConSemana, hora } from '$lib/formato';
  import FilaDesplazable from '$lib/components/FilaDesplazable.svelte';

  let { data }: { data: PageData } = $props();

  /**
   * Conmutador Entrenos | Citas (pantalla 21).
   *
   * Antes eran DOS SECCIONES APILADAS. Con un cliente de un año eso significa
   * que para ver una cita hay que pasar por cincuenta entrenos, y en un móvil
   * ni se sabe que las citas están ahí abajo.
   *
   * El mismo oficio ya se resolvía conmutando en Clientes y en Ejercicios; aquí
   * se apilaba, que es exactamente el tipo de incoherencia que veníamos
   * buscando.
   */
  let vista = $state<'entrenos' | 'citas'>('entrenos');

  /**
   * El filtro que el wireframe dibuja al lado.
   *
   * Se limita a lo que se puede contestar con lo que ya está cargado, y para
   * cada vista lo suyo: en entrenos, si el cliente lo registró o no —que es la
   * pregunta del entrenador, «¿me está siguiendo?»—; en citas, el estado.
   */
  let filtroEntrenos = $state<'todos' | 'hechos' | 'sin_registrar'>('todos');
  let filtroCitas = $state<'todas' | 'confirmed' | 'cancelled' | 'rejected'>('todas');

  const entrenos = $derived(
    data.historyWorkouts.filter((w) =>
      filtroEntrenos === 'todos' ? true : filtroEntrenos === 'hechos' ? w.done : !w.done
    )
  );
  const citas = $derived(
    data.historySessions.filter((s) => filtroCitas === 'todas' || s.status === filtroCitas)
  );

  const ETIQUETA_CITA: Record<string, string> = {
    requested: 'Pendiente',
    confirmed: 'Confirmada',
    rejected: 'Rechazada',
    cancelled: 'Cancelada',
    completed: 'Completada'
  };
  const CLASE_CITA: Record<string, string> = {
    requested: 'bg-warning/15 text-warning',
    confirmed: 'bg-success/15 text-success',
    rejected: 'bg-danger/15 text-danger',
    cancelled: 'bg-text-mute/15 text-text-mute',
    completed: 'bg-primary/15 text-primary'
  };

  // Fecha con hora: aquí importa el instante de la cita, no solo el día, así
  // que no vale ninguna de las de $lib/formato.
  function fechaYHora(iso: string) {
    return new Date(iso).toLocaleString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
</script>

<!-- ===== HISTORIAL ===== -->
<div class="space-y-4">
  <FilaDesplazable class="flex gap-1 border-b border-line" etiqueta="Entrenos o citas">
    {#each [{ v: 'entrenos', l: 'Entrenos', n: data.historyWorkouts.length }, { v: 'citas', l: 'Citas', n: data.historySessions.length }] as p (p.v)}
      <button
        type="button"
        onclick={() => (vista = p.v as typeof vista)}
        aria-current={vista === p.v ? 'page' : undefined}
        class="px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap flex-shrink-0 -mb-px transition-colors flex items-center gap-2
          {vista === p.v
          ? 'border-accent text-text'
          : 'border-transparent text-text-mute hover:text-text'}"
      >
        {p.l}
        <span class="text-xs text-text-mute tabular-nums">{p.n}</span>
      </button>
    {/each}
  </FilaDesplazable>

  <!-- El filtro cambia con la pestaña porque las preguntas son distintas.
       Un filtro único que valiera para las dos tendría que ser tan genérico
       que no contestaría ninguna. -->
  <div class="flex flex-wrap gap-2">
    {#if vista === 'entrenos'}
      {#each [{ v: 'todos', l: 'Todos' }, { v: 'hechos', l: 'Hechos' }, { v: 'sin_registrar', l: 'Sin registrar' }] as f (f.v)}
        <button
          type="button"
          onclick={() => (filtroEntrenos = f.v as typeof filtroEntrenos)}
          aria-pressed={filtroEntrenos === f.v}
          class="px-3 py-1.5 rounded-full text-sm border transition-colors {filtroEntrenos === f.v
            ? 'bg-primary text-bg border-primary'
            : 'border-line text-text-mute hover:text-text'}">{f.l}</button
        >
      {/each}
    {:else}
      {#each [{ v: 'todas', l: 'Todas' }, { v: 'confirmed', l: 'Confirmadas' }, { v: 'cancelled', l: 'Canceladas' }, { v: 'rejected', l: 'Rechazadas' }] as f (f.v)}
        <button
          type="button"
          onclick={() => (filtroCitas = f.v as typeof filtroCitas)}
          aria-pressed={filtroCitas === f.v}
          class="px-3 py-1.5 rounded-full text-sm border transition-colors {filtroCitas === f.v
            ? 'bg-primary text-bg border-primary'
            : 'border-line text-text-mute hover:text-text'}">{f.l}</button
        >
      {/each}
    {/if}
  </div>

  {#if vista === 'entrenos'}
    {#if entrenos.length === 0}
      <p class="text-sm text-text-mute">
        {data.historyWorkouts.length === 0
          ? 'Todavía no hay entrenos pasados.'
          : 'Ninguno con ese filtro.'}
      </p>
    {:else}
      <div class="space-y-2">
        {#each entrenos as w (w.id)}
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
  {:else if citas.length === 0}
    <p class="text-sm text-text-mute">
      {data.historySessions.length === 0 ? 'No hay citas pasadas.' : 'Ninguna con ese filtro.'}
    </p>
  {:else}
    <div class="space-y-1.5">
      {#each citas as s (s.id)}
        <div class="flex items-center justify-between gap-3 text-sm py-2 border-b border-line">
          <span class="capitalize text-text-mute">{fechaYHora(s.starts_at)}</span>
          <span class="text-xs px-2 py-0.5 rounded-full {CLASE_CITA[s.status] ?? ''}">
            {ETIQUETA_CITA[s.status] ?? s.status}
          </span>
        </div>
      {/each}
    </div>
  {/if}
</div>

{#if data.clasesProximas.length > 0}
  <section class="space-y-3 mt-8">
    <h2 class="text-sm uppercase tracking-wider text-text-mute">Clases a las que va</h2>
    <div class="border-t border-line">
      {#each data.clasesProximas as c (c.id)}
        <a href="/clases/{c.id}" class="row-link">
          <div class="flex-1 min-w-0">
            <div class="font-medium truncate">{c.title}</div>
            <div class="text-xs text-text-mute truncate">
              {diaConSemana(c.starts_at)} · {hora(c.starts_at)}
            </div>
          </div>
          {#if c.cancelada}
            <span class="text-xs text-danger flex-shrink-0">clase cancelada</span>
          {:else if c.enEspera}
            <span class="text-xs text-text-mute flex-shrink-0">en lista de espera</span>
          {/if}
          <span class="text-text-mute text-sm flex-shrink-0">→</span>
        </a>
      {/each}
    </div>
  </section>
{/if}
