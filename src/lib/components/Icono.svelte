<script lang="ts">
  /**
   * Iconos de la aplicación.
   *
   * TODOS SON DECORATIVOS. Van con aria-hidden y JAMÁS son el único portador
   * de significado: al lado siempre hay una palabra. Es lo contrario de lo que
   * hacía la aplicación antes, cuando un emoji de lupa ERA el botón de buscar
   * y un lector de pantalla anunciaba "emoji lupa".
   *
   * La regla práctica: si quitando el icono la pantalla se sigue entendiendo,
   * el icono está bien puesto. Si no, es que está haciendo de texto.
   *
   * POR QUÉ SVG EN LÍNEA Y NO UNA LIBRERÍA
   * Son doce trazos. Una dependencia de iconos trae miles, un paso de
   * compilación y la tentación de ir metiendo los que sobran. Aquí se añade uno
   * cuando hace falta y se ve lo que hay.
   *
   * Todos comparten rejilla de 24, trazo de 2 y extremos redondeados, que es lo
   * que hace que parezcan del mismo juego. `currentColor` para que hereden el
   * color de donde estén y sigan a la marca del entrenador sin saberlo.
   */
  interface Props {
    nombre: keyof typeof TRAZOS;
    /** Clases de tamaño. El color lo hereda de su contenedor. */
    class?: string;
  }

  let { nombre, class: clases = 'w-5 h-5' }: Props = $props();

  const TRAZOS = {
    inicio: 'M3 10.5 12 3l9 7.5M5.5 9.5V20h13V9.5',
    rutinas: 'M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11',
    clientes:
      'M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20M9.5 10.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M21 20v-1.5a4 4 0 0 0-3-3.9M16 3.6a4 4 0 0 1 0 7.7',
    agenda: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
    cobros: 'M2.5 6.5h19v11h-19zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M6 10v4M18 10v4',
    ajustes:
      'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.9 2.9l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-3-1.2l-.1.1a2 2 0 1 1-2.9-2.9l.1-.1a1.7 1.7 0 0 0-1.2-2.9h-.2a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.2-3l-.1-.1a2 2 0 1 1 2.9-2.9l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 1-1.5v-.2a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 3 1.2l.1-.1a2 2 0 1 1 2.9 2.9l-.1.1a1.7 1.7 0 0 0 1.2 3h.2a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
    avisos: 'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
    subir: 'M12 16V4M8 8l4-4 4 4M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3',
    enlace:
      'M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7',
    lista: 'M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01',
    rejilla: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
    filtro: 'M3 5h18l-7 8v6l-4 2v-8z',
    salir: 'M15 17l5-5-5-5M20 12H9M11 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5',
    video: 'M10 8.5v7l6-3.5zM3 5.5h18v13H3z'
  } as const;
</script>

<svg
  class={clases}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
  focusable="false"
>
  <path d={TRAZOS[nombre]} />
</svg>
