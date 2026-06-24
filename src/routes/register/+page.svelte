<script lang="ts">
  // Registro real con Supabase Auth. Crea coach por defecto.
  import { goto } from '$app/navigation';
  import { page } from '$app/state';

  let fullName = $state('');
  let email = $state('');
  let password = $state('');
  let loading = $state(false);
  let error = $state('');
  let successMessage = $state('');

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    loading = true;
    error = '';
    successMessage = '';

    const supabase = page.data.supabase;
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: 'coach'
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });

    loading = false;

    if (authError) {
      error = traducirError(authError.message);
      return;
    }

    if (data.user && !data.session) {
      // Email confirmation activado: mostrar mensaje
      successMessage =
        '¡Cuenta creada! Revisa tu email para confirmar tu cuenta y luego entra.';
      return;
    }

    // Si no hay confirmación de email, ya estamos dentro
    goto('/dashboard');
  }

  function traducirError(msg: string): string {
    const map: Record<string, string> = {
      'User already registered': 'Este email ya está registrado. Prueba a entrar.',
      'Password should be at least 6 characters':
        'La contraseña debe tener al menos 6 caracteres.',
      'Unable to validate email address: invalid format': 'El email no es válido.'
    };
    return map[msg] ?? msg;
  }
</script>

<svelte:head>
  <title>Crear cuenta · Coachify</title>
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
      <h1 class="text-3xl font-bold mb-2">Empieza gratis</h1>
      <p class="text-text-mute">14 días Pro de regalo. Sin tarjeta.</p>
    </div>

    {#if successMessage}
      <div
        class="card bg-success/10 border-success/30 text-success text-center space-y-3"
      >
        <p class="font-medium">{successMessage}</p>
        <a href="/login" class="text-sm underline">Ir al login</a>
      </div>
    {:else}
      <form onsubmit={handleSubmit} class="card space-y-5">
        <div>
          <label for="name" class="block text-xs uppercase tracking-wider text-text-mute mb-2">
            Nombre completo
          </label>
          <input
            type="text"
            id="name"
            bind:value={fullName}
            required
            autocomplete="name"
            maxlength="80"
            class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md
                   focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        <div>
          <label for="email" class="block text-xs uppercase tracking-wider text-text-mute mb-2">
            Email profesional
          </label>
          <input
            type="email"
            id="email"
            bind:value={email}
            required
            autocomplete="email"
            maxlength="100"
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
            autocomplete="new-password"
            minlength="8"
            class="w-full px-4 py-3 bg-bg border border-text-mute/20 rounded-md
                   focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
          <p class="text-xs text-text-mute mt-1">Mínimo 8 caracteres.</p>
        </div>

        {#if error}
          <p class="text-sm text-danger bg-danger/10 border border-danger/20 rounded-md p-3">
            {error}
          </p>
        {/if}

        <button type="submit" disabled={loading} class="btn-primary w-full">
          {loading ? 'Creando cuenta…' : 'Crear cuenta gratis'}
        </button>

        <p class="text-xs text-text-mute text-center pt-2">
          Al continuar aceptas nuestros
          <a href="/legal/terminos" class="text-primary hover:underline">Términos</a> y
          <a href="/legal/privacidad" class="text-primary hover:underline">Política de Privacidad</a>.
        </p>
      </form>
    {/if}

    <p class="text-center text-sm text-text-mute mt-6">
      ¿Ya tienes cuenta? <a href="/login" class="text-primary hover:underline">Entrar</a>
    </p>
  </div>
</div>
