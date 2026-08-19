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

**Lo que queda, por coste creciente:**

1. **Detalles de entrenamientos** — buscador en la lista y acordeón de los
   ejercicios. Un rato, sin riesgo.
2. **Formulario de invitar** — nombre y apellidos, crear grupo desde el modal,
   pantalla de confirmación y la explicación de qué recibe el cliente.
3. **Tarjetas en Pendientes** — solo forma.
4. **Modal de añadir ejercicios con multiselección** — cambia una interacción
   entera.
5. **Edición en línea del día (pantalla 15)** — lo más caro con diferencia:
   estado local de un formulario grande, guardado en lote y deshacer.

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
