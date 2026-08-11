<script lang="ts">
  import type { PageData } from './$types';
  /**
   * Historial del cliente: entrenos pasados y citas pasadas.
   *
   * Recibe `data` de la página entera y no props sueltas a propósito: estos
   * paneles no son componentes reutilizables, son las secciones de UNA pantalla
   * partidas para poder abrirlas sin desplazarse por mil líneas. Inventarles un
   * contrato de props que habría que rehacer cada vez que cambie la consulta
   * sería trabajo sin ganancia.
   *
   * Lo que sí se muda con cada panel es su ESTADO: lo que solo usa una pestaña
   * vive en su fichero, no en el de la página.
   */
  import { formatHumanDate } from '$lib/week';

  let { data }: { data: PageData } = $props();

  const ETIQUETA_CITA: Record<string, string> = {
    requested: 'Pendiente',
    confirmed: 'Confirmada',
    rejected: 'Rechazada',
    cancelled: 'Cancelada',
    completed: 'Completada'
  };
  const CLASE_CITA: Record<string, string> = {
    requested: 'bg-warning/15 text-warning',
    confirmed: 'bg-success/15 text-success',
    rejected: 'bg-danger/15 text-danger',
    cancelled: 'bg-text-mute/15 text-text-mute',
    completed: 'bg-primary/15 text-primary'
  };

  // Fecha con hora: aquí importa el instante de la cita, no solo el día, así
  // que no vale ninguna de las de $lib/formato.
  function fechaYHora(iso: string) {
    return new Date(iso).toLocaleString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
</script>

<!-- ===== HISTORIAL ===== -->
<div class="space-y-8">
  <section class="space-y-3">
    <h2 class="text-lg font-semibold">Entrenos anteriores</h2>
    {#if data.historyWorkouts.length === 0}
      <p class="text-sm text-text-mute">Todavía no hay entrenos pasados.</p>
    {:else}
      <div class="space-y-2">
        {#each data.historyWorkouts as w (w.id)}
          <a
            href="/clients/{data.client.id}/workouts/{w.date}"
            class="card p-3 flex items-center justify-between gap-3"
          >
            <div class="min-w-0">
              <div class="font-medium text-sm truncate flex items-center gap-1.5">
                {#if w.done}<span class="text-success" title="Completado">✓</span>{/if}
                {w.title ?? 'Entreno'}
              </div>
              <div class="text-xs text-text-mute mt-0.5">
                {formatHumanDate(w.date)} · {w.itemCount} ej.
              </div>
            </div>
            <span class="text-xs flex-shrink-0 {w.done ? 'text-success' : 'text-text-mute'}">
              {w.done ? 'Hecho' : 'Sin registrar'}
            </span>
          </a>
        {/each}
      </div>
    {/if}
  </section>

  <section class="space-y-3">
    <h2 class="text-lg font-semibold">Citas anteriores</h2>
    {#if data.historySessions.length === 0}
      <p class="text-sm text-text-mute">No hay citas pasadas.</p>
    {:else}
      <div class="space-y-1.5">
        {#each data.historySessions as s (s.id)}
          <div class="flex items-center justify-between gap-3 text-sm py-2 border-b border-line">
            <span class="capitalize text-text-mute">{fechaYHora(s.starts_at)}</span>
            <span class="text-xs px-2 py-0.5 rounded-full {CLASE_CITA[s.status] ?? ''}">
              {ETIQUETA_CITA[s.status] ?? s.status}
            </span>
          </div>
        {/each}
      </div>
    {/if}
  </section>
</div>
