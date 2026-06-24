<script lang="ts">
  import { enhance } from '$app/forms';

  let { data, form } = $props();

  function youtubeId(url: string | null): string | null {
    if (!url) return null;
    const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([\w-]{11})/);
    return m ? m[1] : null;
  }

  function logForSet(n: number) {
    return data.item.set_logs?.find((l) => l.set_number === n);
  }

  const ytId = $derived(youtubeId(data.item.exercise.video_url));
  const sets = $derived(Array.from({ length: data.item.sets }, (_, i) => i + 1));

  let activeSet = $state<number | null>(null);
  let reps = $state('');
  let weight = $state('');
  let feedback = $state<'easy' | 'just_right' | 'hard' | ''>('');

  function openSet(n: number) {
    const existing = logForSet(n);
    reps = existing?.reps_done?.toString() ?? '';
    weight = existing?.weight_done?.toString() ?? '';
    feedback = (existing?.feedback as never) ?? '';
    activeSet = n;
  }

  function closeSet() {
    activeSet = null;
  }
</script>

<svelte:head>
  <title>{data.item.exercise.name} · Coachify</title>
</svelte:head>

<div class="space-y-6">
  <a href="/today" class="text-sm text-text-mute hover:text-text">← Volver al día</a>

  <!-- Vídeo + nombre -->
  {#if ytId}
    <div class="aspect-video rounded-md overflow-hidden bg-black">
      <iframe
        src="https://www.youtube.com/embed/{ytId}"
        title={data.item.exercise.name}
        class="w-full h-full"
        allowfullscreen
      ></iframe>
    </div>
  {:else if data.item.exercise.video_url}
    <a
      href={data.item.exercise.video_url}
      target="_blank"
      rel="noopener noreferrer"
      class="card text-center py-10"
    >
      <div class="text-4xl mb-2">▶</div>
      <div class="text-sm text-text-mute">Abrir vídeo de técnica</div>
    </a>
  {/if}

  <div>
    <h1 class="text-3xl font-bold tracking-tight">{data.item.exercise.name}</h1>
    {#if data.item.exercise.description}
      <p class="text-text-mute mt-2 italic">{data.item.exercise.description}</p>
    {/if}
    <div class="text-sm text-text-mute mt-3">
      Prescrito:
      <strong class="text-text">{data.item.sets} series · {data.item.reps_prescribed ?? '?'} reps</strong>
      {#if data.item.weight_prescribed}· <strong class="text-text">{data.item.weight_prescribed}</strong>{/if}
      {#if data.item.rest_seconds}· descanso {data.item.rest_seconds}s{/if}
    </div>
    {#if data.item.notes}
      <div class="text-sm bg-primary/10 border-l-2 border-primary rounded-r px-3 py-2 mt-3 italic">
        {data.item.notes}
      </div>
    {/if}
  </div>

  <!-- Series -->
  <div class="space-y-2">
    <h2 class="text-sm uppercase tracking-wider text-text-mute">Series</h2>
    {#each sets as n}
      {@const log = logForSet(n)}
      {@const done = !!log}
      <button
        onclick={() => openSet(n)}
        class="card w-full flex items-center gap-4 hover:border-primary/50 transition-all {done
          ? 'border-success/40'
          : ''} {activeSet === n ? 'border-primary' : ''}"
      >
        <div
          class="w-10 h-10 rounded-full grid place-items-center text-sm font-bold {done
            ? 'bg-success text-bg'
            : 'bg-surface-2 text-text-mute'}"
        >
          {done ? '✓' : n}
        </div>
        <div class="flex-1 text-left">
          <div class="font-medium">Serie {n}</div>
          {#if done}
            <div class="text-xs text-text-mute mt-0.5">
              {log.weight_done ?? '?'} kg · {log.reps_done ?? '?'} reps
              {#if log.feedback}
                · {log.feedback === 'easy'
                  ? '😌'
                  : log.feedback === 'just_right'
                    ? '😅'
                    : '🥵'}
              {/if}
            </div>
          {:else}
            <div class="text-xs text-text-mute mt-0.5">
              Toca para registrar
            </div>
          {/if}
        </div>
        <div class="text-text-mute">›</div>
      </button>

      {#if activeSet === n}
        <form
          method="POST"
          action="?/logSet"
          use:enhance={() => {
            return async ({ update }) => {
              await update();
              if (form?.success && form.set_number === n) {
                closeSet();
              }
            };
          }}
          class="card border-primary space-y-4 animate-in"
        >
          <input type="hidden" name="set_number" value={n} />
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs uppercase tracking-wider text-text-mute">Peso (kg)</label>
              <input
                name="weight_done"
                type="number"
                step="0.5"
                bind:value={weight}
                placeholder={data.item.weight_prescribed ?? '0'}
                class="w-full px-3 py-2 bg-bg border border-text-mute/20 rounded-md text-lg font-semibold focus:border-primary"
              />
            </div>
            <div>
              <label class="text-xs uppercase tracking-wider text-text-mute">Reps reales</label>
              <input
                name="reps_done"
                type="number"
                bind:value={reps}
                placeholder={data.item.reps_prescribed ?? '0'}
                class="w-full px-3 py-2 bg-bg border border-text-mute/20 rounded-md text-lg font-semibold focus:border-primary"
              />
            </div>
          </div>
          <div>
            <label class="text-xs uppercase tracking-wider text-text-mute mb-2 block"
              >¿Cómo te salió?</label
            >
            <div class="grid grid-cols-3 gap-2">
              <label
                class="card cursor-pointer text-center py-3 {feedback === 'easy'
                  ? 'border-primary'
                  : ''}"
              >
                <input
                  type="radio"
                  name="feedback"
                  value="easy"
                  bind:group={feedback}
                  class="sr-only"
                />
                <div class="text-2xl">😌</div>
                <div class="text-xs text-text-mute">Fácil</div>
              </label>
              <label
                class="card cursor-pointer text-center py-3 {feedback === 'just_right'
                  ? 'border-primary'
                  : ''}"
              >
                <input
                  type="radio"
                  name="feedback"
                  value="just_right"
                  bind:group={feedback}
                  class="sr-only"
                />
                <div class="text-2xl">😅</div>
                <div class="text-xs text-text-mute">Justo</div>
              </label>
              <label
                class="card cursor-pointer text-center py-3 {feedback === 'hard'
                  ? 'border-primary'
                  : ''}"
              >
                <input
                  type="radio"
                  name="feedback"
                  value="hard"
                  bind:group={feedback}
                  class="sr-only"
                />
                <div class="text-2xl">🥵</div>
                <div class="text-xs text-text-mute">Duro</div>
              </label>
            </div>
          </div>
          <div class="flex gap-2">
            <button type="submit" class="btn-primary flex-1">Guardar serie</button>
            <button type="button" onclick={closeSet} class="btn-ghost">Cerrar</button>
          </div>
        </form>
      {/if}
    {/each}
  </div>
</div>
