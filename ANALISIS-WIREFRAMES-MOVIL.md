# Análisis de los wireframes móviles (entrenador)

**Fecha:** agosto de 2026
**Origen:** siete pantallas de Figma en blanco y negro, arquitectura de la
información. Sin color y sin tipografía definitiva a propósito.
**Estado:** las seis preguntas de §5 están respondidas. Dos respuestas
abarataron el lote de forma notable: las notificaciones se derivan de lo que
ya hay (§2.d) y "Gimnasio Pepe" resultó ser una columna que ya existe (§2.e).

Este documento está escrito para que lo lea también quien hizo los
wireframes. Separa tres cosas que se confunden mucho al estimar: lo que es
cambiar una plantilla, lo que toca el sistema de diseño, y lo que exige datos
que hoy no existen. La tercera categoría es la que rompe los plazos.

---

## 1. Lo que resuelve bien

**El menú lateral arregla un problema real.** Hoy la navegación del
entrenador son cinco enlaces más "Mi marca" en una fila con desplazamiento
horizontal en el móvil. Es lo peor que hay ahora mismo en pantalla pequeña. Un
cajón con seis destinos y la configuración abajo lo resuelve, y además deja
sitio para crecer sin volver a rediseñar la cabecera.

**El avatar con la inicial encaja con lo que ya está construido.** La marca
por entrenador (migración 0014) ya pinta un cuadro con su inicial y su color,
con la tinta calculada para que se lea encima. Ese componente ya existe:
`.marca-cuadro`.

**Poner la agenda primero es una decisión defendible.** Hoy el inicio tiene
seis bloques y el wireframe deja dos. Menos es mejor, y para un entrenador
presencial la pregunta al abrir la aplicación sí es "¿a quién veo hoy?".

**Resolver la petición desde la propia tarjeta**, con el ✓ y la ✕ ahí mismo,
ahorra un viaje a otra pantalla. Es lo correcto.

**Separar la biblioteca por grupo muscular con cuentas** (Pecho 24, Core 32)
es mejor que la lista plana de casi cincuenta que hay hoy.

---

## 2. Lo que cuesta, por capas

### Capa 1 · Solo plantilla (días)

| Cambio                                       | Nota                                              |
| -------------------------------------------- | ------------------------------------------------- |
| Cajón lateral con hamburguesa                 | Sustituye la fila con desplazamiento actual        |
| Conmutador lista / rejilla                    | Un estado y dos formas de pintar lo mismo          |
| Menú de tres puntos por fila                  | Ver §3.4: choca con algo que ya existe             |
| Pestañas Ejercicios / Entrenamientos          | Ya existen                                         |
| Volver a nombrar Cobros → Pagos, Biblioteca → Rutinas | Decisión, no trabajo                       |

### Capa 2 · Toca el sistema de diseño (semana)

**Las pastillas mezclan dos cosas distintas.** En las pantallas 4 y 6, "Pecho"
y "Sin video" van con la misma forma y el mismo gris. Una es una categoría y
la otra es un aviso de que falta algo. Hoy la aplicación pinta "sin vídeo" en
ámbar justo por eso. Si los dos se ven igual, no se lee ninguno.

**La jerarquía de la cabecera se repite y come pantalla.** En la pantalla 7
(editar ejercicio) hay, de arriba abajo: logotipo, campana, hamburguesa,
pestañas, filtro, "+ Añadir", conmutador de vista, y solo entonces "← Editar
ejercicio". Son siete controles de navegación antes del primer campo del
formulario, y ocupan cerca del 40 % del alto útil en un móvil. Editando no se
navega: esa fila debería desaparecer.

### Capa 3 · Datos que hoy no existen (esto es lo caro)

**a. Grupos musculares y equipamiento múltiples.** En la pantalla 7 se ven
varias pastillas y un "4+" y un "2+". Hoy son una sola columna de texto cada
una, con una restricción de valor único:

```sql
muscle_group text check (muscle_group in ('chest','back','legs',…)),
equipment    text check (equipment    in ('barbell','dumbbell',…)),
```

Pasar a múltiple es migración, y arrastra cuatro sitios: el filtro de la
biblioteca, la reclasificación en lote recién construida, el buscador del
constructor de entrenos, y las cuentas de la pantalla 5.

**Es la decisión estructural de todo el lote.** Conviene tomarla antes de
tocar nada más, porque cambiar de una a muchas después de construir las
pantallas es rehacerlas.

**b y c. Vídeo e imagen, cada uno subido o enlazado.**

Decidido: las cuatro combinaciones. Vídeo subido desde móvil o PC, o vídeo
enlazado de YouTube. Imagen subida, o imagen enlazada. Se le **recomienda**
subir, pero no se le obliga.

Es la decisión correcta y por un motivo concreto: un entrenador que ya tiene
sus vídeos en YouTube no va a resubirlos para probar la aplicación. Obligarle
a subir es una barrera de entrada en el peor momento posible, el primer día.

Lo que hay hoy: `video_url` es un enlace, y lo único que se sube es el vídeo
de técnica que manda el cliente, a un cubo privado. No hay columna de imagen.

Lo que hace falta:

- Columnas `image_url` y, para lo subido, saber si el fichero es nuestro (para
  poder borrarlo cuando se borre el ejercicio, como ya se hace con los vídeos
  de técnica).
- Un cubo para el material del entrenador. **Distinto del de técnica**: aquel
  es privado y personal de cada cliente; este es material del entrenador que
  ven todos sus clientes. Mezclarlos complicaría las políticas de acceso de
  los dos.
- Reutilizar la subida con progreso real que ya existe (`uploadWithProgress`).
- Límites de tamaño y duración, que hoy no hay para el lado del entrenador.

**Sobre enlazar: lo que ya está bien hecho y hay que mantener.** El código
actual no mete la URL en un `iframe`. Extrae el identificador con una
expresión regular y construye `youtube.com/embed/{id}`. Eso es lo que impide
que alguien guarde una dirección cualquiera y acabe incrustada en la pantalla
de un cliente. Al añadir más proveedores, mismo patrón: lista blanca y
reconstruir la URL, nunca pasarla tal cual.

**El argumento de la imagen es el mejor de todo el lote.** No es un relleno
para que la ficha no esté vacía mientras se crea —que también—, es que
**quien ya ha visto el vídeo tres veces no necesita el vídeo, necesita
acordarse de la posición**. Una foto en el gimnasio, con prisa y el móvil en
la mano, es más rápida que cargar y buscar el segundo 12 de un vídeo. Eso
tiene una consecuencia de diseño: la imagen no es la miniatura del vídeo, es
un contenido con su propio valor, y en la pantalla del cliente debería poder
verse **sin** entrar al vídeo.

**d. Notificaciones. Mucho más baratas de lo que parecían.**

Mi primera lectura fue que hacía falta un sistema de notificaciones completo:
tabla de eventos, algo que los genere, contadores. Con la respuesta de que
"las notificaciones son los mensajes que ya tenemos —aprobar citas,
correcciones de sesiones online, pagos—", eso se cae.

**No hay que generar nada: las tres listas ya se pueden consultar.**

| Pestaña     | De dónde sale hoy                                          |
| ----------- | ---------------------------------------------------------- |
| Citas       | `sessions` con `status = 'requested'`                      |
| Pagos       | `client_info.paid_until` vencido (ya se calcula en Cobros)  |
| Revisiones  | `technique_videos` con `coach_comment` a null              |

Lo único que no existe es el **estado de leída**, que es lo que pide el
separador "Notificaciones leídas" de la pantalla 3. Y para eso no hace falta
duplicar los eventos en otra tabla: basta con guardar marcas de lectura
—qué entidad y cuándo la vio— y cruzarlas al consultar.

Es la diferencia entre una tabla de apoyo y un subsistema. Deja de ser la
pantalla más cara de las siete.

**Aviso que sí queda en pie:** derivar en vez de generar significa que una
notificación **desaparece cuando el hecho deja de ser cierto**. Si el
entrenador aprueba una cita, esa notificación se va aunque no la hubiera
leído. Es lo correcto para una bandeja de "cosas por hacer", pero no sirve
como historial. Si algún día se quiere "te llegó esto el martes", entonces sí
hará falta la tabla de eventos.

**e. "Gimnasio Pepe": no es la ADR-003, y además ya está resuelto.**

Con la respuesta —"es una forma organizativa, habrá entrenadores con dos
gimnasios al día o que se muevan"— esto no es una organización con varios
entrenadores dentro. Es **dónde ocurre la sesión**.

Y eso ya existe: `sessions.location` es una columna de texto desde la
migración 0003, hoy sin usar en la interfaz. Cero migración para que la
tarjeta de cita muestre el sitio.

Lo único que falta es no obligarle a escribirlo cada vez. La forma barata es
proponerle los sitios que ya ha usado, sacados de los valores distintos de
`location` de sus propias citas. Sin tabla nueva, y la lista se mantiene sola.

---

## 3. Problemas concretos

### 3.1 El ✓ y la ✕ están a un pulgar de distancia

En la pantalla 2, aceptar y rechazar una petición son dos botones pequeños,
uno encima del otro, en el borde derecho. Con el pulgar, en el gimnasio, con
prisa, rechazar una cita queriendo aceptarla va a pasar. Y rechazar le llega
al cliente.

Tres salidas, por orden de preferencia: separarlos y dar más área a aceptar
(que es el caso frecuente); dejar rechazar dentro del detalle; o mantenerlos y
añadir un "deshacer" durante unos segundos.

### 3.2 "Ver otras 25 citas pendientes"

Si el diseño da por hecho que hay veinticinco peticiones sin responder, o el
entrenador está desbordado o algo no funciona antes. Como número de ejemplo
está bien elegido —enseña que la lista tiene que estar acotada— pero conviene
que el diseño empuje a vaciarlo, no a convivir con ello.

### 3.3 El carrusel horizontal esconde contenido

"Próximas sesiones" corta la tercera tarjeta. En móvil funciona; en escritorio
queda raro, y en general el desplazamiento horizontal es contenido que mucha
gente no descubre. Con dos tarjetas completas y el enlace "Ver todas" que ya
está debajo se pierde poco.

### 3.4 Los tres puntos chocan con las casillas

Acabamos de añadir selección múltiple en la biblioteca: casillas, marcar
todos, y acciones en lote para archivar, borrar y reclasificar. El wireframe
pone en su lugar un menú de tres puntos por fila.

No es incompatible —tres puntos para una fila, casillas para varias— pero
tener las dos cosas a la vez en una fila estrecha se llena. Hay que decidir
cuál manda en móvil.

### 3.5 Las cuentas por grupo no van a cuadrar

Si un ejercicio puede ser "Pecho" y "Hombro" a la vez (§2.a), la suma de las
tarjetas de la pantalla 5 será mayor que el total de ejercicios. No es un
error, pero el usuario lo nota y desconfía. Hay que decidir si la cuenta es de
pertenencias o de ejercicios únicos, y decirlo en la interfaz.

### 3.6 El logotipo pone "Chfy"

Viene de Coachify. Ahora es **Treno**.

---

## 4. El choque grande: la maqueta es blanca y la aplicación es oscura

Esto conviene resolverlo **antes** de que se dibujen más pantallas.

La dirección visual vigente es "grafito cálido": fondo casi negro con
temperatura. No fue un capricho. La dirección anterior era papel blanco y se
descartó por dos motivos que están en `DISENO.md` §2:

1. El blanco les chirriaba a entrenadores reales, en las tres superficies que
   vieron (panel, portada y pantalla del cliente). Lo encontraban demasiado
   sobrio.
2. El papel evoca cuaderno, y el producto promete justo lo contrario: dejar el
   Excel y la libreta.

Un wireframe en blanco y negro es lo normal y no contradice nada. Pero si el
paso siguiente es maquetar en claro, el resultado va a chocar de frente con
una decisión ya tomada con feedback de usuarios detrás.

**Lo que hace falta de un diseñador para ir rápido está escrito en
`DISENO.md` §6**: tokens de color con nombre y función, escala tipográfica,
escala de espaciado y dos o tres pantallas completas de referencia. Con eso,
llevarlo a código es mecánico.

Y hay una restricción que conviene conocer desde el principio: **el acento no
es nuestro, es de cada entrenador.** Puede ser azul marino, amarillo o un
degradado. El sistema corrige la luminosidad para que se lea, pero el diseño
no puede depender de que el acento sea de un tono concreto.

---

## 5. Preguntas, ya respondidas

1. **"Gimnasio Pepe"** → forma organizativa: dónde ocurre la sesión. Hay
   entrenadores con dos gimnasios al día o que se mueven. **No es la
   ADR-003**, y `sessions.location` ya existe (§2.e).
2. **Grupos musculares y equipamiento múltiples** → sí, necesariamente.
3. **"Rutinas"** → engloba Ejercicios y Entrenamientos, para simplificar.
4. **Notificaciones** → lo que ya tenemos: citas por aprobar, correcciones de
   técnica y pagos. Se derivan, no se generan (§2.d).
5. **El inicio pierde "Técnica por corregir" y el estado de cobros** → se
   acepta el criterio del diseñador. Se van a notificaciones.
6. **Vídeo e imagen** → subidos o enlazados, las cuatro combinaciones (§2.b).

### Lo que hay que vigilar de la decisión 5

Es la decisión con más riesgo de las seis, y conviene decirlo aunque se
acepte.

Hoy "Técnica por corregir" y el estado de cobros están en el inicio porque se
pidieron expresamente: que el inicio tuviera acciones directas y no fuera una
pantalla de bienvenida. Moverlos a notificaciones los mete detrás de una
campana, y una campana solo funciona si el entrenador la mira.

No es motivo para no hacerlo —concentrar los pendientes en un sitio es más
limpio que repartirlos por el inicio—, pero sí para **medirlo**: si tras el
cambio los vídeos tardan más en corregirse, la campana no está funcionando y
hay que devolver un aviso al inicio. Se sabe mirando el tiempo entre que un
cliente sube un vídeo y el entrenador lo comenta.

---

## 6. Orden de trabajo · estado

| # | Qué                                        | Estado                        |
| - | ------------------------------------------ | ----------------------------- |
| 1 | Grupos musculares y material múltiples      | Hecho · migración 0016        |
| 2 | Cajón lateral en móvil                      | Hecho                         |
| 3 | Biblioteca por grupos + lista/rejilla       | Hecho                         |
| 4 | Vídeo e imagen, subidos o enlazados         | Hecho · migración 0017        |
| 5 | Inicio: sesiones y peticiones               | Hecho                         |
| 6 | Avisos derivados, con campana               | Hecho · migración 0018        |
| — | Menú de cuenta en escritorio                | Hecho (no estaba en el lote)  |
| — | Vocabulario propio del entrenador           | Hecho · migración 0019        |

### Donde nos separamos del wireframe, y por qué

1. **El ✓ y la ✕ de las peticiones no van pegados.** Aceptar es lo que se hace
   casi siempre y rechazar le llega al cliente; a ocho píxeles, con el pulgar
   y con prisa, el fallo es cuestión de tiempo. Aceptar es grande y lleva el
   color, rechazar es pequeño y va aparte, y hay «deshacer».
2. **No hay menú de tres puntos por fila en la biblioteca.** Con las casillas
   ya se puede actuar sobre uno marcándolo, y el enlace de la fila lleva a la
   ficha. Meter además un menú en una fila estrecha de móvil es llenarla para
   duplicar caminos que ya existen.
3. **La sección sigue llamándose «Cobros» y no «Pagos».** Para un autónomo
   español, cobros es el dinero que entra y pagos el que sale, y esa pantalla
   exporta a la gestoría.
4. **La flecha de cerrar el cajón va a la izquierda.** El botón que lo abre se
   queda visible por encima del panel —es la única forma de cerrar que no
   depende de JavaScript— así que a la derecha se solapaban.
5. **Se añadió un cuarto tipo de aviso: clientes sin entreno.** Es el único
   que avisa de algo que NO ha pasado, y así el inicio puede quedarse como el
   wireframe sin perder nada.

---

## 7. Lo que queda

**Cerrar §4: color y tipografía.** Es lo único que bloquea de verdad. Mientras
no esté, cada pantalla nueva se hace con la paleta actual y habrá que repasarla
después. Y sigue pendiente la incoherencia tipográfica de siempre: la portada
ya no usa serif y la aplicación sí.

**La aplicación del cliente no se ha tocado.** Todo este lote era la del
entrenador. Su cliente ve hoy la marca de su entrenador y la imagen del
ejercicio, pero la arquitectura de sus tres pantallas es la de antes.

**Medir la decisión 5.** Se sacaron «técnica por corregir» y el estado de
cobros del inicio. Si tras el cambio los vídeos tardan más en corregirse, la
campana no está funcionando y hay que devolver un aviso al inicio. Se sabe
mirando el tiempo entre que un cliente sube un vídeo y el entrenador lo
comenta.
