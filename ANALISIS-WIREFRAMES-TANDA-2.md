# Wireframes, segunda tanda (15 pantallas) · qué falta de verdad

Contraste de las quince pantallas contra el código que hay hoy. Cada punto
lleva su estado real, comprobado en el código, no de memoria.

**Leyenda:** ✓ ya está · ≈ está pero distinto · ✗ no existe

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
| **Avatar circular con la inicial** | ✗ el cajón no lo tiene |
| **«Pagos», no «Cobros»** | ≈ hoy pone Cobros en todas partes |
| Separadores entre destinos | ✗ |
| Configuración abajo del todo, separada | ≈ hoy va en el mismo bloque |

**Lo caro aquí no es el avatar, es el nombre.** «Cobros» aparece en la
navegación, en la página, en el título y en tres textos. Renombrar a «Pagos»
es tocar todo eso a la vez o quedarse con dos nombres para lo mismo, que es
peor que cualquiera de los dos.

## 2 · Inicio

**Ya estaba entera**, y me equivoqué al listarla: comprobado en el código, el
«+ Añadir» ya va pegado al título de Próximas sesiones y el «Ver otras N citas
pendientes» ya aparece cuando la lista se corta. No hay nada que hacer aquí.

## 3 · Avisos

| Punto | Estado |
| --- | --- |
| Tres pestañas: Pagos · Citas · Revisiones | ≈ **hoy hay cuatro** |
| Contador en círculo superíndice | ✓ |
| **Leídas debajo, en la misma lista** | ≈ hoy están en otra pestaña |

La cuarta pestaña de hoy es **«sin entreno»** (clientes a los que no les has
programado nada). No está en el wireframe. Hay que decidir si se quita, se
funde con otra o el wireframe simplemente no la contempló.

## 4-6 · Ejercicios

Casi todo hecho. Falta:

- **Menú de tres puntos por fila** (✗). Hoy se entra al ejercicio para
  editar o borrar.
- La pastilla **«Sin video»** como aviso en la fila (✗ hoy se ve el grupo
  muscular, no si le falta vídeo).
- «+ Añadir» y el embudo **a la izquierda**, conmutador a la derecha (≈ orden
  distinto hoy).

## 7 · Editar ejercicio

Coincide, con un matiz: las pastillas llevan un **desplegable (⌄) al final de
la fila** en vez del «Ver más» de hoy. Es el mismo comportamiento con otra
forma.

## 8-9 · Entrenamientos (hoy «Plantillas»)

| Punto | Estado |
| --- | --- |
| Se llaman «Entrenamientos» | ✓ en la pestaña, ≈ en el resto de textos |
| Buscador propio | ✗ |
| Tres puntos por fila | ✗ |
| **Notas para el cliente + notas para el entrenador** | ≈ **hoy hay UNA sola nota** |
| Ejercicios como acordeón plegable | ✗ hoy están siempre abiertos |
| Barra inferior fija: Deshacer · Cancelar · Guardar | ✗ |

**El campo doble de notas es un cambio de modelo, no de pantalla.** Hoy
`workout_templates.notes` es un único texto que, cuando se aplica a un cliente,
acaba viéndolo él. Separarlo obliga a decidir qué pasa con lo ya escrito: se
queda como nota del cliente (visible) o como nota del entrenador (privada).
Elegir mal expone a los clientes notas que no eran para ellos.

## 10 · Modal de añadir ejercicios

Multiselección con contador («6 ejercicios seleccionados»), + y − por fila, y
las elegidas con borde. Hoy se añaden **de uno en uno**. (✗)

El prefijo **«Alberto - Extensión de cuádriceps»** no sé qué es. Puede ser el
autor del ejercicio (marketplace del backlog), el entrenador dentro de un
gimnasio (ADR-003) o solo relleno del wireframe. Cambia bastante el modelo.

## 11 · Clientes en rejilla

Esta es la pantalla con más cosas nuevas:

| Punto | Estado |
| --- | --- |
| **Foto de perfil real** | ✗ `profiles.avatar_url` **existe desde la migración 0001 y no la usa nadie** |
| Conmutador lista/rejilla | ✗ solo hay lista |
| Buscador «Buscar en tu cartera» | ✗ |
| Botón «Filtrar» | ≈ hoy es la fila de etiquetas que hicimos |
| Etiquetas bajo el nombre («VIP \| Mañanas») | ✓ |
| **Grupo bajo el nombre** («Consultora de turno» / «Individual») | ✗ |
| **Estado de pago como icono de color** | ≈ hoy es una pastilla de texto |

El icono de estado (✓ verde, ⏰ ámbar, ⊗ rojo) **no puede ir solo**: sin texto,
tres colores no dicen a nadie qué significan, y a quien no distingue rojo de
verde no le dicen nada en absoluto. Va con texto o con `aria-label` y `title`,
y probablemente con las dos cosas.

## 12-13 · Añadir cliente

| Punto | Estado |
| --- | --- |
| **Nombre y Apellidos separados** | ≈ hoy es un solo campo `full_name` |
| Elegir o crear grupo al invitar | ≈ hoy solo se puede elegir uno existente |
| Pantalla de confirmación con «Añadir otro» | ✗ hoy es un mensaje verde y ya |
| Explicación de qué le llega al cliente | ✗ |

Separar nombre y apellidos toca `profiles.full_name`, que se lee en **catorce
sitios**. La alternativa barata es pedirlos en dos campos y guardarlos unidos.

## 14 · Pendientes

Hoy es una pestaña que ya existe con Cancelar y Reenviar. Diferencias: **en
tarjetas de dos columnas** en vez de filas, y con la fecha de envío. (≈)

## 15 · Ficha de cliente

| Punto | Estado |
| --- | --- |
| Foto + nombre + estado + grupo | ✗ (lo mismo que la 11) |
| Pestaña se llama **«Calendario»** | ≈ hoy «Entrenos» |
| Sin pestaña «Historial» | ≈ hoy hay cinco pestañas, el wireframe enseña cuatro |
| Botón «Programar» + Semana/Mes | ✓ |
| **Editar series y pesos en la misma pantalla** | ✗ hoy se entra al día |
| Barra inferior Deshacer · Cancelar · Guardar | ✗ |

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
