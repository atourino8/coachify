# Wireframes, segunda tanda (15 pantallas) · qué falta de verdad

Contraste de las quince pantallas contra el código que hay hoy. Cada punto
lleva su estado real, comprobado en el código, no de memoria.

**Leyenda:** ✓ ya está · ≈ está pero distinto · ✗ no existe

**Revisión del 19 de agosto.** Repasado elemento por elemento contra el
código, no de memoria. Aparecen marcados los puntos donde la primera versión
de este documento **se equivocó**: en tres sitios di por pendiente algo que ya
estaba hecho. Todos los errores fueron en la misma dirección —dar por falso lo
que no había comprobado—, que al menos es la dirección barata.

---

## Lo que ya coincide (y conviene saberlo antes de tocar nada)

La biblioteca de ejercicios es la parte que **más se parece ya** al wireframe:
la rejilla por grupo muscular con el recuento, el conmutador lista/rejilla, el
embudo de filtro y la vuelta desde un grupo (`← Pecho`) están implementados.
Las pantallas 4, 5 y 6 son sobre todo cambios de detalle, no de estructura.

También coinciden: el cajón con la flecha a la izquierda, los contadores en
círculo, el tope de cuatro pastillas con «+N», y las dos formas de vídeo e
imagen (subir / enlazar) de la pantalla 7.

---

## 1 · Cajón lateral

| Punto | Estado |
| --- | --- |
| Flecha de cerrar arriba a la izquierda | ✓ |
| Nombre + sitio debajo («Gimnasio Pepe») | ✓ |
| Avatar circular | ✓ (migración 0024) |
| «Pagos», no «Cobros» | ✓ ruta `/pagos` y `/cobros` redirige |
| Separadores entre destinos | ✓ **ya estaban** (`border-b` en cada fila) |
| Configuración abajo del todo, separada | ✓ **ya estaba** (`mt-auto` + `pt-8`) |

**Pantalla cerrada.** Las dos últimas filas las di por pendientes sin mirarlas.

Única diferencia viva: el wireframe pone **«Configuración»** abajo y nosotros
tenemos tres destinos ahí (Ajustes, Tu marca, Avisos) más Salir. Avisos además
está en la campana de arriba, así que en el cajón sobra.

## 2 · Inicio

**Ya estaba entera**, y me equivoqué al listarla: comprobado en el código, el
«+ Añadir» ya va pegado al título de Próximas sesiones y el «Ver otras N citas
pendientes» ya aparece cuando la lista se corta. No hay nada que hacer aquí.

## 3 · Avisos

| Punto | Estado |
| --- | --- |
| Se llaman Pagos · Citas · Revisiones | ✓ |
| Contador en círculo | ✓ |
| Leídas debajo, en gris, en la misma lista | ✓ **ya estaba** |
| Solo tres pestañas | ≈ **hay una cuarta: «Sin entreno»** |

Lo de las leídas también lo di por pendiente sin comprobarlo: ya se pintan
abajo y en gris, exactamente como el wireframe.

Queda **una decisión de producto**: la cuarta pestaña avisa de clientes a los
que no has programado nada. No está en el wireframe. O no la contempló, o
sobra.

## 4-6 · Ejercicios

**Pantalla cerrada.** Menú de tres puntos ✓, pastilla «Sin vídeo» ✓ (y de paso
salió un fallo: solo miraba `video_url`, así que un ejercicio con el vídeo
subido salía marcado como sin vídeo *y* con el icono de vídeo a la vez),
botones ordenados ✓, rejilla por grupo y vuelta con `← Pecho` ✓.

## 7 · Editar ejercicio

Coincide. Único matiz vivo: el wireframe abre las pastillas con un **⌄ al
final de la fila** y hoy es un botón que pone `+3` / «Ver menos». Mismo
comportamiento, distinta forma. No lo cambio sin que lo diga tu socio: el
`+3` dice **cuántas faltan**, y un chevrón no.

## 8-9 · Entrenamientos (hoy «Plantillas»)

| Punto | Estado |
| --- | --- |
| Se llaman «Entrenamientos» | ✓ |
| Tres puntos por fila | ✓ |
| Notas para el cliente + notas para el entrenador | ✓ (migración 0025) |
| **Buscador en la lista** | ✗ |
| **Ejercicios como acordeón plegable** | ✗ hoy están siempre abiertos |
| **Barra inferior fija: Deshacer · Cancelar · Guardar** | ✗ |

**El campo doble de notas** (hecho en la migración 0025). Y corrijo lo que
escribí aquí primero: dije que la nota de la plantilla «acaba viéndola el
cliente», y era falso. Comprobado en el código, `materializeTemplateWorkout`
copiaba el nombre y los ejercicios, **nunca las notas**. O sea que lo escrito
hasta hoy se escribió sabiendo que no lo leía nadie más, y por eso lo antiguo
se queda como nota privada del entrenador: mantener esa promesa, no romperla
de golpe en todas las plantillas a la vez.

## 10 · Modal de añadir ejercicios

Hoy es un **panel lateral** con la biblioteca y un `+` por fila que añade de
uno en uno. El wireframe es un **modal a pantalla completa** con
multiselección, contador («6 ejercicios seleccionados»), `+`/`−` por fila y
las elegidas con borde. (✗)

Es la diferencia con más trabajo detrás de las que quedan, después de la 15.

El prefijo **«Alberto - …»** queda resuelto: es el gimnasio con varios
entrenadores, cada uno con sus ejercicios y su vídeo. Anotado como anexo del
ADR-003; no se implementa hasta que existan las organizaciones.

## 11 · Clientes en rejilla

Esta es la pantalla con más cosas nuevas:

| Punto | Estado |
| --- | --- |
| Foto de perfil real | ✓ |
| Conmutador lista/rejilla | ✓ |
| Buscador «Buscar en tu cartera» | ✓ (busca nombre **y** correo) |
| Botón «Filtrar» | ≈ es la fila de etiquetas, no un desplegable |
| Etiquetas bajo el nombre | ✓ |
| Grupo bajo el nombre, «Individual» si no tiene | ✓ |
| Estado de pago como icono | ✓ con símbolo, `title` y `sr-only` |

**Dos desviaciones conscientes**, las dos explicadas al final de este
documento: la lista sigue siendo la vista predeterminada, y el punto de color
nunca viaja solo.

## 12-13 · Añadir cliente

| Punto | Estado |
| --- | --- |
| **Nombre y Apellidos separados** | ✗ hoy es un solo campo `full_name` |
| **Elegir o crear grupo al invitar** | ≈ solo se puede elegir uno existente |
| **Pantalla de confirmación con «Añadir otro»** | ✗ hoy es un mensaje verde |
| **Explicación de qué le llega al cliente** | ✗ |

Separar nombre y apellidos toca `profiles.full_name`, que se lee en catorce
sitios. La alternativa barata es pedirlos en dos campos y guardarlos unidos:
el formulario queda como el wireframe y el modelo no se mueve.

## 14 · Pendientes

Funcionalmente completa: pestaña propia, Cancelar, Reenviar y la fecha de
envío («Invitado el 14 ago 2026»). La única diferencia es de forma: el
wireframe usa **tarjetas de dos columnas** y hoy son filas. (≈)

## 15 · Ficha de cliente

| Punto | Estado |
| --- | --- |
| Foto + nombre | ✓ (y la foto se cambia pulsándola) |
| Pestaña se llama «Calendario» | ✓ |
| Botón «Programar» + Semana/Mes | ✓ |
| **Estado y grupo junto al nombre** | ✗ el estado está, el grupo no |
| Sin pestaña «Historial» | ≈ tenemos cinco, el wireframe enseña cuatro |
| **Editar series y pesos en la misma pantalla** | ✗ hoy se entra al día |
| **Barra inferior Deshacer · Cancelar · Guardar** | ✗ |

La edición en línea del día es, con diferencia, **lo más caro de las quince
pantallas**: cambia el constructor entero, necesita estado local de un
formulario grande, guardado en lote y deshacer.

---

## Lo que yo pondría en duda

**El «Deshacer» de la barra inferior.** Aparece en las pantallas 9 y 15. Un
deshacer de verdad, dentro de un formulario sin guardar, es una pila de
estados; y si solo deshace lo último, la gente espera que deshaga más. Con
«Cancelar» al lado, que ya descarta todo, puede que sobre.

**La rejilla de clientes con foto.** Se ven **siete** clientes en pantalla
frente a los doce o catorce de la lista densa. Con quince clientes es más
bonito; con sesenta, es scroll. Por eso el conmutador lista/rejilla importa
más que la rejilla en sí, y por eso la lista debería seguir siendo la
predeterminada.

---

## Estado a 19 de agosto

**Cerradas:** 1 (cajón), 2 (inicio), 3 salvo una decisión, 4-6 (ejercicios),
7 salvo un matiz de forma, 11 (clientes), 14 (funcional).

**Las quince pantallas están hechas.** Lo que faltaba se cerró el 19 de
agosto: buscador y acordeón de entrenamientos, formulario de invitar,
pendientes en tarjetas, modal de multiselección y edición en línea del día.

Para probarlo todo junto: `PRUEBA-DE-CONCEPTO.md`.

**Diferencias vivas que NO son deuda, son decisiones:**

- La lista sigue siendo la vista predeterminada de clientes.
- El punto de estado nunca viaja solo: lleva símbolo y texto.
- El `+3` de las pastillas en vez del chevrón.
- Avisos conserva la cuarta pestaña, «Sin entreno».
- El editor en línea del día no crea entrenos, ni cambia título y notas, ni
  reordena arrastrando, ni aplica plantillas: eso sigue en la pantalla del
  día, y hay un enlace que lo dice.

**Decisiones tomadas (19 de agosto):**

- La cuarta pestaña de Avisos, «Sin entreno», **se queda**. Es el único sitio
  donde se ve a quién tienes abandonado, y eso es dinero: un cliente sin
  entrenos programados es un cliente que se va.
- El `+3` de las pastillas **se queda** frente al `⌄` del wireframe: el número
  dice cuántas faltan, un chevrón solo dice que hay algo más.
- El «Deshacer» de las pantallas 9 y 15 será **deshacer de verdad, paso a
  paso**. Con consecuencias, apuntadas abajo.
- Nombre y apellidos: **dos campos en el formulario, una columna en la base**.
  Se piden separados porque pedirlo junto hace que la mitad escriba solo el
  nombre de pila; se guardan unidos porque partir `full_name` toca catorce
  sitios y no compra nada que se esté usando hoy. El día que haya que ordenar
  por apellido, los datos ya estarán recogidos en el orden correcto.

### Lo que implica el deshacer paso a paso

No es un botón, es una **pila de estados** dentro de un formulario sin
guardar, y hay que decidir qué entra en ella: quitar un ejercicio, cambiar un
peso, reordenar, editar el nombre. Lo que no entre, no se deshace, y el
usuario no tiene forma de saber cuál es cuál.

Dos reglas que conviene fijar antes de escribirlo:

1. **Cada cambio es un paso, no cada pulsación.** Escribir «90» en un campo de
   descanso son dos pulsaciones y un solo cambio; si no se agrupa, deshacer
   una vez borra el «0» y parece roto.
2. **El botón se apaga cuando no queda nada que deshacer.** Un «Deshacer» que
   siempre se puede pulsar y a veces no hace nada es peor que no tenerlo.

---

## Tercera revisión (20 de agosto) · lo que encontré mirando otra vez

Dije que estaban las quince. Repasando **contra las imágenes** y no contra mis
notas aparecieron cuatro cosas reales y seis cosméticas. Las diez, arregladas.

### Reales

1. **Reordenar en el editor del día.** El wireframe 15 pone las mismas flechas
   `^ v` que el 9 en cada tarjeta. Yo las leí como un acordeón y monté el
   acordeón, pero en el editor del día no había NI acordeón ni reordenar. Un
   día se monta en un orden que importa —lo pesado antes de fallar— y sin
   reordenar hay que borrar y volver a añadir.
2. **El grupo bajo el nombre en la ficha.** Estaba en la lista de clientes y
   no en la ficha, y el wireframe lo pone en las dos.
3. **Apellidos era opcional** y el wireframe lo marca con asterisco.
4. **El buscador de Entrenamientos decía «Buscar ejercicios».** Eso es un
   descuido del wireframe —copió el campo de la pestaña de al lado— y yo lo
   copié literal. Copiar el error no es fidelidad.

### Cosméticas

- «Reps» y «Desc. (s)» → **«Repeticiones»** y **«Descanso»**. Las abrevié yo
  para ahorrar ancho; en dos columnas caben enteras y son las palabras del
  diseñador.
- «Ejercicios · 4» → **«Ejercicios - 4»**.
- La × de quitar → **papelera**, que es lo que dibuja, en las dos pantallas.

### Lo que sigue distinto a propósito

- Los ✓ y ✕ de las peticiones van **en horizontal** y el wireframe los apila.
  Apilados son dos objetivos de pulgar de 24 px uno encima de otro, que es
  justo cómo se acepta una cita queriendo rechazarla.
- El separador de avisos dice **«Ya vistos (3)»** y no «Notificaciones
  leídas»: el número dice cuántas hay sin abrir nada.
- El grupo al invitar son un desplegable y un campo, no **dos botones
  grandes**. Los dos botones llevan a un segundo paso —elegir de una lista, o
  escribir— y aquí caben los dos a la vez.
- La barra Deshacer/Cancelar/Guardar del editor del día vive **dentro** del
  día desplegado, no pegada al fondo de la pantalla: hay un día abierto entre
  catorce filas, y una barra fija abajo no diría a cuál pertenece.

---

## Cuarta revisión (20 de agosto) · la pantalla que no miré

Toni: «en la parte de nuevo entrenamiento no veo nada del wireframe nuevo».

Tenía razón, y el fallo es de método. **Hay TRES pantallas que montan
ejercicios**, no dos:

1. El editor de entrenamientos, `/templates/[id]` — hecho en la tanda de la
   pantalla 9.
2. El editor en línea del día, dentro de la ficha — hecho en la pantalla 15.
3. **El constructor del día, `/clients/[id]/workouts/[date]`** — el que se
   abre al pulsar un día sin entreno o «crear entreno desde cero» desde la
   agenda. Ese se quedó como estaba: biblioteca en un panel lateral, sin
   deshacer, sin barra inferior y con «Reps» y «Desc. (s)».

Yo repasé las quince imágenes una por una, y por eso no lo vi: **el wireframe
no dibuja esa pantalla**. Repasar contra el dibujo encuentra lo que el dibujo
enseña; no encuentra las pantallas que hacen el mismo trabajo y no salen
dibujadas.

Ahora las tres comparten el modal, el historial, las mismas palabras y la
misma papelera. Comprobado con una tabla que cruza los diez rasgos por las
tres pantallas, en vez de mirarlas de una en una.

---

# Quinta revisión · por patrones, no por imágenes

*«Pues haz esto para todos los wireframes, porque te pedí que lo revisaras.»*

Lo de la cuarta revisión no era un despiste concreto, era el método. Repasar
imagen por imagen contesta «¿está dibujado esto?». La pregunta buena es otra:

> **¿Hacen lo mismo todas las pantallas que hacen lo mismo?**

Así que esta vez el inventario no es de imágenes. Es de **oficios**: se lista
lo que la aplicación sabe hacer —buscar en una lista, borrar una fila, avisar
de que algo se está guardando, decir quién lee un texto— y se busca **cada
sitio donde se hace ese oficio**, esté dibujado o no. Después se mira si todos
lo hacen igual.

Salieron treinta y siete pantallas y nueve oficios. La tabla completa está
abajo; primero lo que apareció al cruzarlos.

## Lo que salió

### 1. Una nota que el cliente lee y nadie decía que la leía

`workout_items.notes` sale en la pantalla del cliente, debajo del ejercicio.
Se escribía en una caja **sin etiqueta**, con el texto gris «Nota técnica
(opcional)…».

Es exactamente la regla que diste con las notas de plantilla —lo privado no se
lee, lo dirigido a él sí— pero un escalón más abajo, en el ejercicio suelto. Y
ahí no había forma de saberlo: «nota técnica» suena a apunte de profesional.
Alguien escribe «ojo, que este viene flojo de hombro» creyendo que es para él
y se lo está mandando al cliente.

Ahora la caja se llama **«Nota para el cliente»** en las tres pantallas que
montan ejercicios, con el mismo ejemplo debajo.

### 2. La misma nota, que el editor de la ficha borraba

Esto no es de estilo. Es pérdida de datos, y la encontró el cruce.

`guardarDia` —el que guarda el día desde la ficha— **borra los ejercicios y
los vuelve a insertar** con lo que le llega del formulario. El editor en línea
nunca mandó la nota, porque ni siquiera la leía.

Resultado: abrías un día desde la ficha, cambiabas una serie, guardabas, y el
«baja despacio, 3 segundos» que habías escrito en el constructor **desaparecía
de la pantalla del cliente**. Sin error, sin aviso y sin manera de saber que
había pasado.

La regla que faltaba escrita: **lo que reemplaza tiene que mandar todo lo que
reemplaza.**

### 3. En plantillas la nota ni siquiera se podía escribir

Peor y más raro: el campo existía en la base, se guardaba, se copiaba al
entreno del cliente al aplicar la plantilla y el cliente lo leía. Lo único que
faltaba era **la caja**. Los ejercicios de plantilla nacían con la nota vacía y
no había manera de rellenarla nunca.

Y es donde más sentido tiene: «baja despacio» se dice una vez en la plantilla y
vale para los cuarenta días que salgan de ella.

### 4. La biblioteca se podía buscar desde fuera y no desde dentro

Ejercicios es la lista **más larga** de la aplicación y era la única lista
grande sin buscador. Entrenamientos, más corta, sí lo tenía.

Pero la comparación buena no era con Entrenamientos: **el modal de «+ Añadir
ejercicio» busca en estos mismos ejercicios desde el primer día**. O sea que la
misma lista se podía buscar al meterla en un entreno y no se podía buscar al ir
a arreglarla.

De paso, la pastilla «Todos (48)» contaba el total **sin filtrar**: con
«mancuerna» marcado ponía 48 encima de una lista de doce. El comentario del
código avisaba de ese fallo exacto cincuenta líneas más arriba, y el fallo
estaba en la línea de al lado.

### 5. El cobro no se defendía del doble clic

Casi toda la aplicación aguanta pulsar dos veces: se guarda dos veces lo mismo
y queda lo mismo. **Registrar un cobro no.** Cada envío apunta un cobro y
adelanta un mes el «pagado hasta», así que un doble clic —o un móvil con mala
cobertura donde no pasa nada durante dos segundos— deja al cliente pagado hasta
dentro de dos meses y dos apuntes en la caja del mes.

Era el sitio donde repetir sale más caro y de los pocos sin freno.

La regla, ya escrita en el código: **los formularios que insertan una fila se
frenan; los que actualizan algo que ya existe, no.** Con eso entró también
«Añadir hueco» en Disponibilidad, que creaba martes duplicados.

### 6. Cosas pequeñas que ya solo estaban en un sitio

- La **última × de texto** para borrar (Grupos y Disponibilidad). Ahora
  papelera y menú de tres puntos, como en Ejercicios y Entrenamientos. La × ya
  solo significa «cerrar».
- El **normalizador de acentos** estaba copiado letra por letra en tres
  archivos y el buscador nuevo iba a ser el cuarto. Ahora es `lib/texto.ts`,
  con lo de la ñ escrito y decidido a propósito en vez de heredado sin mirar.
- **Buscar y no encontrar nada** en Ejercicios dejaba la pantalla en blanco,
  que parece rota. Ahora lo dice, y distingue si sobra lo escrito o sobra el
  filtro.

## Lo que se miró y NO se tocó

Porque no era incoherencia, era una regla que ya se cumplía. Se deja escrita
para que la próxima revisión no la «arregle»:

| Oficio | La regla que ya seguía |
|---|---|
| Cara de la persona | **Listas de personas** sí (clientes, miembros de un grupo, apuntados a una clase). **Listas de sucesos** no (agenda, avisos, inicio): ahí la fila es una cita, no una persona. |
| Menú de tres puntos | Dos acciones o más, menú. Una sola, botón suelto («Quitar» de un grupo o de una clase). |
| Confirmar antes de borrar | Se confirma lo que **destruye algo que escribiste** (un ejercicio, una plantilla, un grupo). No se confirma **deshacer una relación** (sacar a alguien de un grupo, quitar un hueco): se rehace en un clic. |
| Buscador | Listas que se recorren **por nombre** (clientes, entrenamientos, ejercicios). No las que se recorren **por fecha** (clases, pagos): ahí buscar por texto no es lo que se quiere. |
| Flecha de desplazamiento | Las siete filas de pestañas horizontales de la aplicación usan `FilaDesplazable`. No queda ningún `overflow-x-auto` suelto. |

## Cómo se comprobó

Un guion que cruza los treinta y siete archivos de pantalla con los nueve
oficios y saca la tabla. Los sitios donde la casilla está vacía y **debería**
estar marcada son los seis hallazgos de arriba.

No basta con la tabla: `svelte-check` no ve que un JSON se deje un campo por el
camino. Para el punto 2 hay una comprobación aparte que sigue la nota por
**las diez etapas** de su viaje —tipo, carga, alta, serialización, caja,
consulta al servidor, tipo del servidor, exposición, aceptación e inserción— y
falla si se cae en cualquiera. Es el tipo de fallo que no da error: solo
desaparece un texto.
