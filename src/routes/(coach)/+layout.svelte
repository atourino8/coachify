<script lang="ts">
  import { page } from '$app/state';

  let { data, children } = $props();

  // Enlaces de navegación con los prefijos de ruta que marcan cada uno como activo.
  //
  // "Rutinas" engloba ejercicios y entrenamientos: son las dos pestañas de la
  // misma pantalla y separarlas en el menú obligaba a saber en cuál de las dos
  // está lo que buscas antes de buscarlo.
  const links = [
    { href: '/dashboard', label: 'Inicio', match: ['/dashboard'] },
    { href: '/exercises', label: 'Rutinas', match: ['/exercises', '/templates'] },
    { href: '/clients', label: 'Clientes', match: ['/clients', '/groups'] },
    { href: '/agenda', label: 'Agenda', match: ['/agenda', '/availability'] },
    { href: '/cobros', label: 'Cobros', match: ['/cobros'] }
  ];

  function isActive(match: string[]): boolean {
    const path = page.url.pathname;
    return match.some((m) => path === m || path.startsWith(m + '/'));
  }

  // El cajón se cierra al navegar. Con <details> el estado vive en el DOM, y
  // en una navegación del lado del cliente ese nodo no se vuelve a crear: sin
  // esto, tocas "Clientes" y el menú se queda abierto encima de la pantalla
  // a la que acabas de ir.
  let cajon: HTMLDetailsElement | undefined = $state();
  $effect(() => {
    page.url.pathname;
    if (cajon) cajon.open = false;
  });
</script>

<div style={data.marca.estilo}>
  <!--
    El desenfoque solo desde `sm`, y no es estético: `backdrop-filter` hace
    que este <header> se convierta en el BLOQUE CONTENEDOR de sus
    descendientes `position: fixed`. Con el desenfoque activo en móvil, el
    cajón y su velo se habrían dibujado dentro de la cabecera —unos 60 píxeles
    de alto— en vez de a pantalla completa.

    Es un fallo que no da error y que no se ve hasta abrirlo en un móvil de
    verdad. Como el cajón es `sm:hidden` y el desenfoque es `sm:`, no
    coinciden nunca. En móvil el fondo va opaco, que además se lee mejor.
  -->
  <header class="sticky top-0 z-50 bg-bg sm:bg-bg/90 sm:backdrop-blur-md border-b border-line">
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

        <!-- Escritorio: la navegación sigue a la vista. Ahí sobra espacio y
             esconder cinco destinos tras un clic sería empeorarlo. -->
        <div class="hidden sm:flex items-center gap-6 text-sm">
          <nav class="flex items-center gap-6">
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
          </nav>
          <span class="text-line-strong">|</span>
          <a
            href="/ajustes"
            class="transition-colors {isActive(['/ajustes', '/marca'])
              ? 'text-accent font-medium'
              : 'text-text-mute hover:text-text'}"
          >
            Ajustes
          </a>
        </div>

        <!--
          Móvil: cajón lateral.

          Antes eran cinco enlaces más "Mi marca" en una fila con
          desplazamiento horizontal. Era lo peor de la aplicación en pantalla
          pequeña: los últimos destinos estaban escondidos detrás de un gesto
          que nadie hace, y el hueco que ocupaba la fila salía de donde hace
          falta, que es el contenido.

          Con <details> y no con una variable de estado, por lo mismo que en
          Cobros: abre y cierra SIN JavaScript, el navegador le da el rol y el
          manejo por teclado, y Escape lo cierra solo. Si el guion no ha
          cargado —una 4G mala en un gimnasio es el caso normal, no el raro—,
          la navegación sigue funcionando.
        -->
        <details bind:this={cajon} class="sm:hidden">
          <!-- z por encima del panel: sin esto el cajón abierto tapa el propio
               botón que lo abrió, y sin JavaScript no habría forma de
               cerrarlo, porque volver a pulsar el <summary> es la única que no
               depende de un guion. -->
          <summary
            aria-label="Menú"
            class="relative z-[60] list-none cursor-pointer p-2 -mr-2 rounded-md
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <svg
              class="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              aria-hidden="true"
            >
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </summary>

          <!-- El velo cierra el cajón al tocar fuera. Es un <button> y no un
               <div> con onclick para que exista para el teclado y para un
               lector de pantalla, en vez de ser una trampa invisible. -->
          <button
            type="button"
            aria-label="Cerrar menú"
            onclick={() => cajon && (cajon.open = false)}
            class="fixed inset-0 z-40 bg-bg/70 backdrop-blur-sm cursor-default"
          ></button>

          <nav
            class="fixed top-0 right-0 bottom-0 z-50 w-[17rem] max-w-[85vw]
                   bg-surface border-l border-line
                   flex flex-col overflow-y-auto"
          >
            <div class="flex items-center justify-end p-3">
              <button
                type="button"
                aria-label="Cerrar menú"
                onclick={() => cajon && (cajon.open = false)}
                class="p-2 rounded-md text-text-mute hover:text-text
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <svg
                  class="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  aria-hidden="true"
                >
                  <path d="M5 12h14M12 5l-7 7 7 7" />
                </svg>
              </button>
            </div>

            <a href="/ajustes" class="flex items-center gap-3 px-5 pb-5">
              <div aria-hidden="true" class="marca-cuadro w-12 h-12 text-lg flex-shrink-0">
                {data.marca.inicial}
              </div>
              <span class="min-w-0">
                <span class="block font-semibold truncate">
                  {data.profile.full_name ?? 'Tu nombre'}
                </span>
                <span class="block text-sm text-text-mute">Ver ajustes</span>
              </span>
            </a>

            <div class="px-3">
              {#each links as link (link.href)}
                <a
                  href={link.href}
                  aria-current={isActive(link.match) ? 'page' : undefined}
                  class="block px-2 py-3.5 border-b border-line text-lg font-medium transition-colors
                         {isActive(link.match) ? 'text-accent' : 'hover:text-accent'}"
                >
                  {link.label}
                </a>
              {/each}
            </div>

            <!-- Configuración y salir, abajo y separados del resto: no son
                 destinos de trabajo y no compiten con ellos. -->
            <div class="mt-auto px-3 pb-4 pt-8">
              <a
                href="/ajustes"
                aria-current={isActive(['/ajustes', '/marca']) ? 'page' : undefined}
                class="block px-2 py-3 text-lg font-medium transition-colors
                       {isActive(['/ajustes', '/marca']) ? 'text-accent' : 'hover:text-accent'}"
              >
                Ajustes
              </a>
              <form method="POST" action="/logout" class="px-2 pt-2">
                <button type="submit" class="text-text-mute hover:text-danger transition-colors">
                  Salir
                </button>
              </form>
            </div>
          </nav>
        </details>
      </div>
    </div>
  </header>

  <main class="container-narrow py-6 sm:py-10">
    {@render children()}
  </main>
</div>
