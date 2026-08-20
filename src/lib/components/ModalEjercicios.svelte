<script lang="ts">
  /**
   * Elegir varios ejercicios de la biblioteca y añadirlos de una vez.
   *
   * POR QUÉ CAMBIA LA INTERACCIÓN
   * Antes la biblioteca era un panel siempre visible y cada `+` añadía uno.
   * Montar un entrenamiento de ocho ejercicios eran ocho idas y venidas entre
   * dos columnas, y en un móvil el panel se iba abajo del todo.
   *
   * Aquí se marca lo que se quiera —con el contador diciendo cuántos llevas— y
   * se añade todo junto. Es la pantalla 10 del wireframe.
   *
   * SE PUEDE ELEGIR EL MISMO DOS VECES
   * A propósito: repetir un ejercicio en la misma sesión es normal (una serie
   * al principio y otra al final). Lo que hace el contador es contar
   * ELECCIONES, no ejercicios distintos.
   */
  import type { Exercise } from '$lib/supabase/types';
  import { normalizar } from '$lib/texto';
  import Icono from './Icono.svelte';

  interface Props {
    abierto: boolean;
    ejercicios: Exercise[];
    /** valor interno → texto visible, para el filtro por grupo. */
    etiquetas: Record<string, string>;
    /** Se llama con los elegidos, en el orden en que se marcaron. */
    onanadir: (elegidos: Exercise[]) => void;
  }

  let { abierto = $bindable(false), ejercicios, etiquetas, onanadir }: Props = $props();

  let dialogo = $state<HTMLDialogElement | null>(null);
  let busqueda = $state('');
  let grupo = $state('');
  let elegidos = $state<string[]>([]);

  /**
   * Los grupos de un ejercicio como texto suelto.
   *
   * `muscle_groups` está tipado con el vocabulario base, pero desde la
   * migración 0019 el entrenador puede inventarse los suyos: en la base es
   * `text[]` y aquí lo que llega es texto.
   */
  const gruposDe = (ex: Exercise): string[] => (ex.muscle_groups ?? []) as string[];

  const filtrados = $derived.by(() => {
    const q = normalizar(busqueda.trim());
    return ejercicios.filter((ex) => {
      if (grupo && !gruposDe(ex).includes(grupo)) return false;
      return q === '' || normalizar(ex.name).includes(q);
    });
  });

  /** Grupos que existen de verdad en la biblioteca, no el vocabulario entero. */
  const gruposPresentes = $derived(
    [...new Set(ejercicios.flatMap(gruposDe))].sort((a, b) =>
      (etiquetas[a] ?? a).localeCompare(etiquetas[b] ?? b)
    )
  );

  const cuenta = $derived(elegidos.length);

  function alternar(id: string) {
    const ultima = elegidos.lastIndexOf(id);
    if (ultima === -1) {
      elegidos = [...elegidos, id];
      return;
    }
    // Se quita la ÚLTIMA aparición y no la primera: si alguien marcó el mismo
    // ejercicio dos veces y pulsa «−», deshace lo último que hizo.
    elegidos = [...elegidos.slice(0, ultima), ...elegidos.slice(ultima + 1)];
  }

  function cerrar() {
    abierto = false;
    elegidos = [];
    busqueda = '';
    grupo = '';
  }

  function confirmar() {
    const porId = new Map(ejercicios.map((e) => [e.id, e]));
    const salida = elegidos.map((id) => porId.get(id)).filter((e): e is Exercise => !!e);
    onanadir(salida);
    cerrar();
  }

  $effect(() => {
    if (abierto) dialogo?.showModal();
    else dialogo?.close();
  });
</script>

<dialog
  bind:this={dialogo}
  onclose={cerrar}
  onclick={(e) => {
    if (e.target === dialogo) cerrar();
  }}
  aria-labelledby="modal-ej-titulo"
  class="card w-[calc(100vw-2rem)] max-w-lg"
>
  <!-- El relleno vive en el envoltorio: un click sobre el relleno del propio
       <dialog> cuenta como click fuera y cerraría el modal por accidente. -->
  <div class="flex flex-col gap-4 max-h-[80vh]">
    <div class="flex items-start justify-between gap-4">
      <h2 id="modal-ej-titulo" class="text-lg font-display font-semibold">Añadir ejercicios</h2>
      <button
        type="button"
        onclick={cerrar}
        aria-label="Cerrar"
        class="text-text-mute hover:text-text text-xl leading-none"
      >
        ×
      </button>
    </div>

    <div class="flex flex-wrap gap-3">
      <div class="relative flex-1 min-w-[10rem]">
        <label for="modal-buscar" class="sr-only">Buscar ejercicios</label>
        <input
          id="modal-buscar"
          type="search"
          bind:value={busqueda}
          placeholder="Buscar ejercicios"
          class="w-full pl-9 pr-3 py-2 bg-bg border border-line rounded-md text-sm
                 focus:outline-none focus:border-accent"
        />
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-text-mute pointer-events-none">
          <Icono nombre="buscar" class="w-4 h-4" />
        </span>
      </div>
      {#if gruposPresentes.length > 1}
        <label for="modal-grupo" class="sr-only">Filtrar por grupo muscular</label>
        <select
          id="modal-grupo"
          bind:value={grupo}
          class="px-3 py-2 bg-bg border border-line rounded-md text-sm focus:outline-none focus:border-accent"
        >
          <option value="">Todos los grupos</option>
          {#each gruposPresentes as g (g)}
            <option value={g}>{etiquetas[g] ?? g}</option>
          {/each}
        </select>
      {/if}
    </div>

    <!-- El contador dice cuántos llevas ANTES de la lista, que es donde se
         mira al dudar si ya has marcado ese. -->
    <p class="text-sm text-text-mute border-b border-line pb-2" aria-live="polite">
      {cuenta === 0
        ? 'Ninguno seleccionado'
        : `${cuenta} ${cuenta === 1 ? 'ejercicio seleccionado' : 'ejercicios seleccionados'}`}
    </p>

    <div class="flex-1 overflow-y-auto space-y-2 -mx-1 px-1">
      {#each filtrados as ex (ex.id)}
        {@const veces = elegidos.filter((id) => id === ex.id).length}
        <button
          type="button"
          onclick={() => alternar(ex.id)}
          class="w-full text-left rounded-md p-3 flex items-center gap-3 border transition-colors
            {veces > 0
            ? 'border-accent bg-accent/5'
            : 'border-line bg-bg hover:border-text-mute/40'}"
        >
          <span class="flex-1 min-w-0">
            <span class="block font-medium text-sm truncate">{ex.name}</span>
            {#if gruposDe(ex).length > 0}
              <span class="block text-xs text-text-mute truncate">
                {gruposDe(ex)
                  .map((g) => etiquetas[g] ?? g)
                  .join(', ')}
              </span>
            {/if}
          </span>
          {#if veces > 1}
            <span class="text-2xs text-text-mute tabular-nums">×{veces}</span>
          {/if}
          <!-- El signo es decorativo: lo que anuncia el lector de pantalla es
               el texto de al lado, que dice si está puesto o no. -->
          <span
            aria-hidden="true"
            class="text-lg font-bold {veces > 0 ? 'text-accent' : 'text-text-mute'}"
          >
            {veces > 0 ? '−' : '+'}
          </span>
          <span class="sr-only"
            >{veces > 0 ? 'Quitar de la selección' : 'Añadir a la selección'}</span
          >
        </button>
      {/each}

      {#if filtrados.length === 0}
        <p class="py-8 text-center text-sm text-text-mute">
          {ejercicios.length === 0 ? 'No tienes ejercicios en la biblioteca.' : 'Ninguno coincide.'}
        </p>
      {/if}
    </div>

    <div class="flex justify-end gap-3 border-t border-line pt-3">
      <button type="button" onclick={cerrar} class="action-neutral">Cancelar</button>
      <button
        type="button"
        onclick={confirmar}
        disabled={cuenta === 0}
        class="btn-primary py-2 px-5 disabled:opacity-40"
      >
        Añadir{cuenta > 0 ? ` (${cuenta})` : ''}
      </button>
    </div>
  </div>
</dialog>

<style>
  dialog {
    color: inherit;
    padding: 0;
  }
  dialog > div {
    padding: 1.25rem;
  }
  dialog::backdrop {
    background: rgb(0 0 0 / 0.6);
    backdrop-filter: blur(4px);
  }
</style>
