<script lang="ts">
  import { enhance } from '$app/forms';
  import { untrack } from 'svelte';
  import {
    ACENTO_TRENO,
    CONTRASTE_MINIMO,
    derivarMarca,
    esHexValido,
    estiloDeMarca,
    rgbAHex
  } from '$lib/brand';

  let { data, form } = $props();

  // Lo guardado es el punto de partida, no la fuente de verdad continua: en
  // cuanto el entrenador toca la rueda de color, manda lo que él tenga puesto.
  // El untrack dice justo eso —queremos el valor inicial y solo ese—, y de
  // paso evita que al recargar los datos tras guardar se le pisen los cambios
  // que estuviera haciendo.
  let accent = $state(untrack(() => data.accent) ?? ACENTO_TRENO);
  let usarSegundo = $state(untrack(() => data.accent2) !== null);
  let accent2 = $state(untrack(() => data.accent2) ?? ACENTO_TRENO);
  let guardando = $state(false);

  // El nombre sí sigue a los datos: si lo cambia en otra pestaña, la vista
  // previa debería reflejarlo sin recargar.
  const inicial = $derived((data.nombre ?? 'Treno').trim().slice(0, 1).toUpperCase() || 'T');
  const nombre = $derived((data.nombre ?? '').trim() || 'Tu nombre');

  // La vista previa se calcula con las MISMAS funciones que usa el servidor.
  // Si se pintara aquí de otra forma, el entrenador vería una cosa al elegir
  // y otra al guardar, que es el fallo clásico de los selectores de tema.
  const marca = $derived(derivarMarca(accent, usarSegundo ? accent2 : null));
  const estilo = $derived(estiloDeMarca(marca));

  const numero = (n: number) => n.toFixed(2).replace('.', ',');
</script>

<div class="space-y-8">
  <header class="space-y-2">
    <h1 class="h-display text-2xl sm:text-3xl">Tu marca</h1>
    <p class="text-text-mute max-w-2xl">
      El color con el que tus clientes ven la aplicación. Para ellos esto es tu herramienta, no la
      nuestra: tu nombre va arriba y tu color en los enlaces, los avisos y las barras de progreso.
    </p>
  </header>

  {#if form?.error}
    <p role="alert" class="text-sm text-danger bg-danger/10 border border-danger/20 rounded-md p-3">
      {form.error}
    </p>
  {/if}
  {#if form?.success && form?.restablecido}
    <p
      aria-live="polite"
      class="text-sm text-success bg-success/10 border border-success/20 rounded-md p-3"
    >
      Marca restablecida. Tus clientes vuelven a ver los colores de Treno.
    </p>
  {:else if form?.success}
    <p
      aria-live="polite"
      class="text-sm text-success bg-success/10 border border-success/20 rounded-md p-3"
    >
      Guardado. Tus clientes lo verán la próxima vez que abran la aplicación.
    </p>
  {/if}

  <div class="grid lg:grid-cols-[minmax(0,22rem)_1fr] gap-8 items-start">
    <!-- ================= Elección ================= -->
    <form
      method="POST"
      action="?/guardar"
      use:enhance={() => {
        guardando = true;
        return async ({ update }) => {
          await update({ reset: false });
          guardando = false;
        };
      }}
      class="card space-y-5"
    >
      <div class="space-y-2">
        <label for="accent" class="block text-sm font-medium">Color principal</label>
        <div class="flex items-center gap-3">
          <input
            id="accent"
            name="accent"
            type="color"
            bind:value={accent}
            class="h-11 w-14 rounded-md border border-line bg-surface-2 cursor-pointer"
          />
          <!-- El campo de texto no es decoración: un entrenador con manual de
               marca tiene el código apuntado y quiere pegarlo, no buscarlo a
               ojo en una rueda de color. -->
          <input
            type="text"
            bind:value={accent}
            spellcheck="false"
            aria-label="Código del color principal"
            class="flex-1 min-w-0 bg-surface-2 border border-line rounded-md px-3 py-2.5
                   text-sm font-mono uppercase focus:outline-none focus:border-accent"
          />
        </div>
        {#if !esHexValido(accent)}
          <!-- El ejemplo sale de la constante y no escrito a mano: un
               hexadecimal literal en una plantilla lo rechaza el guardián del
               sistema de diseño, y con razón, porque no sabe distinguir un
               ejemplo de un color puesto a dedo. -->
          <p class="text-2xs text-warning">
            Escribe una almohadilla y seis dígitos, como {ACENTO_TRENO}.
          </p>
        {/if}
      </div>

      <div class="space-y-2 pt-1">
        <label class="flex items-center gap-2.5 text-sm cursor-pointer">
          <input
            type="checkbox"
            name="usar_segundo"
            bind:checked={usarSegundo}
            class="w-4 h-4 rounded border-line bg-surface-2 accent-accent"
          />
          Mi marca es un degradado
        </label>
        {#if usarSegundo}
          <div class="flex items-center gap-3 pt-1">
            <input
              name="accent_2"
              type="color"
              bind:value={accent2}
              aria-label="Segundo color"
              class="h-11 w-14 rounded-md border border-line bg-surface-2 cursor-pointer"
            />
            <input
              type="text"
              bind:value={accent2}
              spellcheck="false"
              aria-label="Código del segundo color"
              class="flex-1 min-w-0 bg-surface-2 border border-line rounded-md px-3 py-2.5
                     text-sm font-mono uppercase focus:outline-none focus:border-accent"
            />
          </div>
          <p class="text-2xs text-text-mute">
            El degradado solo pinta el cuadro de tu inicial. El resto usa el color principal, para
            que un texto no cambie de color a mitad de palabra.
          </p>
        {/if}
      </div>

      <div class="flex flex-wrap items-center gap-3 pt-2">
        <button
          type="submit"
          class="btn-primary"
          disabled={guardando || !esHexValido(accent) || (usarSegundo && !esHexValido(accent2))}
        >
          {guardando ? 'Guardando…' : 'Guardar'}
        </button>
        <button
          type="submit"
          formaction="?/restablecer"
          class="action-neutral"
          disabled={guardando}
        >
          Volver a los colores de Treno
        </button>
      </div>
    </form>

    <!-- ================= Vista previa ================= -->
    <div class="space-y-4">
      <h2 class="eyebrow">Lo que ve tu cliente</h2>

      <!-- El contenedor lleva las variables, igual que en la aplicación de
           verdad. Por eso lo de dentro no menciona ningún color: usa los
           mismos tokens que el resto y se repinta solo. -->
      <div style={estilo} class="rounded-lg border border-line overflow-hidden bg-bg">
        <div class="flex items-center justify-between gap-4 px-4 py-3 border-b border-line">
          <div class="flex items-center gap-2">
            <div aria-hidden="true" class="marca-cuadro w-8 h-8 text-sm">{inicial}</div>
            <span class="font-display font-semibold tracking-tight text-sm">{nombre}</span>
          </div>
          <nav class="flex items-center gap-4 text-xs">
            <span class="text-accent font-medium">Hoy</span>
            <span class="text-text-mute">Citas</span>
            <span class="text-text-mute">Progreso</span>
          </nav>
        </div>

        <div class="p-4 space-y-4">
          <div class="flex items-baseline justify-between gap-4">
            <p class="text-sm font-medium">Empuje · Pecho y hombro</p>
            <span class="pill-accent">3 de 5</span>
          </div>

          <div class="h-1.5 rounded-full bg-surface-2 overflow-hidden">
            <div class="h-full bg-accent" style="width: 60%"></div>
          </div>

          <div class="row text-sm">
            <span class="flex-1">Press banca</span>
            <span class="tabular-nums text-text-mute">4 × 8</span>
            <span class="tabular-nums font-medium">62,5 kg</span>
          </div>
          <div class="row text-sm border-b-0">
            <span class="flex-1">Press militar</span>
            <span class="tabular-nums text-text-mute">3 × 10</span>
            <span class="tabular-nums font-medium">30 kg</span>
          </div>

          <a href="/marca" class="btn-primary w-full text-sm">Empezar entreno</a>
        </div>
      </div>

      <!-- ============ Lo que hemos tenido que corregir ============ -->
      {#if marca}
        <div class="space-y-3 text-sm">
          {#if marca.corregido}
            <div class="border border-warning/25 bg-warning/5 rounded-md p-4 space-y-2">
              <p class="font-medium text-warning">Hemos aclarado tu color para que se lea</p>
              <p class="text-text-mute">
                <span class="font-mono uppercase">{accent}</span> contrasta
                {numero(marca.contrasteElegido)}:1 contra el fondo, y hace falta
                {numero(CONTRASTE_MINIMO)}:1 para que un texto se lea. En los textos y enlaces
                usamos
                <span class="font-mono uppercase">{rgbAHex(marca.acento)}</span>, que es tu mismo
                tono subido de luminosidad hasta
                {numero(marca.contrasteFinal)}:1.
              </p>
              <p class="text-text-mute">
                Tu color original sigue intacto en el cuadro de tu inicial, que es un logotipo y no
                tiene que leerse como texto.
              </p>
            </div>
          {:else}
            <p class="text-text-mute">
              Tu color contrasta {numero(marca.contrasteFinal)}:1 contra el fondo. Se usa tal cual,
              sin retocar.
            </p>
          {/if}

          {#if marca.contrasteTinta < CONTRASTE_MINIMO}
            <div class="border border-line rounded-md p-4 space-y-2">
              <p class="font-medium">La inicial de tu cuadro queda floja</p>
              <p class="text-text-mute">
                Con estos dos colores, la letra se queda en {numero(marca.contrasteTinta)}:1 en el
                extremo más difícil del degradado. Tu nombre, que va justo al lado, se lee siempre,
                así que no se pierde información. Si la quieres nítida, acerca los dos colores en
                claridad o quita el degradado.
              </p>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </div>

  <p class="text-2xs text-text-mute border-t border-line pt-4 max-w-2xl">
    Los avisos de error, los de atención y los de todo correcto mantienen siempre los mismos colores
    —rojo, ámbar y verde— aunque tu marca sea de esos tonos. Ahí el color significa algo, y un
    cliente tiene que poder fiarse de él.
  </p>
</div>
