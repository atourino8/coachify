# ADR-005 · El vídeo deja de pertenecer al ejercicio

**Estado:** aceptado · **Fecha:** 28 de agosto de 2026

## El problema

Un movimiento se entrena de varias maneras. El curl de bíceps **analítico** y el
**isométrico** son dos ejercicios distintos —distinta prescripción, distinta
intención— pero **el mismo movimiento grabado**.

Hoy el vídeo vive en la fila del ejercicio (`exercises.video_url` /
`exercises.video_path`, excluyentes). Así que dos variantes son dos ejercicios y
**dos subidas del mismo vídeo**:

- El entrenador graba o sube dos veces lo mismo.
- Pagamos el doble de almacenamiento, que es la parte cara de esta aplicación
  (100 MB por vídeo).
- Si regraba el movimiento tiene que acordarse de cambiarlo en los dos sitios, y
  si se olvida, dos ejercicios enseñan versiones distintas del mismo gesto.

Y hay un tercer problema que aparece al resolver los dos primeros: si el vídeo
es el mismo, **algo tiene que distinguir las variantes al mirarlo**.

## La decisión

**Tres cosas, y el orden importa porque la tercera solo tiene sentido con la
primera hecha.**

### 1 · Los vídeos son suyos, no del ejercicio

Tabla `coach_videos`, propiedad del entrenador. Un ejercicio **apunta** a un
vídeo (`exercises.video_id`, opcional). Varios ejercicios pueden apuntar al
mismo.

Consecuencias buenas que salen gratis: regrabar un movimiento se hace en un
sitio y se propaga; y la biblioteca del entrenador pasa a ser un activo con
nombre propio, que es la tesis del producto (COMPETENCIA.md § 4.1: lo que hace
caro irse es el trabajo propio acumulado).

### 2 · La distinción entre variantes pertenece al EJERCICIO, no al vídeo

Es el punto de modelado que importa. El mismo vídeo enseña cosas distintas según
qué variante estés explicando: «sube explosivo y baja lento» para el analítico,
«aguanta tres segundos arriba» para el isométrico.

Si la nota colgara del vídeo, **todas las variantes verían la misma** y no
habríamos resuelto nada. Así que va en el ejercicio:

- `exercises.video_nota` — qué mirar en este vídeo **para esta variante**.
- `exercises.video_desde` / `video_hasta` — el tramo que interesa, en segundos.

### 3 · Fragmento, no anotaciones en la línea de tiempo

**Lo que se descarta y por qué.** La idea original era una anotación que
apareciera en el instante exacto del movimiento. Reproducir eso es barato
—escuchar `timeupdate` y pintar un texto—; **lo caro es escribirlo**: obligar al
entrenador a rebobinar al segundo exacto, en un móvil, para cada variante de
cada ejercicio. Eso choca con la premisa 1 («si no es obvio en 30 segundos, se
replantea»).

El fragmento da casi todo con dos campos numéricos y ningún editor de línea de
tiempo. Y encaja con la realidad del gesto: **el isométrico ES un tramo del
mismo movimiento**.

La anotación en el instante se puede añadir encima más adelante sin rehacer
nada, porque el modelo ya tiene dónde ponerla. No se hace ahora.

## Lo que NO cambia

- **Los vídeos de YouTube siguen valiendo.** Un `coach_videos` es o un fichero
  subido o un enlace, igual que antes, con la misma exclusión.
- **El cubo `coach-media` se queda como está**, con sus políticas. Solo cambia
  quién apunta a qué.
- **La corrección de técnica** (`technique_videos`) es otra cosa: son vídeos que
  sube el CLIENTE para que el entrenador los corrija. No se toca.

## Migración

`0026_coach_videos.sql`:

1. Crea `coach_videos` con RLS: cada entrenador ve y edita los suyos; el cliente
   ve los de **su** entrenador.
2. **Mueve los vídeos que ya existen**: por cada ejercicio con `video_url` o
   `video_path`, crea su fila en `coach_videos` y lo apunta. Uno por ejercicio,
   así que el comportamiento no cambia — pero desde ese momento se pueden
   compartir.
3. **Borra `video_url`, `video_path` y `video_poster`** en la misma migración.

**En un solo paso, y esto se corrigió sobre la marcha.** La primera versión lo
partía en dos —copiar ahora, borrar después— para que la aplicación no se
rompiera entre aplicar la migración y hacer `pull`.

Estaba mal. El patrón de «expandir y contraer» existe para **despliegues sin
cortes con código viejo y nuevo corriendo a la vez**: varias instancias,
usuarios dentro, ni un segundo con el esquema a medias. Aquí hay cero usuarios,
un despliegue, y las dos cosas pasan con un minuto de diferencia. Se estaba
metiendo **duplicación de datos** —dos fuentes para lo mismo— para evitar un
minuto de aplicación rota que no ve nadie.

Y partirlo costaba más de lo que ahorraba:

- **Una migración sola es atómica.** El DDL de Postgres va en transacción: o
  entra todo o no entra nada. Dos migraciones crean un estado a medias real, y
  el paso de borrar es exactamente el que se queda sin aplicar.
- Obliga a recordar un orden que no debería existir.

**Cómo se aplica:** `git pull` y luego la migración, o al revés. Da igual: entre
una cosa y otra la aplicación no funciona, y eso es aceptable porque no hay
nadie usándola.

## Lo que hay que vigilar

- **Borrar un vídeo que usan tres ejercicios.** La relación es `on delete set
  null` y al borrar hay que decir a cuántos afecta. Un `restrict` obligaría a
  desenganchar de uno en uno antes de borrar, que es peor.
- **Huérfanos en el cubo.** Al borrar la fila hay que borrar el fichero, como ya
  se hace con los avatares.
- **El reproductor está escrito a mano en dos sitios** (la pantalla del cliente
  y `PanelTecnica`). Al meter el fragmento se saca a un componente: si no,
  tendríamos dos reproductores y solo uno entendería los tramos.
