<script lang="ts">
  // Recuperación de contraseña: pide email, envía magic link con Supabase.
  // El link del email vuelve a /auth/callback?recovery=1 y redirige a /set-password.
  import { page } from '$app/state';

  let email = $state('');
  let loading = $state(false);
  let error = $state('');
  let sent = $state(false);

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    loading = true;
    error = '';

    const supabase = page.data.supabase;
    const redirectTo = `${window.location.origin}/auth/callback?recovery=1`;

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo
    });

    loading = false;
    if (resetError) {
      error = traducirError(resetError.message);
      return;
    }
    sent = true;
  }

  function traducirError(msg: string): string {
    if (msg.toLowerCase().includes('rate')) {
      return 'Has pedido demasiados emails seguidos. Espera un rato antes de reintentar.';
    }
    if (msg.toLowerCase().includes('user') && msg.toLowerCase().includes('found')) {
      return 'No hay ninguna cuenta con ese email.';
    }
    return msg;
  }
</script>

<svelte:head>
  <title>Recuperar contraseña · Coachify</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center p-6">
  <div class="w-full max-w-md">
    <div class="text-center mb-10">
      <a
        href="/login"
        class="inline-flex items-center gap-2 mb-8 text-text-mute hover:text-text transition-colors text-sm"
      >
        ← Volver al login
      </a>
      <div
        class="w-14 h-14 mx-auto mb-6 rounded-xl bg-gradient-to-br from-primary to-accent
               grid place-items-center text-bg font-bold text-2xl shadow-glow"
      >
        C
      </div>
      <h1 class="text-3xl font-bold mb-2">Recuperar contraseña</h1>
      <p class="text-text-mute">
        Te enviamos un email con un enlace para definir una nueva.
      </p>
    </div>

    {#if sent}
      <div class="card text-center space-y-4">
        <div class="text-4xl">📬</div>
        <h2 class="text-xl font-semibold">Email enviado</h2>
        <p class="text-sm text-text-mute">
          Si <strong class="text-text">{email}</strong> tiene una cuenta en Coachify,
          te llegará un email con un enlace para restablecer tu contraseña.
        </p>
        <p class="text-xs text-text-mute">
          Revisa también la carpeta de spam. El enlace expira en 1 hora.
        </p>
        <a href="/login" class="inline-block text-sm text-primary hover:underline pt-2">
          Volver al login →
        </a>
      </div>
    {:else}
      <form onsubmit={handleSubmit} class="card space-y-5">
        <div>
          <label for="email" class="block text-xs uppercase tracking-wider text-text-mute mb-2">
            Tu email
          </label>
          <input
            type="email"
            id="email"
            bind:value={email}
            required
            autocomplete="email"
            autofocus
            placeholder="tu@email.com"
            class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {#if error}
          <p class="text-sm text-danger bg-danger/10 border border-danger/20 rounded-md p-3">
            {error}
          </p>
        {/if}

        <button type="submit" disabled={loading} class="btn-primary w-full">
          {loading ? 'Enviando…' : 'Enviarme el email'}
        </button>
      </form>

      <p class="text-center text-sm text-text-mute mt-6">
        ¿Ya te acordaste? <a href="/login" class="text-primary hover:underline">Entrar</a>
      </p>
    {/if}
  </div>
</div>
