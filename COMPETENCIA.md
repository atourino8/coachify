# Análisis de competencia

Tres estudios. **Dupla** es el vecino: producto pequeño, a medio hacer.
**Harbiz** es el líder del mercado español, con 5 M€ levantados. **Hevy,
Strong y FitNotes** son otra categoría —apps para el que entrena, no para el
entrenador— y por eso mismo son las más peligrosas: una de ellas ya se ha
metido en nuestro mercado por la puerta de al lado.

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

---

# 3 · Hevy, Strong y FitNotes · el otro lado del mostrador

*Estudio del 24 de agosto de 2026. **No pude leer el post de X que lo motivó**
—la página no devuelve texto sin JavaScript y la extensión de Chrome no está
conectada—, así que esto sale de buscar las tres apps por separado. Si el post
menciona un repositorio concreto, hace falta el enlace o el nombre.*

**Conclusión de una línea:** estas tres no son competencia de Treno… salvo que
una de ellas, Hevy, ha lanzado **Hevy Coach** con 12 millones de usuarios
detrás. Eso es un problema mayor que Harbiz, y de otro tipo.

---

## 3.1 Qué son las tres

No son software de gestión. Son **cuadernos de gimnasio**: las usa la persona
que entrena, para apuntar series, repeticiones y peso. Nuestro equivalente no
es el panel del entrenador, es la pantalla de **Hoy** del cliente.

| | Qué es | Precio | Escala |
| --- | --- | --- | --- |
| **FitNotes** | Solo Android, de un desarrollador (James Gay). Sin cuenta, sin anuncios, funciona **sin conexión**. Copia de seguridad a Drive/Dropbox y CSV. | **Gratis**, sin anuncios «nunca» | 4,1 M descargas · **4,85/5** |
| **Strong** | iOS y Android. Superseries, calculadora de discos, temporizador automático, RPE, 1RM, Apple Health, exportar CSV. | Gratis con 3 rutinas · Premium 9,99 $/mes | El clásico del sector |
| **Hevy** | iOS, Android, web y Apple Watch. Lo mismo que Strong más **red social** de entrenos. | Gratis (4 rutinas, 3 meses de historial) · Pro 2,99 $/mes o 74,99 $ de por vida | **12 M de usuarios** |

## 3.2 Lo que de verdad importa: Hevy Coach

Hevy no es una app de aficionados. Es una empresa **sin inversión externa**,
con unos 30 empleados, y estimaciones de **~600.000 $ de facturación en un solo
mes** (febrero de 2026) y ~400.000 descargas mensuales.

Y han lanzado **Hevy Coach**: software para entrenadores personales, **desde 25
$/mes por tramos de clientes**, hasta 500 clientes, 30 días de prueba.

**El detalle que lo cambia todo:** *el cliente no paga nada y entrena desde la
app normal de Hevy*. Es decir:

- El entrenador no tiene que convencer a nadie de instalarse una app nueva.
  **Muchos de sus clientes ya la tienen puesta**, y les gusta.
- Hevy tiene un embudo gratis de 12 millones de personas al que decirle «dile a
  tu entrenador que programe aquí».
- No tienen prisa de fondo: son rentables y no deben nada a nadie.

Harbiz levantó 5 M€ para competir con esto. Nosotros no tenemos ni lo uno ni lo
otro.

**Lo único bueno:** Hevy Coach **también cobra por tramos de clientes**, la
misma herida que Harbiz. Y a día de hoy está en inglés y pensado para el coach
*online*, sin cobros en euros, sin facturación española y sin clases
presenciales.

## 3.3 Lo que sacamos de las tres para nuestra pantalla de Hoy

Esto es lo accionable de verdad, y es de diseño, no de estrategia. Lo que hace
que estas apps se adoren no son funciones grandes; es que **no estorban**:

1. **Los números de la última vez, ahí mismo.** Strong enseña el peso y las
   repeticiones de la sesión anterior de ese ejercicio sin que busques en el
   historial. Es lo primero que mira alguien antes de una serie. Nosotros hoy
   **no lo enseñamos**.
2. **Temporizador de descanso que arranca solo** al apuntar la serie. Nosotros
   hoy escribimos «· descanso 90s» **como texto**. No cuenta nada.
3. **Calculadora de discos**: qué poner en la barra para llegar a 82,5 kg.
   Barato de hacer y se usa en cada serie.
4. **Que funcione sin cobertura.** Es media razón del 4,85 de FitNotes. **Treno
   no tiene nada offline** —ni service worker, ni manifiesto— y muchos
   gimnasios están en un sótano. Si el cliente no puede apuntar la serie porque
   no hay línea, se acabó: se vuelve a Hevy y no vuelve.
5. **Exportar a CSV.** Las tres lo tienen. Es lo que le dice al usuario que sus
   datos son suyos. Nosotros ya exportamos clientes y pagos; los entrenos no.

## 3.4 Cómo cambia esto la estrategia

- **La pantalla del cliente no es donde competir.** Hevy y Strong llevan diez
  años puliendo exactamente esa pantalla. El objetivo ahí es **no dar pena**:
  los cuatro puntos de arriba y punto. Cada hora extra que le echemos a esa
  pantalla es una hora que no le echamos a lo que ellos no hacen.
- **Lo que ellos no hacen es el mundo presencial.** Hevy Coach y Harbiz están
  los dos construidos para **programar a distancia**. Ninguno lleva agenda de
  huecos, clases con plazas y lista de espera, cobros en euros, impagos o
  varios entrenadores bajo una marca. Eso ya lo tenemos nosotros.
- **El riesgo real a vigilar:** que Hevy Coach se traduzca al español y añada
  facturación. Ese día se llevan por delante a Harbiz y a los cuatro que le
  hacen sombra. Nuestra defensa no puede ser la lista de funciones; tiene que
  ser lo que un entrenador presencial español necesita y a una empresa de
  Ottawa no le compensa hacer.
- **FitNotes es la lección barata:** 4,1 millones de descargas y 4,85 de nota
  con cero funciones de más, sin cuenta y sin conexión. Gana la que no estorba.

## 3.5 Lo que este estudio no sabe

- **No he leído el post de X.** Si menciona un repositorio de código abierto
  parecido a Treno, eso merece un estudio aparte: no es lo mismo un rival de
  pago que uno que cualquiera puede autoalojar gratis.
- Las cifras de facturación de Hevy son **estimaciones de terceros**
  (appfigures, Tracxn, prensa), no datos publicados por la empresa.
- **No he probado Hevy Coach.** Habría que abrir una cuenta de prueba —tienen
  30 días gratis— y ver qué hace de verdad con un cliente.
