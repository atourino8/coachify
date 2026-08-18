<script lang="ts">
  /**
   * Los tres puntos del final de una fila.
   *
   * POR QUÉ UN <details> Y NO UN MENÚ DE VERDAD
   * Es el cuarto sitio de la aplicación que necesita «abre, elige, cierra», y
   * los otros tres —el cajón, el desplegable de la cuenta y el filtro de la
   * biblioteca— ya lo resuelven así. El navegador da gratis abrir, cerrar,
   * Escape y el foco, y funciona sin JavaScript.
   *
   * POR QUÉ EXISTE, SIENDO QUE YA HABÍA UN ENLACE «EDITAR»
   * Porque las acciones son dos y van a ser tres: con «Editar» y «Archivar»
   * sueltos en la fila, cada acción nueva le come sitio al nombre, que es lo
   * que se está leyendo. El menú mantiene la fila en un ancho fijo diga lo que
   * diga el menú.
   *
   * QUIEN LO USA PONE LO QUE VA DENTRO
   * Con un array de acciones habría que inventar un formato para «esto es un
   * enlace», «esto es un botón», «esto envía un formulario» y «esto es
   * peligroso». Es un {#snippet}: dentro va HTML normal.
   */
  import type { Snippet } from 'svelte';

  interface Props {
    /** Para el lector de pantalla: «Acciones de Press de banca». */
    etiqueta: string;
    /** El contenido del menú. */
    children: Snippet;
  }

  let { etiqueta, children }: Props = $props();

  let menu = $state<HTMLDetailsElement | null>(null);

  /**
   * Cerrar al elegir algo.
   *
   * Sin esto el menú se queda abierto encima de la fila después de pulsar, y
   * en un móvil tapa justo lo que acabas de tocar. Se escucha el click del
   * contenedor en vez de pedirle a cada acción que se cierre sola, que sería
   * repetir lo mismo en cada uso.
   */
  function alElegir(e: MouseEvent) {
    const destino = e.target as HTMLElement;
    if (destino.closest('a, button[type="submit"], button[data-cierra]')) {
      if (menu) menu.open = false;
    }
  }
</script>

<details bind:this={menu} class="relative flex-shrink-0">
  <summary
    aria-label="Acciones de {etiqueta}"
    class="list-none cursor-pointer w-8 h-8 grid place-items-center rounded-md
           text-text-mute hover:text-text hover:bg-surface-2 transition-colors
           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
  >
    <!-- Los tres puntos son decorativos: el nombre accesible lo lleva el
         summary, que es lo que anuncia un lector de pantalla. -->
    <svg viewBox="0 0 24 24" class="w-4 h-4" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="5" r="1.75" />
      <circle cx="12" cy="12" r="1.75" />
      <circle cx="12" cy="19" r="1.75" />
    </svg>
  </summary>

  <!-- Capa de cierre: un click fuera cierra el menú. Va antes del panel en el
       orden del DOM para quedar por debajo. -->
  <button
    type="button"
    aria-label="Cerrar menú"
    onclick={() => menu && (menu.open = false)}
    class="fixed inset-0 z-40 cursor-default"
  ></button>

  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div
    onclick={alElegir}
    class="absolute right-0 top-full mt-1 z-50 w-44 bg-surface border border-line
           rounded-lg shadow-lg overflow-hidden text-sm"
  >
    {@render children()}
  </div>
</details>
