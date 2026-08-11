<script lang="ts">
  import { page } from '$app/state';
  import Icono from '$lib/components/Icono.svelte';

  let { data, children } = $props();

  // Enlaces de navegación con los prefijos de ruta que marcan cada uno como activo.
  //
  // "Rutinas" engloba ejercicios y entrenamientos: son las dos pestañas de la
  // misma pantalla y separarlas en el menú obligaba a saber en cuál de las dos
  // está lo que buscas antes de buscarlo.
  const links = [
    { href: '/dashboard', label: 'Inicio', icono: 'inicio', match: ['/dashboard'] },
    { href: '/exercises', label: 'Rutinas', icono: 'rutinas', match: ['/exercises', '/templates'] },
    { href: '/clients', label: 'Clientes', icono: 'clientes', match: ['/clients', '/groups'] },
    { href: '/agenda', label: 'Agenda', icono: 'agenda', match: ['/agenda', '/availability'] },
    { href: '/cobros', label: 'Cobros', icono: 'cobros', match: ['/cobros'] }
  ] as const;

  function isActive(match: readonly string[]): boolean {
    const path = page.url.pathname;
    return match.some((m) => path === m || path.startsWith(m + '/'));
  }

  // Los destinos de configuración, en el mismo orden en los dos menús: el
  // cajón del móvil y el desplegable de escritorio. Aprender dos ordenaciones
  // distintas de lo mismo es trabajo que no debería existir.
  const cuenta = [
    { href: '/ajustes', label: 'Ajustes', icono: 'ajustes' },
    { href: '/marca', label: 'Tu marca', icono: 'rejilla' },
    { href: '/avisos', label: 'Avisos', icono: 'avisos' }
  ] as const;

  // Los dos menús se cierran al navegar. Con <details> el estado vive en el
  // DOM, y en una navegación del lado del cliente ese nodo no se vuelve a
  // crear: sin esto, tocas "Clientes" y el menú se queda abierto encima de la
  // pantalla a la que acabas de ir.
  let cajon: HTMLDetailsElement | undefined = $state();
  let menuCuenta: HTMLDetailsElement | undefined = $state();
  $effect(() => {
    page.url.pathname;
    if (cajon) cajon.open = false;
    if (menuCuenta) menuCuenta.open = false;
  });
</script>

{#snippet campana(clases: string)}
  <!-- La campana. Sin número cuando no hay nada: un contador a cero enseña a
       ignorarlo, y entonces tampoco se mira el día que sí hay algo. -->
  <a
    href="/avisos"
    class="relative {clases}"
    aria-label={data.sinVer > 0 ? `Avisos, ${data.sinVer} sin ver` : 'Avisos'}
  >
    <Icono nombre="avisos" class="w-6 h-6" />
    {#if data.sinVer > 0}
      <span
        class="absolute -top-1 -right-1 min-w-[1.15rem] h-[1.15rem] px-1 rounded-full
               bg-accent text-bg text-3xs font-bold grid place-items-center tabular-nums"
        aria-hidden="true"
      >
        {data.sinVer > 9 ? '9+' : data.sinVer}
      </span>
    {/if}
  </a>
{/snippet}

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
          {@render campana('text-text-mute hover:text-text transition-colors')}
          <span class="text-line-strong">|</span>

          <!--
            Desplegable de cuenta. En escritorio no había nada equivalente al
            cajón del móvil: solo un enlace suelto a Ajustes, y las opciones
            quedaban escondidas dentro de esa pantalla.

            Mismo <details> que el cajón y la lista de cobros, por lo mismo:
            abre sin JavaScript, el navegador le da el rol y el teclado, y
            Escape lo cierra. La arquitectura es la misma que la del cajón —tu
            identidad arriba, destinos de configuración en medio, salir
            abajo— para que no haya que aprender dos menús.
          -->
          <details bind:this={menuCuenta} class="relative">
            <summary
              class="list-none cursor-pointer flex items-center gap-2 rounded-md
                     transition-colors {isActive(['/ajustes', '/marca'])
                ? 'text-accent font-medium'
                : 'text-text-mute hover:text-text'}
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span aria-hidden="true" class="marca-cuadro w-7 h-7 text-2xs">
                {data.marca.inicial}
              </span>
              <span class="max-w-[9rem] truncate">{data.profile.full_name ?? 'Ajustes'}</span>
            </summary>

            <button
              type="button"
              aria-label="Cerrar menú"
              onclick={() => menuCuenta && (menuCuenta.open = false)}
              class="fixed inset-0 z-40 cursor-default"
            ></button>

            <div
              class="absolute right-0 top-full mt-2 z-50 w-60
                     bg-surface border border-line rounded-lg shadow-lg overflow-hidden"
            >
              <div class="px-4 py-3 border-b border-line">
                <p class="font-semibold truncate">{data.profile.full_name ?? 'Tu nombre'}</p>
                <p class="text-2xs text-text-mute">Entrenador</p>
              </div>
              {#each cuenta as c (c.href)}
                <a
                  href={c.href}
                  class="flex items-center gap-2.5 px-4 py-2.5 text-sm border-b border-line
                         transition-colors {isActive([c.href])
                    ? 'text-accent'
                    : 'hover:bg-surface-2'}"
                >
                  <Icono nombre={c.icono} class="w-4 h-4 flex-shrink-0" />
                  {c.label}
                </a>
              {/each}
              <form method="POST" action="/logout">
                <button
                  type="submit"
                  class="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-mute
                         hover:text-danger hover:bg-surface-2 transition-colors"
                >
                  <Icono nombre="salir" class="w-4 h-4 flex-shrink-0" />
                  Salir
                </button>
              </form>
            </div>
          </details>
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
        <div class="flex items-center gap-1 sm:hidden">
          {@render campana('text-text-mute p-2')}

          <details bind:this={cajon}>
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
              <!-- La flecha va a la IZQUIERDA, como en el wireframe, y no es
                   decoración: el botón de la hamburguesa se queda visible por
                   encima del panel a propósito (es la única forma de cerrar
                   que no depende de JavaScript), así que si esta flecha
                   estuviera a la derecha las dos cosas se solaparían en la
                   misma esquina. -->
              <div class="flex items-center justify-start p-3">
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
                    <path d="M19 12H5M12 19l7-7-7-7" />
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
                  <!-- Debajo del nombre va DÓNDE entrena, como en el wireframe.
                     Si no lo ha puesto, se ofrece ponerlo en vez de dejar el
                     hueco o inventarse un texto. -->
                  <span class="block text-sm text-text-mute truncate">
                    {data.profile.default_location ?? 'Añadir dónde entrenas'}
                  </span>
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
                <!-- La MISMA lista que el desplegable de escritorio. Son dos
                     formas de enseñar lo mismo, y si se escribieran por
                     separado un día tendrían destinos distintos. -->
                {#each cuenta as c (c.href)}
                  <a
                    href={c.href}
                    aria-current={isActive([c.href]) ? 'page' : undefined}
                    class="flex items-center gap-3 px-2 py-3 text-lg font-medium transition-colors
                           {isActive([c.href]) ? 'text-accent' : 'hover:text-accent'}"
                  >
                    <Icono nombre={c.icono} class="w-5 h-5 flex-shrink-0" />
                    {c.label}
                  </a>
                {/each}
                <form method="POST" action="/logout" class="px-2 pt-2">
                  <button
                    type="submit"
                    class="flex items-center gap-3 text-text-mute hover:text-danger transition-colors"
                  >
                    <Icono nombre="salir" class="w-5 h-5 flex-shrink-0" />
                    Salir
                  </button>
                </form>
              </div>
            </nav>
          </details>
        </div>
      </div>
    </div>
  </header>

  <main class="container-narrow py-6 sm:py-10">
    {@render children()}
  </main>
</div>
