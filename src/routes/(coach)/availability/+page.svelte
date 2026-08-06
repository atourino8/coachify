<script lang="ts">
  import { enhance } from '$app/forms';

  let { data, form } = $props();

  let dayOfWeek = $state('1');
  let startTime = $state('09:00');
  let duration = $state('60');
  let modPresencial = $state(true);
  let modOnline = $state(false);

  const DAYS = [
    { v: '1', label: 'Lunes' },
    { v: '2', label: 'Martes' },
    { v: '3', label: 'Miércoles' },
    { v: '4', label: 'Jueves' },
    { v: '5', label: 'Viernes' },
    { v: '6', label: 'Sábado' },
    { v: '0', label: 'Domingo' }
  ];
  const dayLabel: Record<number, string> = {
    0: 'Domingo',
    1: 'Lunes',
    2: 'Martes',
    3: 'Miércoles',
    4: 'Jueves',
    5: 'Viernes',
    6: 'Sábado'
  };
  const modalityLabel: Record<string, string> = {
    presencial: 'Presencial',
    online: 'Online',
    remoto: 'Remoto'
  };

  // Agrupar slots por día para mostrarlos ordenados
  const grouped = $derived.by(() => {
    const map = new Map<number, typeof data.slots>();
    for (const s of data.slots) {
      const d = s.day_of_week ?? -1;
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(s);
    }
    return [...map.entries()].sort((a, b) => {
      // Lunes(1) primero, domingo(0) al final
      const norm = (x: number) => (x === 0 ? 7 : x);
      return norm(a[0]) - norm(b[0]);
    });
  });

  function hhmm(t: string) {
    return t.slice(0, 5);
  }
</script>

<svelte:head>
  <title>Disponibilidad · Coachify</title>
</svelte:head>

<div class="space-y-8 max-w-2xl">
  <div>
    <a href="/agenda" class="text-sm text-text-mute hover:text-text">← Agenda</a>
    <h1 class="text-3xl sm:text-4xl font-display font-semibold tracking-tight mt-3">
      Mis huecos disponibles
    </h1>
    <p class="text-text-mute mt-2 text-sm">
      Define tus huecos semanales. Tus clientes verán estas franjas al pedir cita.
    </p>
  </div>

  {#if form?.error}
    <p role="alert" class="text-sm text-danger bg-danger/10 border border-danger/20 rounded-md p-3">
      {form.error}
    </p>
  {/if}

  <!-- Añadir hueco -->
  <form method="POST" action="?/add" use:enhance class="card space-y-4">
    <h2 class="font-semibold">Añadir hueco semanal</h2>
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label for="dow" class="block text-xs uppercase tracking-wider text-text-mute mb-2"
          >Día</label
        >
        <select
          id="dow"
          name="day_of_week"
          bind:value={dayOfWeek}
          class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md focus:border-primary"
        >
          {#each DAYS as d}<option value={d.v}>{d.label}</option>{/each}
        </select>
      </div>
      <div>
        <label for="start" class="block text-xs uppercase tracking-wider text-text-mute mb-2"
          >Hora inicio</label
        >
        <input
          id="start"
          type="time"
          name="start_time"
          bind:value={startTime}
          required
          class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md focus:border-primary"
        />
      </div>
      <div>
        <label for="dur" class="block text-xs uppercase tracking-wider text-text-mute mb-2"
          >Duración</label
        >
        <select
          id="dur"
          name="duration_minutes"
          bind:value={duration}
          class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md focus:border-primary"
        >
          <option value="30">30 min</option>
          <option value="45">45 min</option>
          <option value="60">60 min</option>
          <option value="90">90 min</option>
        </select>
      </div>
      <div>
        <span class="block text-xs uppercase tracking-wider text-text-mute mb-2">Modalidad</span>
        <div class="flex gap-3 items-center pt-2">
          <label class="flex items-center gap-1.5 text-sm">
            <input
              type="checkbox"
              name="modalities"
              value="presencial"
              bind:checked={modPresencial}
            /> Presencial
          </label>
          <label class="flex items-center gap-1.5 text-sm">
            <input type="checkbox" name="modalities" value="online" bind:checked={modOnline} /> Online
          </label>
        </div>
      </div>
    </div>
    <button type="submit" class="btn-primary w-full">Añadir hueco</button>
  </form>

  <!-- Huecos actuales -->
  <section class="space-y-3">
    <h2 class="font-semibold">Tus huecos</h2>
    {#if data.slots.length === 0}
      <p class="text-sm text-text-mute">Todavía no has definido ningún hueco.</p>
    {:else}
      {#each grouped as [dow, slots] (dow)}
        <div class="card">
          <div class="font-semibold mb-2">{dayLabel[dow] ?? '—'}</div>
          <div class="space-y-2">
            {#each slots as s (s.id)}
              <div class="flex items-center justify-between gap-4 text-sm">
                <div>
                  <span class="font-medium">{hhmm(s.start_time)} – {hhmm(s.end_time)}</span>
                  <span class="text-text-mute ml-2">
                    {(s.modalities ?? []).map((m) => modalityLabel[m] ?? m).join(', ')}
                  </span>
                </div>
                <form method="POST" action="?/remove" use:enhance>
                  <input type="hidden" name="slot_id" value={s.id} />
                  <button
                    type="submit"
                    aria-label="Borrar hueco de disponibilidad"
                    class="text-text-mute hover:text-danger transition-colors text-lg leading-none"
                    >×</button
                  >
                </form>
              </div>
            {/each}
          </div>
        </div>
      {/each}
    {/if}
  </section>
</div>
