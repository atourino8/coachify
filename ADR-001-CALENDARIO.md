# ADR-001: Sincronización con el calendario del entrenador

**Estado:** Propuesto
**Fecha:** agosto de 2026
**Decide:** Toni (producto), tras hablar con 3-5 entrenadores

---

## Contexto

`SPEC-TRAINER.md` incluye en v1 un "sistema de citas con Google Calendar":
evento creado en el calendario del coach y detección de conflictos. Está sin
hacer, y antes de construirlo conviene separar **dos problemas distintos** que
la frase mezcla:

1. **Ver.** El entrenador ya vive en un calendario (Google, Apple, el del
   móvil). Si las citas de Treno no están ahí, tiene dos agendas y una
   miente. Es incomodidad constante y de baja intensidad.

2. **No chocar.** Que la aplicación no le ofrezca a un cliente un hueco que él
   ya tiene ocupado por algo ajeno (el dentista, recoger a un crío, otro
   trabajo). Esto no es incomodidad: es una cita mal dada que hay que deshacer
   por WhatsApp, justo la fricción que Treno dice eliminar.

El segundo duele mucho más. Y es el único que obliga a **leer** el calendario
personal del entrenador, que es donde está todo el coste.

### Restricciones que impone Google

Comprobado en agosto de 2026:

- **Leer eventos del calendario es un _scope_ sensible.** Google exige revisar
  la aplicación antes de conceder acceso, con justificación escrita y vídeo
  demostrativo. Hay que pedir siempre el permiso más estrecho posible.
- **Sin verificar, tope de 100 usuarios.** El límite es sobre la vida entera
  del proyecto y **no se puede reiniciar**. Cada usuario de prueba consume
  cupo para siempre.
- **Sin verificar, los _refresh tokens_ caducan a los 7 días.** Este es el
  dato decisivo: en modo prueba, **cada entrenador tendría que reconectar su
  calendario cada semana**. Para una beta con entrenadores reales eso no es una
  limitación, es un producto roto.
- La verificación tarda semanas y hay que renovar la evaluación de seguridad
  periódicamente si se usan permisos del nivel más restringido.

### Restricción del feed iCal

- Google Calendar refresca las suscripciones externas **cada 8-24 horas**, el
  intervalo **no es configurable** y **no hay botón de actualizar**. La única
  forma de forzarlo es borrar la suscripción y volver a añadirla.

Esto acota exactamente para qué sirve: para *ver la semana*, sí; para *enterarse
de que le has movido la sesión de mañana*, no.

---

## Decisión propuesta

**Empezar por el feed iCal (opción A) y no construir OAuth hasta tener
evidencia de que hace falta.** En paralelo, cerrar el agujero de "no chocar"
por dentro (opción D), que es más barato y no depende de Google.

Concretamente: A + D ahora, y reevaluar OAuth cuando haya entrenadores
suficientes para que la verificación de Google merezca la pena.

---

## Opciones consideradas

### Opción A · Feed iCal de suscripción

Publicamos una URL secreta con un `.ics` que el entrenador añade a su
calendario. Sus citas de Treno le aparecen ahí y se actualizan solas.

| Dimensión               | Valoración                                              |
| ----------------------- | ------------------------------------------------------- |
| Complejidad             | Baja · una ruta que genera texto                        |
| Coste                   | ~1-2 días. Sin trámites con Google                      |
| Privacidad              | Mínima · no tratamos ningún dato del entrenador         |
| Riesgo de mantenimiento | Bajo · formato estándar, sin API que rompa              |
| Funciona con            | Google, Apple, Outlook y cualquier calendario           |

**A favor**

- Sin OAuth, sin credenciales de Google, sin verificación, sin tope de usuarios.
- No leemos nada suyo, así que la política de privacidad no cambia.
- Sirve para todos los calendarios, no solo Google. Un entrenador con iPhone
  y calendario de Apple queda cubierto igual.
- Se puede tener funcionando esta semana.

**En contra**

- **Retraso de 8-24 horas.** Un cambio de última hora no le llega a tiempo.
- Una sola dirección: no detecta conflictos con su vida personal.
- La URL es un secreto compartido; hay que poder revocarla y regenerarla.
- Si la pierde de vista, sus citas quedan expuestas a quien tenga el enlace.

### Opción B · OAuth de una vía (solo escribir)

El entrenador conecta su cuenta y creamos/actualizamos eventos en su calendario.

| Dimensión               | Valoración                                                        |
| ----------------------- | ----------------------------------------------------------------- |
| Complejidad             | Media-alta · OAuth, refresco de tokens, reintentos, reconciliación |
| Coste                   | ~1-2 semanas + trámite de verificación                            |
| Privacidad              | Media · guardamos tokens de acceso a su cuenta                     |
| Riesgo de mantenimiento | Medio · tokens que caducan, revocaciones, errores de cuota         |
| Funciona con            | Solo Google                                                        |

**A favor**

- Actualización casi inmediata: mueves una cita y aparece movida.
- Es la experiencia que la gente espera cuando lee "se integra con Google
  Calendar".

**En contra**

- Sigue sin resolver "no chocar", que es el problema caro.
- Hay que confirmar la clasificación exacta del permiso de escritura más
  estrecho; si resulta sensible, arrastra verificación igual.
- Guardar tokens de terceros es superficie de ataque y obligación nueva.
- Solo cubre a los entrenadores con Google.

### Opción C · OAuth de dos vías (leer + escribir)

Además de escribir, leemos su calendario para no ofrecer huecos ocupados.

| Dimensión               | Valoración                                                  |
| ----------------------- | ----------------------------------------------------------- |
| Complejidad             | Alta · sincronización incremental, caché, zonas horarias     |
| Coste                   | ~3-4 semanas + verificación (semanas) antes de poder abrirlo |
| Privacidad              | Alta · leemos su agenda personal entera                      |
| Riesgo de mantenimiento | Alto                                                         |
| Funciona con            | Solo Google                                                  |

**A favor**

- Es lo único que resuelve el problema que de verdad duele.

**En contra**

- **Bloqueante para la beta:** con la aplicación sin verificar, los tokens
  caducan a los 7 días. O se verifica antes de tener usuarios, o los
  entrenadores tienen que reconectar cada semana.
- El tope de 100 usuarios no se reinicia nunca: gastarlo en pruebas es
  hipotecar el proyecto de Google.
- Leemos eventos ajenos a Treno (médicos, familia). Eso cambia la política
  de privacidad, exige base legal y minimización, y es justo el tipo de dato
  que no queremos tocar mientras seamos dos.
- Invertir 3-4 semanas antes de validar el precio de 29 € es apostar fuerte
  sobre una hipótesis sin comprobar.

### Opción D · Bloqueos puntuales dentro de Treno (complemento)

La tabla `availability_slots` ya soporta `kind = 'specific'` con
`specific_date`, pero **la interfaz solo crea huecos recurrentes**: el código
inserta siempre `kind: 'recurring'` y `specific_date: null`. Es decir, la base
de datos ya permite excepciones y no las estamos aprovechando.

Exponerlo significa que el entrenador pueda decir "el jueves 14 por la tarde no
estoy" sin tocar su horario habitual.

| Dimensión   | Valoración                                        |
| ----------- | ------------------------------------------------- |
| Complejidad | Baja · el modelo de datos ya está                 |
| Coste       | ~1 día                                            |
| Privacidad  | Nula · dato que él mismo introduce                |

**A favor**

- Resuelve buena parte de "no chocar" sin leer nada de nadie.
- Aprovecha algo ya construido y hoy inaccesible.

**En contra**

- Exige disciplina: solo funciona si él se acuerda de bloquearlo.
- No cubre lo imprevisto.

---

## Análisis de compensaciones

**El coste de C no es el desarrollo, es el calendario.** Tres o cuatro semanas
de trabajo más varias de verificación, todo antes de tener la primera respuesta
a "¿pagarías 29 € por esto?". Es el orden inverso al que marca `NEGOCIO.md`.

**Los 7 días de caducidad del token descartan usar OAuth en la beta.** No es un
detalle de implementación: obligaría a decirle al entrenador "reconecta tu
calendario cada semana", que es peor que no tener integración.

**A no es un sucedáneo de B: resuelve un problema distinto.** El retraso de
8-24 horas hace que iCal sirva para consultar la semana y no para cambios de
última hora. Conviene decirlo así en el producto, sin prometer sincronización
inmediata, para no generar una expectativa que el formato no cumple.

**D es la opción de mejor relación valor/coste** y no está en la SPEC. Un día
de trabajo sobre un modelo de datos que ya existe, y ataca el problema caro
desde el lado barato.

---

## Consecuencias

**Se vuelve más fácil**

- Lanzar sin depender de los plazos de revisión de Google.
- Dar soporte a entrenadores con calendario de Apple o Outlook.
- Mantener la política de privacidad honesta: no tratamos datos de terceros.

**Se vuelve más difícil**

- Prometer "sincronización con Google Calendar" en la landing. Habrá que
  describirlo por lo que es: *"tus citas en el calendario que ya usas"*.
- Competir de tú a tú en una tabla de funcionalidades contra quien ponga
  "Google Calendar ✓" sin matizar.

**Habrá que revisarlo cuando**

- Tres o más entrenadores pidan explícitamente sincronización inmediata o
  detección de conflictos.
- Haya volumen suficiente para que verificar la aplicación merezca el trámite.
- Se decida abrir registro público (entonces el tope de 100 usuarios importa).

---

## Qué preguntar a un entrenador antes de decidir

Va con las preguntas de la beta cerrada de `NEGOCIO.md` §6:

1. **¿Qué calendario usas de verdad, en el móvil?** Si la mitad usa Apple, la
   integración con Google cubre a la mitad y el iCal a todos.
2. **¿Cuántas veces al mes te has dado cuenta tarde de que tenías dos cosas a
   la misma hora?** Cuantifica el problema de "no chocar" en vez de suponerlo.
3. **Cuando mueves una sesión, ¿cuánto tiempo antes suele ser?** Si es de un
   día para otro, el retraso del iCal da igual. Si es de dos horas, no sirve.
4. **¿Te vale con verlas ahí, o esperas poder cambiarlas desde tu calendario?**
   Editar desde Google es otra guerra (dos vías completo) y conviene saber si
   alguien lo espera.
5. **¿Bloquearías tus ratos ocupados en la aplicación si te costara dos
   toques?** Mide si la opción D es realista o ilusión.

---

## Pasos

1. [ ] Preguntar los cinco puntos anteriores a 3-5 entrenadores.
2. [ ] Implementar la opción D (bloqueos puntuales), que no depende de la respuesta.
3. [ ] Implementar la opción A (feed iCal) con URL revocable y regenerable.
4. [ ] Ajustar el texto de la landing y de la SPEC: dejar de prometer "Google
       Calendar" y describir lo que se hace de verdad.
5. [ ] Reevaluar OAuth con las respuestas en la mano. Si se decide seguir,
       **verificar la aplicación antes** de meter entrenadores reales, por lo
       del tope de 100 y la caducidad de 7 días.

---

## Fuentes

- [Sensitive scope verification · Google for Developers](https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification)
- [Verification requirements · Google Cloud Console Help](https://support.google.com/cloud/answer/13464321?hl=en)
- [Unverified apps · Google Cloud Console Help](https://support.google.com/cloud/answer/7454865?hl=en)
- [Manage App Audience · Google Cloud Console Help](https://support.google.com/cloud/answer/15549945?hl=en)
- [Google OAuth 100 user limit · Unipile](https://www.unipile.com/google-oauth-100-user-limit/)
- [Google Calendar ICS subscription refresh rate · Carly](https://www.usecarly.com/blog/google-calendar-ics-refresh-rate/)
