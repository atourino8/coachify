<script lang="ts">
  /**
   * El vídeo de un ejercicio: cuál, qué tramo y qué mirar.
   *
   * NO ES «CampoMedio» OTRA VEZ, aunque se le parezca. CampoMedio sube un
   * fichero que pertenece a UN ejercicio. Esto ELIGE entre los vídeos que ya
   * tiene el entrenador, y solo sube uno nuevo si hace falta (ADR-005).
   *
   * Esa diferencia es el producto entero: el curl analítico y el isométrico son
   * el mismo movimiento grabado. Si cada ejercicio tuviera su vídeo, el
   * entrenador subiría dos veces lo mismo y pagaríamos el doble por el
   * almacenamiento, que es la parte cara de esto.
   *
   * POR QUÉ EL ID DEL VÍDEO SE INVENTA AQUÍ Y NO EN EL SERVIDOR
   *
   * El fichero sube ANTES de enviar el formulario, para poder dar progreso real
   * (si viajara dentro del <form>, la pantalla se queda un minuto parada con
   * 4G y el entrenador recarga a mitad). Pero la ruta en el cubo tiene que
   * llevar el id del vídeo, y ese id no existe hasta que el servidor inserta la
   * fila. Se rompe el círculo generando el id aquí: es un uuid, no colisiona, y
   * el servidor lo usa tal cual.
   *
   * Consecuencia honesta: si sube el vídeo y luego NO guarda, queda un fichero
   * en el cubo sin fila que lo mencione. Es el mismo trato que ya se aceptó
   * para CampoMedio, con una diferencia a peor: aquí la ruta lleva un uuid
   * nuevo cada vez, así que los huérfanos NO se sobrescriben entre sí. Anotado
   * en LECCIONES.md como lo que hay que vigilar cuando esto tenga uso real.
   */
  import { uploadWithProgress } from '$lib/technique';
  import Icono from '$lib/components/Icono.svelte';
  import Reproductor from '$lib/components/Reproductor.svelte';
  import { BUCKET_COACH, rutaVideo, validarMedio, comoReloj } from '$lib/coach-media';

  interface VideoDisponible {
    id: string;
    nombre: string;
    /** URL firmada de lo subido, o null si es un enlace. */
    firmada: string | null;
    url: string | null;
  }

  interface Props {
    coachId: string;
    supabase: { auth: { getSession: () => Promise<{ data: { session: unknown } }> } };
    supabaseUrl: string;
    /** Los vídeos que ya tiene el entrenador. */
    disponibles: VideoDisponible[];
    /** El vídeo elegido ahora mismo, o null. */
    videoId: string | null;
    desde: number | null;
    hasta: number | null;
    nota: string | null;
    /** Cuántos ejercicios usan cada vídeo. Para avisar antes de borrar. */
    usos: Record<string, number>;
  }

  let {
    coachId,
    supabase,
    supabaseUrl,
    disponibles,
    videoId = $bindable(),
    desde = $bindable(),
    hasta = $bindable(),
    nota = $bindable(),
    usos
  }: Props = $props();

  /** Lo que se acaba de subir o enlazar y todavía no existe en la base. */
  let nuevoId = $state<string | null>(null);
  let nuevoPath = $state<string | null>(null);
  let nuevoUrl = $state('');
  let nuevoNombre = $state('');
  let previaLocal = $state<string | null>(null);

  let subiendo = $state(false);
  let progreso = $state(0);
  let problema = $state<string | null>(null);
  let cancelar: (() => void) | null = null;
  let eligiendo = $state(false);

  const actual = $derived(disponibles.find((v) => v.id === videoId) ?? null);
  const hayNuevo = $derived(Boolean(nuevoPath || nuevoUrl.trim()));
  const hayAlgo = $derived(Boolean(actual) || hayNuevo);

  async function elegido(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    problema = validarMedio(file, 'video');
    if (problema) {
      input.value = '';
      return;
    }

    const { data } = await supabase.auth.getSession();
    const token = (data.session as { access_token?: string } | null)?.access_token;
    if (!token) {
      problema = 'Se ha cerrado la sesión. Vuelve a entrar e inténtalo otra vez.';
      input.value = '';
      return;
    }

    const id = crypto.randomUUID();
    const destino = rutaVideo(coachId, id, file.type);
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
      nuevoId = id;
      nuevoPath = destino;
      nuevoUrl = '';
      // El nombre por defecto es el del fichero sin extensión. Ponerlo vale
      // más que dejarlo vacío: lo normal es que ya se llame «curl-biceps.mp4»,
      // y si no le vale, lo cambia — pero no se le obliga a inventar uno para
      // poder seguir.
      if (!nuevoNombre) nuevoNombre = file.name.replace(/\.[^.]+$/, '').slice(0, 80);
      previaLocal = URL.createObjectURL(file);
      videoId = null;
      eligiendo = false;
    } catch (err) {
      if ((err as DOMException)?.name !== 'AbortError') problema = (err as Error).message;
    } finally {
      subiendo = false;
      cancelar = null;
      input.value = '';
    }
  }

  function quitar() {
    // Solo suelta la referencia. El vídeo NO se borra del cubo: puede estar en
    // uso por otros ejercicios, y quitarlo de aquí no dice nada de ellos. Para
    // borrarlo de verdad está el botón de abajo, que sí dice a cuántos afecta.
    videoId = null;
    nuevoId = null;
    nuevoPath = null;
    nuevoUrl = '';
    nuevoNombre = '';
    previaLocal = null;
    problema = null;
    desde = null;
    hasta = null;
  }

  function elegirExistente(id: string) {
    videoId = id;
    nuevoId = null;
    nuevoPath = null;
    nuevoUrl = '';
    previaLocal = null;
    eligiendo = false;
  }

  /** Los segundos como texto para el <input>, sin convertir null en «0». */
  function aTexto(v: number | null) {
    return v === null ? '' : String(v);
  }
  function deTexto(v: string): number | null {
    const t = v.trim();
    if (t === '') return null;
    const n = Math.floor(Number(t));
    return Number.isFinite(n) && n >= 0 ? n : null;
  }

  const usadoPor = $derived(videoId ? (usos[videoId] ?? 0) : 0);
</script>

<div class="space-y-3">
  <p class="block text-xs uppercase tracking-wider text-text-mute">Vídeo</p>

  {#if subiendo}
    <div class="space-y-2">
      <div class="h-1.5 rounded-full bg-surface-2 overflow-hidden">
        <div class="h-full bg-accent transition-all duration-200" style="width: {progreso}%"></div>
      </div>
      <div class="flex items-center justify-between gap-3 text-sm">
        <span class="text-text-mute tabular-nums">Subiendo… {progreso}%</span>
        <button
          type="button"
          onclick={() => cancelar?.()}
          class="text-text-mute hover:text-danger transition-colors">Cancelar</button
        >
      </div>
    </div>
  {:else if hayAlgo}
    <div class="rounded-md border border-line p-3 space-y-3">
      <div class="flex flex-wrap items-start gap-3">
        <span class="flex-1 min-w-0 text-sm">
          {#if actual}
            <span class="font-medium block truncate">{actual.nombre}</span>
            <span class="text-2xs text-text-mute">
              {#if usadoPor > 1}
                Lo usan {usadoPor} ejercicios. Si lo cambias, cambia en todos.
              {:else}
                De tu biblioteca de vídeos
              {/if}
            </span>
          {:else}
            <span class="font-medium block">Vídeo nuevo, sin guardar todavía</span>
            <span class="text-2xs text-text-mute">Se añade a tu biblioteca al guardar</span>
          {/if}
        </span>
        <button type="button" onclick={quitar} class="action-danger flex-shrink-0">Quitar</button>
      </div>

      {#if hayNuevo}
        <div>
          <label
            for="video-nombre"
            class="block text-2xs uppercase tracking-wider text-text-mute mb-1.5"
          >
            Cómo se llama
          </label>
          <input
            id="video-nombre"
            bind:value={nuevoNombre}
            maxlength="80"
            placeholder="Curl de bíceps con mancuerna"
            class="w-full px-3 py-2 bg-bg border border-line rounded-md text-sm focus:border-accent"
          />
          <p class="text-2xs text-text-mute mt-1">
            Es el nombre con el que lo vas a reconocer cuando lo reutilices en otra variante.
          </p>
        </div>
      {/if}

      <Reproductor
        fuente={previaLocal ?? actual?.firmada}
        enlace={nuevoUrl.trim() || actual?.url}
        titulo="Vista previa"
        {desde}
        {hasta}
      />

      <!-- ===== El tramo =====
           Dos números y ningún editor de línea de tiempo, a propósito
           (ADR-005 § 3): obligar a rebobinar al segundo exacto en un móvil,
           para cada variante de cada ejercicio, choca con la premisa de que si
           no es obvio en treinta segundos se replantea. -->
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label
            for="video-desde"
            class="block text-2xs uppercase tracking-wider text-text-mute mb-1.5"
            >Desde (seg.)</label
          >
          <input
            id="video-desde"
            type="number"
            min="0"
            inputmode="numeric"
            value={aTexto(desde)}
            oninput={(e) => (desde = deTexto(e.currentTarget.value))}
            placeholder="0"
            class="w-full px-3 py-2 bg-bg border border-line rounded-md text-sm focus:border-accent"
          />
        </div>
        <div>
          <label
            for="video-hasta"
            class="block text-2xs uppercase tracking-wider text-text-mute mb-1.5"
            >Hasta (seg.)</label
          >
          <input
            id="video-hasta"
            type="number"
            min="1"
            inputmode="numeric"
            value={aTexto(hasta)}
            oninput={(e) => (hasta = deTexto(e.currentTarget.value))}
            placeholder="final"
            class="w-full px-3 py-2 bg-bg border border-line rounded-md text-sm focus:border-accent"
          />
        </div>
      </div>
      <p class="text-2xs text-text-mute">
        {#if desde !== null && hasta !== null}
          Tu cliente verá el tramo <span class="text-text"
            >{comoReloj(desde)} – {comoReloj(hasta)}</span
          >. Puede seguir viendo el resto si quiere.
        {:else}
          Déjalo vacío para el vídeo entero. Sirve para reutilizar un mismo vídeo en varias
          variantes: el isométrico es un trozo del movimiento completo.
        {/if}
      </p>

      <!-- ===== La nota de ESTA variante ===== -->
      <div>
        <label
          for="video-nota"
          class="block text-2xs uppercase tracking-wider text-text-mute mb-1.5"
          >Qué mirar en este vídeo</label
        >
        <textarea
          id="video-nota"
          name="video_nota"
          bind:value={nota}
          rows="2"
          maxlength="300"
          placeholder="Sube la mancuerna explosivo y bájala lento, contando tres"
          class="w-full px-3 py-2 bg-bg border border-line rounded-md text-sm focus:border-accent resize-none"
        ></textarea>
        <p class="text-2xs text-text-mute mt-1">
          <strong class="text-text">La lee tu cliente</strong>, junto al vídeo. Va en el ejercicio y
          no en el vídeo: es justo lo que distingue esta variante de las otras que usan la misma
          grabación.
        </p>
      </div>
    </div>
  {:else if eligiendo}
    <div class="rounded-md border border-line p-3 space-y-2">
      {#if disponibles.length === 0}
        <p class="text-sm text-text-mute">
          Todavía no tienes vídeos. Sube el primero y a partir de ahí podrás reutilizarlo.
        </p>
      {:else}
        {#each disponibles as v (v.id)}
          <button
            type="button"
            onclick={() => elegirExistente(v.id)}
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-md border border-line
                   hover:border-text-mute/40 text-left transition-colors"
          >
            <Icono nombre="video" class="w-4 h-4 flex-shrink-0 text-text-mute" />
            <span class="min-w-0 flex-1">
              <span class="block text-sm truncate">{v.nombre}</span>
              {#if (usos[v.id] ?? 0) > 0}
                <span class="block text-2xs text-text-mute">
                  En {usos[v.id]}
                  {usos[v.id] === 1 ? 'ejercicio' : 'ejercicios'}
                </span>
              {/if}
            </span>
          </button>
        {/each}
      {/if}
      <button type="button" onclick={() => (eligiendo = false)} class="btn-ghost text-sm w-full"
        >Cancelar</button
      >
    </div>
  {:else}
    <div class="grid grid-cols-3 gap-3">
      <button
        type="button"
        onclick={() => (eligiendo = true)}
        disabled={disponibles.length === 0}
        class="border border-line rounded-md p-4 text-center transition-colors
               hover:border-line-strong disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Icono nombre="rutinas" class="w-6 h-6 mx-auto mb-2 text-text-mute" />
        <span class="block text-sm font-medium">Reutilizar</span>
        <span class="block text-2xs text-text-mute mt-1">
          {#if disponibles.length === 0}
            Aún no tienes vídeos
          {:else}
            {disponibles.length}
            {disponibles.length === 1 ? 'vídeo tuyo' : 'vídeos tuyos'}
          {/if}
        </span>
      </button>

      <label
        class="border border-line rounded-md p-4 text-center cursor-pointer
               hover:border-line-strong transition-colors"
      >
        <input
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          onchange={elegido}
          class="sr-only"
        />
        <Icono nombre="subir" class="w-6 h-6 mx-auto mb-2 text-text-mute" />
        <span class="block text-sm font-medium">Subir</span>
        <span class="block text-2xs text-text-mute mt-1">Hasta 100 MB</span>
      </label>

      <div class="border border-line rounded-md p-4">
        <Icono nombre="enlace" class="w-6 h-6 mx-auto mb-2 text-text-mute" />
        <label for="video-enlace" class="block text-sm font-medium text-center">Enlazar</label>
        <input
          id="video-enlace"
          type="url"
          bind:value={nuevoUrl}
          placeholder="youtube.com/watch?v=…"
          class="mt-2 w-full bg-surface-2 border border-line rounded-md px-2 py-1.5 text-2xs
                 focus:outline-none focus:border-accent"
        />
      </div>
    </div>
  {/if}

  <!-- Lo que viaja al servidor.
       Campos ocultos y no los controles de arriba: el de subir es un
       <input type="file"> y mandaría el fichero entero otra vez, y los de
       elegir desaparecen en cuanto hay algo puesto. -->
  <input type="hidden" name="video_id" value={videoId ?? ''} />
  <input type="hidden" name="video_nuevo_id" value={nuevoId ?? ''} />
  <input type="hidden" name="video_nuevo_path" value={nuevoPath ?? ''} />
  <input type="hidden" name="video_nuevo_url" value={nuevoPath ? '' : nuevoUrl.trim()} />
  <input type="hidden" name="video_nuevo_nombre" value={nuevoNombre.trim()} />
  <input type="hidden" name="video_desde" value={aTexto(desde)} />
  <input type="hidden" name="video_hasta" value={aTexto(hasta)} />

  {#if problema}
    <p role="alert" class="text-sm text-danger">{problema}</p>
  {/if}
</div>
