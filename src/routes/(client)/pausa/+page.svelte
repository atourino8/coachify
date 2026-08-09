<script lang="ts">
  let { data } = $props();

  // Derivado y no constante: si el entrenador cambia su nombre, esta pantalla
  // debería decirlo bien sin recargar.
  const coach = $derived(data.nombreCoach?.trim() || 'tu entrenador');
</script>

<!--
  EL TONO IMPORTA MÁS QUE LA PANTALLA.

  Quien llega aquí puede ser un moroso, pero es mucho más probable que sea
  alguien que pagó el viernes y a quien todavía no le han apuntado el pago.
  Así que ni se le acusa, ni se le dan cifras, ni se le habla de deuda: eso es
  un asunto entre él y su entrenador, y nosotros no sabemos quién tiene razón.

  Tampoco se le enseña un importe. Si dijéramos "debes 45 €" y el entrenador
  se hubiera equivocado al apuntarlo, estaríamos reclamando dinero por él con
  un dato que no hemos verificado.

  Lo único que hace esta pantalla es decir qué pasa, con quién se arregla y
  qué sigue estando disponible.
-->
<div class="max-w-xl mx-auto py-10 space-y-8">
  <div class="space-y-3">
    <p class="eyebrow">Acceso en pausa</p>
    <h1 class="h-display text-2xl sm:text-3xl">Habla con {coach} para retomarlo</h1>
    <p class="text-text-mute">
      Tus entrenos y tus vídeos de técnica están en pausa porque hay una cuota pendiente de
      confirmar. En cuanto {coach} lo actualice, vuelve todo a estar donde estaba.
    </p>
  </div>

  <div class="card space-y-3">
    <p class="text-sm font-medium">Si ya has pagado</p>
    <p class="text-sm text-text-mute">
      Puede que aún no le haya dado tiempo a registrarlo. Escríbele y se soluciona en un minuto: no
      se ha perdido nada de tu historial.
    </p>
  </div>

  <!--
    Su progreso sigue abierto, y se le dice. No es un consuelo: son SUS datos
    —sus pesos, sus series, su evolución— y no se retienen por una cuota. Lo
    que está en pausa es el trabajo del entrenador.
  -->
  <div class="space-y-3">
    <p class="text-sm">Mientras tanto sigues teniendo:</p>
    <div class="row">
      <a href="/progress" class="flex-1 font-medium hover:text-accent transition-colors">
        Tu progreso
      </a>
      <span class="text-sm text-text-mute">Todo tu historial de pesos y series</span>
    </div>
    <div class="row border-b-0">
      <a href="/my-calendar" class="flex-1 font-medium hover:text-accent transition-colors">
        Tus citas
      </a>
      <span class="text-sm text-text-mute">Para no plantarte en una sesión que no toca</span>
    </div>
  </div>

  <p class="text-2xs text-text-mute border-t border-line pt-4">
    Nada se ha borrado. Cuando {coach} confirme el pago, recuperas los entrenos y los vídeos tal como
    los dejaste.
  </p>
</div>
