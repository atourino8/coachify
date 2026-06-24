<script lang="ts">
  // Esta página se muestra al cliente recién invitado, justo después de
  // aceptar el magic link y antes de ver el dashboard. Le pide definir
  // contraseña para futuras entradas.
  import { goto } from '$app/navigation';
  import { page } from '$app/state';

  let { data } = $props();
  let password = $state('');
  let password2 = $state('');
  let loading = $state(false);
  let error = $state('');

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    error = '';
    if (password.length < 8) {
      error = 'La contraseña debe tener al menos 8 caracteres.';
      return;
    }
    if (password !== password2) {
      error = 'Las contraseñas no coinciden.';
      return;
    }

    loading = true;
    const supabase = page.data.supabase;
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      loading = false;
      error = updateError.message;
      return;
    }

    // Necesitamos leer el rol del perfil para redirigir bien
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', (await supabase.auth.getUser()).data.user!.id)
      .single();

    loading = false;
    if (profile?.role === 'coach') goto('/dashboard');
    else if (profile?.role === 'client') goto('/today');
    else goto('/');
  }
</script>

<svelte:head>
  <title>Define tu contraseña · Coachify</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center p-6">
  <div class="w-full max-w-md">
    <div class="text-center mb-10">
      <div
        class="w-14 h-14 mx-auto mb-6 rounded-xl bg-gradient-to-br from-primary to-accent
               grid place-items-center text-bg font-bold text-2xl shadow-glow"
      >
        C
      </div>
      <h1 class="text-3xl font-bold mb-2">¡Casi listo!</h1>
      <p class="text-text-mute">
        Define una contraseña para entrar a Coachify cada vez que quieras.
      </p>
      <p class="text-xs text-text-mute mt-2">
        Cuenta: <strong class="text-text">{data.email}</strong>
      </p>
    </div>

    <form onsubmit={handleSubmit} class="card space-y-5">
      <div>
        <label for="password" class="block text-xs uppercase tracking-wider text-text-mute mb-2">
          Nueva contraseña
        </label>
        <input
          type="password"
          id="password"
          bind:value={password}
          required
          minlength="8"
          autocomplete="new-password"
          class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <p class="text-xs text-text-mute mt-1">Mínimo 8 caracteres.</p>
      </div>

      <div>
        <label for="password2" class="block text-xs uppercase tracking-wider text-text-mute mb-2">
          Confirma la contraseña
        </label>
        <input
          type="password"
          id="password2"
          bind:value={password2}
          required
          minlength="8"
          autocomplete="new-password"
          class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {#if error}
        <p class="text-sm text-danger bg-danger/10 border border-danger/20 rounded-md p-3">
          {error}
        </p>
      {/if}

      <button type="submit" disabled={loading} class="btn-primary w-full">
        {loading ? 'Guardando…' : 'Definir contraseña y entrar'}
      </button>
    </form>
  </div>
</div>
