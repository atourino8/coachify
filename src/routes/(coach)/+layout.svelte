<script lang="ts">
  import { page } from '$app/state';

  let { data, children } = $props();

  // Enlaces de navegación con los prefijos de ruta que marcan cada uno como activo.
  const links = [
    { href: '/dashboard', label: 'Inicio', match: ['/dashboard'] },
    { href: '/exercises', label: 'Biblioteca', match: ['/exercises', '/templates'] },
    { href: '/clients', label: 'Clientes', match: ['/clients'] },
    { href: '/agenda', label: 'Agenda', match: ['/agenda', '/availability'] }
  ];

  function isActive(match: string[]): boolean {
    const path = page.url.pathname;
    return match.some((m) => path === m || path.startsWith(m + '/'));
  }
</script>

<!-- Header coach -->
<header class="sticky top-0 z-50 bg-bg/80 backdrop-blur-md border-b border-text-mute/10">
  <div class="container-narrow flex items-center justify-between py-4">
    <a href="/dashboard" class="flex items-center gap-2">
      <div
        class="w-8 h-8 rounded-md bg-gradient-to-br from-primary to-accent grid place-items-center
               text-bg font-bold text-sm"
      >
        C
      </div>
      <span class="font-semibold tracking-tight">Coachify</span>
    </a>

    <nav class="flex items-center gap-6 text-sm">
      {#each links as link (link.href)}
        <a
          href={link.href}
          aria-current={isActive(link.match) ? 'page' : undefined}
          class="transition-colors {isActive(link.match) ? 'text-primary font-medium' : 'text-text-mute hover:text-primary'}"
        >
          {link.label}
        </a>
      {/each}
      <span class="text-text-mute/40">|</span>
      <span class="text-text-mute hidden sm:inline">
        {data.profile.full_name ?? 'Coach'}
      </span>
      <form method="POST" action="/logout">
        <button type="submit" class="text-text-mute hover:text-danger transition-colors">
          Salir
        </button>
      </form>
    </nav>
  </div>
</header>

<main class="container-narrow py-10">
  {@render children()}
</main>
