<script lang="ts">
  import type { PageData, ActionData } from './$types';
  /**
   * Registrar un cobro sin salir de la ficha.
   *
   * `abierto` es vinculable porque el botón que lo abre está en la cabecera de
   * la página, fuera de este componente: la alternativa sería duplicar el botón
   * aquí dentro y tener dos sitios donde tocarlo.
   */
  import { enhance } from '$app/forms';
  import { todayISOLocal } from '$lib/week';
  import { PAYMENT_METHOD_LABELS } from '$lib/supabase/types';

  let {
    data,
    form,
    abierto = $bindable()
  }: { data: PageData; form: ActionData; abierto: boolean } = $props();
</script>

<!-- Registrar un cobro.
       Importe y fecha vienen rellenos con la cuota y con hoy, así que en el
       caso normal sigue siendo un clic. Se pueden cambiar porque en la vida
       real se paga tarde, se paga de menos o se pagan dos meses juntos. -->
{#if abierto}
  <form
    method="POST"
    action="?/markPaid"
    use:enhance={() => {
      return async ({ update }) => {
        await update();
        abierto = false;
      };
    }}
    class="card space-y-4"
  >
    <div>
      <h2 class="font-semibold">Registrar un cobro</h2>
      <p class="text-xs text-text-mute mt-0.5">
        Queda apuntado con su fecha e importe, y avanza un mes el «pagado hasta».
      </p>
    </div>

    <div class="grid sm:grid-cols-3 gap-3">
      <div>
        <label for="pay-amount" class="block text-xs uppercase tracking-wider text-text-mute mb-2">
          Importe
        </label>
        <input
          id="pay-amount"
          name="amount"
          type="number"
          step="0.01"
          min="0"
          value={data.info?.fee_amount ?? ''}
          placeholder="45"
          class="w-full px-3 py-2.5 bg-bg border border-line rounded-md focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
      </div>
      <div>
        <label for="pay-date" class="block text-xs uppercase tracking-wider text-text-mute mb-2">
          Fecha del cobro
        </label>
        <input
          id="pay-date"
          name="paid_on"
          type="date"
          value={todayISOLocal()}
          class="w-full px-3 py-2.5 bg-bg border border-line rounded-md focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
      </div>
      <div>
        <label for="pay-method" class="block text-xs uppercase tracking-wider text-text-mute mb-2">
          Cómo
        </label>
        <select
          id="pay-method"
          name="method"
          class="w-full px-3 py-2.5 bg-bg border border-line rounded-md focus:border-accent"
        >
          {#each Object.entries(PAYMENT_METHOD_LABELS) as [valor, etiqueta] (valor)}
            {#if valor !== 'stripe'}
              <option value={valor}>{etiqueta}</option>
            {/if}
          {/each}
        </select>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <button type="submit" class="btn-primary">Registrar cobro</button>
      <a href="/cobros" class="text-sm text-text-mute hover:text-text transition-colors">
        Ver todos los cobros →
      </a>
    </div>
  </form>
{/if}
