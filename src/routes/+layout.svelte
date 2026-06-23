<script lang="ts">
  import '../app.css';

  let { children } = $props();
</script>

<svelte:head>
  <title>Coachify · La app de entrenamiento personal para coaches modernos</title>
  <meta
    name="description"
    content="Coachify es la app para entrenadores personales: gestiona clientes, arma rutinas con vídeos propios y sigue el progreso. Sin Excel, sin WhatsApp, sin caos."
  />
</svelte:head>

{@render children()}
