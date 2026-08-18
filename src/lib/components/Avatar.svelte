<script lang="ts">
  /**
   * Foto de perfil, o la inicial cuando no hay.
   *
   * POR QUÉ UN COMPONENTE PARA ESTO
   * El círculo con la inicial estaba copiado en cinco sitios con cinco tamaños
   * escritos a mano. Al meter la foto habría que haber tocado los cinco y
   * acordarse del `alt`, del recorte y del caso sin nombre en cada uno.
   *
   * LA INICIAL NO ES UN RESPALDO DE SEGUNDA
   * Va a ser lo que se vea la mayor parte del tiempo, porque casi nadie sube
   * foto. Por eso ocupa el círculo entero y no un icono genérico de persona:
   * una lista de siluetas idénticas no distingue a nadie, y una lista de
   * letras sí.
   */
  interface Props {
    /** URL ya firmada. Nula = inicial. */
    url?: string | null;
    /** De aquí sale la letra. */
    nombre?: string | null;
    /** Diámetro en clases de Tailwind. */
    tamano?: 'sm' | 'md' | 'lg' | 'xl';
    /** Clases extra para el contenedor. */
    class?: string;
  }

  let { url = null, nombre = null, tamano = 'md', class: clase = '' }: Props = $props();

  const TAMANOS = {
    sm: 'w-9 h-9 text-sm',
    md: 'w-11 h-11 text-base',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-3xl'
  } as const;

  const inicial = $derived((nombre ?? '').trim().charAt(0).toUpperCase() || '?');
</script>

<!--
  La foto es DECORATIVA aquí: en todas las pantallas donde se usa, el nombre
  está escrito al lado. Un alt con el nombre haría que un lector de pantalla lo
  leyera dos veces seguidas.
-->
<span
  class="rounded-full bg-surface-2 grid place-items-center overflow-hidden flex-shrink-0
         font-semibold text-text-mute select-none {TAMANOS[tamano]} {clase}"
>
  {#if url}
    <img src={url} alt="" class="w-full h-full object-cover" loading="lazy" />
  {:else}
    {inicial}
  {/if}
</span>
