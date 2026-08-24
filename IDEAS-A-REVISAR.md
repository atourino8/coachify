# Ideas a revisar · a raíz de openGym

**Esto no decide nada.** No es un ADR y no está priorizado. Es la libreta de lo
que salió al mirar `gitlab.com/DuarteSantos8/opengym` (AGPL-3.0), para volver
sobre ello cuando toque.

## Para qué miramos esto

No para copiar. Copiar por copiar nos convierte en el quinto que hace lo
mismo, que es exactamente el sitio donde ya está todo el mundo peleándose por
precio (ver COMPETENCIA.md § 2.3).

Se mira por lo contrario: **un producto de código abierto y muy parecido es un
mapa gratis de lo que la gente da por supuesto**. Y sabiendo qué se da por
supuesto, se ve dónde se puede ser distinto. La pregunta al leer cada función
suya no es «¿la tenemos?», es **«¿qué hace esto en un producto donde hay un
entrenador detrás, que no puede hacer en uno donde no lo hay?»**.

Casi siempre la respuesta cambia la función entera. Eso es lo que buscamos.

**La AGPL ayuda a no equivocarse.** No podemos copiar código aunque
quisiéramos: usar código AGPL en un servicio de red obliga a publicar todo
Treno bajo AGPL. Se mira la demo y se toma nota del comportamiento; no se abre
el fuente para teclear lo mismo.

---

## 1 · Offline · lo que más merece un vistazo serio

**El malentendido, primero:** «en web sería imposible, hay que esperar a la app
móvil». No. openGym es React envuelto en Capacitor: el offline no se lo da lo
nativo, se lo da el navegador. Service worker + IndexedDB, y SvelteKit lo trae
de serie. Además **la PWA instalable ya está en v1.5** (10 h): el offline es su
continuación natural, no un proyecto aparte.

**Por qué aquí es más fácil de lo normal:** registrar una serie es casi
idempotente. La pareja `(workout_item_id, set_number)` identifica la serie, así
que reenviarla no duplica nada. El problema difícil del offline —resolver
conflictos— aquí casi no existe.

**La regla que sale sola de ADR-004:**

> **Offline para registrar. Nunca para reservar.**

Apuntar una serie puede esperar y subir luego. Coger la última plaza de una
clase no: eso lo decide el servidor con el bloqueo de fila, y decidirlo en un
móvil sin cobertura es prometer una plaza que puede no existir.

**A verificar antes de nada:** en iOS el navegador no sincroniza en segundo
plano, así que subiría al volver a abrir la aplicación, no sola. Para el caso
de uso —sótano sin cobertura, subes al salir— sobra, pero hay que decirlo en
la interfaz y no dar por hecho que ya está guardado en el servidor.

**Dónde diferencia:** un cliente que no puede apuntar la serie porque no hay
línea vuelve a Hevy y no vuelve. Es defensivo, no ofensivo, pero es el único de
la lista que puede costarnos un usuario entero.

---

## 2 · Volumen por grupo muscular · la que más me interesa

openGym lo llama «analizar qué músculos estás entrenando» y sirve para que el
que entrena solo se autorregule.

**Girado a nuestro caso cambia de dueño:** aquí no sirve para que el cliente se
mire, sirve para que **el entrenador se audite a sí mismo**. «A Lucía llevas
cinco semanas sin ponerle espalda.» Eso es un aviso sobre la calidad de su
trabajo, en la pantalla donde ya vive el resto de sus avisos.

**Coste bajo:** `exercises.muscle_groups` ya existe y `set_logs` ya guarda cada
serie. Es agregar, no modelar.

**Por qué diferencia:** Hevy no puede hacerlo aunque quiera, porque en Hevy no
hay nadie a quien auditar. Es de las pocas ideas de esta lista que **solo tiene
sentido si hay un entrenador detrás**. Ese es el filtro que buscábamos.

---

## 3 · PRs y récords

No tenemos nada. Se derivan de `set_logs` sin tabla nueva.

**El giro:** en las apps de uno mismo el récord es una medalla. Aquí es
**material de conversación del entrenador** —«has batido tu récord de
sentadilla, por eso subimos»— y, si sale en su panel, es la prueba de que su
trabajo funciona. Es una función de retención del *entrenador*, no del cliente.

---

## 4 · Dos correcciones a lo que dije yo

Las apunto porque me equivoqué en las dos y conviene que no se repita.

**El peso corporal no es un hallazgo.** Lo propuse como hueco y ya estaba
planificado: SPEC-TRAINER.md, v2, *«Tracking enriquecido (peso + medidas +
fotos progreso + feedback emocional)»*, 14 h. Confirmado que no hay ninguna
tabla de medidas hoy, pero la decisión ya estaba tomada; esto solo la respalda.

**El cronómetro de descanso estaba descartado a propósito.** SPEC-TRAINER.md,
backlog v3: *«Cronómetro inteligente de descanso (descartado v1 por feedback
explícito)»*. Yo lo propuse sin mirar.

Ahora bien, esto merece volver a abrirse **por un motivo nuevo, no por
capricho**: cuando se descartó no sabíamos que las tres apps líderes —Strong,
Hevy y FitNotes— lo tienen como función central, y openGym también. Puede que
el feedback siguiera teniendo razón, pero **no está escrito qué decía ese
feedback**, y sin eso no se puede saber si aplica.

→ *Tarea concreta: recuperar de quién vino y qué decía. Si no aparece, el
descarte no se sostiene solo.*

---

## 5 · Lo que NO se coge, y por qué

**Los 1.324 ejercicios.** Decisión de Toni, y es de producto, no de alcance: el
valor está en que la biblioteca **la construya el entrenador**, con su vídeo y
su nombre. Eso hace que irse a otro sitio le cueste perder su propio trabajo.
Una biblioteca precargada de 1.324 filas no crea ese vínculo, lo diluye — y va
en contra del prefijo «Alberto -» del wireframe, donde el ejercicio tiene
autor. (Aparte: no sabemos con qué licencia viene esa base.)

**Las progresiones automáticas, tal cual.** En openGym la aplicación decide
subir 2,5 kg porque no hay entrenador. Aquí eso le quita el trabajo a quien nos
paga. La versión que sí valdría es al revés, como herramienta suya: *«esta
plantilla sube 2,5 kg por semana, aplícamela ocho semanas»*. Misma mecánica,
dueño distinto.

**Passkeys.** Quita fricción de verdad —contraseña con las manos sudadas en el
gimnasio— pero es fontanería que no diferencia. Cuando sobre tiempo.

**Superseries.** Hueco real para entrenar en serio, pero es cambio de modelo de
datos y toca las tres pantallas de montar ejercicios que acabamos de unificar.
Esperar a que se asienten los wireframes nuevos.

**«Sin anuncios, sin tracking».** No hay nada que construir: comprobado que no
existe ni Analytics ni píxeles ni nada en el código, y la página de cookies ya
lo dice en su apartado de «lo que NO usamos». Es un argumento de venta que ya
tenemos y que no estamos usando — y tratándose de datos de salud, Harbiz no lo
puede copiar sin tocar su negocio.

---

## 6 · Lo que falta por mirar de openGym

- **El README y el CHANGELOG.** No los pude cargar (GitLab los pinta con
  JavaScript). Ahí está de dónde salen los 1.324 ejercicios y con qué licencia.
- **La demo en vivo**, `opengym.duarte-santos.ch`. Es lo que sí se puede mirar
  sin acercarse al código. Media hora de trastear vale más que otra lectura de
  la lista de funciones.
- **Su formato de exportación JSON.** Si vamos a exportar entrenos algún día,
  mirar qué campos consideran imprescindibles sale gratis.
- **Cómo resuelven el emparejamiento de nombres de ejercicio** al importar de
  Strong, Hevy y FitNotes. Ese es el problema caro de cualquier importación, y
  se puede estudiar **el comportamiento** sin tocar su código.
