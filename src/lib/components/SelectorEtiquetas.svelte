<script lang="ts">
  /**
   * Selección múltiple con pastillas pulsables.
   *
   * POR QUÉ NO UN <select multiple>
   * En el móvil es horrible: hay que mantener pulsado, no se ve qué está
   * elegido sin desplegar, y en iOS abre una rueda que solo deja uno. El
   * entrenador va a usar esto con el pulgar, así que pastillas grandes.
   *
   * FUNCIONA SIN JAVASCRIPT
   * Cada valor elegido se manda como un <input type="hidden"> con el MISMO
   * name, que es como HTML envía un campo con varios valores. En el servidor
   * se leen con formData.getAll(name). Si el JavaScript no ha cargado todavía,
   * lo que se envía es lo que estaba marcado al pintar la página, no un
   * formulario vacío.
   */
  interface Props {
    /** Nombre del campo en el formulario. Se envía repetido, uno por valor. */
    name: string;
    /** Vocabulario cerrado: valor interno → etiqueta visible. */
    opciones: Record<string, string>;
    /** Valores elegidos. Vinculable desde fuera. */
    seleccion: string[];
    /** Texto de ayuda debajo. */
    ayuda?: string;
    /** Título del grupo. Se usa como etiqueta accesible del conjunto. */
    titulo: string;
  }

  let { name, opciones, seleccion = $bindable(), ayuda, titulo }: Props = $props();

  /**
   * Tope de opciones visibles antes de plegar.
   *
   * Con el vocabulario base son ocho grupos y siete materiales, que ya llenan
   * dos líneas en un móvil. Con etiquetas propias pueden ser veinte, y
   * entonces el formulario entero es una alfombra de pastillas antes de llegar
   * al primer campo que importa.
   *
   * Cuatro es lo que cabe en una línea de móvil sin apretar.
   */
  const TOPE = 4;
  let desplegado = $state(false);

  // Las ELEGIDAS van primero y siempre se ven, aunque sean más de cuatro:
  // plegar algo que el entrenador acaba de marcar es hacerle dudar de si se
  // guardó. El tope solo esconde lo que NO ha elegido.
  const ordenadas = $derived([
    ...Object.keys(opciones).filter((v) => seleccion.includes(v)),
    ...Object.keys(opciones).filter((v) => !seleccion.includes(v))
  ]);
  const cuantasSeVen = $derived(Math.max(TOPE, seleccion.length));
  const visibles = $derived(desplegado ? ordenadas : ordenadas.slice(0, cuantasSeVen));
  const ocultas = $derived(ordenadas.length - visibles.length);

  function alternar(valor: string) {
    seleccion = seleccion.includes(valor)
      ? seleccion.filter((v) => v !== valor)
      : // Se añade al final: el PRIMERO es el principal y es el que se ve en
        // las pantallas que solo enseñan uno. Reordenarlo al azar cambiaría
        // qué etiqueta ve el cliente en su entreno.
        [...seleccion, valor];
  }
</script>

<!-- role="group" en vez de fieldset: fieldset trae márgenes y bordes propios
     que hay que deshacer, y aquí no aporta nada más. -->
<div role="group" aria-labelledby="{name}-titulo" class="space-y-2">
  <p id="{name}-titulo" class="block text-xs uppercase tracking-wider text-text-mute">
    {titulo}
  </p>

  <div class="flex flex-wrap gap-2">
    {#each visibles as valor (valor)}
      {@const elegido = seleccion.includes(valor)}
      <button
        type="button"
        onclick={() => alternar(valor)}
        aria-pressed={elegido}
        class="px-3 py-1.5 rounded-full text-sm border transition-colors {elegido
          ? 'bg-primary text-bg border-primary font-medium'
          : 'border-line text-text-mute hover:text-text hover:border-line-strong'}"
      >
        {opciones[valor] ?? valor}
      </button>
    {/each}

    <!-- El botón dice CUÁNTAS faltan, no solo que hay más: «+9» y «+2» son
         dos decisiones distintas sobre si merece la pena desplegar. -->
    {#if ocultas > 0 || desplegado}
      <button
        type="button"
        onclick={() => (desplegado = !desplegado)}
        aria-expanded={desplegado}
        class="px-3 py-1.5 rounded-full text-sm border border-line text-accent
               hover:border-line-strong transition-colors tabular-nums"
      >
        {desplegado ? 'Ver menos' : `+${ocultas}`}
      </button>
    {/if}
  </div>

  {#each seleccion as valor (valor)}
    <input type="hidden" {name} value={valor} />
  {/each}

  {#if ayuda}
    <p class="text-2xs text-text-mute">{ayuda}</p>
  {/if}
</div>
