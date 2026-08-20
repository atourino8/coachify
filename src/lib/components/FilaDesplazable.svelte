<script lang="ts">
  /**
   * Fila que se desplaza en horizontal, con una flecha que avisa de que hay
   * más a los lados.
   *
   * POR QUÉ HACE FALTA
   * Antes esto era un `div` con el desbordamiento horizontal en automático y
   * el navegador pintaba un scrollbar. Ese scrollbar traía un problema —en Firefox y en Windows con
   * los clásicos aparecía además uno VERTICAL de dos flechas dentro de una
   * fila de cuarenta píxeles— así que se escondió.
   *
   * Y al esconderlo se fue la única pista de que había más pestañas a la
   * derecha. En un móvil, «Pagos · Citas · Revisiones» parecía la lista
   * entera aunque hubiera una cuarta fuera de la pantalla. Eso no es un
   * detalle estético: es información que se pierde sin que nadie sepa que
   * existe.
   *
   * POR QUÉ FLECHAS Y NO UN DEGRADADO QUE DESVANECE
   * Porque los degradados están prohibidos en este proyecto (DISENO.md 3.8) y
   * porque un desvanecido dice «hay algo» pero no se puede pulsar. La flecha
   * avisa Y mueve.
   *
   * LAS FLECHAS SON UN ATAJO, NO EL ÚNICO CAMINO
   * Van con `aria-hidden` y fuera del orden de tabulación: el contenido de la
   * fila —las pestañas— ya es alcanzable con el tabulador, y al enfocar una
   * que está fuera el navegador la trae solo. Meter dos paradas más en el
   * tabulador para hacer lo que ya se hace sería ruido para quien navega con
   * teclado.
   *
   * SIN JAVASCRIPT no aparecen, y la fila se sigue desplazando con el dedo y
   * con la rueda. Se pierde el aviso, no el contenido.
   */
  import type { Snippet } from 'svelte';

  interface Props {
    /** Clases de la fila: separación, borde inferior, relleno… */
    class?: string;
    /** Para el lector de pantalla, si la fila es una navegación. */
    etiqueta?: string;
    children: Snippet;
  }

  let { class: clase = '', etiqueta, children }: Props = $props();

  let caja = $state<HTMLDivElement | null>(null);
  let hayIzquierda = $state(false);
  let hayDerecha = $state(false);

  /**
   * El margen de un píxel no es paranoia: con zoom del navegador o pantallas
   * de densidad rara, `scrollWidth` y `clientWidth` se quedan a medio píxel y
   * la flecha aparecería en una fila que no se mueve.
   */
  const MARGEN = 1;

  function medir() {
    if (!caja) return;
    hayIzquierda = caja.scrollLeft > MARGEN;
    hayDerecha = caja.scrollLeft + caja.clientWidth < caja.scrollWidth - MARGEN;
  }

  function desplazar(direccion: -1 | 1) {
    if (!caja) return;
    // Un 80 % y no la anchura entera: dejar algo de lo anterior a la vista es
    // lo que te dice que no has saltado a otro sitio.
    caja.scrollBy({ left: direccion * caja.clientWidth * 0.8, behavior: 'smooth' });
  }

  $effect(() => {
    if (!caja) return;
    medir();

    // Se vigila la caja Y su contenido: la fila cambia de tamaño al girar el
    // móvil, y el contenido cambia cuando aparece una insignia o se filtra.
    const observador = new ResizeObserver(medir);
    observador.observe(caja);
    for (const hijo of caja.children) observador.observe(hijo);

    return () => observador.disconnect();
  });
</script>

<div class="relative">
  <div
    bind:this={caja}
    onscroll={medir}
    role={etiqueta ? 'group' : undefined}
    aria-label={etiqueta}
    class="fila-desplazable {clase}"
  >
    {@render children()}
  </div>

  {#if hayIzquierda}
    <button
      type="button"
      tabindex="-1"
      aria-hidden="true"
      onclick={() => desplazar(-1)}
      class="flecha-fila left-0"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
        <path d="M15 6l-6 6 6 6" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>
  {/if}

  {#if hayDerecha}
    <button
      type="button"
      tabindex="-1"
      aria-hidden="true"
      onclick={() => desplazar(1)}
      class="flecha-fila right-0"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
        <path d="M9 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>
  {/if}
</div>
