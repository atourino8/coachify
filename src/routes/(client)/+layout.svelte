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

<!-- Todo lo que ve el cliente va dentro del color de SU entrenador. Las
     variables CSS cascadean, así que declararlas aquí basta para repintar la
     cabecera, los enlaces activos y las barras de progreso de las series. -->
<div style={data.marca.estilo}>
  <header class="sticky top-0 z-50 bg-bg/80 backdrop-blur-md border-b border-line">
    <div class="container-narrow py-3 sm:py-4">
      <div class="flex items-center justify-between gap-4">
        <!-- Arriba manda el entrenador, no Treno. El cliente no nos ha
             contratado a nosotros: ha contratado a su entrenador, y esta es
             la aplicación de su entrenador. Nuestro nombre queda abajo, una
             vez, sin competir con el suyo.
             La inicial es decorativa (aria-hidden) porque el nombre completo
             está justo al lado: con un degradado de marca esa letra puede
             quedarse por debajo del contraste mínimo, así que no puede ser
             ella la que lleve la información. -->
        <a href="/today" class="flex items-center gap-2 flex-shrink-0">
          <div aria-hidden="true" class="marca-cuadro w-8 h-8 text-sm">{data.marca.inicial}</div>
          <span class="font-display font-semibold tracking-tight">{data.marca.nombre}</span>
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

  <!--
    Aviso durante los siete días de gracia. Va aquí y no en una sola pantalla
    porque el objetivo es que no le pille por sorpresa: si el corte llega sin
    que lo haya visto venir, el cliente se enfada con la aplicación y con su
    entrenador a la vez.

    Sin importes y sin la palabra "deuda". Puede que ya haya pagado y que el
    entrenador no lo haya apuntado todavía, que con contabilidad manual es el
    caso más probable.
  -->
  {#if data.acceso.estado === 'aviso'}
    <div class="container-narrow pt-4">
      <p
        class="text-sm text-warning bg-warning/5 border border-warning/25 rounded-md p-3"
        role="status"
      >
        Tienes una cuota pendiente de confirmar. Si ya la has pagado, avisa a {data.marca.nombre};
        si no, el acceso a tus entrenos se pausará en {data.acceso.diasRestantes}
        {data.acceso.diasRestantes === 1 ? 'día' : 'días'}.
      </p>
    </div>
  {/if}

  <main class="container-narrow py-6 sm:py-10">
    {@render children()}
  </main>

  <!-- Sin logotipo ni color: una línea de texto. Es honesto sobre quién hace
       la herramienta sin disputarle la cabecera al entrenador, y es el único
       sitio donde un cliente descubre que Treno existe. -->
  <footer class="container-narrow pb-8 pt-2">
    <p class="text-2xs text-text-mute border-t border-line pt-4">
      Hecho con <a href="/" class="hover:text-text transition-colors">Treno</a>
    </p>
  </footer>
</div>
