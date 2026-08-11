# Análisis de los wireframes móviles (entrenador)

**Fecha:** agosto de 2026
**Origen:** siete pantallas de Figma en blanco y negro, arquitectura de la
información. Sin color y sin tipografía definitiva a propósito.

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

**b. Imagen del ejercicio.** No existe la columna. Y "Subir imagen" no es una
columna: es un cubo de almacenamiento, políticas de acceso, límite de tamaño,
recorte y miniatura.

**c. Subir vídeo, no solo enlazarlo.** Hoy `video_url` es un enlace (el de
prueba es de YouTube). El único vídeo que se sube hoy es el que manda el
cliente con su técnica, a un cubo privado. Que el entrenador suba los suyos es
almacenamiento nuevo, y es justo lo que hay pendiente de medir en las pruebas
de rendimiento.

**d. Notificaciones. Cero líneas escritas hoy.** La pantalla 3 necesita: una
tabla con tipo, entidad relacionada y marca de leída; algo que las genere
cuando pasan cosas; contadores por pestaña; y una regla de cuándo se marcan
como leídas. Es, con diferencia, la pantalla más cara de las siete.

Y la pestaña **"Revisiones (11)"** implica que un vídeo de técnica tiene
estado —pendiente, revisado— que hoy tampoco tiene: hay un comentario del
entrenador, y su ausencia es lo único que indica que está sin revisar.

**e. "Gimnasio Pepe".** Aparece bajo el nombre en el cajón y también en cada
tarjeta de sesión. Son dos cosas distintas y conviene saber cuál es (ver §5).
Si es la organización del entrenador, esto es la ADR-003 entera.

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

## 5. Preguntas

1. **¿"Gimnasio Pepe" es el centro donde trabaja el entrenador, o el sitio
   donde es la sesión?** En el cajón parece organización; en las tarjetas de
   cita parece ubicación. Si es lo primero, esto es la ADR-003 y hay que
   ordenarlo antes.

2. **Grupos musculares y equipamiento: ¿múltiples de verdad?** Es la decisión
   que más condiciona todo lo demás.

3. **"Rutinas" en el cajón, ¿engloba Ejercicios y Entrenamientos?** No hay una
   entrada aparte para la biblioteca.

4. **¿Qué genera una notificación?** Es lo que decide si la pantalla 3 son dos
   días o dos semanas. Y en concreto: ¿"Revisiones" es un vídeo de técnica sin
   comentar, o hace falta un estado explícito?

5. **El inicio pierde "Técnica por corregir" y el estado de cobros.** Hoy
   están ahí y fue una petición explícita. ¿Se van a las notificaciones, o
   vuelven al inicio?

6. **¿"Subir vídeo" desde el móvil del entrenador es un requisito, o basta con
   enlazar?** Cambia el trabajo y el coste de almacenamiento.

---

## 6. Por dónde empezaría

1. Decidir el punto 2 (múltiples). Bloquea las cinco pantallas de biblioteca.
2. Cajón lateral. Barato, arregla lo peor del móvil actual y es independiente
   de todo lo demás.
3. Reordenar el inicio con lo que ya hay, sin datos nuevos.
4. Rehacer la biblioteca con la vista por grupos.
5. Notificaciones, al final y con su propia estimación.

Lo de color y tipografía va en paralelo, pero conviene cerrar §4 antes de que
se dibujen más pantallas.
