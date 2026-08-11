<script lang="ts">
  import { enhance } from '$app/forms';
  import { SvelteSet } from 'svelte/reactivity';
  import Icono from '$lib/components/Icono.svelte';
  import { untrack } from 'svelte';
  import { SEED_EXERCISES } from '$lib/seed-exercises';
  let { data, form } = $props();

  let seeding = $state(false);

  // Las etiquetas viven en types.ts: estaban copiadas en cuatro pantallas y
  // una decía "Pierna" donde otra decía "Piernas".
  // Alias tipado con clave `string`, no `MuscleGroup`: lo que llega de la base
  // es un text[] y se indexa con cadenas sueltas. Quien garantiza que solo hay
  // valores válidos es la restricción de la migración 0016 y el saneado de
  // exercise-tags.ts, no el tipo de esta tabla de etiquetas.
  const muscleLabels = $derived(data.vocabulario.muscle);

  /** Clave interna del cajón de los que no tienen ningún grupo puesto. */
  const SIN_GRUPO = '__sin_grupo__';

  // Filtro por grupo muscular (mismo patrón que el de categorías en
  // Entrenamientos, para que la biblioteca se comporte igual en las dos pestañas).
  let filterGroup = $state('');
  const presentGroups = $derived(
    [...new Set(data.exercises.flatMap((e) => e.muscle_groups ?? []))].sort((a, b) =>
      (muscleLabels[a] ?? a).localeCompare(muscleLabels[b] ?? b)
    )
  );
  const filtered = $derived(
    filterGroup === ''
      ? data.exercises
      : filterGroup === SIN_GRUPO
        ? data.exercises.filter((e) => (e.muscle_groups ?? []).length === 0)
        : data.exercises.filter((e) => (e.muscle_groups ?? []).includes(filterGroup))
  );

  const equipmentLabels = $derived(data.vocabulario.equipment);

  // ---- Vista: por grupos o lista plana ----
  //
  // El valor inicial se decide por tamaño y no por gusto: con la biblioteca
  // base son casi cincuenta ejercicios y recorrerlos en una lista plana desde
  // un móvil no es viable, pero a quien tiene seis la rejilla le mete un clic
  // de más para ver lo que le cabía en pantalla.
  const UMBRAL_REJILLA = 12;
  let vista = $state<'grupos' | 'lista'>(
    untrack(() => data.exercises.length) > UMBRAL_REJILLA ? 'grupos' : 'lista'
  );

  // Cuenta por grupo. Un ejercicio con varios grupos cuenta en CADA uno, así
  // que la suma de las tarjetas es mayor que el total. Se avisa en pantalla en
  // vez de disimularlo: un número que no cuadra y no se explica hace
  // desconfiar de toda la pantalla.
  const conteoPorGrupo = $derived.by(() => {
    const mapa = new Map<string, number>();
    for (const ex of data.exercises) {
      const grupos = ex.muscle_groups ?? [];
      if (grupos.length === 0) mapa.set(SIN_GRUPO, (mapa.get(SIN_GRUPO) ?? 0) + 1);
      for (const g of grupos) mapa.set(g, (mapa.get(g) ?? 0) + 1);
    }
    return [...mapa.entries()]
      .map(([grupo, total]) => ({ grupo, total }))
      .sort((a, b) => b.total - a.total);
  });

  const hayMultiples = $derived(data.exercises.some((e) => (e.muscle_groups ?? []).length > 1));

  // En vista por grupos, la rejilla manda hasta que se abre uno.
  const mostrandoRejilla = $derived(vista === 'grupos' && filterGroup === '');

  function etiquetaGrupo(g: string) {
    return g === SIN_GRUPO ? 'Sin clasificar' : (muscleLabels[g] ?? g);
  }

  // ---- Selección múltiple ----
  // Un Set y no un array de booleanos por ejercicio: la pertenencia se
  // comprueba en cada fila al pintar, y con cincuenta ejercicios un indexOf
  // por fila es trabajo tonto en cada pulsación.
  let marcados = $state(new SvelteSet<string>());
  let trabajando = $state(false);
  let grupoNuevo = $state('');
  let materialNuevo = $state('');

  const visibles = $derived(filtered.map((e) => e.id));
  const marcadosVisibles = $derived(visibles.filter((id) => marcados.has(id)));
  // "Todos" se refiere SIEMPRE a lo que se está viendo. Si hay un filtro de
  // grupo activo y "seleccionar todo" marcara también lo oculto, el entrenador
  // archivaría cuarenta ejercicios creyendo que archiva ocho.
  const todosMarcados = $derived(
    visibles.length > 0 && marcadosVisibles.length === visibles.length
  );

  function alternar(id: string) {
    if (marcados.has(id)) marcados.delete(id);
    else marcados.add(id);
  }

  function alternarTodos() {
    if (todosMarcados) visibles.forEach((id) => marcados.delete(id));
    else visibles.forEach((id) => marcados.add(id));
  }

  function limpiar() {
    marcados.clear();
    grupoNuevo = '';
    materialNuevo = '';
  }

  // Tras cualquier acción en lote la lista cambia debajo: hay que soltar la
  // selección o quedan marcados ids que ya no existen.
  function trasLaAccion() {
    trabajando = true;
    return async ({ update }: { update: () => Promise<void> }) => {
      await update();
      limpiar();
      trabajando = false;
    };
  }
</script>

<svelte:head>
  <title>Ejercicios · Treno</title>
</svelte:head>

<div class="space-y-8">
  <!-- Pestañas Biblioteca -->
  <div class="flex gap-1 border-b border-line overflow-x-auto">
    <a
      href="/exercises"
      class="px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap flex-shrink-0 border-accent text-accent -mb-px"
      >Ejercicios</a
    >
    <a
      href="/templates"
      class="px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap flex-shrink-0 border-transparent text-text-mute hover:text-text"
      >Entrenamientos</a
    >
  </div>

  <!-- En móvil las acciones caen a su propia línea: en horizontal no caben
       junto al título y el botón principal se salía de la pantalla. -->
  <div class="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
    <div class="min-w-0">
      <h1 class="text-2xl sm:text-3xl font-display font-semibold tracking-tight">Ejercicios</h1>
      <p class="text-text-mute mt-1">
        {data.exercises.length}
        {data.exercises.length === 1 ? 'ejercicio' : 'ejercicios'} activos
      </p>
    </div>
    <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
      <!-- La carga de la biblioteca base está siempre disponible, no solo con
           la biblioteca vacía: es idempotente y solo añade los que falten. -->
      <form
        method="POST"
        action="?/seedLibrary"
        use:enhance={() => {
          seeding = true;
          return async ({ update }) => {
            await update();
            seeding = false;
          };
        }}
      >
        <button
          type="submit"
          disabled={seeding}
          class="text-sm text-text-mute hover:text-primary transition-colors whitespace-nowrap"
        >
          {seeding ? 'Cargando…' : 'Cargar biblioteca base'}
        </button>
      </form>
      <!-- Conmutador de vista. Dos botones visibles en vez de un icono que
           alterna: con un solo icono nunca sabes si te enseña el estado actual
           o lo que pasaría al pulsarlo. -->
      {#if data.exercises.length > 0}
        <div
          class="flex rounded-md border border-line overflow-hidden"
          role="group"
          aria-label="Vista"
        >
          <button
            onclick={() => {
              vista = 'grupos';
              filterGroup = '';
            }}
            aria-pressed={vista === 'grupos'}
            class="flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors {vista ===
            'grupos'
              ? 'bg-primary text-bg font-medium'
              : 'text-text-mute hover:text-text'}"
          >
            <Icono nombre="rejilla" class="w-4 h-4" />
            Grupos
          </button>
          <button
            onclick={() => (vista = 'lista')}
            aria-pressed={vista === 'lista'}
            class="flex items-center gap-1.5 px-3 py-1.5 text-sm border-l border-line
                   transition-colors {vista === 'lista'
              ? 'bg-primary text-bg font-medium'
              : 'text-text-mute hover:text-text'}"
          >
            <Icono nombre="lista" class="w-4 h-4" />
            Lista
          </button>
        </div>
      {/if}
      <a href="/exercises/new" class="btn-primary whitespace-nowrap">+ Nuevo ejercicio</a>
    </div>
  </div>

  {#if form?.success && form?.seeded}
    <p
      aria-live="polite"
      class="text-sm text-success bg-success/10 border border-success/20 rounded-md p-3"
    >
      {form.seeded} ejercicios añadidos a tu biblioteca. Edítalos o añade los tuyos cuando quieras.
    </p>
  {/if}
  {#if form?.success && form?.alreadyHad}
    <p
      aria-live="polite"
      class="text-sm text-text-mute bg-surface-2 border border-text-mute/20 rounded-md p-3"
    >
      Ya tenías todos los ejercicios de la biblioteca base.
    </p>
  {/if}

  {#if form?.error}
    <p role="alert" class="text-sm text-danger bg-danger/10 border border-danger/20 rounded-md p-3">
      {form.error}
    </p>
  {/if}

  {#if form?.success && form?.cambiados}
    <p
      aria-live="polite"
      class="text-sm text-success bg-success/10 border border-success/20 rounded-md p-3"
    >
      {form.cambiados}
      {form.cambiados === 1 ? 'ejercicio actualizado' : 'ejercicios actualizados'}
      {form.quitados ? '(etiqueta quitada)' : ''}.
    </p>
  {/if}

  <!--
    Aviso con deshacer. Existe porque nada más en la aplicación desarchiva un
    ejercicio: sin este botón, marcar cuarenta y ocho casillas y darle a
    archivar sería un error sin retorno desde ninguna pantalla.

    El deshacer es un formulario normal con los mismos ids: si el aviso
    desaparece al recargar, no se pierde nada raro, solo la oportunidad.
  -->
  {#if form?.success && (form?.archivados || form?.borrados || form?.archivadosPorUso)}
    <div
      aria-live="polite"
      class="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm
             bg-surface-2 border border-line rounded-md p-3"
    >
      <span class="flex-1 min-w-0">
        {#if form.archivados}
          {form.archivados}
          {form.archivados === 1 ? 'ejercicio archivado' : 'ejercicios archivados'}.
        {:else}
          {#if form.borrados}
            {form.borrados} {form.borrados === 1 ? 'borrado' : 'borrados'}.
          {/if}
          {#if form.archivadosPorUso}
            <span class="text-warning">
              {form.archivadosPorUso}
              {form.archivadosPorUso === 1 ? 'no se pudo borrar' : 'no se pudieron borrar'} porque
              {form.archivadosPorUso === 1 ? 'está' : 'están'} dentro de entrenos ya hechos: dentro hay
              series con pesos reales de tus clientes.
              {form.archivadosPorUso === 1 ? 'Se ha archivado' : 'Se han archivado'}.
            </span>
          {/if}
        {/if}
      </span>

      {#if form.idsParaDeshacer && form.idsParaDeshacer.length > 0}
        <form method="POST" action="?/desarchivarVarios" use:enhance={trasLaAccion}>
          {#each form.idsParaDeshacer as id (id)}
            <input type="hidden" name="ids" value={id} />
          {/each}
          <button
            type="submit"
            class="text-accent hover:underline font-medium"
            disabled={trabajando}
          >
            Deshacer
          </button>
        </form>
      {/if}
    </div>
  {/if}

  {#if form?.success && form?.restaurados}
    <p
      aria-live="polite"
      class="text-sm text-success bg-success/10 border border-success/20 rounded-md p-3"
    >
      {form.restaurados}
      {form.restaurados === 1 ? 'ejercicio restaurado' : 'ejercicios restaurados'}.
    </p>
  {/if}

  {#if data.exercises.length === 0}
    <!-- Estado vacío útil: explica qué gana y da el atajo, en vez de decorar. -->
    <div class="card max-w-2xl space-y-5">
      <div>
        <h2 class="text-2xl font-display font-semibold">Empieza con la biblioteca base</h2>
        <p class="text-sm text-text-mute mt-2">
          Sin ejercicios no puedes montar entrenamientos, y sin entrenamientos no puedes programarle
          nada a un cliente. Cargamos {SEED_EXERCISES.length} ejercicios básicos —con su grupo muscular
          y material— para que puedas armar el primer entreno en un minuto. Son tuyos: edítalos, bórralos
          o añádeles tu vídeo.
        </p>
      </div>

      <form
        method="POST"
        action="?/seedLibrary"
        use:enhance={() => {
          seeding = true;
          return async ({ update }) => {
            await update();
            seeding = false;
          };
        }}
        class="flex flex-wrap items-center gap-3"
      >
        <button type="submit" disabled={seeding} class="btn-primary">
          {seeding ? 'Cargando…' : `Cargar ${SEED_EXERCISES.length} ejercicios`}
        </button>
        <a href="/exercises/new" class="text-sm text-text-mute hover:text-text transition-colors">
          o crear el mío desde cero
        </a>
      </form>
    </div>
  {:else if mostrandoRejilla}
    <!-- Rejilla por grupo. Es la forma de recorrer cincuenta ejercicios sin
           desplazarse: se elige el grupo y solo entonces aparecen los suyos. -->
    <div class="grid grid-cols-2 gap-3">
      {#each conteoPorGrupo as g (g.grupo)}
        <button
          onclick={() => (filterGroup = g.grupo)}
          class="card text-left hover:border-line-strong transition-colors"
        >
          <span class="block font-semibold">{etiquetaGrupo(g.grupo)}</span>
          <span class="block text-sm text-text-mute tabular-nums">
            {g.total}
            {g.total === 1 ? 'ejercicio' : 'ejercicios'}
          </span>
        </button>
      {/each}
    </div>

    {#if hayMultiples}
      <!-- La suma de las tarjetas es MAYOR que el total, y hay que decirlo.
             Un número que no cuadra y no se explica hace desconfiar del resto
             de la pantalla. -->
      <p class="text-2xs text-text-mute">
        Tienes {data.exercises.length} ejercicios. Los que trabajan varios grupos cuentan en cada uno,
        así que estas cifras suman más.
      </p>
    {/if}
  {:else}
    {#if vista === 'grupos'}
      <!-- Dentro de un grupo. La vuelta atrás es un enlace de verdad y no un
             icono suelto: se ve a qué se vuelve. -->
      <button
        onclick={() => (filterGroup = '')}
        class="flex items-center gap-2 text-lg font-display font-semibold hover:text-accent transition-colors"
      >
        <span aria-hidden="true">←</span>
        {etiquetaGrupo(filterGroup)}
        <span class="text-sm font-normal text-text-mute tabular-nums">({filtered.length})</span>
      </button>
    {:else if presentGroups.length > 1}
      <!-- Vista lista: filtro por pastillas, que es lo de siempre. -->
      <div class="flex flex-wrap gap-2">
        <button
          onclick={() => (filterGroup = '')}
          class="px-3 py-1.5 rounded-full text-sm border transition-colors {filterGroup === ''
            ? 'bg-primary text-bg border-primary'
            : 'border-line text-text-mute hover:text-text'}"
        >
          Todos ({data.exercises.length})
        </button>
        {#each presentGroups as g (g)}
          <button
            onclick={() => (filterGroup = g)}
            class="px-3 py-1.5 rounded-full text-sm border transition-colors {filterGroup === g
              ? 'bg-primary text-bg border-primary'
              : 'border-line text-text-mute hover:text-text'}"
          >
            {muscleLabels[g] ?? g}
          </button>
        {/each}
      </div>
    {/if}

    <!-- Cabecera de selección. La casilla de "todos" va aquí y no flotando,
         para que se lea junto a la cuenta de lo que hay debajo. -->
    <div class="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-line pt-3">
      <label class="flex items-center gap-2.5 text-sm cursor-pointer select-none">
        <input
          type="checkbox"
          checked={todosMarcados}
          indeterminate={marcadosVisibles.length > 0 && !todosMarcados}
          onchange={alternarTodos}
          class="w-4 h-4 rounded border-line bg-surface-2 accent-accent"
        />
        {#if marcadosVisibles.length > 0}
          <span class="font-medium">{marcadosVisibles.length} marcados</span>
        {:else}
          <span class="text-text-mute">
            Marcar {filterGroup ? 'los ' + filtered.length + ' de este grupo' : 'todos'}
          </span>
        {/if}
      </label>
      {#if marcadosVisibles.length > 0}
        <button onclick={limpiar} class="text-sm text-text-mute hover:text-text transition-colors">
          Quitar selección
        </button>
      {/if}
    </div>

    <!-- Barra de acciones. Aparece solo con algo marcado: una fila de botones
         permanentemente deshabilitados es ruido en todas las visitas para
         servir a una minoría de ellas. -->
    {#if marcadosVisibles.length > 0}
      {@const seleccion = marcadosVisibles}
      <div class="card space-y-4">
        <!-- Etiquetar. Dos botones y no uno con un desplegable de modo:
             "añadir" y "quitar" son dos intenciones distintas y verlas juntas
             evita el error de quitar creyendo que añades. -->
        <form
          method="POST"
          action="?/etiquetarVarios"
          use:enhance={trasLaAccion}
          class="flex flex-wrap items-end gap-3"
        >
          {#each seleccion as id (id)}
            <input type="hidden" name="ids" value={id} />
          {/each}
          <div class="min-w-0">
            <label for="grupo-lote" class="block text-2xs uppercase tracking-wider text-text-mute">
              Grupo muscular
            </label>
            <select
              id="grupo-lote"
              name="muscle_group"
              bind:value={grupoNuevo}
              class="mt-1 bg-surface-2 border border-line rounded-md px-3 py-2 text-sm
                     focus:outline-none focus:border-accent"
            >
              <option value="">—</option>
              {#each Object.entries(muscleLabels) as [valor, texto] (valor)}
                <option value={valor}>{texto}</option>
              {/each}
            </select>
          </div>
          <div class="min-w-0">
            <label
              for="material-lote"
              class="block text-2xs uppercase tracking-wider text-text-mute"
            >
              Material
            </label>
            <select
              id="material-lote"
              name="equipment"
              bind:value={materialNuevo}
              class="mt-1 bg-surface-2 border border-line rounded-md px-3 py-2 text-sm
                     focus:outline-none focus:border-accent"
            >
              <option value="">—</option>
              {#each Object.entries(equipmentLabels) as [valor, texto] (valor)}
                <option value={valor}>{texto}</option>
              {/each}
            </select>
          </div>
          <button
            type="submit"
            name="modo"
            value="anadir"
            class="action-primary"
            disabled={trabajando || (!grupoNuevo && !materialNuevo)}
          >
            Añadir a {seleccion.length}
          </button>
          <button
            type="submit"
            name="modo"
            value="quitar"
            class="action-neutral"
            disabled={trabajando || (!grupoNuevo && !materialNuevo)}
          >
            Quitar
          </button>
          <p class="text-2xs text-text-mute w-full">
            Añadir conserva las etiquetas que ya tuvieran. Un ejercicio puede trabajar varios
            grupos.
          </p>
        </form>

        <!-- Quitar de en medio -->
        <div class="flex flex-wrap items-center gap-3 border-t border-line pt-4">
          <form method="POST" action="?/archivarVarios" use:enhance={trasLaAccion}>
            {#each seleccion as id (id)}
              <input type="hidden" name="ids" value={id} />
            {/each}
            <button type="submit" class="action-neutral" disabled={trabajando}>
              Archivar {seleccion.length}
            </button>
          </form>

          <!-- El borrado va con confirmación y el archivado no, y no es
               inconsistencia: archivar se puede deshacer desde el aviso que
               sale justo después; borrar, no. -->
          <form
            method="POST"
            action="?/borrarVarios"
            use:enhance={({ cancel }) => {
              if (
                !confirm(
                  `¿Borrar ${seleccion.length} ejercicio(s)? Los que estén dentro de un entreno ya hecho no se borran: se archivan, para no romper el historial de tus clientes.`
                )
              ) {
                cancel();
                return async () => {};
              }
              return trasLaAccion();
            }}
          >
            {#each seleccion as id (id)}
              <input type="hidden" name="ids" value={id} />
            {/each}
            <button type="submit" class="action-danger" disabled={trabajando}>
              Borrar {seleccion.length}
            </button>
          </form>

          <p class="text-2xs text-text-mute flex-1 min-w-0">
            Archivar los quita de la biblioteca y del constructor, pero no toca ningún entreno ya
            programado.
          </p>
        </div>
      </div>
    {/if}

    <!-- Filas densas en vez de tarjetas: no hay miniatura real que enseñar
         (el hueco se rellenaba con un emoji), y una rejilla de 48 tarjetas
         con un placeholder de 190px es scroll infinito en el móvil.

         La fila ya no es un enlace entero: una casilla dentro de un <a> no es
         HTML válido y además haría imposible marcar sin navegar. Ahora la
         casilla y el enlace son hermanos, y el área táctil del enlace sigue
         ocupando todo lo demás. -->
    <div class="border-t border-line">
      {#each filtered as ex (ex.id)}
        {@const marcado = marcados.has(ex.id)}
        <div class="row {marcado ? 'bg-surface-2/60' : ''}">
          <input
            type="checkbox"
            checked={marcado}
            onchange={() => alternar(ex.id)}
            aria-label="Marcar {ex.name}"
            class="w-4 h-4 flex-shrink-0 rounded border-line bg-surface-2 accent-accent cursor-pointer"
          />
          <a href="/exercises/{ex.id}" class="flex-1 min-w-0 group">
            <span class="font-medium block truncate group-hover:text-accent transition-colors">
              {ex.name}
            </span>
            {#if !ex.video_url}
              <span class="text-xs text-warning">sin vídeo</span>
            {/if}
          </a>
          {#each ex.muscle_groups ?? [] as g (g)}
            <span class="pill-mute flex-shrink-0">{muscleLabels[g] ?? g}</span>
          {/each}
          <!-- El significado NO puede vivir en un `title`: un lector de
               pantalla no lo anuncia y en un móvil no hay forma de verlo. El
               icono es decoración y el texto va en sr-only. -->
          {#if ex.video_url || ex.video_path}
            <span class="flex-shrink-0 text-text-mute">
              <Icono nombre="video" class="w-4 h-4" />
              <span class="sr-only">Tiene vídeo</span>
            </span>
          {/if}
          <a href="/exercises/{ex.id}" class="text-xs text-accent flex-shrink-0">Editar</a>
        </div>
      {/each}
    </div>
  {/if}
</div>
