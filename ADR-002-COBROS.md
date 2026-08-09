# ADR-002: Cobros de los entrenadores a sus clientes

**Estado:** Aceptado (implementación aplazada)
**Fecha:** agosto de 2026
**Decide:** Toni

---

## Contexto

Tres entrenadores pidieron, sin que nadie preguntara, poder **cobrar a sus
clientes desde la aplicación**. Es la señal de demanda más fuerte que ha tenido
el proyecto: no salió de una hipótesis nuestra, salió de ellos.

Lo que piden, en sus palabras, es "que nos ayudéis a facturar". Traducido:
domiciliar una cuota mensual al cliente final y que el dinero acabe en la
cuenta del entrenador, sin que él persiga a nadie por Bizum.

Hoy la aplicación **registra** cuotas (`client_info.fee_amount` y `paid_until`)
y deriva el estado de pago, pero no mueve un euro. La pregunta es si damos el
salto y con qué forma.

### Lo que decide quién paga cuando un cliente reclama

Es la pregunta que hay que responder antes que ninguna otra, y en Stripe se
contesta con **dos interruptores** que se eligen al principio y son caros de
cambiar después.

**1. El tipo de cuenta del entrenador**

- Cuentas **Standard**: el entrenador tiene su propia cuenta completa de Stripe
  y **responde él de sus saldos negativos**. La devolución y su comisión salen
  de su saldo, no del nuestro.
- Cuentas **Express** o **Custom**: permiten un alta más corta y con nuestra
  marca, pero **la plataforma responde de los saldos negativos**. Si el
  entrenador no tiene fondos, Stripe nos lo cobra a nosotros, y además retiene
  dinero nuestro en reserva mientras intenta recuperarlo. Si a los 180 días
  sigue en negativo, tira de esa reserva.

**2. El tipo de cargo**

- **Cargos directos**: el dinero nace en la cuenta del entrenador.
- **Destination charges** / cargos separados: el dinero nace en la nuestra, y
  Stripe carga ahí las disputas. Recuperarlo del entrenador es cosa nuestra.

Dicho corto: **la comodidad del alta y el control de la marca se pagan
asumiendo el riesgo financiero**. No hay combinación que dé las dos cosas.

### El agravante de la domiciliación

La domiciliación SEPA —que es justo lo que piden— tiene una particularidad que
la tarjeta no tiene:

- El cliente puede reclamar **hasta 8 semanas sin dar explicaciones**, y la
  reclamación **se concede automáticamente**.
- **No hay proceso de alegaciones.** Con una tarjeta puedes aportar pruebas y a
  veces ganas; aquí se devuelve y punto.
- Entre 8 semanas y 13 meses todavía se puede reclamar si se alega que el cargo
  no estaba autorizado.
- Stripe cobra además una comisión por cada cargo devuelto o disputado (del
  orden de 10 €; conviene confirmar la tarifa vigente para España).

Traducido a números reales: un entrenador con 20 clientes a 45 € factura 900 €
al mes. Si uno se enfada y reclama dos meses, son 90 € más comisiones. Si el
que desaparece con saldo negativo es el entrenador, con cuentas Express eso lo
paga la plataforma.

### Coste normal de la operación

- Domiciliación SEPA: **0,35 € fijos por cargo**, más un **0,5 %** si se usa
  Stripe Billing para gestionar las suscripciones. Sobre una cuota de 45 €,
  unos **0,58 €** — bastante más barato que con tarjeta.
- Liquidación a la cuenta del entrenador: **1-2 días hábiles**.

---

## Decisión

**Cuentas Standard con cargos directos.** El entrenador se da de alta con su
propia cuenta de Stripe, el dinero nace en su cuenta y él responde de sus
devoluciones.

**La implementación se aplaza.** Primero van funcionalidades que faciliten el
trabajo del entrenador, después las reuniones y maquetas, y después las pruebas
de rendimiento de subida de vídeo. Este documento existe para que, cuando
llegue el momento, la decisión no se tome con prisa.

### Por qué Standard y no Express

1. **El riesgo se queda donde está el dinero.** Quien cobra la cuota responde
   de la devolución. Es lo justo y lo defendible.
2. **El entrenador es el comerciante de verdad.** El cargo aparece en el
   extracto del cliente a su nombre y es él quien emite la factura. Eso es
   literalmente lo que pidieron —"ayudadnos a facturar"— y fiscalmente es mucho
   más limpio que hacerlo pasar por nosotros.
3. **No hay estructura jurídica todavía.** Hasta la cita del patronato (día 18)
   no se sabe si autónomo o SL. Firmar un acuerdo de plataforma asumiendo
   saldos negativos de terceros **siendo autónomo** significa responder con el
   patrimonio personal de que el cliente de un tercero no se enfade. Eso no se
   hace antes de tener la estructura decidida, y probablemente tampoco después.

### El coste de esta decisión, asumido a conciencia

El alta en Stripe con verificación de identidad es más larga y menos "nuestra".
Se van a perder entrenadores por el camino.

**Contramedida decidida:** convertir esa fricción en producto. Una consultoría
o un tutorial de alta acompañada. Lo que era una pérdida pasa a ser el primer
ingreso y una excusa perfecta para sentarse con ellos —que es justo lo que hace
falta en la fase de validación.

---

## Opciones consideradas

### Opción A · Standard + cargos directos · **elegida**

| Dimensión              | Valoración                                          |
| ---------------------- | --------------------------------------------------- |
| Riesgo para nosotros   | **Bajo** · no respondemos de saldos negativos        |
| Fricción del alta      | Alta · cuenta completa de Stripe con verificación    |
| Control de la marca    | Bajo · el alta es de Stripe, no nuestra              |
| Quién factura          | El entrenador · es el comerciante                    |
| Complejidad técnica    | Media                                                |

**A favor:** el riesgo vive donde vive el dinero; encaja con "ayudadnos a
facturar"; no compromete el patrimonio personal; las comisiones de plataforma
siguen siendo posibles si algún día se quiere la segunda capa de ingresos.

**En contra:** se pierden altas por la fricción; menos control de la
experiencia; hay que dar soporte a un alta que no controlamos.

### Opción B · Express + destination charges

| Dimensión              | Valoración                                              |
| ---------------------- | -------------------------------------------------------- |
| Riesgo para nosotros   | **Alto** · respondemos de saldos negativos y disputas     |
| Fricción del alta      | Baja · alta corta dentro de nuestra marca                 |
| Control de la marca    | Alto                                                      |
| Quién factura          | Ambiguo · el dinero pasa por nosotros                     |
| Complejidad técnica    | Alta · reservas, reversiones, recuperación de impagos     |

**A favor:** la experiencia que la gente espera; conversión mucho mejor.

**En contra:** con las 8 semanas de SEPA, **el problema se descubre dos meses
tarde**, cuando ya hay varios entrenadores dentro. Un fundador solo, sin
sociedad y sin colchón, no puede absorber eso.

### Opción C · No mover dinero (lo que hay hoy)

Seguir registrando cuota y fecha de pago, sin pasarela.

| Dimensión            | Valoración                     |
| -------------------- | ------------------------------- |
| Riesgo para nosotros | Nulo                            |
| Coste                | Cero · ya está construido       |
| Resuelve la petición | No                              |

**A favor:** cero riesgo, cero trabajo.
**En contra:** deja sin atender la petición más clara que hemos recibido.

---

## Implementación por fases

Deliberadamente escalonada: cada fase se puede parar sin haber hipotecado nada.

**Fase 0 · lo que hay hoy.** Registro de cuota y estado de pago derivado.
Ningún cambio.

**Fase 1 · emitir el cobro sin tocar el dinero.** El entrenador conecta su
cuenta de Stripe; nosotros generamos el cobro o el enlace de pago contra *su*
cuenta. El dinero nunca pasa por nosotros. Es la opción A en su versión mínima
y no compromete a nada: si se decide no seguir, no hay nada que deshacer.

> **Ya adelantado (agosto de 2026):** la migración 0013 crea
> `client_payments`, donde cada cobro es un hecho con fecha e importe. Nació
> para poder exportar la contabilidad, pero es **la misma tabla** que recibirá
> los cobros de Stripe: tiene `method` (con `'stripe'` ya contemplado) y
> `external_id` con índice único, para que el reintento de un webhook no
> duplique la fila. Cuando llegue esta fase, el modelo de datos ya está.

**Fase 2 · suscripción domiciliada.** Mandato SEPA y cobro recurrente
automático. Aquí es donde aparece de verdad el riesgo de las 8 semanas, y
donde hay que tener escrita la política de devoluciones **antes** de activarlo.

**Fase 3 (opcional) · comisión de plataforma.** `NEGOCIO.md` §5 plantea un
porcentaje pequeño sobre lo facturado como segunda capa de ingresos. Connect lo
soporta de forma nativa. Ojo con el antecedente: TrueCoach metió un 5 % en 2026
y le llovieron críticas. Si se hace, con porcentaje bajo y transparente desde
el primer día, nunca como subida sorpresa.

---

## Consecuencias

**Se vuelve más fácil**

- Que el entrenador facture de verdad a su nombre, que es lo que pidió.
- Retenerlo: quien cobra a través de una herramienta no la cambia con
  facilidad.
- Justificar el plan Studio y el caso corporativo, donde la facturación
  conjunta es el argumento.

**Se vuelve más difícil**

- El soporte. Cuando un cobro falle, el entrenador **llamará a Treno, no a
  Stripe**. Es exactamente el coste que `NEGOCIO.md` §7 identifica como el
  único que escala mal con un fundador solo.
- Los términos de servicio: pasan a describir una relación de tres partes.
- Prometerlo en la landing antes de tenerlo. Ya pasó una vez: la landing decía
  "Programa, **cobra** y corrige", que solo se sostenía entendiendo "cobrar"
  como llevar el control de las cuotas. Corregido a "gestiona", que describe lo
  que sí hace hoy y además promete menos. Cuando exista la pasarela de verdad,
  el verbo puede volver.

**Habrá que revisarlo cuando**

- Se decida la forma jurídica (a partir del 18). Con una SL, Express deja de
  ser descartable de plano.
- Un número relevante de entrenadores abandone el alta de Stripe. Si la
  fricción resulta ser mortal, hay que reabrir el debate sabiendo lo que cuesta.

---

## Qué preguntar a los entrenadores

Va con las preguntas de la beta cerrada de `NEGOCIO.md` §6:

1. **¿Estarías dispuesto a darte de alta tú en Stripe, con verificación de
   identidad?** Es la pregunta que valida o tumba toda esta decisión. Hazla
   antes de escribir una línea de código.
2. **¿Pagarías por que te lo dejemos montado?** Mide si la contramedida de la
   consultoría es real o un consuelo nuestro.
3. **¿Cómo cobras hoy: efectivo, Bizum, transferencia, domiciliación?** Si ya
   domicilian, el mandato SEPA no les asusta. Si van a Bizum, es un salto
   cultural más grande de lo que parece.
4. **¿Cuántas veces al año te reclama un cliente un cobro?** Cuantifica el
   riesgo de las 8 semanas en vez de suponerlo.
5. **Si un cliente reclama y el banco le devuelve el dinero, ¿esperas que lo
   asumamos nosotros?** Incómoda a propósito. Más vale descubrir ahora que hay
   una expectativa distinta.

---

## Pasos

1. [ ] Hacer las cinco preguntas a los tres entrenadores que lo pidieron.
2. [ ] Decidir forma jurídica tras la cita del día 18.
3. [x] Revisar el verbo "cobra" de la landing. Hecho: ahora dice "gestiona".
4. [ ] Implementar la fase 1 (cobro contra su cuenta, sin tocar el dinero)
       **después** de las funcionalidades pendientes, las maquetas y las
       pruebas de rendimiento de subida de vídeo.
5. [ ] Escribir la política de devoluciones **antes** de activar la fase 2.
6. [ ] Confirmar la tarifa vigente de SEPA en España justo antes de implementar:
       los precios de esta ADR son de agosto de 2026 y cambian.

---

## Fuentes

- [Risk and liability management with Connect · Stripe](https://docs.stripe.com/connect/risk-management)
- [Disputes on Connect platforms · Stripe](https://docs.stripe.com/connect/disputes)
- [Understand how charges work in a Connect integration · Stripe](https://docs.stripe.com/connect/charges)
- [Connected account types · Stripe](https://docs.stripe.com/connect/accounts)
- [Payouts to connected accounts · Stripe](https://docs.stripe.com/connect/payouts-connected-accounts)
- [SEPA Direct Debit payment disputes · Stripe](https://support.stripe.com/questions/sepa-direct-debit-payment-disputes)
- [Domiciliación bancaria en España · Stripe](https://stripe.com/resources/more/direct-debit-in-spain)
- [Comisiones de Stripe en España · Quipu](https://getquipu.com/blog/comisiones-stripe/)
