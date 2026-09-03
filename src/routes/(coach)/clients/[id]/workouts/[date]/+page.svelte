<script lang="ts">
  import { dndzone, type DndEvent } from 'svelte-dnd-action';
  import ModalImportar from '$lib/components/ModalImportar.svelte';
  import { flip } from 'svelte/animate';
  import { enhance } from '$app/forms';
  import { Historial } from '$lib/historial.svelte';
  import ModalEjercicios from '$lib/components/ModalEjercicios.svelte';
  import Icono from '$lib/components/Icono.svelte';
  import { formatHumanDate, todayISOLocal } from '$lib/week';
  import ConfirmModal from '$lib/components/ConfirmModal.svelte';
  import type { Exercise, WorkoutItemWithRelations } from '$lib/supabase/types';

  let { data, form } = $props();

  let modalImportar = $state(false);
  /** Confirmación de borrar el entreno entero (va por POST, sí toca la base). */
  let confirmDelete = $state(false);

  // Tipo del item del día: copia del exercise + parámetros prescritos.
  type DayItem = {
    id: string; // dnd-id (necesario único por item, no por exercise)
    exercise: Exercise;
    sets: number;
    reps_prescribed: string;
    weight_prescribed: string;
    rest_seconds: number | null;
    notes: string;
  };

  // Estado: lista de ejercicios del día.
  // Iniciamos desde data.workout?.workout_items si existe.
  // svelte-ignore state_referenced_locally
  let dayItems = $state<DayItem[]>(
    (data.workout?.workout_items ?? []).map((it: WorkoutItemWithRelations) => ({
      id: crypto.randomUUID(),
      exercise: it.exercise,
      sets: it.sets,
      reps_prescribed: it.reps_prescribed ?? '',
      weight_prescribed: it.weight_prescribed ?? '',
      rest_seconds: it.rest_seconds,
      notes: it.notes ?? ''
    }))
  );

  // svelte-ignore state_referenced_locally
  let title = $state(data.workout?.title ?? '');
  // svelte-ignore state_referenced_locally
  let notes = $state(data.workout?.notes ?? '');
  let saving = $state(false);

  // ---- Consultar vs. editar -------------------------------------------------
  // Un día pasado se abre para MIRAR qué se hizo, no para montarlo. Enseñar la
  // biblioteca entera ahí sobra, y en el móvil es peor: aparece antes que el
  // propio entreno, así que hay que pasar 48 ejercicios para ver lo que buscas.
  // Se puede editar igualmente, pero hay que pedirlo.
  const esPasado = $derived(data.date < todayISOLocal());
  // svelte-ignore state_referenced_locally
  let editando = $state(!(data.date < todayISOLocal()));

  /**
   * Traer los ejercicios de una plantilla o de otro día.
   *
   * Pasa por `antesDeCambiar()` como cualquier otra edición, así que
   * «Deshacer» devuelve el día tal y como estaba. Por eso el aviso del modal
   * puede prometerlo.
   */
  function importarDesde(origen: 'biblioteca' | 'otro', id: string) {
    const fuente =
      origen === 'biblioteca'
        ? data.templates?.find((x) => x.id === id)
        : data.otrosDias?.find((x) => x.id === id);
    if (!fuente) return;

    antesDeCambiar();
    dayItems = fuente.items.map((it) => ({
      id: crypto.randomUUID(),
      exercise: it.exercise as Exercise,
      sets: it.sets,
      reps_prescribed: it.reps_prescribed,
      weight_prescribed: it.weight_prescribed,
      rest_seconds: it.rest_seconds,
      notes: it.notes
    }));

    // La nota PARA EL CLIENTE de una plantilla se propone si el día no tiene
    // ya la suya. De otro día NO se trae: esa nota se escribió para aquel día.
    if (origen === 'biblioteca') {
      const tpl = data.templates?.find((x) => x.id === id);
      if (tpl?.clientNotes && !notes.trim()) notes = tpl.clientNotes;
    }

    modalImportar = false;
  }

  // ---- Deshacer paso a paso ----
  //
  // La MISMA pila que el editor de entrenamientos y que el editor en línea de
  // la ficha. Esta pantalla se quedó fuera de la primera tanda y era la que
  // más lo necesitaba: es donde se monta un día desde cero.
  const historial = new Historial<DayItem[]>();

  function antesDeCambiar() {
    historial.marcar(dayItems);
  }
  function alSalirDelCampo() {
    historial.olvidarSiIgual(dayItems);
  }
  function deshacer() {
    const anterior = historial.deshacer();
    if (anterior) dayItems = anterior;
  }

  let modalAbierto = $state(false);

  /** Añade los elegidos de golpe. Un solo paso de deshacer para los seis. */
  function anadirVarios(elegidos: Exercise[]) {
    if (elegidos.length === 0) return;
    antesDeCambiar();
    dayItems = [
      ...dayItems,
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

  // Drag&drop SOLO para reordenar dentro del día.
  function handleDayConsider(e: CustomEvent<DndEvent<DayItem>>) {
    dayItems = e.detail.items;
  }
  function handleDayFinalize(e: CustomEvent<DndEvent<DayItem>>) {
    // La instantánea se toma al SOLTAR y no al empezar a arrastrar: mientras
    // arrastras el orden cambia treinta veces, y guardarlas todas llenaría la
    // pila de pasos intermedios que nadie quiere deshacer uno a uno.
    antesDeCambiar();
    dayItems = e.detail.items;
  }

  function removeItem(id: string) {
    antesDeCambiar();
    dayItems = dayItems.filter((it) => it.id !== id);
  }

  // Para el form submit: serializamos los items
  function itemsJSON() {
    return JSON.stringify(
      dayItems.map((it) => ({
        exercise_id: it.exercise.id,
        sets: it.sets,
        reps_prescribed: it.reps_prescribed,
        weight_prescribed: it.weight_prescribed,
        rest_seconds: it.rest_seconds,
        notes: it.notes
      }))
    );
  }

  // El diccionario viene del layout: incluye el vocabulario base MÁS las
  // etiquetas que se haya inventado el entrenador (migración 0019). Estaba
  // copiado a mano en cuatro pantallas, y una decía "Pierna" donde otra
  // decía "Piernas".
  const muscleLabels = $derived(data.vocabulario.muscle);
</script>

<svelte:head>
  <title>{formatHumanDate(data.date)} · {data.client.full_name}</title>
</svelte:head>

<div class="space-y-6">
  <!-- Cabecera -->
  <div class="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
    <div class="min-w-0">
      <a href="/clients/{data.client.id}" class="text-sm text-text-mute hover:text-text">
        ← {data.client.full_name}
      </a>
      <h1 class="text-2xl font-display font-semibold tracking-tight mt-2 capitalize">
        {formatHumanDate(data.date)}
      </h1>
      {#if esPasado}
        <p class="text-xs text-text-mute mt-1">Día pasado</p>
      {/if}
    </div>

    <!-- «Importar» y «Borrar» JUNTOS arriba, como en el wireframe 17.
         Los dos hacen lo mismo: cambiar el día entero de golpe, frente a los
         retoques de más abajo. «Borrar» vivía centrado al final de la página,
         que es donde uno acaba después de editar y el peor sitio para poner lo
         único irreversible de la pantalla. -->
    {#if editando}
      <div class="flex items-center gap-2 flex-shrink-0">
        <button type="button" onclick={() => (modalImportar = true)} class="btn-ghost text-sm">
          <Icono nombre="subir" class="w-4 h-4 inline-block -mt-0.5" /> Importar
        </button>
        {#if data.workout}
          <button
            type="button"
            onclick={() => (confirmDelete = true)}
            class="btn-ghost text-sm text-danger hover:text-danger/80"
          >
            Borrar <Icono nombre="papelera" class="w-4 h-4 inline-block -mt-0.5" />
          </button>
        {/if}
      </div>
    {/if}
  </div>

  {#if form?.error}
    <div class="bg-danger/10 border border-danger/30 text-danger text-sm p-3 rounded-md">
      {form.error}
    </div>
  {/if}

  {#if !editando}
    <!-- ===== CONSULTA (día pasado) =====
         Solo el entreno que se hizo. Sin biblioteca, sin plantillas y sin
         formularios: aquí se viene a mirar, no a montar. -->
    {#if dayItems.length > 0}
      <section class="card space-y-4">
        <div>
          <h2 class="font-semibold">{title || 'Entreno sin título'}</h2>
          <p class="text-xs text-text-mute mt-0.5">
            {dayItems.length}
            {dayItems.length === 1 ? 'ejercicio' : 'ejercicios'}
          </p>
        </div>

        {#if notes}
          <p class="text-sm bg-bg border border-line rounded-md px-3 py-2">
            <span class="text-xs uppercase tracking-wider text-text-mute block mb-1">
              Nota para el cliente
            </span>
            {notes}
          </p>
        {/if}

        <div class="border-t border-line">
          {#each dayItems as item, i (item.id)}
            <div class="row">
              <span class="w-6 text-text-mute tabular-nums flex-shrink-0">{i + 1}</span>
              <span class="flex-1 min-w-0">
                <span class="font-medium block truncate">{item.exercise.name}</span>
                <span class="text-xs text-text-mute">
                  {item.sets} series{item.reps_prescribed
                    ? ' · ' + item.reps_prescribed + ' reps'
                    : ''}{item.weight_prescribed
                    ? ' · ' + item.weight_prescribed
                    : ''}{item.rest_seconds ? ' · ' + item.rest_seconds + 's desc.' : ''}
                </span>
                {#if item.notes}
                  <span class="text-xs text-text-mute italic block">{item.notes}</span>
                {/if}
              </span>
            </div>
          {/each}
        </div>

        <button type="button" onclick={() => (editando = true)} class="btn-ghost">
          Editar este día
        </button>
      </section>
    {:else}
      <!-- Sin entreno ese día: se puede añadir a posteriori, que es justo lo
           que hace falta cuando se entrenó y no se llegó a apuntar. -->
      <div class="card max-w-2xl space-y-3">
        <h2 class="text-2xl font-display font-semibold">Ese día no tiene entreno</h2>
        <p class="text-sm text-text-mute">
          No hay nada registrado para esta fecha. Puedes añadirlo ahora si entrenasteis y se quedó
          sin apuntar: le aparecerá a tu cliente en su historial.
        </p>
        <button type="button" onclick={() => (editando = true)} class="btn-primary">
          Registrar el entreno de ese día
        </button>
      </div>
    {/if}
  {:else}
    <!-- Datos generales del workout -->
    <div class="card space-y-4">
      <div>
        <label for="w-title" class="block text-xs uppercase tracking-wider text-text-mute mb-2">
          Título del día
        </label>
        <input
          id="w-title"
          type="text"
          bind:value={title}
          placeholder="ej: PIERNA — Bloque hipertrofia"
          class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md text-lg font-semibold
               focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all
               placeholder:font-normal placeholder:text-text-mute/40"
        />
      </div>
      <div>
        <label for="w-notes" class="block text-xs uppercase tracking-wider text-text-mute mb-2">
          Notas para tu cliente
        </label>
        <textarea
          id="w-notes"
          bind:value={notes}
          placeholder="ej: calienta bien, ojo al hombro derecho..."
          rows="2"
          class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md text-sm
               focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none
               placeholder:text-text-mute/40"
        ></textarea>
      </div>
    </div>

    <!-- Cuerpo: biblioteca + día.
       La biblioteca se abre en un modal, como en el editor de entrenamientos:
       era un panel al lado y en un móvil acababa debajo del todo, así que
       había que pasar cuarenta y ocho ejercicios para ver el día que estabas
       montando. -->
    <div class="space-y-6">
      <!-- DÍA -->
      <section class="card space-y-4 min-h-[400px]">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h2 class="text-sm uppercase tracking-wider text-text-mute">
            Ejercicios - {dayItems.length}
          </h2>
          {#if editando}
            <button type="button" onclick={() => (modalAbierto = true)} class="action-primary">
              + Añadir ejercicio
            </button>
          {/if}
        </div>

        <!--
          EL MENSAJE DE «VACÍO» VA FUERA DE LA ZONA DE ARRASTRE.

          Estaba dentro, en el `{:else}` del `{#each}`, y eso es justo lo que
          svelte-dnd-action no admite: la zona tiene que contener UN HIJO POR
          ITEM y nada más. Con la lista vacía había cero items y un hijo, así
          que la librería trataba ese párrafo como si fuera un ejercicio
          arrastrable: lo clonaba y dejaba la copia colgada del <body> con
          posición fija. De ahí el texto duplicado, uno quieto al hacer scroll
          y otro no.

          La solución no es esconder la copia con CSS: es que ese nodo no sea
          hijo de la zona. Va superpuesto, con `pointer-events-none` para que
          no estorbe al soltar encima.
        -->
        <div class="relative">
          {#if dayItems.length === 0}
            <div
              class="absolute inset-0 grid place-items-center p-6 text-center text-text-mute text-sm pointer-events-none"
            >
              <div>
                <p class="mb-1">
                  Añade ejercicios desde la biblioteca con el botón <span class="text-accent"
                    >+</span
                  >
                </p>
                <p class="text-xs">luego arrástralos aquí para reordenarlos</p>
              </div>
            </div>
          {/if}

          <div
            class="space-y-3 min-h-[300px] rounded-md transition-colors {dayItems.length === 0
              ? 'border-2 border-dashed border-text-mute/20'
              : ''}"
            use:dndzone={{
              items: dayItems,
              type: 'exercise',
              flipDurationMs: 200,
              dropFromOthersDisabled: true,
              dropTargetStyle: {}
            }}
            onconsider={handleDayConsider}
            onfinalize={handleDayFinalize}
          >
            {#each dayItems as item, i (item.id)}
              <!-- Igual que en las otras dos pantallas: una instantánea al
                 entrar en un campo y se descarta al salir si nada cambió. -->
              <div
                animate:flip={{ duration: 200 }}
                onfocusin={antesDeCambiar}
                onfocusout={alSalirDelCampo}
                class="bg-bg border border-text-mute/20 rounded-md p-4 space-y-3"
              >
                <div class="flex items-start gap-3">
                  <div class="text-primary font-bold mt-0.5 w-6">#{i + 1}</div>
                  <div class="flex-1">
                    <div class="font-semibold">{item.exercise.name}</div>
                    {#if item.exercise.muscle_group}
                      <div class="text-xs text-text-mute">
                        {muscleLabels[item.exercise.muscle_group]}
                      </div>
                    {/if}
                  </div>
                  <button
                    type="button"
                    onclick={() => removeItem(item.id)}
                    class="text-text-mute hover:text-danger flex-shrink-0"
                    aria-label="Quitar {item.exercise.name}"
                  >
                    <Icono nombre="papelera" class="w-4 h-4" />
                  </button>
                </div>

                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label
                      for="sets-{item.id}"
                      class="text-3xs uppercase tracking-wider text-text-mute">Series</label
                    >
                    <input
                      id="sets-{item.id}"
                      type="number"
                      min="1"
                      max="20"
                      bind:value={item.sets}
                      class="w-full px-2 py-1 bg-surface border border-text-mute/20 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label
                      for="reps-{item.id}"
                      class="text-3xs uppercase tracking-wider text-text-mute">Repeticiones</label
                    >
                    <input
                      id="reps-{item.id}"
                      type="text"
                      bind:value={item.reps_prescribed}
                      placeholder="8-10"
                      class="w-full px-2 py-1 bg-surface border border-text-mute/20 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label
                      for="weight-{item.id}"
                      class="text-3xs uppercase tracking-wider text-text-mute">Peso</label
                    >
                    <input
                      id="weight-{item.id}"
                      type="text"
                      bind:value={item.weight_prescribed}
                      placeholder="80kg"
                      class="w-full px-2 py-1 bg-surface border border-text-mute/20 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label
                      for="rest-{item.id}"
                      class="text-3xs uppercase tracking-wider text-text-mute">Descanso</label
                    >
                    <input
                      id="rest-{item.id}"
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
                Esta nota LA LEE EL CLIENTE, en su pantalla de hoy, debajo del
                ejercicio. Antes era una caja sin etiqueta que solo ponía «Nota
                técnica (opcional)» y no había forma de saberlo: se podía
                escribir aquí «ojo, que este viene flojo» pensando que era un
                recordatorio para uno mismo. Lo privado va en «Notas para ti»,
                arriba, y eso solo se puede saber si cada caja dice para quién
                escribe.
              -->
                <div>
                  <label
                    for="nota-{item.id}"
                    class="text-3xs uppercase tracking-wider text-text-mute"
                    >Nota para el cliente</label
                  >
                  <input
                    id="nota-{item.id}"
                    type="text"
                    bind:value={item.notes}
                    placeholder="«Baja despacio, 3 segundos»"
                    class="w-full px-2 py-1 bg-surface border border-text-mute/20 rounded text-xs text-text-mute placeholder:text-text-mute/40"
                  />
                </div>
              </div>
            {/each}
          </div>
        </div>
      </section>
    </div>
  {/if}

  {#if editando}
    <!--
      Barra de acciones pegada abajo, la misma que el editor de entrenamientos.

      `sticky` y no `fixed`: pegada al viewport taparía el último ejercicio
      para siempre, y con `sticky` el contenido termina por encima.
    -->
    <div
      class="sticky bottom-0 -mx-4 px-4 py-3 bg-surface/95 border-t border-line
             flex flex-wrap items-center gap-3 backdrop-blur-sm"
    >
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

      <a href="/clients/{data.client.id}" class="action-neutral">Cancelar</a>

      <form
        method="POST"
        action="?/save"
        use:enhance={() => {
          saving = true;
          return async ({ update }) => {
            await update();
            saving = false;
            // Lo guardado ya no se deshace desde aquí: el botón no debe
            // ofrecer volver a un estado anterior a lo que está en la base.
            historial.limpiar();
          };
        }}
      >
        <input type="hidden" name="title" value={title} />
        <input type="hidden" name="notes" value={notes} />
        <input type="hidden" name="items" value={itemsJSON()} />
        <button type="submit" disabled={saving} class="btn-primary py-2 px-5">
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </form>
    </div>
  {/if}
</div>

<ModalEjercicios
  bind:abierto={modalAbierto}
  ejercicios={data.exercises}
  etiquetas={muscleLabels}
  onanadir={anadirVarios}
/>

<ConfirmModal
  bind:open={confirmDelete}
  action="?/delete"
  title="Borrar entreno del día"
  message="Se borrará el entreno completo de este día. No se puede deshacer."
  confirmLabel="Borrar entreno"
/>

<ModalImportar
  abierto={modalImportar}
  fecha={data.date}
  tieneEjercicios={dayItems.length > 0}
  plantillas={data.templates ?? []}
  otrosDias={data.otrosDias ?? []}
  importar={importarDesde}
  cerrar={() => (modalImportar = false)}
/>

<style>
  /* Estilos sutiles para el drag */
  :global(.dndzone) {
    transition: outline 0.15s ease;
  }
</style>
