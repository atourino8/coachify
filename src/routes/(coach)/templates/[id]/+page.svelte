<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import { untrack } from 'svelte';
  import { Historial } from '$lib/historial.svelte';
  import ConfirmModal from '$lib/components/ConfirmModal.svelte';
  import ModalEjercicios from '$lib/components/ModalEjercicios.svelte';
  import Icono from '$lib/components/Icono.svelte';
  import type { Exercise } from '$lib/supabase/types';

  let { data, form } = $props();

  type TplItem = {
    id: string; // id local para el #each
    exercise: Exercise;
    sets: number;
    reps_prescribed: string;
    weight_prescribed: string;
    rest_seconds: number | null;
    notes: string;
  };

  const CATEGORIES: { value: string; label: string }[] = [
    { value: 'hipertrofia', label: 'Hipertrofia' },
    { value: 'fuerza', label: 'Fuerza' },
    { value: 'resistencia', label: 'Resistencia' },
    { value: 'movilidad', label: 'Movilidad' },
    { value: 'perdida_grasa', label: 'Pérdida de grasa' },
    { value: 'rehabilitacion', label: 'Rehabilitación' },
    { value: 'otro', label: 'Otro' }
  ];

  // svelte-ignore state_referenced_locally
  let name = $state(data.template.name);
  // Dos notas, y el orden importa: primero la que va a leer alguien más.
  // Escribir en el campo privado es lo natural cuando solo hay uno; con el
  // visible arriba, la nota para el cliente deja de ser la que se olvida.
  //
  // El svelte-ignore va en CADA una: la directiva solo cubre la línea
  // siguiente, y al meter un comentario en medio dejó de cubrir la segunda.
  // svelte-ignore state_referenced_locally
  let clientNotes = $state(data.template.client_notes ?? '');
  // svelte-ignore state_referenced_locally
  let coachNotes = $state(data.template.coach_notes ?? '');
  // svelte-ignore state_referenced_locally
  let category = $state(data.template.category ?? '');
  // svelte-ignore state_referenced_locally
  let items = $state<TplItem[]>(
    (data.template.workout_template_items ?? []).map((it) => ({
      id: crypto.randomUUID(),
      exercise: it.exercise as Exercise,
      sets: it.sets,
      reps_prescribed: it.reps_prescribed ?? '',
      weight_prescribed: it.weight_prescribed ?? '',
      rest_seconds: it.rest_seconds,
      notes: it.notes ?? ''
    }))
  );

  let saving = $state(false);

  // ---- Deshacer paso a paso ----
  //
  // La pila guarda SOLO los ejercicios y no el nombre ni las notas: son tres
  // campos de texto sueltos donde Ctrl+Z del navegador ya funciona, y meterlos
  // aquí haría que deshacer un peso pudiera cambiarte también el título.
  const historial = new Historial<TplItem[]>();

  /** Instantánea antes de tocar. Para añadir, quitar y reordenar. */
  function antesDeCambiar() {
    historial.marcar(items);
  }

  /**
   * Al ENTRAR en cualquier campo de un ejercicio se marca, y al salir se
   * descarta si no cambió nada. Va en la tarjeta entera y no en cada input:
   * son seis campos por ejercicio y el foco pasa por todos.
   */
  function alSalirDelCampo() {
    historial.olvidarSiIgual(items);
  }

  function deshacer() {
    const anterior = historial.deshacer();
    if (anterior) items = anterior;
  }

  // ---- Acordeón ----
  //
  // Abiertos por defecto: plegarlos de salida escondería lo que la pantalla
  // viene a enseñar. Lo que se gana es poder plegarlos cuando son doce.
  let plegados = $state<Set<string>>(new Set());
  function alternarPliegue(id: string) {
    const s = new Set(plegados);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    plegados = s;
  }
  const todosPlegados = $derived(items.length > 0 && plegados.size === items.length);
  function alternarTodos() {
    plegados = todosPlegados ? new Set() : new Set(items.map((i) => i.id));
  }

  // ---- Cambios sin guardar ----
  //
  // UNA SOLA FUNCIÓN para las dos instantáneas, la de referencia y la de ahora.
  //
  // Antes eran dos objetos escritos a mano por separado —uno desde `data`, otro
  // desde el estado— con los mismos seis campos repetidos. Mientras coincidan
  // funciona; el día que alguien añada un campo a uno y no al otro, «Sin
  // guardar» se queda encendido para siempre y nadie sabe por qué.
  function instantanea(v: {
    name: string;
    clientNotes: string;
    coachNotes: string;
    category: string;
    items: {
      exercise_id: string;
      sets: number;
      reps: string;
      peso: string;
      descanso: number | null;
      notas: string;
    }[];
  }) {
    return JSON.stringify(v);
  }

  /**
   * Cómo estaba al cargar… y cómo quedó al guardar.
   *
   * ES ESTADO, no una constante. Era `const` calculada una vez con `untrack`, y
   * por eso al guardar salía «Entrenamiento guardado» y justo encima «Sin
   * guardar»: la referencia seguía siendo la de la carga, así que todo lo que
   * habías escrito seguía contando como pendiente aunque acabara de escribirse
   * en la base.
   */
  let referencia = $state(
    untrack(() =>
      instantanea({
        name: data.template.name,
        clientNotes: data.template.client_notes ?? '',
        coachNotes: data.template.coach_notes ?? '',
        category: data.template.category ?? '',
        items: (data.template.workout_template_items ?? []).map((it) => ({
          exercise_id: it.exercise_id,
          sets: it.sets,
          reps: it.reps_prescribed ?? '',
          peso: it.weight_prescribed ?? '',
          descanso: it.rest_seconds,
          notas: it.notes ?? ''
        }))
      })
    )
  );

  const ahora = $derived(
    instantanea({
      name,
      clientNotes,
      coachNotes,
      category,
      items: items.map((it) => ({
        exercise_id: it.exercise.id,
        sets: it.sets,
        reps: it.reps_prescribed,
        peso: it.weight_prescribed,
        descanso: it.rest_seconds,
        notas: it.notes
      }))
    })
  );

  const hayCambios = $derived(ahora !== referencia);

  let confirmarSalir = $state(false);
  function cancelar() {
    if (hayCambios) confirmarSalir = true;
    else goto('/templates');
  }

  // El diccionario viene del layout: incluye el vocabulario base MÁS las
  // etiquetas que se haya inventado el entrenador (migración 0019). Estaba
  // copiado a mano en cuatro pantallas, y una decía "Pierna" donde otra
  // decía "Piernas".
  const muscleLabels = $derived(data.vocabulario.muscle);

  let modalAbierto = $state(false);

  /**
   * Añade los elegidos en el modal, todos de una vez.
   *
   * Un solo paso de deshacer para las seis altas: quien añade seis y se
   * arrepiente quiere quitarlas de golpe, no pulsar «Deshacer» seis veces.
   */
  function anadirVarios(elegidos: Exercise[]) {
    if (elegidos.length === 0) return;
    antesDeCambiar();
    items = [
      ...items,
      ...elegidos.map((ex) => ({
        id: crypto.randomUUID(),
        exercise: ex,
        sets: 4,
        reps_prescribed: '8-10',
        weight_prescribed: '',
        rest_seconds: 90,
        notes: ''
      }))
    ];
  }
  function removeItem(id: string) {
    antesDeCambiar();
    items = items.filter((it) => it.id !== id);
  }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    antesDeCambiar();
    const copy = [...items];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    items = copy;
  }
  function itemsJSON() {
    return JSON.stringify(
      items.map((it) => ({
        exercise_id: it.exercise.id,
        sets: it.sets,
        reps_prescribed: it.reps_prescribed,
        weight_prescribed: it.weight_prescribed,
        rest_seconds: it.rest_seconds,
        notes: it.notes
      }))
    );
  }
</script>

<svelte:head>
  <title>{name || 'Entrenamiento'} · Treno</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between gap-4">
    <a href="/templates" class="text-sm text-text-mute hover:text-text">← Entrenamientos</a>
    {#if hayCambios}
      <!-- Que haya cambios sin guardar se dice arriba TAMBIÉN, y no solo en la
           barra de abajo: en un móvil la barra está donde está el pulgar y la
           cabecera donde están los ojos. -->
      <span class="text-xs text-warning">Sin guardar</span>
    {/if}
  </div>

  {#if form?.error}
    <p role="alert" class="text-sm text-danger bg-danger/10 border border-danger/20 rounded-md p-3">
      {form.error}
    </p>
  {/if}

  <!-- Cabecera editable -->
  <div class="card space-y-4">
    <div>
      <label for="tpl-name" class="block text-xs uppercase tracking-wider text-text-mute mb-2">
        Nombre del entrenamiento
      </label>
      <input
        id="tpl-name"
        bind:value={name}
        maxlength="80"
        placeholder="ej: Full body principiante"
        class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md text-2xl font-bold
               focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all
               placeholder:font-normal placeholder:text-text-mute/40"
      />
    </div>
    <!--
      Las etiquetas dicen QUIÉN LEE cada campo, no cómo se llama.

      «Notas para el cliente» y «Notas para el entrenador» se distinguen por
      una palabra en medio, y quien va con prisa escribe en el primero que
      pilla. Lo que no se confunde es «la ve tu cliente» frente a «no la ve
      nadie más»: eso responde a la pregunta que importa antes de escribir.
    -->
    <div>
      <label for="tpl-client-notes" class="block text-xs uppercase tracking-wider text-text-mute">
        Notas para el cliente
      </label>
      <p class="text-2xs text-text-mute mb-2">La ve él en su pantalla de Hoy.</p>
      <textarea
        id="tpl-client-notes"
        bind:value={clientNotes}
        rows="2"
        maxlength="300"
        placeholder="ej: si un grupo muscular sigue fatigado, cambia el ejercicio por 30 min de cinta"
        class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md text-sm
               focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none
               placeholder:text-text-mute/40"
      ></textarea>
    </div>

    <div>
      <label for="tpl-coach-notes" class="block text-xs uppercase tracking-wider text-text-mute">
        Notas para ti
      </label>
      <p class="text-2xs text-text-mute mb-2">Privadas: no las ve nadie más.</p>
      <textarea
        id="tpl-coach-notes"
        bind:value={coachNotes}
        rows="2"
        maxlength="300"
        placeholder="ej: progresar carga en principiantes hasta el fallo con 90s de reposo"
        class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md text-sm
               focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none
               placeholder:text-text-mute/40"
      ></textarea>
    </div>
    <div class="flex items-center gap-2 pt-1">
      <label for="tpl-cat" class="text-xs uppercase tracking-wider text-text-mute">Categoría</label>
      <select
        id="tpl-cat"
        bind:value={category}
        class="px-3 py-1.5 bg-bg border border-text-mute/20 rounded-md text-sm focus:border-primary"
      >
        <option value="">Sin categoría</option>
        {#each CATEGORIES as c}<option value={c.value}>{c.label}</option>{/each}
      </select>
    </div>
  </div>

  <!-- Igual que en el constructor del día: en móvil primero el entrenamiento
       que estás montando, y la biblioteca detrás. -->
  <!-- Una sola columna: la biblioteca ya no vive al lado, se abre en un modal
       (pantalla 10). En un móvil el panel lateral acababa debajo del todo, y
       montar ocho ejercicios eran ocho viajes entre dos columnas. -->
  <div class="space-y-6">
    <section class="card space-y-4 min-h-[300px]">
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-sm uppercase tracking-wider text-text-mute">
          Ejercicios - {items.length}
        </h2>
        <div class="flex items-center gap-3">
          {#if items.length > 1}
            <button
              type="button"
              onclick={alternarTodos}
              class="text-sm text-text-mute hover:text-text transition-colors"
            >
              {todosPlegados ? 'Desplegar todos' : 'Plegar todos'}
            </button>
          {/if}
          <button type="button" onclick={() => (modalAbierto = true)} class="action-primary">
            + Añadir ejercicio
          </button>
        </div>
      </div>
      {#if items.length === 0}
        <div
          class="min-h-[220px] grid place-items-center text-center border-2 border-dashed border-text-mute/20 rounded-md p-6"
        >
          <div class="space-y-3">
            <p class="text-sm text-text-mute">Este entrenamiento todavía no tiene ejercicios.</p>
            <button type="button" onclick={() => (modalAbierto = true)} class="btn-primary">
              + Añadir ejercicios
            </button>
            <p class="text-xs text-text-mute">Luego los ordenas con las flechas ↑↓</p>
          </div>
        </div>
      {:else}
        {#each items as item, i (item.id)}
          <!-- onfocusin/onfocusout en la TARJETA y no en cada campo: son seis
               por ejercicio y el foco pasa por todos. Aquí se marca al entrar
               y se descarta al salir si no cambió nada, que es la regla de
               «un paso por cambio, no por pulsación». -->
          <div
            onfocusin={antesDeCambiar}
            onfocusout={alSalirDelCampo}
            class="bg-bg border border-text-mute/20 rounded-md p-4 space-y-3"
          >
            <div class="flex items-start gap-3">
              <div class="flex flex-col gap-0.5 pt-0.5">
                <button
                  type="button"
                  onclick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label="Subir ejercicio"
                  class="text-text-mute hover:text-primary disabled:opacity-30 text-xs leading-none"
                  >▲</button
                >
                <button
                  type="button"
                  onclick={() => move(i, 1)}
                  disabled={i === items.length - 1}
                  aria-label="Bajar ejercicio"
                  class="text-text-mute hover:text-primary disabled:opacity-30 text-xs leading-none"
                  >▼</button
                >
              </div>
              <!-- El nombre abre y cierra: es la zona más grande de la
                   tarjeta y la que se pulsa sin apuntar. -->
              <button
                type="button"
                onclick={() => alternarPliegue(item.id)}
                aria-expanded={!plegados.has(item.id)}
                class="flex-1 min-w-0 text-left"
              >
                <div class="font-medium truncate">
                  <span aria-hidden="true" class="text-text-mute mr-1">
                    {plegados.has(item.id) ? '▸' : '▾'}
                  </span>
                  {item.exercise.name}
                </div>
                {#if item.exercise.muscle_group}
                  <div class="text-xs text-text-mute">
                    {muscleLabels[item.exercise.muscle_group]}
                    <!-- Plegado, la tarjeta sigue diciendo lo esencial: sin
                         esto, plegar doce ejercicios deja doce nombres y cero
                         información de qué hay dentro. -->
                    {#if plegados.has(item.id)}
                      · {item.sets}×{item.reps_prescribed || '—'}
                      {item.weight_prescribed ? ` · ${item.weight_prescribed}` : ''}
                    {/if}
                  </div>
                {/if}
              </button>
              <button
                type="button"
                onclick={() => removeItem(item.id)}
                aria-label="Quitar ejercicio"
                class="text-text-mute hover:text-danger flex-shrink-0"
              >
                <Icono nombre="papelera" class="w-4 h-4" />
              </button>
            </div>
            {#if !plegados.has(item.id)}
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label for="s-{item.id}" class="text-3xs uppercase tracking-wider text-text-mute"
                    >Series</label
                  >
                  <input
                    id="s-{item.id}"
                    type="number"
                    min="1"
                    max="20"
                    bind:value={item.sets}
                    class="w-full px-2 py-1 bg-surface border border-text-mute/20 rounded text-sm"
                  />
                </div>
                <div>
                  <label for="r-{item.id}" class="text-3xs uppercase tracking-wider text-text-mute"
                    >Repeticiones</label
                  >
                  <input
                    id="r-{item.id}"
                    type="text"
                    bind:value={item.reps_prescribed}
                    placeholder="8-10"
                    class="w-full px-2 py-1 bg-surface border border-text-mute/20 rounded text-sm"
                  />
                </div>
                <div>
                  <label for="w-{item.id}" class="text-3xs uppercase tracking-wider text-text-mute"
                    >Peso</label
                  >
                  <input
                    id="w-{item.id}"
                    type="text"
                    bind:value={item.weight_prescribed}
                    placeholder="80kg"
                    class="w-full px-2 py-1 bg-surface border border-text-mute/20 rounded text-sm"
                  />
                </div>
                <div>
                  <label for="d-{item.id}" class="text-3xs uppercase tracking-wider text-text-mute"
                    >Descanso</label
                  >
                  <input
                    id="d-{item.id}"
                    type="number"
                    min="0"
                    step="15"
                    bind:value={item.rest_seconds}
                    placeholder="90"
                    class="w-full px-2 py-1 bg-surface border border-text-mute/20 rounded text-sm"
                  />
                </div>
              </div>

              <!--
                Este campo existía en la base de datos, se guardaba, se copiaba
                al entreno del cliente al aplicar la plantilla y el cliente lo
                LEÍA. Lo único que faltaba era la caja para escribirlo: los
                ejercicios nuevos nacían con la nota vacía y no había manera de
                rellenarla. Una plantilla es justo donde más sentido tiene
                —«baja despacio» se dice una vez y vale para los cuarenta días
                que salgan de ella—, así que era el sitio donde más se notaba
                la ausencia.
              -->
              <div class="mt-2">
                <label for="n-{item.id}" class="text-3xs uppercase tracking-wider text-text-mute"
                  >Nota para el cliente</label
                >
                <input
                  id="n-{item.id}"
                  type="text"
                  bind:value={item.notes}
                  placeholder="«Baja despacio, 3 segundos»"
                  class="w-full px-2 py-1 bg-surface border border-text-mute/20 rounded text-xs text-text-mute placeholder:text-text-mute/40"
                />
              </div>
            {/if}
          </div>
        {/each}
      {/if}
    </section>
  </div>

  <!--
    Barra de acciones, pegada abajo (pantalla 9 del wireframe).

    `sticky` y no `fixed`: pegada al viewport taparía el último ejercicio de la
    lista para siempre, y con `sticky` el contenido termina por encima de ella.
  -->
  <div
    class="sticky bottom-0 -mx-4 px-4 py-3 bg-surface/95 border-t border-line
           flex flex-wrap items-center gap-3 backdrop-blur-sm"
  >
    <!-- Deshacer va a la izquierda y separado de los otros dos: no es una
         forma de terminar, es una forma de corregirse a mitad. -->
    <button
      type="button"
      onclick={deshacer}
      disabled={!historial.puedeDeshacer}
      class="action-neutral disabled:opacity-40 disabled:cursor-not-allowed"
      title={historial.puedeDeshacer
        ? 'Deshacer el último cambio en los ejercicios'
        : 'No hay nada que deshacer'}
    >
      Deshacer <span aria-hidden="true">↩</span>
    </button>

    <div class="flex-1"></div>

    <button type="button" onclick={cancelar} class="action-neutral">Cancelar</button>

    <form
      method="POST"
      action="?/save"
      use:enhance={() => {
        // La instantánea se toma ANTES de enviar: es lo que va de camino al
        // servidor. Si se leyera al volver, un tecleo mientras guarda se daría
        // por guardado sin estarlo.
        const enviado = ahora;
        saving = true;
        return async ({ update, result }) => {
          await update();
          saving = false;
          // SOLO si ha ido bien. Si el guardado falló, los cambios siguen sin
          // guardar de verdad y el aviso tiene que seguir ahí.
          if (result.type === 'success') {
            referencia = enviado;
            // Lo guardado ya no se deshace desde aquí: la pila se vacía para
            // que el botón no ofrezca volver a un estado anterior al guardado,
            // que desharía en pantalla algo que en la base ya está escrito.
            historial.limpiar();
          }
        };
      }}
    >
      <input type="hidden" name="name" value={name} />
      <input type="hidden" name="client_notes" value={clientNotes} />
      <input type="hidden" name="coach_notes" value={coachNotes} />
      <input type="hidden" name="category" value={category} />
      <input type="hidden" name="items" value={itemsJSON()} />
      <button type="submit" disabled={saving || !name.trim()} class="btn-primary py-2 px-5">
        {saving ? 'Guardando…' : 'Guardar'}
      </button>
    </form>
  </div>

  {#if !name.trim()}
    <p class="text-xs text-text-mute">El entrenamiento necesita un nombre.</p>
  {/if}
</div>

<ModalEjercicios
  bind:abierto={modalAbierto}
  ejercicios={data.exercises}
  etiquetas={muscleLabels}
  onanadir={anadirVarios}
/>

<ConfirmModal
  bind:open={confirmarSalir}
  title="Salir sin guardar"
  message="Has cambiado cosas y no las has guardado. Si sales ahora se pierden."
  confirmLabel="Salir sin guardar"
  cancelLabel="Seguir editando"
  onconfirm={() => goto('/templates')}
/>
