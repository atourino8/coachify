<script lang="ts">
  let { data, children } = $props();
</script>

<header class="sticky top-0 z-50 bg-bg/80 backdrop-blur-md border-b border-text-mute/10">
  <div class="container-narrow flex items-center justify-between py-4">
    <a href="/today" class="flex items-center gap-2">
      <div
        class="w-8 h-8 rounded-md bg-gradient-to-br from-primary to-accent grid place-items-center
               text-bg font-bold text-sm"
      >
        C
      </div>
      <span class="font-semibold tracking-tight">Coachify</span>
    </a>

    <nav class="flex items-center gap-6 text-sm">
      <a href="/today" class="hover:text-primary transition-colors">Hoy</a>
      <a href="/my-calendar" class="text-text-mute hover:text-primary transition-colors"
        >Calendario</a
      >
      <a href="/progress" class="text-text-mute hover:text-primary transition-colors">Progreso</a>
      <span class="text-text-mute/40">|</span>
      <span class="text-text-mute hidden sm:inline">
        {data.profile.full_name ?? 'Cliente'}
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
