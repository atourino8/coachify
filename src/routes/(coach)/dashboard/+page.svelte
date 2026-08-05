<script lang="ts">
  import { enhance } from '$app/forms';

  let { data, form } = $props();

  function fmtTime(iso: string) {
    return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }
  function fmtDay(iso: string) {
    return new Date(iso).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
  }
  function fmtDate(iso: string) {
    return new Date(iso + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }
  // "hace 2 días" en vez de una fecha: para un vídeo pendiente, lo que importa
  // es cuánto lleva esperando el cliente.
  function hace(iso: string) {
    const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    if (dias <= 0) return 'hoy';
    if (dias === 1) return 'ayer';
    return `hace ${dias} días`;
  }

  const modalityLabel: Record<string, string> = {
    presencial: 'Presencial',
    online: 'Online',
    remoto: 'Remoto'
  };

  const hoy = new Date().toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long'
  });

  // Contador de todo lo que espera una decisión tuya.
  const pendientes = $derived(
    data.pendingRequests.length +
      data.pendingVideoCount +
      data.paymentAlerts.length +
      data.clientsWithoutWorkout.length
  );
</script>

<svelte:head>
  <title>Inicio · Coachify</title>
</svelte:head>

<div class="space-y-8">
  <!-- Cabecera: la jerarquía la marca el tipo, no la decoración -->
  <div>
    <span class="eyebrow capitalize">{hoy}</span>
    <h1 class="text-4xl font-display font-semibold tracking-tight mt-1.5">
      Hola{data.firstName ? ', ' + data.firstName : ''}
    </h1>
    {#if data.hasClients}
      <p class="text-sm text-text-mute mt-2">
        {#if pendientes === 0}
          Nada pendiente. Tienes {data.counts.clients}
          {data.counts.clients === 1 ? 'cliente' : 'clientes'} en marcha.
        {:else}
          {pendientes} {pendientes === 1 ? 'cosa espera' : 'cosas esperan'} por ti.
        {/if}
      </p>
    {/if}
  </div>

  <!-- Acciones: tira compacta de texto, sin tarjetas ni iconos decorativos -->
  <nav class="flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-line py-3 text-sm">
    <span class="text-xs uppercase tracking-wider text-text-mute">Crear</span>
    <a href="/agenda?propose=1" class="font-medium hover:text-accent transition-colors">Cita</a>
    <a href="/templates?new=1" class="font-medium hover:text-accent transition-colors">Entrenamiento</a>
    <a href="/exercises/new" class="font-medium hover:text-accent transition-colors">Ejercicio</a>
    <a href="/clients?invite=1" class="font-medium hover:text-accent transition-colors">Invitar cliente</a>
    <a href="/groups" class="font-medium hover:text-accent transition-colors">Grupo</a>
  </nav>

  {#if form?.error}
    <p role="alert" class="text-sm text-danger bg-danger/10 border border-danger/20 rounded-md p-3">{form.error}</p>
  {/if}
  {#if form?.success && form?.confirmed}
    <p aria-live="polite" class="text-sm text-success bg-success/10 border border-success/20 rounded-md p-3">
      Cita confirmada. Ya le aparece al cliente en sus citas.
    </p>
  {/if}
  {#if form?.success && form?.rejected}
    <p aria-live="polite" class="text-sm text-text-mute bg-surface-2 border border-line rounded-md p-3">
      Cita rechazada.
    </p>
  {/if}
  {#if form?.success && form?.commented}
    <p aria-live="polite" class="text-sm text-success bg-success/10 border border-success/20 rounded-md p-3">
      Corrección enviada. Tu cliente la verá en ese ejercicio.
    </p>
  {/if}

  {#if !data.hasClients}
    <!-- Arranque en frío: qué gana y por dónde empezar, sin adornos -->
    <div class="card max-w-2xl space-y-4">
      <h2 class="text-2xl font-display font-semibold">Monta tu primer entreno en cinco minutos</h2>
      <p class="text-sm text-text-mute">
        El orden que funciona: carga la biblioteca de ejercicios, arma un entrenamiento
        con ellos y luego invita a tu primer cliente para asignárselo.
      </p>
      <div class="flex flex-wrap gap-3">
        <a href="/exercises" class="btn-primary">Cargar biblioteca base</a>
        <a href="/clients?invite=1" class="btn-ghost">Invitar cliente</a>
      </div>
    </div>
  {:else}
    <!-- ===== HOY ===== -->
    <section>
      <div class="flex items-baseline justify-between gap-4 mb-2">
        <h2 class="text-lg font-display font-semibold">Hoy</h2>
        <a href="/agenda" class="text-xs text-text-mute hover:text-accent transition-colors">Ver agenda →</a>
      </div>
      {#if data.todaySessions.length === 0}
        <p class="text-sm text-text-mute border-t border-line pt-3">
          Sin citas confirmadas para hoy.
          <a href="/agenda?propose=1" class="text-accent hover:underline">Proponer una</a>.
        </p>
      {:else}
        <div class="border-t border-line">
          {#each data.todaySessions as s (s.id)}
            <div class="row">
              <span class="w-14 tabular-nums font-display font-semibold flex-shrink-0">
                {fmtTime(s.starts_at)}
              </span>
              <div class="flex-1 min-w-0">
                <div class="font-medium truncate">{s.client?.full_name ?? 'Cliente'}</div>
                <div class="text-xs text-text-mute">{modalityLabel[s.modality] ?? s.modality}</div>
              </div>
              {#if s.workout}
                <a href="/clients/{s.client_id}/workouts/{s.workout.date}"
                   class="text-xs text-accent hover:underline flex-shrink-0">
                  {s.workout.title ?? 'Ver entreno'} →
                </a>
              {:else}
                <a href="/clients/{s.client_id}/workouts/{data.today}"
                   class="text-xs text-accent hover:underline flex-shrink-0">
                  Montar entreno →
                </a>
              {/if}
              <a href="/clients/{s.client_id}" class="text-xs text-text-mute hover:text-text flex-shrink-0">Ficha</a>
            </div>
          {/each}
        </div>
      {/if}
    </section>

    <!-- ===== CITAS QUE ESPERAN TU RESPUESTA (se resuelven aquí) ===== -->
    {#if data.pendingRequests.length > 0}
      <section>
        <h2 class="text-lg font-display font-semibold mb-2">Te han pedido cita</h2>
        <div class="border-t border-line">
          {#each data.pendingRequests as s (s.id)}
            <div class="row">
              <div class="flex-1 min-w-0">
                <div class="font-medium truncate">{s.client?.full_name ?? 'Cliente'}</div>
                <div class="text-xs text-text-mute capitalize">
                  {fmtDay(s.starts_at)} · {fmtTime(s.starts_at)} · {modalityLabel[s.modality] ?? s.modality}
                </div>
              </div>
              <form method="POST" action="?/confirmSession" use:enhance class="flex-shrink-0">
                <input type="hidden" name="session_id" value={s.id} />
                <button type="submit" class="action-primary">Confirmar</button>
              </form>
              <form method="POST" action="?/rejectSession" use:enhance class="flex-shrink-0">
                <input type="hidden" name="session_id" value={s.id} />
                <button type="submit" class="action-danger">Rechazar</button>
              </form>
            </div>
          {/each}
        </div>
      </section>
    {/if}

    <!-- ===== BANDEJA DE CORRECCIÓN DE TÉCNICA =====
         Se corrige aquí mismo: ver el vídeo, escribir la corrección y guardar.
         Al guardar, el vídeo sale de la bandeja. -->
    {#if data.reviewQueue.length > 0}
      <section>
        <div class="flex items-baseline justify-between gap-4 mb-2">
          <h2 class="text-lg font-display font-semibold">Técnica por corregir</h2>
          {#if data.pendingVideoCount > data.reviewQueue.length}
            <span class="text-xs text-text-mute">
              {data.reviewQueue.length} de {data.pendingVideoCount}
            </span>
          {/if}
        </div>

        <div class="space-y-4 border-t border-line pt-4">
          {#each data.reviewQueue as v (v.id)}
            <article class="card space-y-3">
              <div class="flex items-baseline justify-between gap-3">
                <h3 class="font-semibold min-w-0 truncate">
                  {v.clientName}
                  <span class="text-text-mute font-normal"> · {v.exerciseName}</span>
                </h3>
                <span class="text-xs text-text-mute flex-shrink-0">{hace(v.createdAt)}</span>
              </div>

              <div class="grid {v.firstUrl ? 'sm:grid-cols-2' : ''} gap-3">
                <div class="space-y-1.5">
                  {#if v.firstUrl}
                    <span class="text-xs uppercase tracking-wider text-text-mute">Ahora</span>
                  {/if}
                  {#if v.url}
                    <!-- svelte-ignore a11y_media_has_caption -->
                    <video
                      src={v.url}
                      controls
                      playsinline
                      preload="metadata"
                      class="w-full max-h-72 rounded-md bg-black"
                    ></video>
                  {:else}
                    <p class="text-xs text-text-mute italic">No se pudo cargar el vídeo.</p>
                  {/if}
                </div>
                {#if v.firstUrl}
                  <div class="space-y-1.5">
                    <span class="text-xs uppercase tracking-wider text-text-mute">
                      Su primer vídeo{v.firstAt
                        ? ' · ' + new Date(v.firstAt).toLocaleDateString('es-ES')
                        : ''}
                    </span>
                    <!-- svelte-ignore a11y_media_has_caption -->
                    <video
                      src={v.firstUrl}
                      controls
                      playsinline
                      preload="metadata"
                      class="w-full max-h-72 rounded-md bg-black"
                    ></video>
                  </div>
                {/if}
              </div>

              <form
                method="POST"
                action="?/commentVideo"
                use:enhance
                class="space-y-2 border-t border-line pt-3"
              >
                <input type="hidden" name="video_id" value={v.id} />
                <label
                  for="cmt-{v.id}"
                  class="block text-xs uppercase tracking-wider text-text-mute"
                >
                  Corrección para {v.clientName.split(' ')[0]}
                </label>
                <textarea
                  id="cmt-{v.id}"
                  name="comment"
                  rows="2"
                  maxlength="600"
                  required
                  placeholder="ej: baja más la cadera y mantén la espalda neutra…"
                  class="w-full px-4 py-3 bg-bg border border-line rounded-md text-sm
                         focus:border-accent focus:ring-2 focus:ring-accent/20 resize-none"
                ></textarea>
                <div class="flex items-center justify-end gap-3">
                  <a href="/clients/{v.clientId}?tab=tecnica" class="action-neutral">Ver historial</a>
                  <button type="submit" class="action-primary">Enviar corrección</button>
                </div>
              </form>
            </article>
          {/each}
        </div>

        {#if data.pendingVideoCount > data.reviewQueue.length}
          <p class="text-sm text-text-mute mt-3">
            Quedan {data.pendingVideoCount - data.reviewQueue.length} vídeos más por corregir.
            Aparecerán aquí según despaches estos.
          </p>
        {/if}
      </section>
    {/if}

    <!-- ===== REQUIERE TU ATENCIÓN (programar / cobrar) ===== -->
    {#if data.clientsWithoutWorkout.length > 0 || data.paymentAlerts.length > 0}
      <section>
        <h2 class="text-lg font-display font-semibold mb-2">Requiere tu atención</h2>
        <div class="border-t border-line">
          {#each data.paymentAlerts as c (c.id)}
            <a href="/clients/{c.id}?tab=ficha" class="row-link">
              <span class="flex-shrink-0 {c.status === 'vencido' ? 'pill-danger' : 'pill-warn'}">
                {c.status === 'vencido' ? 'Vencida' : 'Vence pronto'}
              </span>
              <span class="flex-1 min-w-0 truncate">
                <span class="font-medium">{c.name}</span>
                <span class="text-text-mute text-sm">
                  {#if c.paidUntil}
                    · pagado hasta el {fmtDate(c.paidUntil)}
                  {:else}
                    · sin fecha de pago
                  {/if}
                </span>
              </span>
              <span class="text-xs text-accent flex-shrink-0">Actualizar →</span>
            </a>
          {/each}

          {#each data.clientsWithoutWorkout as c (c.id)}
            <div class="row">
              <span class="pill-mute flex-shrink-0">Sin entrenos</span>
              <span class="flex-1 min-w-0 truncate">
                <span class="font-medium">{c.full_name ?? 'Cliente'}</span>
                <span class="text-text-mute text-sm"> no tiene nada esta semana</span>
              </span>
              <a href="/clients/{c.id}/workouts/{data.today}" class="action-primary flex-shrink-0">Programar</a>
              <a href="/clients/{c.id}" class="text-xs text-text-mute hover:text-text flex-shrink-0">Ficha</a>
            </div>
          {/each}
        </div>
      </section>
    {/if}

    <!-- ===== ESPERANDO AL CLIENTE ===== -->
    {#if data.pendingProposals.length > 0}
      <section>
        <h2 class="text-lg font-display font-semibold mb-2">Esperando a que confirmen</h2>
        <div class="border-t border-line">
          {#each data.pendingProposals as s (s.id)}
            <div class="row text-sm">
              <span class="flex-1 min-w-0 truncate">
                <span class="font-medium">{s.client?.full_name ?? 'Cliente'}</span>
                <span class="text-text-mute capitalize"> · {fmtDay(s.starts_at)}</span>
              </span>
              <span class="text-xs text-text-mute flex-shrink-0">Pendiente del cliente</span>
              <form method="POST" action="?/rejectSession" use:enhance class="flex-shrink-0">
                <input type="hidden" name="session_id" value={s.id} />
                <button type="submit" class="action-neutral">Anular</button>
              </form>
            </div>
          {/each}
        </div>
      </section>
    {/if}
  {/if}
</div>
