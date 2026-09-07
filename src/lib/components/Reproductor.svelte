<script lang="ts">
  /**
   * El reproductor, uno para toda la aplicación.
   *
   * POR QUÉ EXISTE
   *
   * Estaba escrito a mano en dos pantallas: la del cliente entrenando y el
   * panel de técnica del entrenador. Al meter el tramo (ADR-005) habría habido
   * dos reproductores y solo uno entendería de tramos — el fallo de siempre:
   * mismo oficio, dos respuestas.
   *
   * QUÉ ES UN TRAMO Y POR QUÉ LO HACE ÉL
   *
   * Un mismo vídeo sirve para varias variantes del mismo movimiento. El
   * isométrico ES un trozo del curl completo. Así que el ejercicio dice qué
   * segundos mirar y esto los respeta: empieza donde toca y para donde toca.
   *
   * NO recorta el fichero ni lo esconde: los controles siguen ahí y quien
   * quiera ver el resto puede. Un tramo es una sugerencia fuerte, no una
   * cárcel — si el entrenador se equivoca poniendo los segundos, el cliente
   * todavía puede ver su vídeo.
   */
  import { idDeYoutube, urlDeEmbebido, comoReloj } from '$lib/coach-media';

  interface Props {
    /** Vídeo SUBIDO: URL ya firmada. Excluyente con `enlace`. */
    fuente?: string | null;
    /** Vídeo ENLAZADO: la URL de YouTube tal cual la escribió el entrenador. */
    enlace?: string | null;
    /** Imagen de portada mientras no se le da al play. */
    poster?: string | null;
    /** Para el título del iframe y la accesibilidad. */
    titulo?: string;
    /** Tramo que interesa, en segundos. Ambos opcionales. */
    desde?: number | null;
    hasta?: number | null;
  }

  let {
    fuente = null,
    enlace = null,
    poster = null,
    titulo = 'Vídeo',
    desde = null,
    hasta = null
  }: Props = $props();

  // El id, no la URL. Es una medida de seguridad, no una comodidad: lo que se
  // guarda lo escribe el entrenador y lo que se pinta es un <iframe>. Sacando
  // el identificador y reconstruyendo la dirección, lo único que puede acabar
  // incrustado en la pantalla de un cliente es un vídeo de YouTube.
  const yt = $derived(idDeYoutube(enlace));

  // YouTube entiende el tramo en la propia dirección, así que ahí no hay nada
  // que programar. El `rel=0` evita que al acabar proponga vídeos de otros:
  // esto es material del entrenador, no una sala de estar.
  const urlYoutube = $derived.by(() => {
    if (!yt) return null;
    const p = new URLSearchParams({ rel: '0' });
    if (desde !== null) p.set('start', String(desde));
    if (hasta !== null) p.set('end', String(hasta));
    return `${urlDeEmbebido(yt)}?${p}`;
  });

  let video = $state<HTMLVideoElement | null>(null);

  /**
   * Colocar la aguja al principio del tramo.
   *
   * En `loadedmetadata` y no en `onMount`: antes de tener metadatos, `duration`
   * es NaN y asignar `currentTime` no hace nada. Es el fallo clásico de esto y
   * no da ningún error, simplemente el vídeo empieza en cero.
   */
  function alCargar() {
    if (video && desde !== null) video.currentTime = desde;
  }

  /**
   * Parar al final del tramo.
   *
   * `pause()` y no `currentTime = desde`: rebobinar solo daría la sensación de
   * un bucle que nadie ha pedido. Se para, y quien quiera seguir viendo el
   * resto del vídeo solo tiene que darle otra vez al play.
   */
  function alAvanzar() {
    if (video && hasta !== null && video.currentTime >= hasta) video.pause();
  }

  const etiquetaTramo = $derived.by(() => {
    if (desde === null && hasta === null) return null;
    if (desde !== null && hasta !== null) return `${comoReloj(desde)} – ${comoReloj(hasta)}`;
    if (desde !== null) return `desde ${comoReloj(desde)}`;
    return `hasta ${comoReloj(hasta as number)}`;
  });
</script>

{#if fuente}
  <!-- Vídeo subido por el entrenador. URL firmada porque el cubo es privado:
       su material es parte de lo que vende. -->
  <video
    bind:this={video}
    src={fuente}
    controls
    playsinline
    preload="metadata"
    poster={poster ?? undefined}
    onloadedmetadata={alCargar}
    ontimeupdate={alAvanzar}
    class="w-full aspect-video rounded-md bg-black"
  >
    <track kind="captions" />
  </video>
{:else if urlYoutube}
  <div class="aspect-video rounded-md overflow-hidden bg-black">
    <iframe src={urlYoutube} title={titulo} class="w-full h-full" allowfullscreen></iframe>
  </div>
{/if}

{#if (fuente || urlYoutube) && etiquetaTramo}
  <!-- Se dice qué tramo se está mirando. Si no, alguien que abra el vídeo y lo
       vea empezar en el segundo cuarenta pensará que se ha roto. -->
  <p class="text-xs text-text-mute mt-1.5">
    Fíjate en el tramo <span class="text-text">{etiquetaTramo}</span>
  </p>
{/if}
