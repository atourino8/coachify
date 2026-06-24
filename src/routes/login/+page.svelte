<script lang="ts">
  // Login real con Supabase Auth + redirección según rol.
  import { goto } from '$app/navigation';
  import { page } from '$app/state';

  let email = $state('');
  let password = $state('');
  let loading = $state(false);
  let error = $state('');

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    loading = true;
    error = '';

    const supabase = page.data.supabase;
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      loading = false;
      error = traducirError(authError.message);
      return;
    }

    // Leer el rol del perfil para decidir a dónde redirigir
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    loading = false;

    if (profile?.role === 'coach') {
      goto('/dashboard');
    } else if (profile?.role === 'client') {
      goto('/today');
    } else {
      // Sin perfil aún (raro): mandamos a la home
      goto('/');
    }
  }

  function traducirError(msg: string): string {
    const map: Record<string, string> = {
      'Invalid login credentials': 'Email o contraseña incorrectos.',
      'Email not confirmed':
        'Confirma tu email antes de entrar. Revisa tu bandeja de entrada.'
    };
    return map[msg] ?? msg;
  }
</script>

<svelte:head>
  <title>Entrar · Coachify</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center p-6">
  <div class="w-full max-w-md">
    <div class="text-center mb-10">
      <a
        href="/"
        class="inline-flex items-center gap-2 mb-8 text-text-mute hover:text-text transition-colors text-sm"
      >
        ← Volver
      </a>
      <div
        class="w-14 h-14 mx-auto mb-6 rounded-xl bg-gradient-to-br from-primary to-accent
               grid place-items-center text-bg font-bold text-2xl shadow-glow"
      >
        C
      </div>
      <h1 class="text-3xl font-bold mb-2">Bienvenido de nuevo</h1>
      <p class="text-text-mute">Entra a tu cuenta de Coachify</p>
    </div>

    <form onsubmit={handleSubmit} class="card space-y-5">
      <div>
        <label for="email" class="block text-xs uppercase tracking-wider text-text-mute mb-2">
          Email
        </label>
        <input
          type="email"
          id="email"
          bind:value={email}
          required
          autocomplete="email"
          class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md
                 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
        />
      </div>

      <div>
        <label for="password" class="block text-xs uppercase tracking-wider text-text-mute mb-2">
          Contraseña
        </label>
        <input
          type="password"
          id="password"
          bind:value={password}
          required
          autocomplete="current-password"
          class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md
                 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
        />
      </div>

      {#if error}
        <p class="text-sm text-danger bg-danger/10 border border-danger/20 rounded-md p-3">
          {error}
        </p>
      {/if}

      <button type="submit" disabled={loading} class="btn-primary w-full">
        {loading ? 'Entrando…' : 'Entrar'}
      </button>

      <div class="text-center text-sm text-text-mute pt-2">
        <a href="/recover" class="hover:text-text transition-colors">
          ¿Olvidaste tu contraseña?
        </a>
      </div>
    </form>

    <p class="text-center text-sm text-text-mute mt-6">
      ¿No tienes cuenta? <a href="/register" class="text-primary hover:underline">Crea una gratis</a>
    </p>
  </div>
</div>
