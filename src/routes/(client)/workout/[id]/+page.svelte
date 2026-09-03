<script lang="ts">
  import { fechaCorta } from '$lib/formato';
  import { idDeYoutube, urlDeEmbebido, miniaturaDeYoutube } from '$lib/coach-media';
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { page } from '$app/state';
  import { PUBLIC_SUPABASE_URL } from '$env/static/public';
  import {
    validateVideo,
    videoPath,
    formatBytes,
    readDuration,
    uploadWithProgress,
    type UploadHandle
  } from '$lib/technique';
  import type { SetLog } from '$lib/supabase/types';

  let { data, form } = $props();

  // ---- Vídeo de técnica ----
  let uploading = $state(false);
  let uploadPct = $state(0);
  // Dos fases: la subida (lenta, con progreso real) y el guardado del registro
  // (instantáneo). Mezclarlas en una sola barra es lo que hacía que se quedara
  // parada en un número raro.
  let uploadPhase = $state<'subiendo' | 'guardando'>('subiendo');
  let videoError = $state('');
  let consent = $state(false);
  let fileInput = $state<HTMLInputElement | null>(null);
  // Guardamos el archivo para poder reintentar sin obligar a volver a grabarlo.
  let pendingFile = $state<File | null>(null);
  let currentUpload: UploadHandle | null = null;

  // Solo hace falta consentir la primera vez (si ya tiene vídeos, ya consintió).
  const needsConsent = $derived(!data.techniqueFirst && !data.techniqueLatest);

  async function handleFile(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    videoError = '';
    const problem = await validateVideo(file);
    if (problem) {
      videoError = problem;
      return;
    }
    if (!data.coachId) {
      videoError = 'Necesitas tener un entrenador asignado para enviar vídeos.';
      return;
    }
    pendingFile = file;
    await sendVideo(file);
  }

  async function sendVideo(file: File) {
    if (!data.coachId) return;
    videoError = '';

    // Primera subida → 'first' (no se pisa nunca). Siguientes → 'latest'.
    const kind = data.techniqueFirst ? 'latest' : 'first';
    const path = videoPath(data.clientId, data.item.exercise_id, kind, file.type);
    const duration = await readDuration(file);

    const supabase = page.data.supabase;
    const {
      data: { session }
    } = await supabase.auth.getSession();
    if (!session) {
      videoError = 'Tu sesión ha caducado. Vuelve a entrar e inténtalo otra vez.';
      return;
    }

    uploading = true;
    uploadPhase = 'subiendo';
    uploadPct = 0;

    try {
      currentUpload = uploadWithProgress({
        supabaseUrl: PUBLIC_SUPABASE_URL,
        accessToken: session.access_token,
        path,
        file,
        onProgress: (pct) => (uploadPct = pct)
      });
      await currentUpload.promise;

      uploadPhase = 'guardando';
      const { error: dbErr } = await supabase.from('technique_videos').upsert(
        {
          client_id: data.clientId,
          coach_id: data.coachId,
          exercise_id: data.item.exercise_id,
          kind,
          storage_path: path,
          duration_seconds: duration ? Math.round(duration) : null,
          size_bytes: file.size,
          // Una versión nueva invalida el comentario anterior del coach.
          coach_comment: null,
          coach_comment_at: null
        },
        { onConflict: 'client_id,exercise_id,kind' }
      );
      if (dbErr) throw dbErr;

      pendingFile = null;
      await invalidateAll();
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        videoError = '';
      } else {
        videoError = err instanceof Error ? err.message : 'No se pudo subir el vídeo.';
      }
    } finally {
      currentUpload = null;
      uploading = false;
      uploadPct = 0;
    }
  }

  function cancelUpload() {
    currentUpload?.abort();
  }

  function logForSet(n: number) {
    return data.item.set_logs?.find((l: SetLog) => l.set_number === n);
  }

  const ytId = $derived(idDeYoutube(data.item.exercise.video_url));

  // La imagen se enseña SIEMPRE que exista, junto al vídeo y no dentro de él.
  //
  // El motivo no es decorativo: quien ya se ha visto el vídeo tres veces no
  // necesita el vídeo, necesita acordarse de la posición. Y en el gimnasio,
  // con prisa y el móvil en la mano, mirar una foto es más rápido que cargar
  // un vídeo y buscar el segundo doce.
  const imagen = $derived(
    data.imagenCoach ?? data.item.exercise.image_url ?? (ytId ? miniaturaDeYoutube(ytId) : null)
  );
  const sets = $derived(Array.from({ length: data.item.sets }, (_, i) => i + 1));

  let activeSet = $state<number | null>(null);
  let reps = $state('');
  let weight = $state('');
  let feedback = $state<'easy' | 'just_right' | 'hard' | ''>('');

  function openSet(n: number) {
    const existing = logForSet(n);
    reps = existing?.reps_done?.toString() ?? '';
    weight = existing?.weight_done?.toString() ?? '';
    feedback = (existing?.feedback as never) ?? '';
    activeSet = n;
  }

  function closeSet() {
    activeSet = null;
  }
</script>

<svelte:head>
  <title>{data.item.exercise.name} · Treno</title>
</svelte:head>

<div class="space-y-6">
  <a href="/today" class="text-sm text-text-mute hover:text-text">← Volver al día</a>

  <!-- Material del ejercicio.
       Orden a propósito: primero el vídeo si lo hay, y la imagen SIEMPRE
       visible debajo cuando existe. No es la miniatura del vídeo: es la
       chuleta de la posición para quien ya se lo ha visto. -->
  {#if data.videoCoach}
    <!-- Vídeo subido por el entrenador. Se sirve con URL firmada porque el
         cubo es privado: su material es parte de lo que vende. -->
    <video
      src={data.videoCoach}
      controls
      playsinline
      preload="metadata"
      poster={data.imagenCoach ?? undefined}
      class="w-full aspect-video rounded-md bg-black"
    >
      <track kind="captions" />
    </video>
  {:else if ytId}
    <div class="aspect-video rounded-md overflow-hidden bg-black">
      <iframe
        src={urlDeEmbebido(ytId)}
        title={data.item.exercise.name}
        class="w-full h-full"
        allowfullscreen
      ></iframe>
    </div>
  {/if}

  {#if imagen}
    <figure class="space-y-1">
      <img
        src={imagen}
        alt="Posición de {data.item.exercise.name}"
        loading="lazy"
        class="w-full rounded-md border border-line"
      />
      <figcaption class="text-2xs text-text-mute">
        La posición, para cuando ya te sabes el vídeo.
      </figcaption>
    </figure>
  {/if}

  <div>
    <h1 class="text-2xl sm:text-3xl font-display font-semibold tracking-tight">
      {data.item.exercise.name}
    </h1>
    {#if data.item.exercise.description}
      <p class="text-text-mute mt-2 italic">{data.item.exercise.description}</p>
    {/if}
    <div class="text-sm text-text-mute mt-3">
      Prescrito:
      <strong class="text-text"
        >{data.item.sets} series · {data.item.reps_prescribed ?? '?'} reps</strong
      >
      {#if data.item.weight_prescribed}· <strong class="text-text"
          >{data.item.weight_prescribed}</strong
        >{/if}
      {#if data.item.rest_seconds}· descanso {data.item.rest_seconds}s{/if}
    </div>
    {#if data.item.notes}
      <div class="text-sm bg-primary/10 border-l-2 border-primary rounded-r px-3 py-2 mt-3 italic">
        {data.item.notes}
      </div>
    {/if}
  </div>

  <!-- Series -->
  <div class="space-y-2">
    <h2 class="text-sm uppercase tracking-wider text-text-mute">Series</h2>
    {#each sets as n}
      {@const log = logForSet(n)}
      {@const done = !!log}
      <button
        onclick={() => openSet(n)}
        class="card w-full flex items-center gap-4 hover:border-primary/50 transition-all {done
          ? 'border-success/40'
          : ''} {activeSet === n ? 'border-primary' : ''}"
      >
        <div
          class="w-10 h-10 rounded-full grid place-items-center text-sm font-bold {done
            ? 'bg-success text-bg'
            : 'bg-surface-2 text-text-mute'}"
        >
          {done ? '✓' : n}
        </div>
        <div class="flex-1 text-left">
          <div class="font-medium">Serie {n}</div>
          {#if done}
            <div class="text-xs text-text-mute mt-0.5">
              {log.weight_done ?? '?'} kg · {log.reps_done ?? '?'} reps
              {#if log.feedback}
                · {log.feedback === 'easy' ? '😌' : log.feedback === 'just_right' ? '😅' : '🥵'}
              {/if}
            </div>
          {:else}
            <div class="text-xs text-text-mute mt-0.5">Toca para registrar</div>
          {/if}
        </div>
        <div class="text-text-mute">›</div>
      </button>

      {#if activeSet === n}
        <form
          method="POST"
          action="?/logSet"
          use:enhance={() => {
            return async ({ update }) => {
              await update();
              if (form?.success && form.set_number === n) {
                closeSet();
              }
            };
          }}
          class="card border-primary space-y-4 animate-in"
        >
          <input type="hidden" name="set_number" value={n} />
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="log-weight" class="text-xs uppercase tracking-wider text-text-mute"
                >Peso (kg)</label
              >
              <input
                id="log-weight"
                name="weight_done"
                type="number"
                step="0.5"
                bind:value={weight}
                placeholder={data.item.weight_prescribed ?? '0'}
                class="w-full px-3 py-2 bg-bg border border-text-mute/20 rounded-md text-lg font-semibold focus:border-primary"
              />
            </div>
            <div>
              <label for="log-reps" class="text-xs uppercase tracking-wider text-text-mute"
                >Reps reales</label
              >
              <input
                id="log-reps"
                name="reps_done"
                type="number"
                bind:value={reps}
                placeholder={data.item.reps_prescribed ?? '0'}
                class="w-full px-3 py-2 bg-bg border border-text-mute/20 rounded-md text-lg font-semibold focus:border-primary"
              />
            </div>
          </div>
          <fieldset class="border-0 p-0 m-0">
            <legend class="text-xs uppercase tracking-wider text-text-mute mb-2 block">
              ¿Cómo te salió?
            </legend>
            <div class="grid grid-cols-3 gap-2">
              <label
                class="card cursor-pointer text-center py-3 {feedback === 'easy'
                  ? 'border-primary'
                  : ''}"
              >
                <input
                  type="radio"
                  name="feedback"
                  value="easy"
                  bind:group={feedback}
                  class="sr-only"
                />
                <div class="text-2xl">😌</div>
                <div class="text-xs text-text-mute">Fácil</div>
              </label>
              <label
                class="card cursor-pointer text-center py-3 {feedback === 'just_right'
                  ? 'border-primary'
                  : ''}"
              >
                <input
                  type="radio"
                  name="feedback"
                  value="just_right"
                  bind:group={feedback}
                  class="sr-only"
                />
                <div class="text-2xl">😅</div>
                <div class="text-xs text-text-mute">Justo</div>
              </label>
              <label
                class="card cursor-pointer text-center py-3 {feedback === 'hard'
                  ? 'border-primary'
                  : ''}"
              >
                <input
                  type="radio"
                  name="feedback"
                  value="hard"
                  bind:group={feedback}
                  class="sr-only"
                />
                <div class="text-2xl">🥵</div>
                <div class="text-xs text-text-mute">Duro</div>
              </label>
            </div>
          </fieldset>
          <div class="flex gap-2">
            <button type="submit" class="btn-primary flex-1">Guardar serie</button>
            <button type="button" onclick={closeSet} class="btn-ghost">Cerrar</button>
          </div>
        </form>
      {/if}
    {/each}
  </div>

  <!-- ===== VÍDEO DE TÉCNICA ===== -->
  <section class="space-y-3">
    <div>
      <h2 class="text-sm uppercase tracking-wider text-text-mute">Vídeo de técnica</h2>
      <p class="text-xs text-text-mute mt-1">
        Graba una serie (máx. 1 minuto) y tu entrenador te corregirá la postura.
      </p>
    </div>

    {#if videoError}
      <p
        role="alert"
        class="text-sm text-danger bg-danger/10 border border-danger/20 rounded-md p-3"
      >
        {videoError}
      </p>
    {/if}

    <!-- Vídeos existentes: antes / actual -->
    {#if data.techniqueFirst || data.techniqueLatest}
      <div class="grid {data.techniqueLatest ? 'sm:grid-cols-2' : ''} gap-3">
        {#each [{ v: data.techniqueFirst, label: data.techniqueLatest ? 'Primer vídeo' : 'Tu vídeo', k: 'first' }, { v: data.techniqueLatest, label: 'Más reciente', k: 'latest' }] as slot (slot.k)}
          {#if slot.v}
            <div class="card p-3 space-y-2">
              <div class="flex items-center justify-between gap-2">
                <span class="text-xs uppercase tracking-wider text-text-mute">{slot.label}</span>
                <span class="text-2xs text-text-mute">
                  {fechaCorta(slot.v.created_at)}
                </span>
              </div>
              {#if data.techniqueUrls[slot.k]}
                <!-- svelte-ignore a11y_media_has_caption -->
                <video
                  src={data.techniqueUrls[slot.k]}
                  controls
                  playsinline
                  class="w-full max-h-72 rounded-md bg-black"
                ></video>
              {/if}
              <div class="flex items-center justify-between gap-2">
                <span class="text-2xs text-text-mute">
                  {slot.v.duration_seconds ? `${slot.v.duration_seconds}s · ` : ''}{formatBytes(
                    slot.v.size_bytes
                  )}
                </span>
                <form method="POST" action="?/deleteVideo" use:enhance>
                  <input type="hidden" name="video_id" value={slot.v.id} />
                  <button
                    type="submit"
                    class="text-2xs text-text-mute hover:text-danger transition-colors"
                  >
                    Eliminar
                  </button>
                </form>
              </div>

              {#if slot.v.coach_comment}
                <div class="text-sm bg-primary/10 border-l-2 border-primary rounded-r px-3 py-2">
                  <div class="text-3xs uppercase tracking-wider text-primary mb-1">
                    Corrección de tu entrenador
                  </div>
                  {slot.v.coach_comment}
                </div>
              {:else}
                <p class="text-2xs text-text-mute italic">
                  Pendiente de revisar por tu entrenador.
                </p>
              {/if}
            </div>
          {/if}
        {/each}
      </div>
    {/if}

    <!-- Subir / reemplazar -->
    <div class="card space-y-3">
      {#if needsConsent}
        <label class="flex items-start gap-2 text-xs text-text-mute cursor-pointer">
          <input type="checkbox" bind:checked={consent} class="mt-0.5" />
          <span>
            Acepto enviar un vídeo mío a mi entrenador para que corrija mi técnica. Solo lo verá él
            y puedo eliminarlo cuando quiera.
          </span>
        </label>
      {/if}

      {#if uploading}
        <div class="space-y-2">
          <div class="flex items-baseline justify-between gap-3 text-xs">
            <span class="font-medium">
              {uploadPhase === 'guardando' ? 'Guardando…' : 'Subiendo vídeo'}
            </span>
            {#if uploadPhase === 'subiendo'}
              <span class="tabular-nums text-text-mute">
                {uploadPct}%{pendingFile ? ' de ' + formatBytes(pendingFile.size) : ''}
              </span>
            {/if}
          </div>
          <div
            class="h-2 bg-surface-2 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={uploadPhase === 'guardando' ? 100 : uploadPct}
            aria-valuemin="0"
            aria-valuemax="100"
            aria-label="Progreso de la subida del vídeo"
          >
            <div
              class="h-full bg-accent transition-all duration-200"
              style="width: {uploadPhase === 'guardando' ? 100 : uploadPct}%"
            ></div>
          </div>
          <div class="flex items-center justify-between gap-3">
            <p class="text-xs text-text-mute">No cierres la página.</p>
            {#if uploadPhase === 'subiendo'}
              <button type="button" onclick={cancelUpload} class="action-neutral">Cancelar</button>
            {/if}
          </div>
        </div>
      {:else}
        <!-- Si falló a media subida no le hacemos volver a grabar: el archivo
             sigue en memoria y se reintenta con un toque. -->
        {#if pendingFile && videoError}
          <button
            type="button"
            onclick={() => pendingFile && sendVideo(pendingFile)}
            class="btn-primary w-full"
          >
            Reintentar la subida
          </button>
        {/if}
        <input
          bind:this={fileInput}
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          capture="environment"
          onchange={handleFile}
          class="sr-only"
          id="tech-video"
        />
        <button
          type="button"
          onclick={() => fileInput?.click()}
          disabled={needsConsent && !consent}
          class="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {data.techniqueFirst ? 'Subir nuevo vídeo' : 'Grabar / subir vídeo'}
        </button>
        <p class="text-2xs text-text-mute text-center">
          {#if data.techniqueFirst}
            Se guardará como el más reciente y sustituirá al anterior. Tu primer vídeo se conserva
            para comparar.
          {:else}
            Máx. 1 minuto y 50 MB · MP4, WebM o MOV
          {/if}
        </p>
      {/if}
    </div>
  </section>
</div>
