<script lang="ts">
  /**
   * Qué poner en un día vacío: crear, elegir de la biblioteca o duplicar otro.
   *
   * POR QUÉ EXISTE
   *
   * Las tres cosas ya se podían hacer, pero desde tres sitios que no se ven
   * entre sí: «crear» era pulsar el día, «elegir» un panel desplegable en lo
   * alto de la pantalla y «duplicar» otro panel distinto más abajo. Son la
   * misma pregunta —«¿qué pongo aquí?»— contestada en tres esquinas.
   *
   * El modal la contesta DONDE SE HACE: al tocar el día.
   *
   * LO QUE ESTE MODAL NO HACE, Y ES A PROPÓSITO
   *
   * Programar una plantilla en VARIOS días de golpe («los lunes y miércoles de
   * marzo») sigue en su panel. Este modal habla de un día concreto, y meterle
   * un rango de fechas dentro lo convertiría en el panel que ya existe. Uno es
   * para un día, el otro para una tanda.
   *
   * DOS PASOS Y NO UNO
   *
   * El wireframe pone «Siguiente», y con razón: elegir el método y elegir la
   * plantilla son dos decisiones. Juntarlas obliga a pintar las tres listas a
   * la vez en una pantalla de móvil.
   *
   * «Crear» no tiene segundo paso porque su segundo paso es la pantalla del
   * constructor entera.
   */
  import { enhance } from '$app/forms';
  import { formatHumanDate } from '$lib/week';
  import Icono from '$lib/components/Icono.svelte';
  import type { ComponentProps } from 'svelte';

  type Metodo = 'crear' | 'elegir' | 'duplicar';

  interface Props {
    /** Día que se está programando, en ISO. `null` = cerrado. */
    fecha: string | null;
    clienteId: string;
    plantillas: { id: string; name: string; itemCount: number }[];
    entrenos: { iso: string; id: string; title: string | null; itemCount: number }[];
    cerrar: () => void;
  }

  let { fecha, clienteId, plantillas, entrenos, cerrar }: Props = $props();

  let dialogo = $state<HTMLDialogElement | null>(null);
  let metodo = $state<Metodo | null>(null);
  let paso = $state<1 | 2>(1);
  let plantillaElegida = $state('');
  let entrenoElegido = $state('');
  let enviando = $state(false);

  /**
   * Abrir y cerrar siguiendo a `fecha`.
   *
   * Y RESETEAR AL ABRIR, que es lo que se olvida: sin esto, abres el martes,
   * eliges «Duplicar», cierras, abres el jueves y te encuentra el modal en el
   * segundo paso con el entreno del martes ya elegido. Un clic de más y has
   * duplicado en el día que no era.
   */
  $effect(() => {
    if (!dialogo) return;
    if (fecha) {
      metodo = null;
      paso = 1;
      plantillaElegida = '';
      entrenoElegido = '';
      if (!dialogo.open) dialogo.showModal();
    } else if (dialogo.open) {
      dialogo.close();
    }
  });

  /** El día de la semana de esa fecha, que es lo que pide `programTemplate`. */
  const diaSemana = $derived(fecha ? new Date(`${fecha}T12:00:00`).getDay() : 0);

  /** Los entrenos que se pueden duplicar: todos menos el de este mismo día. */
  const duplicables = $derived(entrenos.filter((e) => e.iso !== fecha));

  const puedeSeguir = $derived(
    metodo === 'crear' ||
      (metodo === 'elegir' && plantillas.length > 0) ||
      (metodo === 'duplicar' && duplicables.length > 0)
  );

  /**
   * `icono` tipado contra el juego de verdad y no como `string`: si mañana
   * alguien renombra un icono, el error sale aquí y no en pantalla con un
   * hueco en blanco.
   */
  const OPCIONES: {
    v: Metodo;
    texto: string;
    icono: ComponentProps<typeof Icono>['nombre'];
    ayuda: string;
  }[] = [
    { v: 'crear', texto: 'Crear', icono: 'mas', ayuda: 'Montarlo desde cero' },
    { v: 'elegir', texto: 'Elegir', icono: 'lista', ayuda: 'De tus entrenamientos' },
    { v: 'duplicar', texto: 'Duplicar', icono: 'copiar', ayuda: 'Copiar otro día suyo' }
  ];
</script>

<dialog
  bind:this={dialogo}
  onclose={cerrar}
  onclick={(e) => {
    if (e.target === dialogo) cerrar();
  }}
  aria-labelledby="mp-titulo"
  class="card w-[calc(100vw-2rem)] max-w-md"
>
  <!-- El relleno va en el envoltorio: un click sobre el relleno del propio
       <dialog> cuenta como click fuera y cerraría el modal por accidente. -->
  <div class="flex flex-col gap-5">
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <h2 id="mp-titulo" class="text-lg font-display font-semibold">Programar entrenamiento</h2>
        {#if fecha}
          <p class="text-xs text-text-mute mt-1">
            {paso === 1 ? 'Elige cómo quieres programar el' : 'Para el'}
            <span class="text-text">{formatHumanDate(fecha)}</span>.
          </p>
        {/if}
      </div>
      <button
        type="button"
        onclick={cerrar}
        aria-label="Cerrar"
        class="text-text-mute hover:text-text text-xl leading-none flex-shrink-0">×</button
      >
    </div>

    {#if paso === 1}
      <div class="space-y-2">
        {#each OPCIONES as o (o.v)}
          {@const vacio =
            (o.v === 'elegir' && plantillas.length === 0) ||
            (o.v === 'duplicar' && duplicables.length === 0)}
          <button
            type="button"
            onclick={() => (metodo = o.v)}
            disabled={vacio}
            aria-pressed={metodo === o.v}
            class="w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-colors
              disabled:opacity-40 disabled:cursor-not-allowed
              {metodo === o.v
              ? 'border-accent bg-surface-2'
              : 'border-line hover:border-text-mute/40'}"
          >
            <Icono nombre={o.icono} class="w-5 h-5 flex-shrink-0 text-text-mute" />
            <span class="min-w-0">
              <span class="block text-sm font-medium">{o.texto}</span>
              <!-- Cuando una opción no se puede usar se dice POR QUÉ. Un botón
                   apagado sin explicación es lo que hace pensar que la
                   aplicación está rota. -->
              <span class="block text-xs text-text-mute">
                {#if vacio}
                  {o.v === 'elegir' ? 'No tienes entrenamientos guardados' : 'No tiene otros días'}
                {:else}
                  {o.ayuda}
                {/if}
              </span>
            </span>
          </button>
        {/each}
      </div>
    {:else if metodo === 'elegir'}
      <div>
        <label for="mp-tpl" class="block text-xs uppercase tracking-wider text-text-mute mb-2">
          Entrenamiento
        </label>
        <select
          id="mp-tpl"
          bind:value={plantillaElegida}
          class="w-full px-3 py-2.5 bg-bg border border-line rounded-md text-sm focus:border-accent"
        >
          <option value="" disabled>Elige uno…</option>
          {#each plantillas as t (t.id)}
            <option value={t.id}>{t.name} ({t.itemCount} ej.)</option>
          {/each}
        </select>
      </div>
    {:else if metodo === 'duplicar'}
      <div>
        <label for="mp-src" class="block text-xs uppercase tracking-wider text-text-mute mb-2">
          Copiar de
        </label>
        <select
          id="mp-src"
          bind:value={entrenoElegido}
          class="w-full px-3 py-2.5 bg-bg border border-line rounded-md text-sm focus:border-accent"
        >
          <option value="" disabled>Elige un día…</option>
          {#each duplicables as e (e.id)}
            <option value={e.id}>
              {formatHumanDate(e.iso)} · {e.title ?? 'Entreno'} ({e.itemCount} ej.)
            </option>
          {/each}
        </select>
      </div>
    {/if}

    <div class="flex items-center justify-end gap-3 pt-1 border-t border-line -mx-6 px-6 pt-4">
      {#if paso === 2}
        <button type="button" onclick={() => (paso = 1)} class="btn-ghost text-sm">← Atrás</button>
      {/if}
      <div class="flex-1"></div>
      <button type="button" onclick={cerrar} class="btn-ghost text-sm">Cancelar</button>

      {#if paso === 1}
        {#if metodo === 'crear'}
          <!-- Enlace de verdad y no un botón que navega: se puede abrir en otra
               pestaña, y sin JavaScript sigue funcionando. -->
          <a href="/clients/{clienteId}/workouts/{fecha}" class="btn-primary text-sm">Siguiente</a>
        {:else}
          <button
            type="button"
            disabled={!puedeSeguir}
            onclick={() => (paso = 2)}
            class="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Siguiente
          </button>
        {/if}
      {:else if metodo === 'elegir'}
        <form
          method="POST"
          action="?/programTemplate"
          use:enhance={() => {
            enviando = true;
            return async ({ update }) => {
              await update();
              enviando = false;
              cerrar();
            };
          }}
        >
          <input type="hidden" name="template_id" value={plantillaElegida} />
          <!-- Un solo día: el inicio y el fin son el mismo, y el único día de
               la semana marcado es el suyo. La acción de programar en tanda se
               reutiliza tal cual en vez de escribir otra que haga lo mismo. -->
          <input type="hidden" name="start_date" value={fecha} />
          <input type="hidden" name="end_date" value={fecha} />
          <input type="hidden" name="weekdays" value={diaSemana} />
          <button
            type="submit"
            disabled={!plantillaElegida || enviando}
            class="btn-primary text-sm disabled:opacity-50"
          >
            {enviando ? 'Programando…' : 'Programar'}
          </button>
        </form>
      {:else}
        <form
          method="POST"
          action="?/duplicate"
          use:enhance={() => {
            enviando = true;
            return async ({ update }) => {
              await update();
              enviando = false;
              cerrar();
            };
          }}
        >
          <input type="hidden" name="source_id" value={entrenoElegido} />
          <input type="hidden" name="target_date" value={fecha} />
          <button
            type="submit"
            disabled={!entrenoElegido || enviando}
            class="btn-primary text-sm disabled:opacity-50"
          >
            {enviando ? 'Duplicando…' : 'Duplicar aquí'}
          </button>
        </form>
      {/if}
    </div>
  </div>
</dialog>
