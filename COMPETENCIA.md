# Análisis de competencia · Dupla

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
   esas fuentes exige app nativa, y Coachify es web. Solo viable si algún día
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
