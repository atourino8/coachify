<script lang="ts">
  import { page } from '$app/state';

  let { data, children } = $props();

  // Enlaces de navegación con los prefijos de ruta que marcan cada uno como activo.
  const links = [
    { href: '/dashboard', label: 'Inicio', match: ['/dashboard'] },
    { href: '/exercises', label: 'Biblioteca', match: ['/exercises', '/templates'] },
    { href: '/clients', label: 'Clientes', match: ['/clients', '/groups'] },
    { href: '/agenda', label: 'Agenda', match: ['/agenda', '/availability'] },
    { href: '/cobros', label: 'Cobros', match: ['/cobros'] }
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

<!-- El color de marca del entrenador se declara aquí, en un contenedor que
     envuelve todo lo suyo. Las variables CSS cascadean, así que con esto se
     repintan la cabecera, los enlaces activos, los antetítulos, el foco y las
     barras de progreso sin que ninguna plantilla mencione un color.
     Si no ha elegido marca, `estilo` viene vacío y manda app.css. -->
<div style={data.marca.estilo}>
  <header class="sticky top-0 z-50 bg-bg/90 backdrop-blur-md border-b border-line">
    <div class="container-narrow py-3 sm:py-4">
      <div class="flex items-center justify-between gap-4">
        <!-- Aquí el nombre sigue siendo Treno, no el del entrenador. Él es
             nuestro cliente y esta es la herramienta que ha contratado; verse
             su propio nombre en la esquina de su panel no le dice nada. Lo
             que sí cambia es el color del cuadro, que toma el suyo. Donde su
             marca manda entera es en la pantalla del cliente. -->
        <a href="/dashboard" class="flex items-center gap-2.5 flex-shrink-0">
          <div aria-hidden="true" class="marca-cuadro w-7 h-7 text-sm">T</div>
          <span class="font-display font-semibold tracking-tight text-lg">Treno</span>
        </a>

        <div class="flex items-center gap-4 sm:gap-6 text-sm">
          <nav class="hidden sm:flex items-center gap-6">
            {@render navLinks()}
          </nav>
          <span class="text-line-strong hidden sm:inline">|</span>
          <a
            href="/marca"
            class="hidden md:inline transition-colors {page.url.pathname === '/marca'
              ? 'text-accent font-medium'
              : 'text-text-mute hover:text-text'}"
          >
            {data.profile.full_name ?? 'Coach'}
          </a>
          <form method="POST" action="/logout">
            <button type="submit" class="text-text-mute hover:text-danger transition-colors">
              Salir
            </button>
          </form>
        </div>
      </div>

      <nav class="flex sm:hidden items-center gap-5 text-sm pt-2.5 overflow-x-auto">
        {@render navLinks()}
        <!-- En móvil el nombre no cabe arriba, así que el acceso a la marca
             viaja con el resto de la navegación en vez de desaparecer. -->
        <a
          href="/marca"
          aria-current={page.url.pathname === '/marca' ? 'page' : undefined}
          class="whitespace-nowrap transition-colors {page.url.pathname === '/marca'
            ? 'text-accent font-medium'
            : 'text-text-mute hover:text-text'}"
        >
          Mi marca
        </a>
      </nav>
    </div>
  </header>

  <main class="container-narrow py-6 sm:py-10">
    {@render children()}
  </main>
</div>
