<script lang="ts">
  /**
   * Lista de etiquetas con tope, y el resto en un «+N».
   *
   * POR QUÉ HAY TOPE
   * Desde que un ejercicio puede llevar varios grupos y varios materiales, una
   * fila puede acumular ocho pastillas. En un móvil eso empuja el nombre del
   * ejercicio —que es lo que se está buscando— fuera de la pantalla, o lo parte
   * en dos líneas. Cuatro caben y el resto se cuenta.
   *
   * El «+N» dice CUÁNTAS faltan, no que haya más. «+3» y «+1» son informaciones
   * distintas y las dos caben en el mismo hueco.
   *
   * Es solo para MOSTRAR. Para elegir está SelectorEtiquetas, que tiene su
   * propio plegado porque ahí hace falta poder desplegar.
   */
  interface Props {
    /** Identificadores a pintar, en su orden. */
    valores: readonly string[];
    /** Identificador → texto visible. Lo que no esté, se pinta tal cual. */
    etiquetas: Record<string, string>;
    /** Cuántas se ven antes de resumir. */
    tope?: number;
    /** Clase de la pastilla, por si el contexto pide otra. */
    clase?: string;
  }

  let { valores, etiquetas, tope = 4, clase = 'pill-mute' }: Props = $props();

  const visibles = $derived(valores.slice(0, tope));
  const restantes = $derived(Math.max(0, valores.length - tope));

  // El texto completo va en el título del grupo para quien use lector de
  // pantalla: el «+2» a secas no dice cuáles son.
  const todasEnTexto = $derived(valores.map((v) => etiquetas[v] ?? v).join(', '));
</script>

{#if valores.length > 0}
  <span class="contents" aria-label={todasEnTexto}>
    {#each visibles as v (v)}
      <span class="{clase} flex-shrink-0">{etiquetas[v] ?? v}</span>
    {/each}
    {#if restantes > 0}
      <span class="{clase} flex-shrink-0 tabular-nums" aria-hidden="true">+{restantes}</span>
    {/if}
  </span>
{/if}
