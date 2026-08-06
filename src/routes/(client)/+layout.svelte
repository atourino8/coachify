<script lang="ts">
  import { page } from '$app/state';

  let { data, children } = $props();

  const links = [
    { href: '/today', label: 'Hoy', match: ['/today', '/workout'] },
    { href: '/my-calendar', label: 'Citas', match: ['/my-calendar'] },
    { href: '/progress', label: 'Progreso', match: ['/progress'] }
  ];

  function isActive(match: string[]): boolean {
    const path = page.url.pathname;
    return match.some((m) => path === m || path.startsWith(m + '/'));
  }
</script>

<!-- El cliente usa esto con el móvil en la mano en el gimnasio, así que la
     navegación tiene que caber sin apreturas: en pantalla pequeña baja a una
     segunda fila en vez de comprimirse junto al logo. -->
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

<header class="sticky top-0 z-50 bg-bg/80 backdrop-blur-md border-b border-line">
  <div class="container-narrow py-3 sm:py-4">
    <div class="flex items-center justify-between gap-4">
      <a href="/today" class="flex items-center gap-2 flex-shrink-0">
        <div
          class="w-8 h-8 rounded-md bg-accent grid place-items-center
                 text-white font-display font-bold text-sm"
        >
          C
        </div>
        <span class="font-display font-semibold tracking-tight">Coachify</span>
      </a>

      <div class="flex items-center gap-4 sm:gap-6 text-sm">
        <nav class="hidden sm:flex items-center gap-6">
          {@render navLinks()}
        </nav>
        <span class="text-line-strong hidden sm:inline">|</span>
        <span class="text-text-mute hidden md:inline">
          {data.profile.full_name ?? 'Cliente'}
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
