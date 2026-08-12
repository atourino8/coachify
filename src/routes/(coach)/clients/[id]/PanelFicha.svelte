<script lang="ts">
  import type { PageData, ActionData } from './$types';
  /** Datos del cliente, notas privadas y cuota. Ver PanelHistorial sobre las props. */
  import { enhance } from '$app/forms';
  import { untrack } from 'svelte';
  import SelectorEtiquetas from '$lib/components/SelectorEtiquetas.svelte';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const LEVELS = [
    { value: 'principiante', label: 'Principiante' },
    { value: 'intermedio', label: 'Intermedio' },
    { value: 'avanzado', label: 'Avanzado' }
  ];
  let savingInfo = $state(false);
  let levelSel = $state(untrack(() => data.info?.level) ?? '');
  let etiquetas = $state<string[]>(untrack(() => data.info?.tags) ?? []);

  const hayVocabulario = $derived(Object.keys(data.vocabulario.client).length > 0);

  function ageFrom(birth: string | null | undefined): number | null {
    if (!birth) return null;
    const b = new Date(birth);
    if (isNaN(b.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - b.getFullYear();
    const m = now.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
    return age;
  }
</script>

<!-- ===== FICHA DEL CLIENTE ===== -->
<form
  method="POST"
  action="?/saveInfo"
  use:enhance={() => {
    savingInfo = true;
    return async ({ update }) => {
      await update();
      savingInfo = false;
    };
  }}
  class="card space-y-5 max-w-2xl"
>
  <div class="grid sm:grid-cols-2 gap-4">
    <div class="sm:col-span-2">
      <label for="goals" class="block text-xs uppercase tracking-wider text-text-mute mb-2"
        >Objetivos</label
      >
      <textarea
        id="goals"
        name="goals"
        rows="2"
        maxlength="500"
        placeholder="ej: ganar masa muscular, preparar una carrera de 10k…"
        class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
        >{data.info?.goals ?? ''}</textarea
      >
    </div>
    <div class="sm:col-span-2">
      <label for="injuries" class="block text-xs uppercase tracking-wider text-text-mute mb-2"
        >Lesiones / limitaciones</label
      >
      <textarea
        id="injuries"
        name="injuries"
        rows="2"
        maxlength="500"
        placeholder="ej: hombro derecho delicado, evitar impacto en rodillas…"
        class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
        >{data.info?.injuries ?? ''}</textarea
      >
    </div>
    <div>
      <label for="freq" class="block text-xs uppercase tracking-wider text-text-mute mb-2"
        >Días de entreno / semana</label
      >
      <input
        id="freq"
        name="training_days_per_week"
        type="number"
        min="0"
        max="14"
        value={data.info?.training_days_per_week ?? ''}
        class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </div>
    <div>
      <label for="level" class="block text-xs uppercase tracking-wider text-text-mute mb-2"
        >Nivel</label
      >
      <select
        id="level"
        name="level"
        bind:value={levelSel}
        class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md text-sm focus:border-primary"
      >
        <option value="">Sin especificar</option>
        {#each LEVELS as l (l.value)}<option value={l.value}>{l.label}</option>{/each}
      </select>
    </div>
    <div>
      <label for="height" class="block text-xs uppercase tracking-wider text-text-mute mb-2"
        >Altura (cm)</label
      >
      <input
        id="height"
        name="height_cm"
        type="number"
        min="50"
        max="260"
        value={data.info?.height_cm ?? ''}
        class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </div>
    <div>
      <label for="birth" class="block text-xs uppercase tracking-wider text-text-mute mb-2"
        >Fecha de nacimiento</label
      >
      <input
        id="birth"
        name="birth_date"
        type="date"
        value={data.info?.birth_date ?? ''}
        class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
      {#if ageFrom(data.info?.birth_date)}
        <p class="text-xs text-text-mute mt-1">{ageFrom(data.info?.birth_date)} años</p>
      {/if}
    </div>
    <div class="sm:col-span-2 border-t border-text-mute/10 pt-4">
      <p class="text-xs uppercase tracking-wider text-text-mute mb-3">Cuota</p>
      <div class="grid sm:grid-cols-2 gap-4">
        <div>
          <label for="fee" class="block text-xs uppercase tracking-wider text-text-mute mb-2">
            Cuota mensual (€)
          </label>
          <input
            id="fee"
            name="fee_amount"
            type="number"
            min="0"
            step="1"
            value={data.info?.fee_amount ?? ''}
            placeholder="ej: 120"
            class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label
            for="paid-until"
            class="block text-xs uppercase tracking-wider text-text-mute mb-2"
          >
            Pagado hasta
          </label>
          <input
            id="paid-until"
            name="paid_until"
            type="date"
            value={data.info?.paid_until ?? ''}
            class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>
    </div>

    <!-- Las etiquetas van ARRIBA de las notas privadas y no al final: son lo
         que se usa para encontrarle en la lista, así que es lo primero que hay
         que poder tocar al abrir la ficha. -->
    <div class="sm:col-span-2">
      {#if hayVocabulario}
        <SelectorEtiquetas
          name="tags"
          titulo="Etiquetas"
          opciones={data.vocabulario.client}
          bind:seleccion={etiquetas}
          ayuda="Sirven para filtrar tu lista de clientes."
        />
      {:else}
        <p class="block text-xs uppercase tracking-wider text-text-mute mb-2">Etiquetas</p>
        <p class="text-sm text-text-mute">
          Todavía no has creado ninguna.
          <a href="/ajustes" class="text-accent hover:underline">Créalas en Ajustes</a>
          y podrás filtrar tu lista por ellas.
        </p>
      {/if}
    </div>

    <div class="sm:col-span-2">
      <label for="notes" class="block text-xs uppercase tracking-wider text-text-mute mb-2">
        Notas privadas <span class="normal-case tracking-normal text-text-mute/70"
          >(solo tú las ves)</span
        >
      </label>
      <textarea
        id="notes"
        name="coach_notes"
        rows="3"
        maxlength="1000"
        placeholder="Cualquier apunte para ti: preferencias, contexto, recordatorios…"
        class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
        >{data.info?.coach_notes ?? ''}</textarea
      >
    </div>
  </div>
  <button type="submit" disabled={savingInfo} class="btn-primary">
    {savingInfo ? 'Guardando…' : 'Guardar ficha'}
  </button>
</form>
