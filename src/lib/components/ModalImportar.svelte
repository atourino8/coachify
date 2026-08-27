<script lang="ts">
  /**
   * De dónde saco los ejercicios de este día: de la biblioteca o de otro día.
   *
   * POR QUÉ NO ES EL MISMO MODAL QUE «PROGRAMAR»
   *
   * Se parecen y hacen cosas distintas. «Programar» llena un día **vacío** y
   * escribe en la base al momento. Esto **sobrescribe** un día que ya tiene
   * ejercicios, y solo toca el borrador que hay en pantalla: hasta que no le
   * das a Guardar no se ha perdido nada, y «Deshacer» lo devuelve.
   *
   * Esa diferencia es la que justifica el aviso: aquí se avisa de que vas a
   * sobreescribir, y en el otro no hay nada que sobreescribir.
   *
   * POR QUÉ EL AVISO VA ARRIBA Y NO EN UN «¿SEGURO?» AL FINAL
   *
   * Porque decirlo al final, cuando ya has elegido la plantilla, es hacerte
   * recorrer dos pasos para luego preguntarte si querías empezar. Lo que puede
   * costar trabajo se dice ANTES de que trabajes.
   */
  import { formatHumanDate } from '$lib/week';
  import Icono from '$lib/components/Icono.svelte';
  import type { ComponentProps } from 'svelte';

  type Origen = 'biblioteca' | 'otro';

  interface Props {
    abierto: boolean;
    /** El día que se va a sobrescribir, en ISO. */
    fecha: string;
    /** ¿Hay algo que perder? Cambia el aviso. */
    tieneEjercicios: boolean;
    plantillas: { id: string; name: string; items: unknown[] }[];
    otrosDias: { id: string; date: string; title: string | null; items: unknown[] }[];
    /** Devuelve los items elegidos a quien abrió el modal. */
    importar: (origen: Origen, id: string) => void;
    cerrar: () => void;
  }

  let { abierto, fecha, tieneEjercicios, plantillas, otrosDias, importar, cerrar }: Props =
    $props();

  let dialogo = $state<HTMLDialogElement | null>(null);
  let origen = $state<Origen | null>(null);
  let paso = $state<1 | 2>(1);
  let elegido = $state('');

  $effect(() => {
    if (!dialogo) return;
    if (abierto) {
      // Igual que en el modal de programar: se resetea AL ABRIR, no al cerrar.
      // Cerrar con Escape no pasa por ninguna función nuestra.
      origen = null;
      paso = 1;
      elegido = '';
      if (!dialogo.open) dialogo.showModal();
    } else if (dialogo.open) {
      dialogo.close();
    }
  });

  const OPCIONES: {
    v: Origen;
    texto: string;
    icono: ComponentProps<typeof Icono>['nombre'];
    ayuda: string;
  }[] = [
    { v: 'biblioteca', texto: 'Biblioteca', icono: 'rutinas', ayuda: 'Uno de tus entrenamientos' },
    { v: 'otro', texto: 'Otro entrenamiento', icono: 'copiar', ayuda: 'Otro día de este cliente' }
  ];

  const lista = $derived(
    origen === 'biblioteca'
      ? plantillas.map((t) => ({ id: t.id, texto: `${t.name} (${t.items.length} ej.)` }))
      : otrosDias.map((w) => ({
          id: w.id,
          texto: `${formatHumanDate(w.date)} · ${w.title ?? 'Entreno'} (${w.items.length} ej.)`
        }))
  );

  function vacio(v: Origen) {
    return v === 'biblioteca' ? plantillas.length === 0 : otrosDias.length === 0;
  }
</script>

<dialog
  bind:this={dialogo}
  onclose={cerrar}
  onclick={(e) => {
    if (e.target === dialogo) cerrar();
  }}
  aria-labelledby="mi-titulo"
  class="card w-[calc(100vw-2rem)] max-w-md"
>
  <div class="flex flex-col gap-5">
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <h2 id="mi-titulo" class="text-lg font-display font-semibold">Importar entrenamiento</h2>
        <p class="text-xs text-text-mute mt-1">
          {#if tieneEjercicios}
            Vas a sobreescribir el entrenamiento del
            <span class="text-text">{formatHumanDate(fecha)}</span>. ¿De dónde quieres obtener el
            nuevo?
          {:else}
            <!-- Sin ejercicios no hay nada que sobrescribir, así que no se
                 asusta a nadie con un aviso que no aplica. -->
            El día está vacío. ¿De dónde quieres obtener el entrenamiento?
          {/if}
        </p>
      </div>
      <button
        type="button"
        onclick={cerrar}
        aria-label="Cerrar"
        class="text-text-mute hover:text-text text-xl leading-none flex-shrink-0">×</button
      >
    </div>

    {#if paso === 1}
      <div class="space-y-2">
        {#each OPCIONES as o (o.v)}
          <button
            type="button"
            onclick={() => (origen = o.v)}
            disabled={vacio(o.v)}
            aria-pressed={origen === o.v}
            class="w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-colors
              disabled:opacity-40 disabled:cursor-not-allowed
              {origen === o.v
              ? 'border-accent bg-surface-2'
              : 'border-line hover:border-text-mute/40'}"
          >
            <Icono nombre={o.icono} class="w-5 h-5 flex-shrink-0 text-text-mute" />
            <span class="min-w-0">
              <span class="block text-sm font-medium">{o.texto}</span>
              <span class="block text-xs text-text-mute">
                {#if vacio(o.v)}
                  {o.v === 'biblioteca'
                    ? 'No tienes entrenamientos guardados'
                    : 'No tiene otros días con ejercicios'}
                {:else}
                  {o.ayuda}
                {/if}
              </span>
            </span>
          </button>
        {/each}
      </div>
    {:else}
      <div>
        <label for="mi-src" class="block text-xs uppercase tracking-wider text-text-mute mb-2">
          {origen === 'biblioteca' ? 'Entrenamiento' : 'Copiar de'}
        </label>
        <select
          id="mi-src"
          bind:value={elegido}
          class="w-full px-3 py-2.5 bg-bg border border-line rounded-md text-sm focus:border-accent"
        >
          <option value="" disabled>Elige uno…</option>
          {#each lista as o (o.id)}<option value={o.id}>{o.texto}</option>{/each}
        </select>

        {#if tieneEjercicios}
          <p class="text-xs text-warning mt-3">
            Los ejercicios que hay ahora se reemplazan. Podrás deshacerlo antes de guardar.
          </p>
        {/if}
      </div>
    {/if}

    <div class="flex items-center gap-3 border-t border-line -mx-6 px-6 pt-4">
      {#if paso === 2}
        <button type="button" onclick={() => (paso = 1)} class="btn-ghost text-sm">← Atrás</button>
      {/if}
      <div class="flex-1"></div>
      <button type="button" onclick={cerrar} class="btn-ghost text-sm">Cancelar</button>
      {#if paso === 1}
        <button
          type="button"
          disabled={!origen}
          onclick={() => (paso = 2)}
          class="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >Siguiente</button
        >
      {:else}
        <button
          type="button"
          disabled={!elegido}
          onclick={() => origen && importar(origen, elegido)}
          class="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >Importar</button
        >
      {/if}
    </div>
  </div>
</dialog>
