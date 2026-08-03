<script lang="ts">
  import { page } from '$app/state';

  let { data, children } = $props();

  // Enlaces de navegación con los prefijos de ruta que marcan cada uno como activo.
  const links = [
    { href: '/dashboard', label: 'Inicio', match: ['/dashboard'] },
    { href: '/exercises', label: 'Biblioteca', match: ['/exercises', '/templates'] },
    { href: '/clients', label: 'Clientes', match: ['/clients', '/groups'] },
    { href: '/agenda', label: 'Agenda', match: ['/agenda', '/availability'] }
  ];

  function isActive(match: string[]): boolean {
    const path = page.url.pathname;
    return match.some((m) => path === m || path.startsWith(m + '/'));
  }
</script>

<!-- Header coach -->
<header class="sticky top-0 z-50 bg-bg/90 backdrop-blur-md border-b border-line">
  <div class="container-narrow flex items-center justify-between py-4">
    <a href="/dashboard" class="flex items-center gap-2.5">
      <div class="w-7 h-7 rounded-md bg-accent grid place-items-center text-white font-display font-bold text-sm">
        C
      </div>
      <span class="font-display font-semibold tracking-tight text-[17px]">Coachify</span>
    </a>

    <nav class="flex items-center gap-6 text-sm">
      {#each links as link (link.href)}
        <a
          href={link.href}
          aria-current={isActive(link.match) ? 'page' : undefined}
          class="transition-colors {isActive(link.match) ? 'text-accent font-medium' : 'text-text-mute hover:text-text'}"
        >
          {link.label}
        </a>
      {/each}
      <span class="text-line-strong">|</span>
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
