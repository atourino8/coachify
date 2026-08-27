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

**Lo que hay que mirar de verdad es la cabecera.** El wireframe enseña, uno
encima de otro:

1. La fila de pestañas «Ejercicios · Entrenamientos»
2. La barra de filtro + «+ Añadir» + conmutador de vista
3. Y **debajo** el «← Editar ejercicio»

Es decir, la pantalla de edición aparece **dentro** de la biblioteca, con los
controles de la lista todavía visibles arriba. Eso en móvil son tres filas de
controles antes de llegar al primer campo del formulario —en una pantalla de
360 px de ancho, media pantalla gastada en cosas que no sirven mientras editas:
el filtro no filtra nada, el conmutador de vista no conmuta nada y «+ Añadir»
te sacaría de lo que estás haciendo sin guardar.

**Sospecho que es una convención del prototipo y no una intención** —al maquetar
en Figma se reaprovecha la cabecera—, pero hay que confirmarlo, porque si es
intencionado es un cambio grande y en la dirección contraria a la premisa 2
(«tap y swipe, no formularios»).

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
