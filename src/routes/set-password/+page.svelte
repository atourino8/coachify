<script lang="ts">
  // Esta página se muestra:
  //  - al cliente recién invitado (reason=invite), tras aceptar el magic link
  //  - a cualquier usuario que pasó por /recover (reason=recovery)
  //
  // FIX DEFENSIVO: antes de actualizar la password, verificamos que la sesión
  // del browser client (localStorage) coincide con la del server (cookies).
  // Si no coinciden, es señal de que el flow se cruzó con otra sesión activa
  // en el mismo navegador (bug conocido: coach logueado abre email del cliente).
  // En ese caso cerramos todo y mandamos al login.
  import { goto } from '$app/navigation';
  import { page } from '$app/state';

  let { data } = $props();
  let password = $state('');
  let password2 = $state('');
  let loading = $state(false);
  let error = $state('');

  const isRecovery = $derived(data.reason === 'recovery');
  const title = $derived(isRecovery ? 'Nueva contraseña' : '¡Casi listo!');
  const subtitle = $derived(
    isRecovery
      ? 'Define una contraseña nueva para tu cuenta.'
      : 'Define una contraseña para entrar a Treno cada vez que quieras.'
  );
  const submitLabel = $derived(isRecovery ? 'Guardar contraseña' : 'Definir contraseña y entrar');

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

    // Verificación cruzada server vs browser: si la sesión activa del navegador
    // no es la misma cuenta que el server dice tener, abortar. Evita cruces de
    // password cuando hay dos sesiones convivientes en el mismo navegador.
    const { data: userData, error: getUserErr } = await supabase.auth.getUser();
    if (getUserErr || !userData?.user) {
      loading = false;
      error = 'No hay sesión activa. Vuelve a solicitar el enlace.';
      return;
    }
    if (userData.user.email !== data.email) {
      // Sesiones cruzadas: cerrar todo por seguridad y mandar al login.
      console.warn(
        '[set-password] Sesión cruzada detectada. Server dice',
        data.email,
        'browser dice',
        userData.user.email
      );
      await supabase.auth.signOut({ scope: 'global' });
      loading = false;
      goto('/login?error=session-mismatch');
      return;
    }

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
      .eq('id', userData.user.id)
      .single();

    loading = false;
    if (profile?.role === 'coach') goto('/dashboard');
    else if (profile?.role === 'client') goto('/today');
    else goto('/');
  }
</script>

<svelte:head>
  <title>Define tu contraseña · Treno</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center p-6">
  <div class="w-full max-w-md">
    <div class="text-center mb-10">
      <div aria-hidden="true" class="marca-cuadro w-14 h-14 mx-auto mb-6 rounded-xl text-2xl">
        T
      </div>
      <h1 class="text-3xl font-display font-semibold mb-2">{title}</h1>
      <p class="text-text-mute">{subtitle}</p>
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
        <p
          role="alert"
          class="text-sm text-danger bg-danger/10 border border-danger/20 rounded-md p-3"
        >
          {error}
        </p>
      {/if}

      <button type="submit" disabled={loading} class="btn-primary w-full">
        {loading ? 'Guardando…' : submitLabel}
      </button>
    </form>
  </div>
</div>
