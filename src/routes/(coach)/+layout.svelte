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

<!-- Los cuatro enlaces no caben junto al logo en un móvil, así que en pantalla
     pequeña bajan a una segunda fila. Preferimos eso a un menú hamburguesa:
     son cuatro destinos, esconderlos tras un clic no compensa. -->
{#snippet navLinks()}
  {#each links as link (link.href)}
    <a
      href={link.href}
      aria-current={isActive(link.match) ? 'page' : undefined}
      class="whitespace-nowrap transition-colors {isActive(link.match)
        ? 'text-accent font-medium'
        : 'text-text-mute hover:text-text'}"
    >
      {link.label}
    </a>
  {/each}
{/snippet}

<header class="sticky top-0 z-50 bg-bg/90 backdrop-blur-md border-b border-line">
  <div class="container-narrow py-3 sm:py-4">
    <div class="flex items-center justify-between gap-4">
      <a href="/dashboard" class="flex items-center gap-2.5 flex-shrink-0">
        <div
          class="w-7 h-7 rounded-md bg-accent grid place-items-center text-white font-display font-bold text-sm"
        >
          C
        </div>
        <span class="font-display font-semibold tracking-tight text-lg">Coachify</span>
      </a>

      <div class="flex items-center gap-4 sm:gap-6 text-sm">
        <nav class="hidden sm:flex items-center gap-6">
          {@render navLinks()}
        </nav>
        <span class="text-line-strong hidden sm:inline">|</span>
        <span class="text-text-mute hidden md:inline">
          {data.profile.full_name ?? 'Coach'}
        </span>
        <form method="POST" action="/logout">
          <button type="submit" class="text-text-mute hover:text-danger transition-colors">
            Salir
          </button>
        </form>
      </div>
    </div>

    <nav class="flex sm:hidden items-center gap-5 text-sm pt-2.5 overflow-x-auto">
      {@render navLinks()}
    </nav>
  </div>
</header>

<main class="container-narrow py-6 sm:py-10">
  {@render children()}
</main>
