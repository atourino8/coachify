# ADR-004: Clases grupales con aforo, lista de espera y faltas

**Estado:** Propuesto
**Fecha:** agosto de 2026
**Decide:** Toni (producto)

---

## Contexto

Un entrenador da clases a varias personas a la vez: un HIIT de 12 plazas los
martes y jueves a las 19:00. Hoy Treno no sabe qué es eso. Sabe de **citas**
(`sessions`), que son de una persona, y de **grupos de clientes**
(`client_groups`), que son una capa de gestión para actuar sobre muchos a la
vez —invitar en masa, programarles el mismo entreno—, no algo a lo que nadie
se apunte.

Lo que falta es una tercera cosa: un **evento con aforo** que el entrenador
publica y al que sus clientes se apuntan solos hasta que se llena.

### Las cuatro decisiones que tomó Toni

1. La clase la ven **todos sus clientes**, y al crearla puede restringirla a
   uno de los grupos que ya existen.
2. Cada clase es **un día y una hora**. Puede crear muchas de una vez
   —«martes y jueves, del 1 al 30»—, pero no hay recurrencia de verdad:
   editar una no toca a las demás.
3. Al llenarse se marca **completa** y se puede entrar en **lista de espera**.
4. Apuntarse **da la plaza directamente**. El entrenador puede sacar a alguien.

Y una quinta que salió sola: **cancelar tarde cuenta como falta**. Menos de
dos días de aviso y queda registrado.

---

## Decisión 1 · Tabla nueva, no `sessions` con un campo más

`sessions.client_id` es `not null`, y de ahí cuelga casi todo: las dos
políticas RLS de la tabla, los índices `sessions_client_starts_idx`, la
agenda del entrenador, las citas del cliente, el ligado cita↔entreno.

Meter las clases ahí obliga a hacer `client_id` nullable, y en ese momento
**cada consulta que hoy asume que una cita tiene dueño pasa a tener un caso
nulo que nadie ha escrito**. La agenda dejaría de ser una lista de citas para
ser una lista de dos cosas distintas que se parecen.

Así que `group_classes` es una tabla nueva, y `class_bookings` es la
pertenencia. Es exactamente la misma forma que `client_groups` +
`client_group_members`, que ya funciona.

**Lo que se pierde:** la agenda tendrá que juntar dos consultas para pintar el
día completo del entrenador. Es un `union` en el servidor, no un problema de
modelo.

---

## Decisión 2 · Las plazas se cuentan en la base, no en el servidor

Este es el punto que de verdad importa, y es el único sitio donde este
proyecto tiene una condición de carrera real.

Lo obvio sería, en la acción de servidor: contar apuntados, ¿caben?, insertar.
Entre el contar y el insertar pasan milisegundos, y **en una clase que se abre
a una hora fija ese es justo el momento en que todo el mundo pulsa a la vez**.
Dos personas leen «11 de 12», las dos insertan, la clase acaba con 13.

No es un caso teórico: es el caso normal de este producto.

La solución no es un `check`, porque una restricción no puede contar filas de
otra tabla. Es hacer la comprobación y la inserción **en la misma transacción y
con la fila de la clase bloqueada**:

```sql
select capacity into aforo
  from public.group_classes
 where id = p_class_id
   for update;            -- ← aquí se serializa todo lo demás
```

Todo el que llegue después espera a que el primero termine, y entonces lee el
número ya actualizado. Va dentro de una función `SECURITY DEFINER`, que es el
mismo patrón que la migración 0002 introdujo para romper la recursión de RLS.

**Consecuencia:** apuntarse y cancelar **no son un `insert` y un `update`**
desde el código de la aplicación, son dos llamadas a función (`rpc`). Si
alguien añade más adelante un `insert` directo sobre `class_bookings`, se salta
el aforo.

Por eso la puerta está cerrada por dos sitios: **no hay política de INSERT** en
la RLS, y el permiso de INSERT está **revocado** a `anon` y `authenticated`
(migración 0023). El segundo cerrojo hizo falta porque Supabase concede `all`
por defecto a toda tabla nueva del esquema `public`, así que escribir un
`grant select, update, delete` no quita el INSERT que ya venía dado: conceder
de menos no retira nada.

La única excepción es el guion de sembrado, que usa la clave de servicio
porque `book_class()` mira `auth.uid()` y ahí no hay sesión.

---

## Decisión 3 · La lista de espera es la misma tabla, con un estado

Una tabla aparte de «los que esperan» significa mover filas de un lado a otro
cada vez que alguien cancela, y dos sitios donde mirar para responder «¿estoy
apuntado?».

Es una columna `status` con tres valores: `seat`, `waitlist`, `cancelled`. El
orden de la cola es `created_at`: el primero que pidió es el primero que
entra. Y **el ascenso ocurre dentro de la misma transacción de la cancelación**,
no en un trabajo aparte: quien cancela paga el coste de promover al siguiente,
que son unos milisegundos, y a cambio no existe el estado intermedio de «hay
hueco pero nadie lo ha ocupado todavía».

**Lo que no hace:** avisar al que asciende. Los avisos de Treno se derivan al
cargar la pantalla (migración 0018), no se envían. El que entra desde la lista
lo verá la próxima vez que abra Citas, y lo verá bien —porque el aviso se
deriva del estado real—, pero no le llega un correo. Cuando haya envío de
notificaciones, este es el primer sitio donde ponerlo.

---

## Decisión 4 · Una falta se deriva, no se lleva en un contador

La tentación es `client_info.strikes`, un entero que sube. Se descarta por dos
razones:

1. **Un contador se desincroniza y no sabe explicarse.** Si un cliente ve
   «tienes 3 faltas» y no está de acuerdo, no hay nada que enseñarle. Derivado,
   siempre se puede responder *qué* clases fueron.
2. **La regla va a cambiar.** Hoy son dos días; mañana serán 24 horas, o
   dependerá del entrenador. Con un contador, cambiar la regla no cambia el
   pasado: quedan sumadas faltas calculadas con una norma que ya no existe.
   Derivado, se recalcula solo.

Una falta es una fila de `class_bookings` con:

```
status = 'cancelled'  y  had_seat  y  cancelled_at > starts_at - interval '2 days'
```

`cancelled_at` y `had_seat` sí se guardan, porque **son hechos**, no
opiniones: pasaron en un instante concreto y se pierden en cuanto la fila
cambia de estado. Lo que se deriva es la interpretación.

`had_seat` está porque soltar una plaza a última hora deja a alguien fuera,
mientras que salirse de la lista de espera no le quita nada a nadie. Solo lo
primero es una falta. Y si es el entrenador quien saca a alguien, tampoco
cuenta: la decisión no fue del cliente.

**Consecuencia:** las faltas no caducan, y deberían. Un año son doce faltas
para alguien que va a todo. De momento se cuentan **las de los últimos tres
meses**, y esa ventana vive en una constante del código, en un solo sitio.

### Qué hace una falta

Nada automático. **Se ve, y ya.** El entrenador la ve junto al nombre en la
clase y en la ficha; el cliente ve las suyas antes de cancelar.

Bloquear a alguien por acumular faltas es una decisión de negocio del
entrenador, no del programa, y equivocarse ahí —dejar fuera de la clase a un
cliente que paga— es mucho más caro que no bloquear a nadie. Si más adelante
hace falta, la información ya está.

---

## Lo que este ADR deja fuera a propósito

- **Cobrar por clase.** Hoy la cuota es mensual (ADR-002). Un bono de diez
  clases es otro modelo de cobro y no toca todavía.
- **Recurrencia real.** Se genera en lote y cada clase es independiente.
  Cambiar la hora de «todos los martes» es editar cada una.
- **Aforo por encima del límite.** El entrenador no puede meter a nadie a la
  fuerza en una clase llena; tendría que ampliar el aforo, que sí puede.
- **Que una clase lleve entreno asignado.** Una cita sí puede (`workout_id`),
  pero un entreno hoy pertenece a un cliente y una clase es de doce. La
  columna ni siquiera se crea: añadirla cuando exista el concepto es una
  migración de una línea; quitarla cuando resulte que no encajaba, no.

---

## Cómo se sabrá si esto está bien

Una clase se llena de verdad —doce personas pulsando a la vez— y quedan doce
plazas ocupadas, ni once ni trece. Es lo único de esta característica que no se
puede comprobar leyendo el código.
