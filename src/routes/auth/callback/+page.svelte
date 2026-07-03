<script lang="ts">
  // Callback client-side: maneja los flujos de Supabase Auth.
  //
  // 1) PKCE (signup/recovery via code): el código viene en ?code=XXX en query string.
  //    El cliente Supabase lo intercambia por sesión llamando a exchangeCodeForSession.
  // 2) Implicit (invitaciones, recovery via hash): tokens en el HASH
  //    (#access_token=..., #type=invite|recovery).
  //
  // IMPORTANTE: antes de procesar los tokens, cerramos la sesión previa que pudiera
  // existir en el navegador (p. ej. si el coach abre en la misma pestaña el email
  // del cliente). Sin esto, los tokens del invitado se solapan con los del coach y
  // acaban cruzándose (bug conocido).
  //
  // Redirección final:
  //  - invite  → /set-password  (definir contraseña por primera vez)
  //  - recovery → /set-password  (definir contraseña nueva)
  //  - resto   → dashboard/today según rol

  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { onMount } from 'svelte';

  let status = $state('Procesando…');

  onMount(async () => {
    const supabase = page.data.supabase;
    const url = new URL(window.location.href);

    // ---------- Detectar tipo de flujo ----------
    const code = url.searchParams.get('code');
    const isInviteQuery = url.searchParams.get('invite') === '1';
    const isRecoveryQuery = url.searchParams.get('recovery') === '1';
    const hashParams = new URLSearchParams(url.hash.startsWith('#') ? url.hash.slice(1) : url.hash);
    const hashType = hashParams.get('type');
    const isInviteHash = hashType === 'invite';
    const isRecoveryHash = hashType === 'recovery';
    const isInvite = isInviteQuery || isInviteHash;
    const isRecovery = isRecoveryQuery || isRecoveryHash;
    const hasAccessToken = hashParams.has('access_token');
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');

    try {
      // Fix defensivo: si hay hash de invite/recovery, primero limpiar la sesión
      // previa del navegador. Evita que se solape con la nueva.
      if (hasAccessToken && (isInvite || isRecovery)) {
        status = 'Preparando sesión…';
        await supabase.auth.signOut({ scope: 'local' });
      }

      // CASO 1: PKCE flow (signup normal, recovery via code)
      if (code) {
        status = 'Confirmando cuenta…';
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) throw error;
      }

      // CASO 2: implicit flow (invite/recovery via hash tokens)
      if (hasAccessToken && accessToken && refreshToken) {
        status = 'Estableciendo sesión…';
        // setSession explícito: no dependemos de detectSessionInUrl automático.
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });
        if (error) throw error;
      }

      // Verificar que tenemos usuario
      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('No se pudo recuperar la sesión.');
      }

      // Limpiar el hash de la URL (no queremos tokens visibles en histórico)
      history.replaceState({}, '', '/auth/callback');

      // Invite o recovery → set-password (pasamos el motivo por query)
      if (isInvite) {
        status = 'Redirigiendo a definir contraseña…';
        await goto('/set-password?reason=invite');
        return;
      }
      if (isRecovery) {
        status = 'Redirigiendo a definir nueva contraseña…';
        await goto('/set-password?reason=recovery');
        return;
      }

      // Flow normal: leer rol y redirigir
      status = 'Cargando tu panel…';
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role === 'coach') await goto('/dashboard');
      else if (profile?.role === 'client') await goto('/today');
      else await goto('/');
    } catch (err) {
      console.error('Error en callback:', err);
      status = 'Error al autenticar. Redirigiendo al login…';
      setTimeout(() => goto('/login?error=auth-callback'), 1500);
    }
  });
</script>

<svelte:head>
  <title>Procesando · Coachify</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center p-6">
  <div class="text-center space-y-6">
    <div
      class="w-16 h-16 mx-auto rounded-xl bg-gradient-to-br from-primary to-accent
             grid place-items-center text-bg font-bold text-2xl shadow-glow animate-pulse"
    >
      C
    </div>
    <p class="text-text-mute">{status}</p>
    <div class="flex justify-center gap-1.5">
      <div class="w-2 h-2 bg-primary rounded-full animate-bounce" style="animation-delay: 0ms"></div>
      <div class="w-2 h-2 bg-primary rounded-full animate-bounce" style="animation-delay: 150ms"></div>
      <div class="w-2 h-2 bg-primary rounded-full animate-bounce" style="animation-delay: 300ms"></div>
    </div>
  </div>
</div>
