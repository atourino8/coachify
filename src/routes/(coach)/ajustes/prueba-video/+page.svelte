<script lang="ts">
  /**
   * Banco de pruebas de la compresión de vídeo. NO SUBE NADA.
   *
   * Sirve para probar con vídeos reales del móvil antes de fiarse: se elige un
   * vídeo, se comprime con los ajustes que se quieran y se ven el original y
   * el comprimido uno al lado del otro, con lo que pesa cada uno y lo que
   * tardó. Cada prueba queda apuntada en la tabla de abajo para comparar.
   *
   * Cuando la compresión esté dada por buena, esta página se puede borrar sin
   * que se rompa nada: no la enlaza ninguna otra.
   */
  import {
    COMPRESION,
    comprimirVideo,
    puedeComprimir,
    resumenCompresion,
    type ResultadoCompresion
  } from '$lib/compresion-video';
  import { onMount } from 'svelte';

  let original = $state<File | null>(null);
  let urlOriginal = $state<string | null>(null);
  let urlComprimido = $state<string | null>(null);
  let resultado = $state<ResultadoCompresion | null>(null);
  let error = $state<string | null>(null);
  let trabajando = $state(false);
  let progreso = $state(0);
  let control: AbortController | null = null;

  let ladoCorto = $state<number>(COMPRESION.ladoCorto);
  let mbps = $state<number>(COMPRESION.bitrateVideo / 1_000_000);
  let sinSonido = $state(false);

  let soporte = $state<string>('Comprobando…');
  onMount(() => {
    soporte = puedeComprimir()
      ? 'Este navegador tiene WebCodecs: puede comprimir.'
      : 'Este navegador NO tiene WebCodecs: se subiría el original.';
  });

  type Fila = { nombre: string; ajustes: string; resumen: string };
  let historial = $state<Fila[]>([]);

  function elegir(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const f = input.files?.[0];
    input.value = '';
    if (!f) return;
    if (urlOriginal) URL.revokeObjectURL(urlOriginal);
    if (urlComprimido) URL.revokeObjectURL(urlComprimido);
    original = f;
    urlOriginal = URL.createObjectURL(f);
    urlComprimido = null;
    resultado = null;
    error = null;
  }

  async function comprimir() {
    if (!original) return;
    trabajando = true;
    progreso = 0;
    error = null;
    resultado = null;
    if (urlComprimido) URL.revokeObjectURL(urlComprimido);
    urlComprimido = null;
    control = new AbortController();
    try {
      const r = await comprimirVideo(original, {
        signal: control.signal,
        onProgress: (p) => (progreso = p),
        ladoCorto,
        bitrateVideo: Math.round(mbps * 1_000_000),
        sinSonido
      });
      resultado = r;
      if (r.comprimido) urlComprimido = URL.createObjectURL(r.archivo);
      historial = [
        {
          nombre: original.name,
          ajustes: `${ladoCorto}p · ${mbps} Mbps${sinSonido ? ' · sin sonido' : ''}`,
          resumen: resumenCompresion(r)
        },
        ...historial
      ];
    } catch (err) {
      error =
        (err as DOMException)?.name === 'AbortError' ? 'Cancelado.' : String((err as Error)?.message ?? err);
    } finally {
      trabajando = false;
      control = null;
    }
  }

  function descargar() {
    if (!resultado?.comprimido || !urlComprimido) return;
    const a = document.createElement('a');
    a.href = urlComprimido;
    a.download = resultado.archivo.name;
    a.click();
  }

  const mb = (b: number) => (b / 1048576).toFixed(1) + ' MB';
</script>

<svelte:head>
  <title>Prueba de compresión de vídeo</title>
</svelte:head>

<div class="max-w-4xl space-y-8">
  <div>
    <a href="/ajustes" class="text-sm text-text-mute hover:text-text">← Ajustes</a>
    <h1 class="text-2xl font-display font-semibold mt-2">Prueba de compresión de vídeo</h1>
    <p class="text-sm text-text-mute mt-1">
      Aquí no se sube nada. Elige un vídeo del móvil, comprímelo y compara. Los ajustes por defecto
      son los que se usan al subir de verdad.
    </p>
    <p class="text-xs text-text-mute mt-2">{soporte}</p>
  </div>

  <section class="card space-y-4">
    <label class="btn-primary inline-flex cursor-pointer">
      <input type="file" accept="video/*" onchange={elegir} class="sr-only" />
      {original ? 'Elegir otro vídeo' : 'Elegir vídeo'}
    </label>
    {#if original}
      <p class="text-sm">
        <span class="font-medium">{original.name}</span>
        <span class="text-text-mute tabular-nums"> · {mb(original.size)} · {original.type || 'tipo desconocido'}</span>
      </p>
    {/if}

    <div class="grid gap-4 sm:grid-cols-3">
      <label class="block text-sm">
        <span class="block text-2xs uppercase tracking-wider text-text-mute mb-1.5">Lado corto</span>
        <select bind:value={ladoCorto} class="w-full px-3 py-2 bg-bg border border-line rounded-md">
          <option value={480}>480 p</option>
          <option value={720}>720 p (por defecto)</option>
          <option value={1080}>1080 p</option>
        </select>
      </label>
      <label class="block text-sm">
        <span class="block text-2xs uppercase tracking-wider text-text-mute mb-1.5">Calidad (Mbps)</span>
        <select bind:value={mbps} class="w-full px-3 py-2 bg-bg border border-line rounded-md">
          <option value={1}>1 Mbps</option>
          <option value={1.5}>1,5 Mbps</option>
          <option value={2}>2 Mbps (por defecto)</option>
          <option value={3}>3 Mbps</option>
          <option value={4}>4 Mbps</option>
        </select>
      </label>
      <label class="flex items-center gap-2 text-sm sm:pt-6">
        <input type="checkbox" bind:checked={sinSonido} />
        Quitar el sonido
      </label>
    </div>

    {#if trabajando}
      <div class="space-y-2">
        <div class="h-1.5 rounded-full bg-surface-2 overflow-hidden">
          <div class="h-full bg-accent transition-all duration-200" style="width: {progreso}%"></div>
        </div>
        <div class="flex items-center justify-between text-sm">
          <span class="text-text-mute tabular-nums">Comprimiendo… {progreso}%</span>
          <button type="button" class="action-neutral" onclick={() => control?.abort()}>Cancelar</button>
        </div>
      </div>
    {:else}
      <button type="button" class="btn-primary" disabled={!original} onclick={comprimir}>Comprimir</button>
    {/if}

    {#if error}
      <p role="alert" class="text-sm text-danger">{error}</p>
    {/if}
    {#if resultado}
      <p class="text-sm tabular-nums {resultado.comprimido ? '' : 'text-warning'}">
        {resumenCompresion(resultado)}
      </p>
    {/if}
  </section>

  {#if urlOriginal}
    <section class="grid gap-4 md:grid-cols-2">
      <div class="space-y-2">
        <h2 class="text-sm font-medium">Original</h2>
        <!-- svelte-ignore a11y_media_has_caption -->
        <video src={urlOriginal} controls playsinline class="w-full rounded-md bg-surface-2"></video>
      </div>
      <div class="space-y-2">
        <h2 class="text-sm font-medium">Comprimido</h2>
        {#if urlComprimido}
          <!-- svelte-ignore a11y_media_has_caption -->
          <video src={urlComprimido} controls playsinline class="w-full rounded-md bg-surface-2"></video>
          <button type="button" class="action-neutral" onclick={descargar}>Descargar el comprimido</button>
        {:else}
          <p class="text-sm text-text-mute">Todavía no hay.</p>
        {/if}
      </div>
    </section>
  {/if}

  {#if historial.length}
    <section class="space-y-2">
      <h2 class="text-sm font-medium">Pruebas de esta sesión</h2>
      <p class="text-2xs text-text-mute">Se borran al recargar. Copia lo que quieras guardar.</p>
      <div class="border-t border-line text-sm">
        {#each historial as f, i (i)}
          <div class="py-2 border-b border-line">
            <div class="font-medium truncate">{f.nombre} <span class="text-text-mute font-normal">· {f.ajustes}</span></div>
            <div class="text-text-mute tabular-nums">{f.resumen}</div>
          </div>
        {/each}
      </div>
    </section>
  {/if}
</div>
