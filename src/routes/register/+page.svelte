<script lang="ts">
  // Registro UI · Fase A · Solo coaches (los clientes se invitan, no se autoregistran)

  let fullName = $state('');
  let email = $state('');
  let password = $state('');
  let loading = $state(false);
  let error = $state('');

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    loading = true;
    error = '';
    // TODO Fase B: signUp({ email, password }, { data: { full_name: fullName, role: 'coach' } })
    setTimeout(() => {
      loading = false;
      error = 'Registro aún no implementado (Fase B). Te llegará un email de verificación cuando esté listo.';
    }, 600);
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
        <p class="text-sm text-warning bg-warning/10 border border-warning/20 rounded-md p-3">
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

    <p class="text-center text-sm text-text-mute mt-6">
      ¿Ya tienes cuenta? <a href="/login" class="text-primary hover:underline">Entrar</a>
    </p>
  </div>
</div>
