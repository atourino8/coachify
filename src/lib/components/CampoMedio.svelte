<script lang="ts">
  /**
   * Vídeo o imagen de un ejercicio, subido o enlazado.
   *
   * POR QUÉ SE SUBE ANTES DE ENVIAR EL FORMULARIO
   * Si el fichero viajara dentro del <form>, el navegador no da progreso y la
   * pantalla se queda parada un minuto con una subida de 4G. El entrenador lo
   * lee como colgado y recarga a mitad. Así que el fichero sube por su cuenta
   * con progreso real y al formulario solo va la ruta resultante.
   *
   * Consecuencia honesta: si sube el fichero y luego NO guarda el formulario,
   * queda un objeto en el cubo sin fila que lo mencione. Se acota escribiendo
   * siempre en la MISMA ruta por ejercicio y tipo, así que como mucho hay un
   * huérfano por hueco, se sobrescribe a la siguiente y no crece sin control.
   */
  import { uploadWithProgress } from '$lib/technique';
  import {
    BUCKET_COACH,
    rutaMedio,
    validarMedio,
    idDeYoutube,
    type MedioTipo
  } from '$lib/coach-media';

  interface Props {
    tipo: MedioTipo;
    titulo: string;
    exerciseId: string;
    coachId: string;
    supabase: { auth: { getSession: () => Promise<{ data: { session: unknown } }> } };
    supabaseUrl: string;
    /** URL enlazada guardada. */
    url: string | null;
    /** Ruta en el cubo de lo subido. */
    path: string | null;
    /** URL firmada de lo subido, para la vista previa. */
    firmada: string | null;
    ayuda?: string;
  }

  let {
    tipo,
    titulo,
    exerciseId,
    coachId,
    supabase,
    supabaseUrl,
    url = $bindable(),
    path = $bindable(),
    firmada,
    ayuda
  }: Props = $props();

  let subiendo = $state(false);
  let progreso = $state(0);
  let problema = $state<string | null>(null);
  let cancelar: (() => void) | null = null;
  let previaLocal = $state<string | null>(null);

  // Derivados y no constantes: `tipo` es una propiedad, y aunque en la
  // práctica no cambie, leerla fuera de un derivado captura solo el valor
  // inicial y el compilador avisa con razón.
  const nombreCampo = $derived(tipo === 'video' ? 'video' : 'image');
  const acepta = $derived(tipo === 'video' ? 'video/mp4,video/webm,video/quicktime' : 'image/*');

  async function elegido(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    problema = validarMedio(file, tipo);
    if (problema) {
      input.value = '';
      return;
    }

    const { data } = await supabase.auth.getSession();
    const token = (data.session as { access_token?: string } | null)?.access_token;
    if (!token) {
      problema = 'Se ha cerrado la sesión. Vuelve a entrar e inténtalo otra vez.';
      return;
    }

    const destino = rutaMedio(coachId, exerciseId, tipo, file.type);
    subiendo = true;
    progreso = 0;

    const handle = uploadWithProgress({
      supabaseUrl,
      accessToken: token,
      bucket: BUCKET_COACH,
      path: destino,
      file,
      onProgress: (p) => (progreso = p)
    });
    cancelar = handle.abort;

    try {
      await handle.promise;
      path = destino;
      // Subir y enlazar son excluyentes: la restricción de la tabla lo
      // rechazaría, así que se limpia aquí y no se le enseña un error por algo
      // que podemos resolver solos.
      url = null;
      if (tipo === 'imagen') previaLocal = URL.createObjectURL(file);
    } catch (err) {
      if ((err as DOMException)?.name !== 'AbortError') {
        problema = (err as Error).message;
      }
    } finally {
      subiendo = false;
      cancelar = null;
      input.value = '';
    }
  }

  function quitar() {
    // Solo se suelta la referencia. El fichero del cubo lo borra el servidor
    // al guardar, cuando ya sabe que el cambio ha ido bien.
    path = null;
    url = null;
    previaLocal = null;
    problema = null;
  }

  const hayAlgo = $derived(Boolean(path || url));
  const idYoutube = $derived(idDeYoutube(url));
  const previaImagen = $derived(previaLocal ?? firmada);
</script>

<div class="space-y-3">
  <p class="block text-xs uppercase tracking-wider text-text-mute">{titulo}</p>

  {#if hayAlgo}
    <div class="flex flex-wrap items-center gap-3 rounded-md border border-line p-3">
      {#if tipo === 'imagen' && previaImagen}
        <img src={previaImagen} alt="" class="w-20 h-20 object-cover rounded-md flex-shrink-0" />
      {/if}
      <span class="flex-1 min-w-0 text-sm">
        {#if path}
          <span class="font-medium block">Subido</span>
          <span class="text-text-mute break-all text-2xs">{path.split('/').pop()}</span>
        {:else if idYoutube}
          <span class="font-medium block">Enlazado de YouTube</span>
          <span class="text-text-mute break-all text-2xs">{url}</span>
        {:else}
          <span class="font-medium block">Enlazado</span>
          <span class="text-text-mute break-all text-2xs">{url}</span>
        {/if}
      </span>
      <button type="button" onclick={quitar} class="action-danger flex-shrink-0">Quitar</button>
    </div>
  {:else if subiendo}
    <div class="space-y-2">
      <div class="h-1.5 rounded-full bg-surface-2 overflow-hidden">
        <div class="h-full bg-accent transition-all duration-200" style="width: {progreso}%"></div>
      </div>
      <div class="flex items-center justify-between gap-3 text-sm">
        <span class="text-text-mute tabular-nums">Subiendo… {progreso}%</span>
        <button
          type="button"
          onclick={() => cancelar?.()}
          class="text-text-mute hover:text-danger transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  {:else}
    <div class="grid grid-cols-2 gap-3">
      <label
        class="border border-line rounded-md p-4 text-center cursor-pointer
               hover:border-line-strong transition-colors"
      >
        <input type="file" accept={acepta} onchange={elegido} class="sr-only" />
        <span class="block text-sm font-medium">Subir {tipo}</span>
        <span class="block text-2xs text-text-mute mt-1">Desde el móvil o el ordenador</span>
      </label>

      <div class="border border-line rounded-md p-4">
        <label for="{nombreCampo}-enlace" class="block text-sm font-medium text-center">
          Enlazar
        </label>
        <input
          id="{nombreCampo}-enlace"
          type="url"
          bind:value={url}
          placeholder={tipo === 'video' ? 'youtube.com/watch?v=…' : 'https://…'}
          class="mt-2 w-full bg-surface-2 border border-line rounded-md px-2 py-1.5 text-2xs
                 focus:outline-none focus:border-accent"
        />
      </div>
    </div>
  {/if}

  <!-- Los valores que viajan al servidor.
       Van en campos ocultos y no en los controles de arriba por dos motivos:
       el control de enlace desaparece en cuanto hay algo elegido, y el de
       subida es un <input type="file">, que mandaría el fichero entero otra
       vez dentro del formulario. Aquí solo viaja la ruta.
       Si hay fichero subido, la URL se manda vacía: son excluyentes. -->
  <input type="hidden" name="{nombreCampo}_path" value={path ?? ''} />
  <input type="hidden" name="{nombreCampo}_url" value={path ? '' : (url ?? '')} />

  {#if problema}
    <p role="alert" class="text-sm text-danger">{problema}</p>
  {:else if ayuda}
    <p class="text-2xs text-text-mute">{ayuda}</p>
  {/if}
</div>
