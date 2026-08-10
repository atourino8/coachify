# ADR-003: Gimnasios con varios entrenadores

**Estado:** Propuesto
**Fecha:** agosto de 2026
**Decide:** Toni (producto), tras hablar con 2-3 gimnasios

---

## Contexto

Un gimnasio con cuatro entrenadores quiere que los cuatro tengan cuenta, que
compartan la marca del centro y que alguien los administre. Hoy Treno no sabe
qué es un gimnasio: solo sabe de entrenadores sueltos y de sus clientes.

Está en el backlog de `SPEC-TRAINER.md` como *Multi-coach por organización
("Team plan" para gimnasios)*, sin estimar. Y en la landing ya hay una casilla
de **Studio 79 €** que promete justamente esto.

### Lo que hay montado hoy

El modelo entero se apoya en una sola pregunta: **¿esto es mío?**

- Doce tablas llevan `coach_id`: `exercises`, `workouts`, `sessions`,
  `availability_slots`, `workout_templates`, `client_info`,
  `technique_videos`, `client_groups`, `client_payments` y las derivadas.
- Hay **44 políticas RLS**, casi todas con la forma
  `using (coach_id = auth.uid())`.
- `profiles.coach_id` ata cada cliente a un entrenador.
- La marca (`brand_accent`, migración 0014) y el interruptor de pausa por
  impago (`block_on_overdue`, migración 0015) viven en el perfil del
  entrenador.

Ya existe el mecanismo para consultas que no pueden preguntar directamente:
funciones `SECURITY DEFINER` como `public.current_user_coach_id()`, que la
migración 0002 introdujo para romper una recursión infinita en las políticas
de `profiles`. Ese patrón es la clave de todo lo que viene después.

### Por qué esto no es "añadir una tabla"

El riesgo no está en crear `organizations`. Está en que **44 políticas pasan
de preguntar "¿es mío?" a preguntar "¿es mío o de mi gimnasio?"**, y una
política un punto demasiado permisiva filtra los clientes de un entrenador a
otro **sin dar ningún error**. Nadie ve una excepción: alguien ve una lista con
gente que no le corresponde, y puede tardar semanas en notarlo.

Es exactamente la clase de fallo que este proyecto ya ha sufrido dos veces en
otras formas (la recursión de la 0002, y la RLS de `client_info` que dejaba el
bloqueo por impago mudo). Merece un diseño explícito.

---

## Decisiones tomadas

Respondidas por Toni en agosto de 2026:

1. **Si un entrenador se va, quién se queda los clientes lo decide cada
   gimnasio** al configurarse. Hay centros que contratan asalariados y centros
   que alquilan sala a autónomos, y no es la misma relación.
2. **Dentro de un gimnasio, todos ven todo.** Cualquier entrenador del centro
   ve los clientes de sus compañeros, para poder cubrirse entre ellos.
3. **Paga el gimnasio por sus entrenadores**, con una factura y un plan. Es la
   casilla Studio de la landing.

---

## Decisión propuesta

**No añadir `organization_id` a las doce tablas. Mantener `coach_id` donde
está y cambiar la pregunta que hacen las políticas.**

Concretamente: una función `SECURITY DEFINER` que devuelve el conjunto de
entrenadores que el usuario actual puede ver, y las políticas pasan de

```sql
using (coach_id = auth.uid())
```

a

```sql
using (coach_id in (select public.coaches_visibles()))
```

La función devuelve:

- para un entrenador sin organización → solo su propio id;
- para uno de un gimnasio → todos los entrenadores de ese gimnasio;
- para un cliente → su entrenador (y, si el gimnasio lo permite, el resto del
  centro, que es lo que hace posible cubrir una baja).

### Por qué así

**Un entrenador solo no nota nada.** La función le devuelve su propio id y la
política se comporta exactamente igual que hoy. Eso importa porque los
primeros usuarios reales son autónomos, no gimnasios: la funcionalidad que
paga el gimnasio no puede introducir riesgo en la cuenta de quien ya está
usando esto.

**No hay migración de datos.** Nada que rellenar en doce tablas, nada que
pueda quedarse a medias. Las filas existentes siguen siendo válidas tal cual.

**Hay un solo sitio donde equivocarse.** Con `organization_id` duplicado en
doce tablas, cada `insert` tiene que acordarse de ponerlo bien y cada política
tiene que comprobar dos columnas coherentes entre sí. Con una función, la
lógica de visibilidad está escrita una vez y se audita una vez.

**La decisión 1 deja de ser un problema de esquema.** "¿Los clientes se quedan
o se van?" se convierte en qué se hace con `profiles.coach_id` cuando alguien
sale: reasignarlo a otro entrenador del centro, o dejarlo donde está y sacar al
entrenador de la organización. Es una operación, no dos modelos de datos.

### Tablas nuevas

```
organizations
  id, name, brand_accent, brand_accent_2, block_on_overdue,
  clientes_del_centro boolean,   -- decisión 1, por gimnasio
  created_at

organization_members
  organization_id, profile_id, rol ('admin' | 'coach'), created_at
  primary key (organization_id, profile_id)
```

`brand_accent` y `block_on_overdue` se **duplican** aquí a propósito, no se
mueven. El perfil sigue siendo el valor por defecto y la organización lo pisa
si existe. Así un entrenador que entra en un gimnasio no pierde su
configuración, y si sale la recupera.

**Un entrenador pertenece como mucho a una organización.** Es una restricción
que nos ahorra la mitad de los casos raros (¿de quién es el cliente si el
entrenador está en dos centros?) y que se puede levantar más adelante. Hoy no
hay ninguna evidencia de que haga falta.

---

## Opciones consideradas

### Opción A · Función de visibilidad sobre el modelo actual (propuesta)

| Dimensión                | Valoración                                              |
| ------------------------ | ------------------------------------------------------- |
| Complejidad              | Media · 2 tablas, 1 función, reescribir 44 políticas    |
| Migración de datos       | Ninguna                                                 |
| Riesgo para el solitario | Bajo · su caso devuelve exactamente lo de hoy           |
| Dónde se puede fallar    | Un sitio: la función                                    |

**En contra:** cada consulta con RLS llama a la función. Es `stable`, así que
Postgres la evalúa una vez por consulta y no por fila, pero conviene medirlo
con un gimnasio de verdad antes de darlo por bueno.

### Opción B · `organization_id` en las doce tablas

| Dimensión                | Valoración                                                    |
| ------------------------ | ------------------------------------------------------------- |
| Complejidad              | Alta · 12 columnas, 12 relleno de datos, 44 políticas dobles   |
| Migración de datos       | Sí, y con las tablas en uso                                    |
| Riesgo para el solitario | Medio · toca sus tablas para una función que no usa            |
| Dónde se puede fallar    | En cada `insert` de cada ruta                                  |

**A favor:** las consultas son más directas y no dependen de una función.
**En contra:** desnormaliza una relación que ya se puede derivar, y crea la
posibilidad de que `coach_id` y `organization_id` acaben diciendo cosas
distintas de la misma fila. Ese tipo de incoherencia no la detecta nadie hasta
que alguien ve datos que no son suyos.

### Opción C · Un gimnasio es un "entrenador" con subcuentas

Modelar el centro como un perfil de coach y a sus entrenadores como algo
colgando de él.

**Descartada.** Reutiliza una tabla para dos conceptos distintos y obliga a
preguntar en todas partes si un `coach_id` es una persona o un centro. Ahorra
una tabla y cuesta un `if` en cada consulta durante años.

### Opción D · No hacerlo: que el gimnasio pague cuatro cuentas sueltas

**No es tan mala como suena, y conviene tenerla presente.** Cuatro entrenadores
con cuatro cuentas normales funcionan hoy, sin escribir una línea. Lo que no
tienen es marca común, administración ni una sola factura.

Es la referencia contra la que medir: si un gimnasio no está dispuesto a pagar
más por esas tres cosas, la funcionalidad entera no se sostiene.

---

## Consecuencias

**Se vuelve más fácil**

- Vender a centros, que es donde están los cuatro clientes de golpe en vez de
  uno.
- Cubrir vacaciones y bajas sin pasar clientes a mano.
- Cambiar la marca de todo un centro en un sitio.

**Se vuelve más difícil**

- Razonar sobre quién ve qué. Hoy la respuesta es "lo suyo" y cabe en una
  frase; con gimnasios deja de caber.
- Probar. Cada pantalla pasa a tener tres casos (solitario, entrenador de
  centro, administrador) en vez de uno.
- Los cobros. Con Stripe Connect (ADR-002) el cargo directo va a **una** cuenta
  conectada. Si cobra el centro, la cuenta es del centro y el reparto entre
  entrenadores es un problema del gimnasio, no nuestro. Conviene que sea así y
  conviene decirlo explícitamente antes de venderlo.

**Obligación legal que nace de la decisión 2**

Que todo el gimnasio vea todo incluye `client_info.coach_notes`, donde hoy se
escriben lesiones: *"condromalacia rótula izquierda"*, *"molestias lumbares al
peso muerto"*. Eso son **datos de salud**, categoría especial del artículo 9
del RGPD. Ampliar quién los lee no es una preferencia de interfaz:

1. Hay que actualizar la política de privacidad describiendo que, en un centro,
   el personal del centro accede a esos datos.
2. Hay que informar al cliente **antes**, no después.
3. El responsable del tratamiento pasa a ser el centro, no el entrenador
   individual. Eso cambia con quién se firma el encargo de tratamiento.

Nada de esto impide la decisión. Sí impide implementarla y publicarla sin
tocar los textos legales.

---

## Qué preguntar a un gimnasio antes de construirlo

1. **¿Vuestros entrenadores son asalariados o autónomos que alquilan sala?**
   Es la pregunta que decide todo lo demás, y la respuesta cambia por centro.
2. **Cuando uno se va, ¿qué pasa hoy con sus clientes?** No qué debería pasar:
   qué pasa. La respuesta real suele ser "se los lleva por WhatsApp".
3. **¿Quién pagaría, el centro o cada entrenador?** Si dicen "que lo pague
   cada uno", el plan Studio no existe y esto se cae.
4. **¿Os parece bien que cualquier entrenador vea las notas de lesiones de los
   clientes de otro?** Preguntado así, en voz alta. Es la comprobación de que
   la decisión 2 es lo que quieren de verdad.
5. **¿Cuántos entrenadores tenéis y cuánta rotación hay al año?** Si rotan
   mucho, el traspaso de clientes deja de ser un caso raro y pasa a ser la
   funcionalidad principal.

---

## Pasos

1. [ ] Preguntar los cinco puntos anteriores a 2-3 gimnasios. **Antes de
       escribir código**: la opción D existe y puede ganar.
2. [ ] Migración: `organizations`, `organization_members` y la función
       `coaches_visibles()`.
3. [ ] Reescribir las 44 políticas. Con una prueba que cree dos gimnasios y
       compruebe que ninguno ve nada del otro; sin esa prueba, esto no se
       sube.
4. [ ] Panel del administrador: invitar entrenadores, marca del centro,
       traspasar clientes al salir alguien.
5. [ ] Actualizar la política de privacidad **antes** de activar la
       visibilidad compartida.
6. [ ] Revisar el plan Studio de la landing cuando haya una respuesta real
       sobre quién paga.

---

## Fuentes

- [Row Level Security · PostgreSQL](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Row Level Security · Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Función `SECURITY DEFINER` en políticas · Supabase](https://supabase.com/docs/guides/database/functions)
- [Artículo 9 · Tratamiento de categorías especiales de datos personales (RGPD)](https://www.boe.es/doue/2016/119/L00001-00088.pdf)
- Migración 0002 de este repositorio, donde nació el patrón de funciones
  `SECURITY DEFINER` para evitar la recursión en políticas.
