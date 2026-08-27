# Wireframes · tanda 3 (once pantallas)

Revisadas con el método de la quinta revisión: **por oficios, no imagen por
imagen**. Para cada cosa que dibuja el wireframe se busca dónde más se hace lo
mismo en la aplicación, y se mira si se hace igual.

Pantallas: 15 (calendario del cliente), 16 (modal Programar), 17 (editor del
día), 18 (modal Importar), 19 (ficha), 20 (progreso vacío), 21 (historial), 22
(citas), 23 (clases), 24 (mis huecos) y **7 (editar ejercicio, wireframe
antiguo)**.

---

## Resumen en una línea

Casi todo el contenido está. **Lo que falta es estructura**: la Agenda no es un
juego de pestañas, programar un día tiene dos puertas distintas en vez de una,
e importar un entrenamiento no existe.

---

## 1 · El hallazgo estructural: la Agenda no son tres pestañas

Las pantallas **22, 23 y 24** dibujan la misma fila arriba —**«Citas · Clases ·
Mis huecos»**— con la activa en negrita. Son tres vistas hermanas de una misma
sección.

Hoy son **tres rutas sueltas**: `/agenda` tiene dos enlaces (uno de ellos
etiquetado «⚙ Mis huecos», con un símbolo que no lleva ninguna otra pestaña de
la aplicación) y las otras dos vuelven con un «← Agenda». Es decir: se navega
como si Citas fuera la pantalla madre y las otras dos sus hijas, cuando el
wireframe dice que son iguales.

**Por qué importa más de lo que parece.** La aplicación ya tiene el patrón de
pestañas hermanas resuelto en dos sitios —la ficha del cliente
(Calendario/Ficha/Progreso/Técnica) y la biblioteca
(Ejercicios/Entrenamientos)—, los dos con `FilaDesplazable` y su flecha. La
Agenda hace el mismo trabajo de otra forma, que es exactamente lo que veníamos
persiguiendo.

Y en móvil se nota: desde «Mis huecos» no se ve que existan «Clases» sin volver
atrás primero.

**Propuesta:** una fila de pestañas compartida, presente en las tres, con la
activa marcada. Las rutas se quedan como están; cambia la navegación, no la
arquitectura.

---

## 2 · Programar un día: una puerta con tres caminos

**Pantalla 16.** Pulsas un día sin entreno y sale un modal: *«Elige cómo
quieres programar el entrenamiento del 19 de agosto»* → **Crear · Elegir ·
Duplicar**. Con Cancelar y Siguiente (Siguiente apagado hasta elegir).

Hoy hay **tres caminos por tres sitios distintos**:

| Camino | Dónde está hoy |
| --- | --- |
| Crear | Pulsas el día → botón «+ Añadir entreno» → te lleva al constructor |
| Elegir (plantilla) | Panel desplegable «Programar con un entrenamiento», arriba del todo |
| Duplicar | Otro panel desplegable distinto, «Duplicar un entreno» |

Son la misma pregunta —«¿qué pongo en este día?»— contestada en tres sitios que
no se ven entre sí. El wireframe los junta en el momento en que la pregunta se
hace: al tocar el día.

**Ojo con esto:** los dos paneles de hoy sirven además para lo que el modal no
hace — programar una plantilla **en varios días de golpe**. Eso no se puede
perder al unificar; el modal es para un día, los paneles son para una tanda.

---

## 3 · Importar un entrenamiento: no existe

**Pantalla 18.** En el editor del día hay un botón **«Importar»**, y al pulsarlo
avisa: *«Vas a sobreescribir el entrenamiento del 19 de agosto, ¿de dónde
quieres obtener el nuevo entrenamiento?»* → **Biblioteca · Otro entrenamiento**.

Hoy existe **la mitad**: en el constructor del día se puede aplicar una
plantilla desde un desplegable, y avisa antes de reemplazar. Lo que no existe:

- El botón **«Importar»** en la cabecera (pantalla 17), que es donde el
  wireframe lo pone.
- **«Otro entrenamiento»** como origen: copiar de otro día de este cliente o de
  otro. Eso es distinto de la plantilla y hoy solo se puede por el panel
  «Duplicar» de la pantalla anterior.

El aviso de sobrescritura sí está y está bien redactado; se puede reutilizar.

---

## 4 · Buscadores: el wireframe me corrige

Las pantallas **22 y 23** llevan buscador: «Buscar por cliente» y «Buscar por
nombre». **Ninguna de las dos lo tiene hoy.** Tampoco «Mis huecos», y ahí el
wireframe tampoco lo dibuja.

Esto merece una nota, porque me contradice: en la quinta revisión razoné que
las listas que se recorren **por fecha** —clases, pagos— no necesitan buscador,
y lo di por cerrado. El diseñador dice lo contrario en dos de ellas.

**Se hace lo que dice el wireframe.** Mi razonamiento era una inferencia; esto
es evidencia. Y la explicación de por qué me equivoqué es fácil de ver: una
lista por fecha se recorre por fecha **mientras es corta**. Con cuarenta citas
y treinta clases al mes, buscar «Nadia» es más rápido que desplazarse.

*(Queda en pie la conclusión para Pagos, que el wireframe no dibuja.)*

---

## 5 · El historial: apilado donde debería conmutar

**Pantalla 21.** Un conmutador **Entrenos | Citas** más un botón **Filtrar**, y
debajo una lista con ✓ verde o ✕ rojo por entreno.

Hoy `PanelHistorial` pinta **dos secciones apiladas**: «Entrenos anteriores» y
debajo «Citas anteriores». Otra vez el mismo oficio con dos respuestas: en
Clientes y en Ejercicios se conmuta entre dos vistas; aquí se apilan.

Con un cliente de un año, las citas quedan a un scroll enorme de distancia.

---

## 6 · Mis huecos: formulario arriba, tarjetas abajo

**Pantalla 24.** Un botón **+** arriba y **una tarjeta por día de la semana**,
cada una con su menú **⋮**.

Hoy `/availability` es un **formulario de alta permanente** ocupando la primera
pantalla y debajo la lista agrupada por día, con papelera por hueco (papelera
que puse esta misma semana).

Es el mismo cambio que ya hicimos en Grupos: el formulario deja de estar
siempre abierto y pasa a un botón. Y las acciones de la fila se van al ⋮.

**Duda real:** en el wireframe las tarjetas son **días de la semana** (Lunes,
Martes…) pero el texto de dentro pone fechas concretas y datos de clase («8/8
(+4 en espera) · Exprt Fit · Sala 3»). Eso parece contenido copiado de la
pantalla de Clases al maquetar. Lo trato como error del wireframe, no como
requisito — pero conviene confirmarlo.

---

## 7 · Detalles sueltos

**«Sin conflictos ✓» (pantalla 22).** No existe ninguna comprobación de
conflictos. Es una función nueva, no un retoque: comparar la cita propuesta
contra las demás citas y contra las clases del entrenador. Tiene sentido y no
es cara, pero hay que decidir qué cuenta como conflicto (¿solapar con una clase
que él da? ¿con otra cita? ¿un margen entre medias?).

**«Completadas» vs «Pasadas» (pantalla 23).** Existe la sección, se llama
**«Pasadas (N)»** y está **plegada**; el wireframe dice **«4 Completadas»** y
la enseña abierta. Cambio de palabra y de estado inicial. Nota: «completada» y
«pasada» no significan lo mismo si una clase se canceló.

**«Descanso» en los días vacíos (pantalla 15).** Hoy un día sin entreno enseña
**«+ Añadir entreno»**; el wireframe pone **«Descanso»** en gris, sin botón
(programar se hace tocando el día, que abre el modal del punto 2).

Aquí hay una decisión de fondo, no de estilo: **«Descanso» afirma que el
entrenador planificó descanso**, y hoy un día vacío solo significa que no hay
nada puesto. No es lo mismo, y el cliente lo lee como una instrucción.

**Progreso vacío con «Editar» (pantalla 20).** No entiendo qué edita ese botón.
La pantalla de progreso enseña gráficas derivadas de lo que el cliente
registra; no hay nada que editar ahí. Puede ser: elegir qué ejercicios se
siguen, o meter medidas a mano, o un resto de maquetar. **Preguntar.**

---

## 8 · Pantalla 7 · Editar ejercicio (el wireframe antiguo)

Revisada aparte porque Toni avisa de que no vio ese menú hecho en móvil.

**Lo que está bien:**

| Punto | Estado |
| --- | --- |
| Nombre | ✓ |
| Grupos musculares como pastillas, con `4+` y desplegable | ✓ (componente `Pastillas`) |
| Equipamientos igual, con `2+` | ✓ |
| **Subir vídeo / Enlazar vídeo** | ✓ (`CampoMedio`, y la columna `video_url` ya existía) |
| **Subir imagen / Enlazar imagen** | ✓ (`image_url` y `image_path`, con la restricción de que solo uno de los dos) |
| Descripción | ✓ |

O sea que el contenido de la pantalla 7 **sí está hecho**, y en móvil.

**La cabecera: resuelto, y era del prototipo.** El wireframe enseña encima del
formulario la fila «Ejercicios / Entrenamientos», el embudo del filtro, «+
Añadir» y el conmutador de vista. **Toni confirma que no va así.** Al editar,
la cabecera se queda solo con la vuelta atrás y el título — que es como está
hecho hoy, comprobado en `/exercises/[id]` y en `/exercises/new`.

El motivo, por si vuelve a salir: en 360 px esa barra son tres filas de mandos
antes del primer campo, y **ninguno hace nada mientras editas**. El filtro no
filtra, el conmutador no conmuta y «+ Añadir» te sacaría de lo que estás
haciendo sin guardar. Es la premisa 2 de las inamovibles.

**Único matiz vivo, y es de palabras:** el wireframe pone «← Editar ejercicio»
—flecha pegada al título— y nosotros ponemos «← Volver a ejercicios» y debajo
«Editar ejercicio». La nuestra dice a dónde vuelves; la suya no. Lo dejo así
salvo que tu socio prefiera lo otro.

**Conclusión de la pantalla 7: está hecha y en móvil.** No hay nada que
implementar.

---

## 9 · Lo que ya está y no hay que tocar

Para que la próxima revisión no lo «arregle»:

- **Pantalla 15:** conmutador Semana/Mes ✓, calendario dentro de la ficha ✓,
  entreno con nombre, nº de ejercicios y grupos musculares debajo ✓.
- **Pantalla 17:** acordeón con ^ ∨, papelera por ejercicio, «Ejercicios - N»,
  «+ Añadir ejercicio», las dos notas separadas, «Repeticiones» y «Descanso»
  enteros, y la barra **Deshacer ↩ · Cancelar · Guardar** ✓. **«Borrar»** en la
  cabecera también existe ✓.
- **Pantalla 19:** todos los campos de la ficha existen —objetivos, lesiones,
  días a la semana, nivel, altura, fecha de nacimiento, cuota, pagado hasta con
  su «actualizado el», notas privadas y etiquetas ✓.
- **Pantalla 22:** pastilla de estado, menú ⋮, **el mensaje del cliente en su
  caja** y los botones Reprogramar/Confirmar ✓. Ojo: nuestro tercer estado se
  llama **«Esperando al cliente»** donde el wireframe pone **«Propuesta»**.
- **Pantalla 23:** sala/ubicación ✓, «8/8 (+4 en espera)» ✓, agrupación por
  próximas ✓.

---

## 10 · Hecho en esta tanda

**Las tres pestañas de la Agenda.** `PestanasRuta` es ahora el único sitio
donde se pinta una fila de pestañas que son páginas, y `lib/navegacion.ts` la
única lista de cuáles son. Citas, Clases y Mis huecos la llevan las tres y cada
una se marca a sí misma; fuera el «← Agenda» y fuera el engranaje. La
biblioteca (Ejercicios/Entrenamientos) pasa por el mismo componente.

**Y de paso salieron dos cosas que no venían en los wireframes**, del tipo que
solo aparece al mirar todas las filas de pestañas a la vez:

- Había **dos colores** para «esta es la que estás viendo»: la biblioteca y los
  avisos usaban `text-accent`, la ficha del cliente `text-text`. Ahora una.
- **Ninguna fila de botones marcaba `aria-current`.** El estado activo iba solo
  en el color, que es justo lo que prohíbe DISENO.md. Un lector de pantalla no
  podía saber en qué pestaña estabas. Arreglado en las cuatro.

**Los buscadores de Citas y Clases**, con `lib/texto.ts`, que ya es de donde
busca todo lo demás. En Clases filtra las dos secciones —próximas y pasadas—
porque quien escribe el nombre de una clase suele querer la que dio. Y los dos
vacíos se distinguen: no tener citas y no encontrar ninguna tienen salidas
distintas.

**Un fallo mío cazado por el comprobador de tipos:** escribí `c.name` para
filtrar clases y la columna se llama `title`. No lo vi leyendo el diff.

## 11 · Decidido, pendiente de hacer

- **Días vacíos:** «Descanso» va en la vista del ENTRENADOR, que sabe leerlo.
  Al cliente no se le promete un descanso que nadie ha decidido.
- **Progreso → «Editar»:** es meter medidas y peso a mano. Enlaza con
  «Tracking enriquecido», que ya está en la v2 de SPEC-TRAINER.md; esto le pone
  pantalla.
- **Pantalla 7:** nada que hacer. La barra de la biblioteca encima del
  formulario era cosa del prototipo (§ 8).

---

## 12 · Cerrado el resto de la tanda

**Importar (pantallas 17 y 18).** Botón «Importar» en la cabecera del editor
del día, con Biblioteca u **Otro entrenamiento** —otro día de ese mismo
cliente, que es lo que se hace de verdad al repetir la semana—. El aviso de
sobrescritura va **antes** de elegir, no después: lo que puede costar trabajo
se dice antes de que trabajes.

Solo se ofrecen días **de ese cliente**, no de la cartera: copiar el lunes de
Nadia al martes de Lucía suena útil hasta que recuerdas que las cargas son de
Nadia. Para eso están las plantillas, que no son de nadie a propósito.

De paso se fue el desplegable suelto «Cargar entrenamiento» que vivía a media
pantalla, y con él dos funciones y un modal que ya no llamaba nadie.

**Historial (pantalla 21).** Conmutador **Entrenos | Citas** con el número de
cada uno, más el filtro: en entrenos por «Hechos / Sin registrar» —la pregunta
del entrenador es «¿me está siguiendo?»— y en citas por estado. Antes eran dos
secciones apiladas, y con un cliente de un año las citas quedaban a un scroll
enorme.

**Mis huecos (pantalla 24).** El formulario de alta ya no vive abierto: botón
«+ Nuevo hueco», como en Grupos. Y borrar se fue al menú de tres puntos.

**Las palabras:** «Pasadas» → **«Completadas»**, y «Esperando al cliente» →
**«Propuesta»**. Esta segunda importa más de lo que parece: las otras tres
pastillas nombran el **estado** de la cita —Confirmada, Pendiente, Cancelada— y
«Esperando al cliente» nombraba lo que falta por pasar, que es otra categoría.
Cuatro pastillas en la misma columna tienen que hablar de lo mismo.

**«Sin conflictos ✓» (pantalla 22).** Se calcula en el servidor. La regla, que
había que decidir y no adivinar:

> Choca si se **solapa con otra cita confirmada** suya o con una **clase suya
> publicada**. Las rechazadas y las canceladas no ocupan a nadie, y dos
> pendientes solapadas no son un conflicto todavía: confirmar una es lo que
> decide cuál gana.

**Sin margen entre medias, a propósito.** Dos citas pegadas —una acaba a las
10:00 y la otra empieza a las 10:00— no se marcan. Un margen para desplazarse
sería útil, pero es una política que nadie ha decidido y quince minutos
inventados llenarían la pantalla de avisos falsos. Si tu socio quiere margen,
es un número y una línea.

Y se dice **también cuando no hay conflicto**, porque «Sin conflictos» solo
tranquiliza si aparece siempre: si únicamente saliera el aviso malo, su
ausencia podría significar que no se ha comprobado.

**Sin migraciones.** Todo esto es interfaz y consultas sobre columnas que ya
existían.
