<script lang="ts">
  import { diaConAnio } from '$lib/formato';
  import { enhance } from '$app/forms';
  import Avatar from '$lib/components/Avatar.svelte';
  import Icono from '$lib/components/Icono.svelte';
  import { page } from '$app/state';
  import { paymentStatus } from '$lib/supabase/types';
  import { todayISOLocal } from '$lib/week';
  import ConfirmModal from '$lib/components/ConfirmModal.svelte';

  let { data, form } = $props();

  // ---- Filtro por etiqueta ----
  //
  // Etiquetar sin poder filtrar no sirve para nada: la razón de ponerle «VIP» a
  // alguien es encontrarle después. Solo aparece si tiene etiquetas creadas,
  // porque una fila de filtros vacía es ruido en todas las visitas.
  let filtroEtiqueta = $state('');

  // ---- Buscar en la cartera ----
  //
  // Busca en el nombre Y en el correo. El correo importa más de lo que parece:
  // es lo único que el entrenador tiene cuando alguien le escribe desde una
  // dirección y no recuerda de quién era.
  let busqueda = $state('');
  const normalizar = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  // ---- Vista ----
  //
  // La LISTA es la predeterminada, no la rejilla, aunque el wireframe enseñe
  // la rejilla: caben doce o catorce clientes por pantalla frente a siete. Con
  // quince clientes la rejilla es más bonita; con sesenta, es desplazamiento.
  // Quien la prefiera la elige, y esa es justo la razón de que haya
  // conmutador.
  let vista = $state<'lista' | 'rejilla'>('lista');
  const etiquetasEnUso = $derived(
    [...new Set(data.active.flatMap((c) => c.tags ?? []))].sort((a, b) =>
      (data.vocabulario.client[a] ?? a).localeCompare(data.vocabulario.client[b] ?? b)
    )
  );
  const activosFiltrados = $derived.by(() => {
    const q = normalizar(busqueda.trim());
    return data.active.filter((c) => {
      if (filtroEtiqueta !== '' && !(c.tags ?? []).includes(filtroEtiqueta)) return false;
      if (q === '') return true;
      return normalizar(c.full_name ?? '').includes(q) || normalizar(c.email ?? '').includes(q);
    });
  });

  let tab = $state<'active' | 'pending'>('active');
  // Se abre solo con ?invite=1 (atajo desde el home o desde un grupo).
  // svelte-ignore state_referenced_locally
  let showInvite = $state(page.url.searchParams.get('invite') === '1');
  let inviting = $state(false);

  // Modo de invitación: una persona o una lista pegada. Si venimos de un grupo
  // (?group=…), lo natural es abrir directamente en masa.
  // svelte-ignore state_referenced_locally
  let inviteMode = $state<'one' | 'bulk'>(page.url.searchParams.get('group') ? 'bulk' : 'one');
  // Grupo preseleccionado si venimos de /groups/[id].
  // svelte-ignore state_referenced_locally
  let inviteGroup = $state(page.url.searchParams.get('group') ?? '');
  let bulkEmails = $state('');
  // Grupo nuevo escrito en el propio formulario de invitar.
  let grupoNuevo = $state('');

  // La confirmación se apaga a mano al pulsar «Añadir otro». No basta con
  // mirar `form`: form sigue trayendo el éxito anterior hasta el siguiente
  // envío, así que sin esto el formulario nuevo no llegaría a verse.
  let invitacionEnviada = $state(false);

  function cerrarInvitar() {
    showInvite = false;
    invitacionEnviada = false;
    grupoNuevo = '';
  }
  const bulkCount = $derived(
    bulkEmails
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean).length
  );

  // Modal de cancelar invitación.
  let cancelOpen = $state(false);
  let toCancel = $state<{ id: string; name: string }>({ id: '', name: '' });
  function askCancel(id: string, name: string) {
    toCancel = { id, name };
    cancelOpen = true;
  }

  // Etiqueta de estado de pago. Devuelve null si el cliente no tiene cuota
  // definida, para no ensuciar la lista con estados vacíos.
  function payLabelFor(fee: { fee_amount: number | null; paid_until: string | null } | null) {
    const st = paymentStatus(fee, todayISOLocal());
    if (st === 'sin_cuota') return null;
    // El símbolo es para la rejilla, donde el estado va en un punto pequeño.
    // Nunca viaja solo: al lado siempre hay un texto para lectores de pantalla.
    if (st === 'al_dia') return { text: 'Al día', cls: 'pill-ok', tinte: 'tinte-ok', simbolo: '✓' };
    if (st === 'vence_pronto')
      return { text: 'Vence pronto', cls: 'pill-warn', tinte: 'tinte-aviso', simbolo: '!' };
    return { text: 'Vencido', cls: 'pill-danger', tinte: 'tinte-peligro', simbolo: '×' };
  }

  // El guion cuando no hay fecha se queda aquí: es decisión de esta pantalla,
  // no del formateo.
  const fmtDate = (iso: string | null) => (iso ? diaConAnio(iso) : '—');
</script>

<svelte:head>
  <title>Clientes · Treno</title>
</svelte:head>

<svelte:window
  onkeydown={(e) => {
    if (showInvite && e.key === 'Escape') cerrarInvitar();
  }}
/>

<div class="space-y-6">
  <div class="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
    <div class="min-w-0">
      <span class="eyebrow">tu cartera</span>
      <h1 class="text-2xl sm:text-3xl font-display font-semibold tracking-tight mt-2">Clientes</h1>
    </div>
    <div class="flex items-center gap-3">
      <a
        href="/groups"
        class="text-sm text-text-mute hover:text-primary transition-colors whitespace-nowrap"
      >
        Grupos
      </a>
      <button
        class="btn-primary whitespace-nowrap"
        onclick={() => {
          invitacionEnviada = false;
          showInvite = true;
        }}>+ Invitar cliente</button
      >
    </div>
  </div>

  {#if form?.success && form?.invited_email}
    <p
      aria-live="polite"
      class="text-sm text-success bg-success/10 border border-success/20 rounded-md p-3"
    >
      Invitación enviada a {form.invited_email}. Aparecerá en “Pendientes” hasta que la acepte.
    </p>
  {/if}
  {#if form?.success && form?.resent_email}
    <p
      aria-live="polite"
      class="text-sm text-success bg-success/10 border border-success/20 rounded-md p-3"
    >
      Invitación reenviada a {form.resent_email}.
    </p>
  {/if}
  {#if form?.success && form?.bulk}
    <div
      aria-live="polite"
      class="text-sm bg-success/10 border border-success/20 rounded-md p-3 space-y-1"
    >
      <p class="text-success font-medium">
        {form.sent} de {form.total} invitaciones enviadas.
      </p>
      {#if form.errors && form.errors.length > 0}
        <p class="text-danger text-xs">No se pudieron enviar:</p>
        <ul class="text-xs text-text-mute list-disc pl-5">
          {#each form.errors as e}
            <li>{e.email} — {e.reason}</li>
          {/each}
        </ul>
      {/if}
    </div>
  {/if}
  {#if form?.success && form?.cancelled}
    <p
      aria-live="polite"
      class="text-sm text-success bg-success/10 border border-success/20 rounded-md p-3"
    >
      Invitación cancelada.
    </p>
  {/if}

  <!-- Pestañas -->
  <div class="flex gap-1 border-b border-line overflow-x-auto">
    <button
      onclick={() => (tab = 'active')}
      class="px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap flex-shrink-0 -mb-px transition-colors
        {tab === 'active'
        ? 'border-accent text-text'
        : 'border-transparent text-text-mute hover:text-text'}"
    >
      Activos ({data.active.length})
    </button>
    <button
      onclick={() => (tab = 'pending')}
      class="px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap flex-shrink-0 -mb-px transition-colors flex items-center gap-2
        {tab === 'pending'
        ? 'border-accent text-text'
        : 'border-transparent text-text-mute hover:text-text'}"
    >
      Pendientes
      {#if data.pending.length > 0}
        <span class="text-xs px-2 py-0.5 rounded-full bg-warning/15 text-warning"
          >{data.pending.length}</span
        >
      {/if}
    </button>
  </div>

  {#if tab === 'active'}
    {#if data.active.length === 0}
      <div class="card text-center py-16">
        <div class="text-6xl mb-4" aria-hidden="true">👥</div>
        <h2 class="text-xl font-semibold mb-2">Aún no tienes clientes activos</h2>
        <p class="text-sm text-text-mute max-w-md mx-auto">
          Invita a tu primer cliente por email. Cuando acepte la invitación, aparecerá aquí.
        </p>
      </div>
    {:else}
      <!-- Buscar y «+ Añadir» a la izquierda, conmutador a la derecha, igual
           que en la biblioteca: lo que cambia QUÉ se ve, junto; lo que cambia
           CÓMO se ve, aparte. -->
      <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div class="flex flex-wrap items-center gap-3 flex-1 min-w-[16rem]">
          <div class="relative flex-1 min-w-[12rem]">
            <label for="buscar" class="sr-only">Buscar en tu cartera</label>
            <input
              id="buscar"
              type="search"
              bind:value={busqueda}
              placeholder="Buscar en tu cartera"
              class="w-full pl-9 pr-3 py-2 bg-bg border border-line rounded-md text-sm
                     focus:outline-none focus:border-accent"
            />
            <span
              class="absolute left-3 top-1/2 -translate-y-1/2 text-text-mute pointer-events-none"
            >
              <Icono nombre="buscar" class="w-4 h-4" />
            </span>
          </div>
        </div>

        <div
          class="flex rounded-md border border-line overflow-hidden"
          role="group"
          aria-label="Vista"
        >
          <button
            onclick={() => (vista = 'lista')}
            aria-pressed={vista === 'lista'}
            class="flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors {vista ===
            'lista'
              ? 'bg-primary text-bg font-medium'
              : 'text-text-mute hover:text-text'}"
          >
            <Icono nombre="lista" class="w-4 h-4" />
            Lista
          </button>
          <button
            onclick={() => (vista = 'rejilla')}
            aria-pressed={vista === 'rejilla'}
            class="flex items-center gap-1.5 px-3 py-1.5 text-sm border-l border-line
                   transition-colors {vista === 'rejilla'
              ? 'bg-primary text-bg font-medium'
              : 'text-text-mute hover:text-text'}"
          >
            <Icono nombre="rejilla" class="w-4 h-4" />
            Fotos
          </button>
        </div>
      </div>

      {#if etiquetasEnUso.length > 0}
        <!-- La fila de filtros solo existe si hay algo que filtrar: con cero
             etiquetas puestas sería una barra vacía en todas las visitas. -->
        <div class="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          <button
            onclick={() => (filtroEtiqueta = '')}
            aria-pressed={filtroEtiqueta === ''}
            class="px-3 py-1 rounded-full text-xs whitespace-nowrap flex-shrink-0 border transition-colors
              {filtroEtiqueta === ''
              ? 'border-accent bg-accent/10 text-text'
              : 'border-line text-text-mute hover:text-text'}"
          >
            Todos
          </button>
          {#each etiquetasEnUso as slug (slug)}
            <button
              onclick={() => (filtroEtiqueta = filtroEtiqueta === slug ? '' : slug)}
              aria-pressed={filtroEtiqueta === slug}
              class="px-3 py-1 rounded-full text-xs whitespace-nowrap flex-shrink-0 border transition-colors
                {filtroEtiqueta === slug
                ? 'border-accent bg-accent/10 text-text'
                : 'border-line text-text-mute hover:text-text'}"
            >
              {data.vocabulario.client[slug] ?? slug}
            </button>
          {/each}
        </div>
      {/if}

      {#if vista === 'lista'}
        <!-- Lista densa: filas separadas por línea, no tarjetas. Se ve más
             gente por pantalla y el estado de pago se lee de un vistazo. -->
        <div class="border-t border-line">
          {#each activosFiltrados as client (client.id)}
            {@const pay = payLabelFor(client.fee)}
            <a href="/clients/{client.id}" class="row-link">
              <Avatar url={client.avatar} nombre={client.full_name} tamano="sm" />
              <div class="flex-1 min-w-0">
                <div class="font-medium truncate">{client.full_name ?? 'Sin nombre'}</div>
                <!-- Grupo y etiquetas en la misma línea, y el email solo si no
                     hay ninguno de los dos: los tres compiten por el mismo
                     hueco, y el email ya está en la ficha. -->
                <div class="text-xs text-text-mute truncate">
                  {[client.grupo ?? 'Individual']
                    .concat(client.tags.map((s) => data.vocabulario.client[s] ?? s))
                    .join(' · ')}
                </div>
              </div>
              {#if client.fee?.fee_amount}
                <span class="text-xs text-text-mute tabular-nums hidden sm:block flex-shrink-0">
                  {client.fee.fee_amount} €/mes
                </span>
              {/if}
              {#if pay}
                <span class="{pay.cls} flex-shrink-0">{pay.text}</span>
              {/if}
              <span class="text-text-mute text-sm flex-shrink-0">→</span>
            </a>
          {/each}
        </div>
      {:else}
        <!-- Rejilla de dos columnas, como el wireframe. Dos y no tres ni
             cuatro: en un móvil, tres tarjetas por fila dejan el nombre en dos
             líneas cortadas y la cara del tamaño de un sello, que es lo único
             que la rejilla aporta sobre la lista. -->
        <div class="grid grid-cols-2 gap-3">
          {#each activosFiltrados as client (client.id)}
            {@const pay = payLabelFor(client.fee)}
            <a
              href="/clients/{client.id}"
              class="card relative flex flex-col items-center text-center gap-2
                     hover:border-accent transition-colors"
            >
              {#if pay}
                <!--
                  El estado, arriba a la derecha como en el wireframe, pero NO
                  solo con color.

                  Tres colores no dicen a nadie qué significan la primera vez, y
                  a quien no distingue el rojo del verde no le dicen nada nunca.
                  Así que el punto lleva su letra dentro —✓, !, ×— y el texto
                  completo va en un title y en sr-only, que es lo que lee un
                  lector de pantalla.
                -->
                <span
                  class="absolute top-3 right-3 w-6 h-6 rounded-full grid place-items-center
                         text-2xs font-bold {pay.tinte}"
                  title={pay.text}
                >
                  <span aria-hidden="true">{pay.simbolo}</span>
                  <span class="sr-only">{pay.text}</span>
                </span>
              {/if}

              <Avatar url={client.avatar} nombre={client.full_name} tamano="lg" class="mt-1" />

              <div class="min-w-0 w-full">
                <div class="font-medium truncate">{client.full_name ?? 'Sin nombre'}</div>
                <!-- El grupo, o «Individual». No se deja el hueco vacío: en una
                     rejilla, una tarjeta con una línea menos que las de al lado
                     parece que le falta algo. -->
                <div class="text-xs text-text-mute truncate">{client.grupo ?? 'Individual'}</div>
                {#if client.tags.length > 0}
                  <div class="text-2xs text-text-mute truncate mt-1">
                    {client.tags.map((s) => data.vocabulario.client[s] ?? s).join(' | ')}
                  </div>
                {/if}
              </div>
            </a>
          {/each}
        </div>
      {/if}

      {#if activosFiltrados.length === 0}
        <p class="card py-8 text-center text-sm text-text-mute">
          {busqueda.trim() ? 'Nadie con ese nombre ni ese correo.' : 'Nadie con esta etiqueta.'}
        </p>
      {/if}
    {/if}
  {:else if data.pending.length === 0}
    <div class="card text-center py-16">
      <div class="text-5xl mb-4" aria-hidden="true">📭</div>
      <h2 class="text-xl font-semibold mb-2">No hay invitaciones pendientes</h2>
      <p class="text-sm text-text-mute max-w-md mx-auto">
        Cuando invites a alguien, aparecerá aquí hasta que acepte y ponga su contraseña.
      </p>
    </div>
  {:else}
    <div class="space-y-2">
      {#each data.pending as client (client.id)}
        <div class="card p-4 flex items-center gap-4">
          <div
            class="w-11 h-11 rounded-full bg-warning/10 grid place-items-center text-warning flex-shrink-0"
            aria-hidden="true"
          >
            <svg
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <rect x="3" y="5" width="18" height="14" rx="2" /><path
                d="m3 7 9 6 9-6"
                stroke-linecap="round"
              />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-semibold truncate">{client.full_name ?? 'Sin nombre'}</div>
            <div class="text-xs text-text-mute truncate">{client.email ?? '—'}</div>
            <div class="text-2xs text-text-mute mt-0.5">
              Invitado el {fmtDate(client.invited_at)}
            </div>
          </div>
          <span class="text-2xs px-2 py-0.5 rounded-full bg-warning/15 text-warning flex-shrink-0">
            Pendiente de aceptar
          </span>
          <div class="flex flex-col gap-1.5 flex-shrink-0">
            <form method="POST" action="?/resendInvite" use:enhance>
              <input type="hidden" name="email" value={client.email ?? ''} />
              <input type="hidden" name="full_name" value={client.full_name ?? ''} />
              <button type="submit" class="action-neutral w-full">Reenviar</button>
            </form>
            <button
              type="button"
              class="action-danger"
              onclick={() =>
                askCancel(client.id, client.full_name ?? client.email ?? 'este cliente')}
            >
              Cancelar
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- Modal: invitar cliente -->
{#if showInvite}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-[200] grid place-items-center bg-black/60 backdrop-blur-sm p-4"
    role="presentation"
    onclick={cerrarInvitar}
  >
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
    <div
      class="card w-full max-w-md space-y-4"
      role="dialog"
      tabindex="-1"
      aria-modal="true"
      aria-labelledby="invite-title"
      onclick={(e) => e.stopPropagation()}
    >
      {#if invitacionEnviada && form?.invited_email}
        <!--
          Pantalla 13: la confirmación ocupa el modal entero en vez de ser un
          mensaje verde detrás.

          «Añadir otro» existe porque el caso real de un entrenador que empieza
          no es invitar a uno: es invitar a doce seguidos con la lista delante.
          Con un mensaje y el modal cerrado, cada persona son tres clics de más.
        -->
        <div class="space-y-4">
          <h3 id="invite-title" class="text-lg font-semibold">¡Invitación enviada!</h3>
          <p class="text-sm text-text-mute">
            Se ha enviado la invitación a <strong class="text-text">{form.invited_email}</strong>.
            No aparecerá en el listado de clientes hasta que la acepte, pero
            <strong class="text-text">puedes cancelarla o reenviarla</strong>
            desde la pestaña de pendientes.
          </p>
          <div class="flex flex-wrap gap-3 justify-end pt-1">
            <button
              type="button"
              class="action-neutral"
              onclick={() => {
                // Vaciar el grupo nuevo: si el anterior lo creó, ya existe y
                // volver a mandarlo crearía otro con el mismo nombre.
                grupoNuevo = '';
                invitacionEnviada = false;
              }}
            >
              Añadir otro
            </button>
            <button type="button" class="btn-primary py-2 px-5" onclick={cerrarInvitar}>
              Volver al listado
            </button>
          </div>
        </div>
      {:else}
        <div>
          <h3 id="invite-title" class="text-lg font-semibold">Añadir cliente</h3>
          <!-- Qué le llega y qué tiene que hacer, antes de pedir sus datos:
               es la pregunta que se hace todo el que invita por primera vez. -->
          <p class="text-sm text-text-mute mt-1">
            El cliente recibirá una invitación a su correo electrónico. Si no tiene cuenta de Treno,
            no podrá aceptarla hasta que se cree una.
          </p>
        </div>

        <!-- Selector de modo -->
        <div class="flex gap-1 border-b border-line overflow-x-auto">
          <button
            type="button"
            onclick={() => (inviteMode = 'one')}
            class="px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors
            {inviteMode === 'one'
              ? 'border-primary text-text'
              : 'border-transparent text-text-mute hover:text-text'}"
          >
            Una persona
          </button>
          <button
            type="button"
            onclick={() => (inviteMode = 'bulk')}
            class="px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors
            {inviteMode === 'bulk'
              ? 'border-primary text-text'
              : 'border-transparent text-text-mute hover:text-text'}"
          >
            Varias a la vez
          </button>
        </div>

        {#if inviteMode === 'bulk'}
          <form
            method="POST"
            action="?/inviteBulk"
            use:enhance={() => {
              inviting = true;
              return async ({ result, update }) => {
                await update();
                inviting = false;
                // La masiva sí cierra: su resultado es un recuento con los
                // fallos, y ese se lee mejor en la página que en un modal.
                if (result.type === 'success') {
                  bulkEmails = '';
                  cerrarInvitar();
                }
              };
            }}
            class="space-y-4"
          >
            <div>
              <label
                for="bulk-emails"
                class="block text-xs uppercase tracking-wider text-text-mute mb-2"
              >
                Emails
              </label>
              <textarea
                id="bulk-emails"
                name="emails"
                bind:value={bulkEmails}
                rows="6"
                required
                placeholder={'ana@empresa.com\nlucia@empresa.com\nMarta Ruiz <marta@empresa.com>'}
                class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md text-sm font-mono
                     focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
              ></textarea>
              <p class="text-2xs text-text-mute mt-1">
                Uno por línea (o separados por comas). Puedes poner “Nombre &lt;email&gt;”.
                {#if bulkCount > 0}<span class="text-primary"> · {bulkCount} detectados</span>{/if}
              </p>
            </div>

            {#if data.groups.length > 0}
              <div>
                <label
                  for="bulk-group"
                  class="block text-xs uppercase tracking-wider text-text-mute mb-2"
                >
                  Añadir al grupo <span class="normal-case tracking-normal text-text-mute/70"
                    >(opcional)</span
                  >
                </label>
                <select
                  id="bulk-group"
                  name="group_id"
                  bind:value={inviteGroup}
                  class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md text-sm focus:border-primary"
                >
                  <option value="">Sin grupo</option>
                  {#each data.groups as g (g.id)}<option value={g.id}>{g.name}</option>{/each}
                </select>
              </div>
            {/if}

            <p
              class="text-2xs text-text-mute bg-warning/10 border border-warning/20 rounded-md p-2.5"
            >
              Enviar muchas invitaciones de golpe puede topar con el límite de envío del proveedor
              de correo. Te diremos cuáles salieron y cuáles no.
            </p>

            {#if form?.error}
              <p
                role="alert"
                class="text-sm text-danger bg-danger/10 border border-danger/20 rounded-md p-3"
              >
                {form.error}
              </p>
            {/if}

            <div class="flex gap-3 justify-end pt-1">
              <button type="button" class="action-neutral" onclick={cerrarInvitar}>Cancelar</button>
              <button
                type="submit"
                disabled={inviting || bulkCount === 0}
                class="btn-primary py-2 px-5"
              >
                {inviting ? 'Enviando…' : `Invitar ${bulkCount || ''}`}
              </button>
            </div>
          </form>
        {:else}
          <form
            method="POST"
            action="?/invite"
            use:enhance={() => {
              inviting = true;
              return async ({ result, update }) => {
                await update();
                inviting = false;
                // El formulario NO se cierra al enviar: se queda enseñando la
                // confirmación, que es la pantalla 13 del wireframe.
                //
                // Se mira `result` y no `form`: form conserva el éxito
                // anterior hasta el siguiente envío, así que con él la
                // confirmación volvería a salir sola tras «Añadir otro».
                invitacionEnviada = result.type === 'success';
              };
            }}
            class="space-y-4"
          >
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  for="nombre"
                  class="block text-xs uppercase tracking-wider text-text-mute mb-2"
                >
                  Nombre <span class="text-danger">*</span>
                </label>
                <input
                  id="nombre"
                  name="nombre"
                  type="text"
                  required
                  maxlength="40"
                  placeholder="Naia"
                  class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label
                  for="apellidos"
                  class="block text-xs uppercase tracking-wider text-text-mute mb-2"
                >
                  Apellidos
                </label>
                <input
                  id="apellidos"
                  name="apellidos"
                  type="text"
                  maxlength="60"
                  placeholder="Serrano García"
                  class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div>
              <label for="email" class="block text-xs uppercase tracking-wider text-text-mute mb-2">
                Correo electrónico <span class="text-danger">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                maxlength="100"
                placeholder="naia.sg99@gmail.com"
                class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <!-- Grupo: elegir uno o crear uno aquí mismo.
               Los dos campos existen a la vez pero solo uno se usa: escribir
               un nombre nuevo manda sobre el desplegable, y se dice. -->
            <div>
              <p class="block text-xs uppercase tracking-wider text-text-mute mb-2">
                Grupo <span class="normal-case tracking-normal text-text-mute/70">(opcional)</span>
              </p>
              <div class="grid gap-3 sm:grid-cols-2">
                <select
                  name="group_id"
                  bind:value={inviteGroup}
                  disabled={grupoNuevo.trim() !== ''}
                  aria-label="Elegir un grupo que ya existe"
                  class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md text-sm
                       disabled:opacity-40 focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Sin grupo</option>
                  {#each data.groups as g (g.id)}
                    <option value={g.id}>{g.name}</option>
                  {/each}
                </select>
                <input
                  name="grupo_nuevo"
                  type="text"
                  bind:value={grupoNuevo}
                  maxlength="80"
                  placeholder="…o crear uno nuevo"
                  aria-label="Crear un grupo nuevo"
                  class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md text-sm
                       focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              {#if grupoNuevo.trim()}
                <p class="text-2xs text-text-mute mt-2">
                  Se creará el grupo «{grupoNuevo.trim()}» y entrará en él.
                </p>
              {/if}
            </div>

            {#if form?.error}
              <p
                role="alert"
                class="text-sm text-danger bg-danger/10 border border-danger/20 rounded-md p-3"
              >
                {form.error}
              </p>
            {/if}

            <div class="flex gap-3 justify-end pt-1">
              <button type="button" class="action-neutral" onclick={cerrarInvitar}>Cancelar</button>
              <button type="submit" disabled={inviting} class="btn-primary py-2 px-5">
                {inviting ? 'Enviando…' : 'Enviar invitación'}
              </button>
            </div>
          </form>
        {/if}
      {/if}
    </div>
  </div>
{/if}

<ConfirmModal
  bind:open={cancelOpen}
  action="?/cancelInvite"
  fields={{ client_id: toCancel.id }}
  title="Cancelar invitación"
  message={`Se cancelará la invitación de ${toCancel.name} y se eliminará su acceso pendiente. Podrás volver a invitarle cuando quieras.`}
  confirmLabel="Cancelar invitación"
/>
