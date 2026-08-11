<script lang="ts">
  import type { PageData, ActionData } from './$types';
  /** Vídeos de técnica del cliente y su corrección. Ver PanelHistorial sobre las props. */
  import { enhance } from '$app/forms';
  import { fechaCorta } from '$lib/formato';

  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<!-- ===== VÍDEOS DE TÉCNICA ===== -->
{#if data.technique.length === 0}
  <div class="card text-center py-16">
    <div class="text-5xl mb-4" aria-hidden="true">🎥</div>
    <h2 class="text-xl font-semibold mb-2">Sin vídeos de técnica</h2>
    <p class="text-sm text-text-mute max-w-md mx-auto">
      Cuando {data.client.full_name?.split(' ')[0] ?? 'tu cliente'} suba un vídeo ejecutando un ejercicio,
      aparecerá aquí para que le corrijas la postura.
    </p>
  </div>
{:else}
  <div class="space-y-4">
    {#each data.technique as g (g.exerciseId)}
      {@const newest = g.latest ?? g.first}
      <div class="card space-y-4">
        <div class="flex items-center justify-between gap-3">
          <h2 class="font-semibold">{g.exerciseName}</h2>
          {#if g.pending}
            <span
              class="text-2xs px-2 py-0.5 rounded-full bg-warning/15 text-warning whitespace-nowrap"
            >
              Por revisar
            </span>
          {:else}
            <span
              class="text-2xs px-2 py-0.5 rounded-full bg-success/15 text-success whitespace-nowrap"
            >
              Revisado
            </span>
          {/if}
        </div>

        <!-- Antes / después -->
        <div class="grid {g.latest && g.first ? 'sm:grid-cols-2' : ''} gap-3">
          {#each [{ v: g.first, label: g.latest ? 'Primer vídeo' : 'Vídeo', k: 'f' }, { v: g.latest, label: 'Más reciente', k: 'l' }] as slot (slot.k)}
            {#if slot.v}
              <div class="space-y-1.5">
                <div class="flex items-center justify-between gap-2">
                  <span class="text-xs uppercase tracking-wider text-text-mute">{slot.label}</span>
                  <span class="text-2xs text-text-mute">
                    {fechaCorta(slot.v.created_at)}
                  </span>
                </div>
                {#if slot.v.url}
                  <!-- svelte-ignore a11y_media_has_caption -->
                  <video
                    src={slot.v.url}
                    controls
                    playsinline
                    preload="metadata"
                    class="w-full max-h-80 rounded-md bg-black"
                  ></video>
                {:else}
                  <p class="text-xs text-text-mute italic">No se pudo cargar el vídeo.</p>
                {/if}
              </div>
            {/if}
          {/each}
        </div>

        <!-- Corrección del coach sobre el vídeo más reciente -->
        {#if newest}
          <form
            method="POST"
            action="?/commentVideo"
            use:enhance
            class="border-t border-text-mute/10 pt-3 space-y-2"
          >
            <input type="hidden" name="video_id" value={newest.id} />
            <label
              for="cmt-{g.exerciseId}"
              class="block text-xs uppercase tracking-wider text-text-mute"
            >
              Corrección para tu cliente
            </label>
            <textarea
              id="cmt-{g.exerciseId}"
              name="comment"
              rows="2"
              maxlength="600"
              placeholder="ej: baja más la cadera y mantén la espalda neutra…"
              class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md text-sm
                       focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
              >{newest.coach_comment ?? ''}</textarea
            >
            <div class="flex items-center justify-between gap-3">
              <span class="text-2xs text-text-mute">
                {#if newest.coach_comment_at}
                  Comentado el {fechaCorta(newest.coach_comment_at)}
                {/if}
              </span>
              <button type="submit" class="action-primary">Guardar corrección</button>
            </div>
          </form>
        {/if}
      </div>
    {/each}
  </div>
{/if}
