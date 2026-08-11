<script lang="ts">
  import { enhance } from '$app/forms';
  import { hora, diaConSemana } from '$lib/formato';

  let { data, form } = $props();
</script>

<svelte:head>
  <title>Inicio · Treno</title>
</svelte:head>

<div class="space-y-10">
  {#if form?.error}
    <p role="alert" class="text-sm text-danger bg-danger/10 border border-danger/20 rounded-md p-3">
      {form.error}
    </p>
  {/if}

  <!-- Deshacer el rechazo. Aparece justo después y solo entonces: rechazar es
       lo único de esta pantalla que le llega al cliente, y el ✓ y la ✕ están a
       un pulgar de distancia en un móvil. -->
  {#if form?.success && form?.rechazada}
    <div
      aria-live="polite"
      class="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm bg-surface-2 border border-line rounded-md p-3"
    >
      <span class="flex-1 min-w-0">Cita rechazada. Tu cliente ya lo ve.</span>
      <form method="POST" action="?/deshacerRechazo" use:enhance>
        <input type="hidden" name="session_id" value={form.sessionId} />
        <button type="submit" class="text-accent hover:underline font-medium">Deshacer</button>
      </form>
    </div>
  {/if}

  <!-- ============== Próximas sesiones ============== -->
  <section class="space-y-3">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-xl sm:text-2xl font-display font-semibold tracking-tight">
        Próximas sesiones
      </h1>
      <a href="/agenda" class="action-primary">+ Añadir</a>
    </div>

    {#if data.proximas.length === 0}
      <div class="card space-y-3">
        {#if data.hayClientes}
          <p class="text-text-mute">
            No tienes ninguna sesión confirmada. Propón una desde la agenda, o abre huecos para que
            te la pidan ellos.
          </p>
          <div class="flex flex-wrap gap-3">
            <a href="/agenda" class="btn-primary">Ir a la agenda</a>
            <a href="/availability" class="btn-ghost">Abrir huecos</a>
          </div>
        {:else}
          <p class="text-text-mute">
            Todavía no tienes clientes. En cuanto invites al primero podrás programarle entrenos y
            citas.
          </p>
          <a href="/clients" class="btn-primary">Invitar a mi primer cliente</a>
        {/if}
      </div>
    {:else}
      <!-- Tira horizontal, como en el wireframe. La tarjeta cortada del borde
           es lo que indica que hay más: sin ella parecería que se acaban ahí.
           snap-x para que el arrastre no deje una tarjeta a medias. -->
      <div class="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0">
        {#each data.proximas as s (s.id)}
          <a
            href="/clients/{s.clientId}"
            class="card snap-start flex-shrink-0 w-64 hover:border-line-strong transition-colors"
          >
            <span class="block font-semibold truncate">{s.nombre}</span>
            {#if s.donde}
              <span class="block text-sm text-text-mute truncate">{s.donde}</span>
            {:else}
              <span class="block text-sm text-text-mute capitalize">{s.modalidad}</span>
            {/if}
            <span class="block text-sm text-text-mute tabular-nums mt-1">
              {hora(s.cuando)} · {diaConSemana(s.cuando)}
            </span>
          </a>
        {/each}
      </div>

      <a href="/agenda" class="inline-block text-sm underline hover:text-accent transition-colors">
        Ver todas las citas
      </a>
    {/if}
  </section>

  <!-- ============== Peticiones pendientes ============== -->
  {#if data.totalPeticiones > 0}
    <section class="space-y-3">
      <h2 class="text-xl sm:text-2xl font-display font-semibold tracking-tight">
        Peticiones pendientes
      </h2>

      <div class="space-y-3">
        {#each data.peticiones as p (p.id)}
          <div class="card flex items-center gap-3">
            <div class="flex-1 min-w-0">
              <span class="block font-semibold truncate">{p.nombre}</span>
              <span class="block text-sm text-text-mute tabular-nums">
                {diaConSemana(p.cuando)} · {hora(p.cuando)}
              </span>
              {#if p.donde}
                <span class="block text-sm text-text-mute truncate">{p.donde}</span>
              {/if}
            </div>

            <!--
              Aceptar y rechazar SEPARADOS y con tamaños distintos.

              El wireframe los pone pegados, uno encima del otro, en el borde
              derecho. Aceptar es lo que se hace casi siempre y rechazar le
              llega al cliente: a ocho píxeles de distancia, con el pulgar y
              con prisa, el fallo es cuestión de tiempo. Aceptar es grande y
              lleva el color; rechazar es pequeño, va aparte, y encima tiene
              "deshacer" arriba.
            -->
            <div class="flex items-center gap-2 flex-shrink-0">
              <form method="POST" action="?/confirmar" use:enhance>
                <input type="hidden" name="session_id" value={p.id} />
                <button
                  type="submit"
                  class="btn-primary"
                  aria-label="Aceptar la cita de {p.nombre}"
                >
                  Aceptar
                </button>
              </form>
              <form method="POST" action="?/rechazar" use:enhance>
                <input type="hidden" name="session_id" value={p.id} />
                <button
                  type="submit"
                  class="action-neutral"
                  aria-label="Rechazar la cita de {p.nombre}"
                >
                  Rechazar
                </button>
              </form>
            </div>
          </div>
        {/each}
      </div>

      {#if data.totalPeticiones > data.peticiones.length}
        <a
          href="/agenda"
          class="inline-block text-sm underline hover:text-accent transition-colors"
        >
          Ver otras {data.totalPeticiones - data.peticiones.length} citas pendientes
        </a>
      {/if}
    </section>
  {/if}
</div>
