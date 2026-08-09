<script lang="ts">
  import { enhance } from '$app/forms';
  import { page } from '$app/state';

  let { data, form } = $props();

  const profile = $derived(page.data.profile);

  // Un paso visible cada vez. Los pasos ya cumplidos (porque el entrenador
  // abandonó a medias y ha vuelto) arrancan marcados.
  let paso = $state(1);
  const TOTAL = 4;

  // svelte-ignore state_referenced_locally
  let fullName = $state(profile?.full_name ?? '');

  // Horarios: L-V por defecto, que es lo que hace la mayoría.
  let dias = $state<number[]>([1, 2, 3, 4, 5]);
  let desde = $state('09:00');
  let hasta = $state('20:00');
  const DIAS = [
    { v: 1, label: 'L' },
    { v: 2, label: 'M' },
    { v: 3, label: 'X' },
    { v: 4, label: 'J' },
    { v: 5, label: 'V' },
    { v: 6, label: 'S' },
    { v: 0, label: 'D' }
  ];
  function toggleDia(d: number) {
    dias = dias.includes(d) ? dias.filter((x) => x !== d) : [...dias, d];
  }

  let clientName = $state('');
  let clientEmail = $state('');
  let enviando = $state(false);

  // Avanzar solo cuando el paso ha ido bien.
  //
  // El guardián no es paranoia: sin él, al pulsar "Atrás" el efecto vuelve a
  // ver el mismo `form` con éxito y te reenvía hacia delante, así que no se
  // puede retroceder. Solo reaccionamos a un resultado que no hayamos usado ya.
  let ultimoForm: unknown = null;
  $effect(() => {
    if (!form?.success || form === ultimoForm) return;
    ultimoForm = form;
    if (form.step === 'profile') paso = 2;
    else if (form.step === 'library') paso = 3;
    else if (form.step === 'availability') paso = 4;
  });
</script>

<svelte:head>
  <title>Empezar · Treno</title>
</svelte:head>

<div class="max-w-2xl mx-auto space-y-8">
  <div>
    <p class="eyebrow">Paso {paso} de {TOTAL}</p>
    <h1 class="text-3xl font-display font-semibold tracking-tight mt-1">
      {#if paso === 1}
        Vamos a dejarlo listo
      {:else if paso === 2}
        Tu biblioteca de ejercicios
      {:else if paso === 3}
        Cuándo puedes entrenar
      {:else}
        Tu primer cliente
      {/if}
    </h1>
  </div>

  <!-- Progreso: cuatro trazos, sin números ni porcentajes -->
  <div class="flex gap-1.5" aria-hidden="true">
    {#each [1, 2, 3, 4] as n (n)}
      <div class="h-1 flex-1 rounded-full {n <= paso ? 'bg-accent' : 'bg-line'}"></div>
    {/each}
  </div>

  {#if form?.error}
    <p role="alert" class="text-sm text-danger bg-danger/10 border border-danger/20 rounded-md p-3">
      {form.error}
    </p>
  {/if}

  {#if paso === 1}
    <!-- ===== 1 · PERFIL ===== -->
    <form method="POST" action="?/saveProfile" use:enhance class="card space-y-4">
      <p class="text-sm text-text-mute">
        Empezamos por tu nombre. Es lo que verán tus clientes cuando les propongas una cita o les
        corrijas un vídeo, así que pon el que usas con ellos.
      </p>
      <div>
        <label for="ob-name" class="block text-xs uppercase tracking-wider text-text-mute mb-2">
          Tu nombre
        </label>
        <input
          id="ob-name"
          name="full_name"
          bind:value={fullName}
          maxlength="80"
          placeholder="Ej: Antonio Touriño"
          class="w-full px-4 py-3 bg-bg border border-line rounded-md focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
      </div>
      <button type="submit" class="btn-primary w-full sm:w-auto">Continuar</button>
    </form>
  {:else if paso === 2}
    <!-- ===== 2 · BIBLIOTECA ===== -->
    <div class="card space-y-4">
      {#if data.done.exercises}
        <p class="text-sm text-text-mute">
          Ya tienes {data.counts.exercises}
          {data.counts.exercises === 1 ? 'ejercicio' : 'ejercicios'} en tu biblioteca. Puedes seguir.
        </p>
        <button type="button" onclick={() => (paso = 3)} class="btn-primary w-full sm:w-auto">
          Continuar
        </button>
      {:else}
        <p class="text-sm text-text-mute">
          Sin ejercicios no puedes montar entrenamientos, y sin entrenamientos no puedes programarle
          nada a nadie. Te cargamos {data.seedCount} ejercicios básicos con su grupo muscular y su material,
          para que no empieces desde cero. Son tuyos: edítalos, bórralos o añádeles tu vídeo cuando quieras.
        </p>
        <div class="flex flex-wrap items-center gap-3">
          <form method="POST" action="?/seedLibrary" use:enhance>
            <button type="submit" class="btn-primary">
              Cargar {data.seedCount} ejercicios
            </button>
          </form>
          <button
            type="button"
            onclick={() => (paso = 3)}
            class="text-sm text-text-mute hover:text-text transition-colors"
          >
            Los añadiré yo
          </button>
        </div>
      {/if}
    </div>
  {:else if paso === 3}
    <!-- ===== 3 · HORARIOS ===== -->
    <form method="POST" action="?/saveAvailability" use:enhance class="card space-y-5">
      <p class="text-sm text-text-mute">
        Marca en qué franja sueles atender. Esto importa más de lo que parece:
        <strong class="text-text">
          mientras no publiques horarios, tus clientes no pueden pedirte cita
        </strong>
        — solo puedes proponérselas tú. Luego lo afinas día a día en Agenda ▸ Disponibilidad.
      </p>

      <div>
        <span class="block text-xs uppercase tracking-wider text-text-mute mb-2">Días</span>
        <div class="flex flex-wrap gap-1.5">
          {#each DIAS as d (d.v)}
            <button
              type="button"
              onclick={() => toggleDia(d.v)}
              aria-pressed={dias.includes(d.v)}
              class="w-10 h-10 rounded-md text-sm font-medium transition-colors {dias.includes(d.v)
                ? 'bg-primary text-bg'
                : 'bg-bg border border-line text-text-mute hover:text-text'}"
            >
              {d.label}
            </button>
          {/each}
        </div>
        {#each dias as d (d)}<input type="hidden" name="days" value={d} />{/each}
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label for="ob-desde" class="block text-xs uppercase tracking-wider text-text-mute mb-2">
            Desde
          </label>
          <input
            id="ob-desde"
            name="start_time"
            type="time"
            bind:value={desde}
            class="w-full px-3 py-2.5 bg-bg border border-line rounded-md focus:border-accent"
          />
        </div>
        <div>
          <label for="ob-hasta" class="block text-xs uppercase tracking-wider text-text-mute mb-2">
            Hasta
          </label>
          <input
            id="ob-hasta"
            name="end_time"
            type="time"
            bind:value={hasta}
            class="w-full px-3 py-2.5 bg-bg border border-line rounded-md focus:border-accent"
          />
        </div>
      </div>

      <input type="hidden" name="duration_minutes" value="60" />

      <div class="flex flex-wrap items-center gap-3">
        <button type="submit" class="btn-primary">Guardar horarios</button>
        <button
          type="button"
          onclick={() => (paso = 4)}
          class="text-sm text-text-mute hover:text-text transition-colors"
        >
          Lo configuro después
        </button>
      </div>
    </form>
  {:else}
    <!-- ===== 4 · PRIMER CLIENTE ===== -->
    {#if form?.success && form?.invited}
      <div class="card space-y-4">
        <div>
          <h2 class="text-2xl font-display font-semibold">Invitación enviada</h2>
          <p class="text-sm text-text-mute mt-2">
            Le hemos escrito a <strong class="text-text">{form.invited}</strong>. En cuanto entre y
            ponga su contraseña, aparecerá en tus clientes y podrás programarle la semana.
          </p>
        </div>
        <form method="POST" action="?/finish" use:enhance>
          <button type="submit" class="btn-primary w-full sm:w-auto">Ir a mi inicio</button>
        </form>
      </div>
    {:else}
      <form
        method="POST"
        action="?/inviteClient"
        use:enhance={() => {
          enviando = true;
          return async ({ update }) => {
            await update();
            enviando = false;
          };
        }}
        class="card space-y-4"
      >
        <p class="text-sm text-text-mute">
          Le llegará un correo para entrar y poner su contraseña. A partir de ahí ve sus entrenos,
          registra sus series y puede mandarte vídeos para que le corrijas la técnica.
        </p>
        <div class="grid sm:grid-cols-2 gap-3">
          <div>
            <label
              for="ob-cli-name"
              class="block text-xs uppercase tracking-wider text-text-mute mb-2"
            >
              Nombre
            </label>
            <input
              id="ob-cli-name"
              name="full_name"
              bind:value={clientName}
              maxlength="80"
              placeholder="Ej: Lucía Bermejo"
              class="w-full px-4 py-3 bg-bg border border-line rounded-md focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div>
            <label
              for="ob-cli-email"
              class="block text-xs uppercase tracking-wider text-text-mute mb-2"
            >
              Email
            </label>
            <input
              id="ob-cli-email"
              name="email"
              type="email"
              bind:value={clientEmail}
              placeholder="lucia@ejemplo.com"
              class="w-full px-4 py-3 bg-bg border border-line rounded-md focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={enviando} class="btn-primary">
            {enviando ? 'Enviando…' : 'Enviar invitación'}
          </button>
          <button
            type="submit"
            formaction="?/finish"
            class="text-sm text-text-mute hover:text-text transition-colors"
          >
            Todavía no tengo clientes
          </button>
        </div>
      </form>
    {/if}
  {/if}

  <!-- Salida siempre disponible: un asistente del que no se puede salir es
       una jaula, y el entrenador que ya sabe lo que hace lo agradece. -->
  <div class="flex items-center justify-between gap-4 border-t border-line pt-4">
    {#if paso > 1}
      <button
        type="button"
        onclick={() => (paso = paso - 1)}
        class="text-sm text-text-mute hover:text-text transition-colors"
      >
        ← Atrás
      </button>
    {:else}
      <span></span>
    {/if}
    <form method="POST" action="?/finish" use:enhance>
      <button type="submit" class="text-sm text-text-mute hover:text-text transition-colors">
        Saltar y empezar por mi cuenta
      </button>
    </form>
  </div>
</div>
