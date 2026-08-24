# Análisis de competencia

Dos estudios. **Dupla** (abajo) es el vecino: producto pequeño, a medio hacer.
**Harbiz** (al final) es el líder del mercado español, con 5 M€ levantados. Son
dos lecturas muy distintas y la segunda es la que importa para decidir.

---

# 1 · Dupla

Estudio del competidor más cercano (duplapp.win), a partir de su web pública,
sus precios y capturas de todo su panel de entrenador.

**Conclusión de una línea:** juegan a lo ancho para el coach *online*; nosotros
jugamos a lo hondo para el entrenador *presencial e híbrido*. No hay que
igualar su menú.

---

## 1. Qué tienen

Menú completo: Inicio · Alumnos · Mis Rutinas · Programas · Mensajes ·
Estadísticas · Nutrición · Progresión · Ingresos · Win-Win · Notificaciones ·
Configuración.

Precios: Starter gratis (1 alumno), Bronze 15 $, Silver 30 $, Gold 50 $,
Olympian 100 $ — **por número de alumnos y en dólares**.

---

## 2. Sus grietas (nuestras oportunidades)

**El español está a medias.** Su supuesta ventaja frente a los americanos está
rota: "Filter by Date", "Create Workout", "Completed / Assigned / Pending",
"Financial Growth", "Total Reps", "Weight Lifted", "Trainee Subscriptions",
"PAID / PENDING / OVERDUE", "Nothing logged yet", "My Progression",
"1RM History", "Select exercise"… media aplicación sigue en inglés.

**No está hecho para España.** Precios en USD y el teléfono con placeholder
`+1 000 000 0000`. Apuntan a Latinoamérica. El mercado español está más libre
de lo que parecía.

**Bug en producción.** La sección de Mensajes muestra en rojo
*"Authentication token required (received null/undefined)"* a un usuario nuevo.
Su chat está caído.

**Identidad de producto confusa.** Nutrición dice "registra **tus** calorías",
Progresión muestra "**My** Progression" y Estadísticas tiene "**Your**
performance: Total Reps, Weight Lifted, Personal Workouts". Son secciones para
que el coach se registre a sí mismo como atleta, mezcladas con las de gestión
de alumnos. No se sabe si es herramienta de trabajo o app de fitness personal.

**Dos abstracciones que se solapan:** "Rutinas" (plantillas) y "Programas"
(carpetas + planes multi-día). Un entrenador nuevo no sabe cuál usar cuándo.

**Señales de producto a medio hacer**, probablemente de un equipo pequeño o de
una sola persona: traducción incompleta, bug visible, secciones vacías de
sentido. No es un rival consolidado.

---

## 3. Lo que SÍ merece la pena incorporar

### 3.1 Estado de pago por cliente · prioridad alta
Tienen cada alumno marcado como PAID / PENDING / OVERDUE.

Encaja perfectamente con nuestra tesis: si empujamos al entrenador a cobrar
**cuota mensual** en vez de por sesión, necesita ver de un vistazo quién le
debe. Parece registro manual, no cobro real, así que podemos igualarlo sin
montar pasarela de pagos.

### 3.2 Programa de referidos · prioridad alta
Su "Win-Win": un entrenador refiere a otro y ambos ganan.

Para arrancar sin presupuesto de marketing es la palanca más barata que existe.
Nuestra versión puede ser mejor: **refiere a un compañero y os lleváis meses
gratis los dos** (más claro que un saldo acumulado que hay que pedir a soporte).

### 3.3 Filtros por estado en la lista de entrenos · prioridad media
Asignado / completado / pendiente. Detalle pequeño, mejora el día a día.

---

## 4. Lo que NO copiamos

**Nutrición propia.** Es un producto entero, existen apps dedicadas mucho
mejores y nos desenfoca del presencial. (Ver punto 5.)

**Mensajería propia.** El entrenador ya usa WhatsApp con sus clientes y no lo
va a abandonar por un chat peor. Es caro de construir y a ellos ya se les ha
roto.

**Que el coach se registre a sí mismo como atleta.** Mezcla roles y ensucia la
interfaz.

**La cuota visible tipo "PLAN: STARTER 0/1".** Le recuerdas en cada pantalla
que le falta pagar. Nosotros vamos a precio plano justamente para no hacer eso.

**Dos niveles rutina/programa.** Mantener un solo concepto: Entrenamiento.

---

## 5. Nutrición: integrar, no construir

**Idea:** no desarrollar el módulo de nutrición, sino leer datos de una app que
el cliente ya use (MyFitnessPal) vía API y mostrarlos al entrenador.

**Hallazgo (agosto 2026):** la **API de MyFitnessPal está cerrada**. Es privada,
solo para partners aprobados, y no aceptan nuevas solicitudes. Vía descartada
por ahora.

**Alternativas, por orden de sensatez:**

1. **No hacer nada todavía.** No es nuestro terreno y el presencial no lo pide.
2. **Open Food Facts** — base de datos abierta, gratuita y con buena cobertura
   europea/española. Serviría para un registro de comidas propio y ligero si
   algún día hace falta.
3. **FatSecret Platform API** — tiene programa de socios accesible, a
   diferencia de MFP.
4. **Apple Health / Health Connect** — MyFitnessPal sí vuelca ahí. Pero leer de
   esas fuentes exige app nativa, y Treno es web. Solo viable si algún día
   hay app móvil.

**Decisión:** aparcado. Si un cliente lo pide, empezar por un campo simple de
objetivo calórico en la ficha, no por un módulo.

---

## 6. Qué refuerza esto de nuestra estrategia

Revisado su menú completo, **no tienen agenda, ni citas, ni disponibilidad, ni
corrección de técnica, ni grupos**. Ni una sola pantalla para el entrenador que
ve gente en persona.

Ellos construyeron a lo ancho. Nosotros vamos a lo hondo en un segmento que no
tocan. La defensa no es tener más secciones que ellos: es tener **menos y
mejores**, y que cada una sirva al presencial e híbrido.

---

# 2 · Harbiz · el líder del mercado español

*Estudio hecho el 24 de agosto de 2026 a partir de prensa económica, reseñas
públicas (Capterra, Trustpilot, App Store) y las tablas de precios que
publican sus competidores. **No he podido cargar harbiz.io directamente**, así
que los precios vienen de terceros y hay que verificarlos antes de usarlos en
ninguna parte — y buena parte de esos terceros son rivales suyos vendiendo
contra ellos.*

**Conclusión de una línea:** Harbiz demuestra que el mercado existe y paga,
pero la guerra que se está librando —precio y lista de funciones— ya la están
peleando cuatro españoles más y no la vamos a ganar. Lo que nadie está
atacando es que **el producto pierde el trabajo de la gente**.

---

## 2.1 Qué son

Fundada por **Mario Morante y Javier Ortega**. Empezaron como **marketplace**
de entrenadores personales y **pivotaron a SaaS** de gestión. Antes se
llamaban **Dudyfit**: es la misma empresa con otro nombre (misma ficha en
Capterra, id 201790).

- **5 M€ de ronda** en enero de 2024, liderada por Octopus Ventures, con
  Entrecanales, Athos y Enzo.
- **~4 M€ de ARR** proyectados para cerrar 2024, después de triplicar en 2022
  y doblar en 2023.
- **6.000-10.000 profesionales** (según la fuente), **más de 150.000 clientes
  finales**, presencia en **35 países**.
- Producto: rutinas, nutrición, cuestionarios, agenda, reservas, cobros
  recurrentes, facturación, app de marca blanca e IA de dietas.

**Lo primero que hay que sacar de aquí no es competitivo, es de mercado:** un
señor levantó 5 M€ de un fondo británico serio vendiendo esto a entrenadores
españoles. La tesis de NEGOCIO.md no era optimista. Era correcta.

**Lo segundo, para el backlog:** en SPEC-TRAINER.md tenemos apuntada una épica
de *marketplace*. Ellos empezaron ahí y se salieron. Merece la pena entender
por qué antes de gastar un mes en eso.

## 2.2 Cómo cobran, y por qué es su herida

Cobran por **tramos de número de clientes**, en tres planes (Basic, Pro, My
APP), y encima **tres add-ons que se acumulan**: app de marca blanca (~30
€/mes), IA de nutrición (~18 €/mes) y biblioteca de vídeos (~24 €/mes).

Un entrenador con 100 clientes que quiera marca blanca, IA y vídeos acaba
pagando del orden de **300 €/mes con IVA**. Los add-ons **no entran en el
descuento anual**.

Esto es exactamente lo contrario de nuestra decisión de NEGOCIO.md —precio
plano por entrenador, no por cliente— y es la grieta que **todo el mundo** les
está atacando.

## 2.3 El problema: esa grieta ya tiene cuatro personas dentro

Buscando «Harbiz» aparece un ecosistema entero de españoles cuya estrategia
completa es *«alternativa a Harbiz, más barato»*: **TotalGains** (29,90 €/mes,
IA y marca blanca incluidas, un solo desarrollador en Granada), **TrainerStudio**,
**Hexfit**, **wayoai**… Todos con páginas «vs Harbiz», tablas comparativas y
migración asistida gratis.

**Esto es lo más importante de todo el estudio.** Nuestra diferenciación
prevista —29 €/mes planos frente a los tramos de Harbiz— **ya no diferencia**:
TotalGains está en 29,90 € con más funciones que nosotros. Si salimos con el
mensaje «somos como Harbiz pero plano y barato», salimos los quintos a decir lo
mismo, sin ARR, sin app en las tiendas y sin marca.

El eje de precio está saturado. Hay que competir por otro lado.

## 2.4 Dónde sí están débiles: pierden el trabajo de la gente

Las quejas repetidas en Trustpilot, App Store y Capterra no son de funciones.
Son de **fiabilidad**:

- **«Pérdida de planificaciones después de horas de trabajo.»** Repetida.
- La app móvil **se cuelga**, va lenta, **se reinicia sola** al bloquear el
  teléfono y **pierde el entrenamiento registrado**.
- Soporte que tarda **meses** en algunos casos, y dificultad para darse de baja.
- Un entrenador: *«casi 200 € al mes»* con fallos frecuentes.
- Base de datos de alimentos *«un poco pobre»*, CRM *«sin demasiada
  información»*.

Nota justa: también hay muchas reseñas buenas —4,4/5 en Capterra, 4 en
Trustpilot— y el soporte sale elogiado tantas veces como criticado. No están
rotos. Pero el patrón de «perder trabajo hecho» aparece una y otra vez.

**Y aquí está lo interesante para nosotros, que no es una casualidad:** el
fallo que encontré esta misma semana —guardar un día desde la ficha borraba la
nota del cliente sin avisar— es **exactamente esa clase de fallo**. La
diferencia es que nosotros lo cazamos con una comprobación antes de que llegara
a nadie, y que el editor tiene deshacer paso a paso.

Eso no es una funcionalidad que se ponga en una tabla comparativa. Es una
propiedad del producto, y es la única en la que salimos por delante del líder
del mercado hoy mismo.

## 2.5 Dónde no están: presencial, clases y estudios

Harbiz está diseñado para el **entrenador online** con clientes a distancia.
Tiene reservas de sesiones individuales y grupales, pero las reseñas señalan la
**gestión de clases** como punto flojo, y las guías de software para gimnasios
lo recomiendan para *«entrenadores online o gimnasios grandes con mucho volumen
virtual»*, no para el estudio de barrio con clases presenciales.

Nosotros acabamos de meter clases con **plazas limitadas, lista de espera,
faltas por avisar tarde y bloqueo de fila para que dos personas no se lleven la
misma plaza**. Eso, más ADR-003 (gimnasio con varios entrenadores) y el plan
Studio de 79 €, apunta a un sitio donde ellos no están mirando.

## 2.6 Lo que NO hay que hacer

- **No entrar en la guerra de la nutrición y la IA de dietas.** Base de 240.000
  alimentos, generación de dietas, cuestionarios: ahí están todos, cuesta caro
  y llegaríamos los últimos.
- **No competir por precio.** Está ocupado por alguien que ya lo hace bien.
- **No copiar su menú.** Es la misma conclusión que con Dupla y por otro
  motivo: con Dupla porque su menú está vacío; con Harbiz porque está lleno y
  no podemos llenarlo igual.

## 2.7 Lo que sí

1. **Vender fiabilidad, no funciones.** «No te vamos a perder la planificación»
   es un mensaje que ningún competidor español puede decir con la cara seria
   ahora mismo, y que a un entrenador que ha perdido dos horas de trabajo le
   dice más que una lista de treinta funciones. Deshacer paso a paso, guardado
   que no pisa lo que no toca, y que la app no se caiga.
2. **Presencial y estudios**, no coach online. Es donde ellos no están y donde
   ya tenemos clases, agenda de huecos y ADR-003.
3. **Precio plano, pero como consecuencia y no como titular.** Que no sea el
   argumento principal, porque ese argumento ya no es nuestro.
4. **Antes de nada, tener usuarios.** Ellos tienen 6.000 profesionales, seis
   años y 5.400 búsquedas de marca al mes. Nosotros tenemos cero de las tres
   cosas. Nada de esto importa hasta que haya diez entrenadores usándolo de
   verdad.

## 2.8 Lo que este estudio no sabe

- **No he podido leer harbiz.io.** Precios y funciones vienen de terceros, casi
  todos rivales suyos. Antes de poner una tabla comparativa en la web hay que
  verificarlos en su web, y fecharlos.
- **No he probado el producto.** Todo lo de la lentitud y las pérdidas de datos
  son reseñas de otros, no observación propia. Merecería la pena que alguien se
  abra una cuenta de prueba y lo mire.
- **Los datos de ARR y clientes son de 2024** y salen de entrevistas a los
  fundadores en prensa. Ni auditados ni recientes.
- **No sé qué han hecho con los 5 M€** desde enero de 2024, ni si hay ronda
  nueva. Dos años y medio dan para mucho.
