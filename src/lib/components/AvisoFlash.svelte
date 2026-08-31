<script lang="ts">
  /**
   * El aviso de «hecho», flotando arriba, uno para toda la aplicación.
   *
   * POR QUÉ FLOTANDO Y NO EN EL SITIO DONDE PULSASTE
   *
   * Porque el sitio donde pulsaste puede estar a media pantalla de scroll, o
   * dentro de un panel que se acaba de cerrar, o en otra página si la acción
   * redirigió. En la agenda el mensaje de éxito vivía arriba del todo y quien
   * confirmaba una cita desde la sexta tarjeta no lo veía nunca.
   *
   * POR QUÉ SE VA SOLO
   *
   * Es una confirmación, no un estado: cuando ya la has leído estorba. Se va a
   * los cinco segundos, que da para leer una frase corta sin prisa, y también
   * se puede cerrar a mano.
   *
   * `aria-live="polite"` para que un lector de pantalla lo anuncie sin cortar
   * lo que esté diciendo.
   *
   * NO LLEVA EL COLOR SOLO
   *
   * Cada tipo lleva su icono además del color, que es lo que pide DISENO.md:
   * verde y rojo no se distinguen para una de cada doce personas.
   */
  import Icono from './Icono.svelte';
  import type { Aviso } from '$lib/aviso.server';

  interface Props {
    aviso: Aviso | null;
  }

  let { aviso }: Props = $props();

  /** El que se está enseñando. Copia local para poder cerrarlo. */
  let visible = $state<Aviso | null>(null);

  const ESTILO = {
    ok: 'bg-success/15 border-success/30 text-success',
    aviso: 'bg-warning/15 border-warning/30 text-warning',
    error: 'bg-danger/15 border-danger/30 text-danger'
  } as const;

  const SIMBOLO = { ok: '✓', aviso: '!', error: '✕' } as const;

  /**
   * Al llegar uno nuevo se enseña y se programa su salida.
   *
   * El temporizador se limpia en el retorno del efecto: si llegan dos avisos
   * seguidos —confirmar y luego rechazar— sin esto el reloj del primero
   * apagaría el segundo antes de tiempo.
   */
  $effect(() => {
    if (!aviso) return;
    visible = aviso;
    const reloj = setTimeout(() => (visible = null), 5000);
    return () => clearTimeout(reloj);
  });
</script>

{#if visible}
  <div
    role="status"
    aria-live="polite"
    class="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[calc(100vw-2rem)] max-w-md
           flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg
           backdrop-blur-sm {ESTILO[visible.tipo]}"
  >
    <span aria-hidden="true" class="font-bold flex-shrink-0">{SIMBOLO[visible.tipo]}</span>
    <span class="text-sm flex-1 min-w-0">{visible.texto}</span>
    <button
      type="button"
      onclick={() => (visible = null)}
      aria-label="Cerrar aviso"
      class="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
    >
      <Icono nombre="cerrar" class="w-4 h-4" />
    </button>
  </div>
{/if}
