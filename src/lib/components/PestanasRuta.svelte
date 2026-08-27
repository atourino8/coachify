<script lang="ts">
  /**
   * Una fila de pestañas donde cada pestaña es una PÁGINA distinta.
   *
   * POR QUÉ HACE FALTA, SI YA HABÍA PESTAÑAS
   *
   * Había dos filas de pestañas por ruta —Ejercicios/Entrenamientos y las de la
   * Agenda— escritas a mano, y no decían lo mismo: la biblioteca pintaba la
   * activa con `text-accent` y la ficha del cliente con `text-text`. Dos
   * colores para «esta es la que estás viendo», en la misma aplicación.
   *
   * Y la Agenda ni siquiera tenía fila: eran enlaces sueltos dentro de Citas
   * —uno de ellos con un símbolo de engranaje que no lleva ninguna otra
   * pestaña— y las otras dos volvían con un «← Agenda». O sea que Citas
   * parecía la madre y las otras dos sus hijas, cuando el wireframe las dibuja
   * iguales. En un móvil eso significa que desde «Mis huecos» no se ve que
   * existan «Clases» sin volver atrás primero.
   *
   * ENLACES Y NO BOTONES
   *
   * Cada pestaña es una URL de verdad: se puede compartir, abrir en otra
   * pestaña del navegador y funciona sin JavaScript. Las pestañas que solo
   * cambian lo que se enseña dentro de la misma página —las de la ficha del
   * cliente— siguen siendo botones, y está bien que lo sean: ahí no hay a
   * dónde navegar.
   *
   * `aria-current="page"` NO ES DECORACIÓN
   *
   * Es lo que le dice a un lector de pantalla cuál de las tres estás viendo.
   * Antes se marcaba solo con color, que es justo lo que DISENO.md prohíbe: el
   * color nunca lleva la información solo.
   */
  import FilaDesplazable from './FilaDesplazable.svelte';

  interface Props {
    /** Para el lector de pantalla: «Secciones de la agenda». */
    etiqueta: string;
    pestanas: { href: string; texto: string }[];
    /** El `href` de la que se está viendo. */
    activa: string;
  }

  let { etiqueta, pestanas, activa }: Props = $props();
</script>

<FilaDesplazable class="flex gap-1 border-b border-line" {etiqueta}>
  {#each pestanas as p (p.href)}
    {@const esActiva = p.href === activa}
    <a
      href={p.href}
      aria-current={esActiva ? 'page' : undefined}
      class="px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap flex-shrink-0 -mb-px transition-colors
        {esActiva
        ? 'border-accent text-text'
        : 'border-transparent text-text-mute hover:text-text'}">{p.texto}</a
    >
  {/each}
</FilaDesplazable>
