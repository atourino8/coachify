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
    {#each Object.entries(opciones) as [valor, etiqueta] (valor)}
      {@const elegido = seleccion.includes(valor)}
      <button
        type="button"
        onclick={() => alternar(valor)}
        aria-pressed={elegido}
        class="px-3 py-1.5 rounded-full text-sm border transition-colors {elegido
          ? 'bg-primary text-bg border-primary font-medium'
          : 'border-line text-text-mute hover:text-text hover:border-line-strong'}"
      >
        {etiqueta}
      </button>
    {/each}
  </div>

  {#each seleccion as valor (valor)}
    <input type="hidden" {name} value={valor} />
  {/each}

  {#if ayuda}
    <p class="text-2xs text-text-mute">{ayuda}</p>
  {/if}
</div>
