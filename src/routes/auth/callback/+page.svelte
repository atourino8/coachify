<script lang="ts">
  // Callback client-side: maneja AMBOS flujos de Supabase Auth.
  //
  // 1) PKCE (signup/recovery): el código viene en ?code=XXX en query string.
  //    El cliente Supabase lo intercambia por sesión llamando a exchangeCodeForSession.
  // 2) Implicit (invitaciones): los tokens vienen en el HASH (#access_token=..., #type=invite).
  //    El cliente Supabase los detecta automáticamente al instanciarse con
  //    detectSessionInUrl: true (que es el default de createBrowserClient).
  //
  // En ambos casos, una vez tenemos sesión, leemos el rol del perfil y
  // redirigimos al destino correcto (set-password si es invite, dashboard/today
  // si es flujo normal).

  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { onMount } from 'svelte';

  let status = $state('Procesando…');

  onMount(async () => {
    const supabase = page.data.supabase;
    const url = new URL(window.location.href);

    // Detectar tipo de flujo
    const code = url.searchParams.get('code');
    const isInviteQuery = url.searchParams.get('invite') === '1';
    const hashParams = new URLSearchParams(url.hash.startsWith('#') ? url.hash.slice(1) : url.hash);
    const hashType = hashParams.get('type');
    const isInviteHash = hashType === 'invite';
    const isInvite = isInviteQuery || isInviteHash;
    const hasAccessToken = hashParams.has('access_token');

    try {
      // CASO 1: PKCE flow (signup normal)
      if (code) {
        status = 'Confirmando cuenta…';
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) throw error;
      }

      // CASO 2: implicit flow (invitación)
      // El cliente Supabase con detectSessionInUrl ya procesa el hash al cargar.
      // Solo necesitamos esperar un poquito a que se establezca la sesión.
      if (hasAccessToken) {
        status = 'Estableciendo sesión…';
        // Pequeño tick para que el cliente procese el hash
        await new Promise((r) => setTimeout(r, 200));
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

      // Si es invitación → set-password
      if (isInvite) {
        status = 'Redirigiendo a definir contraseña…';
        await goto('/set-password');
        return;
      }

      // Si no, leer rol y redirigir
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
