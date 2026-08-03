# Coachify · Modelo de negocio

Documento de trabajo. Decisiones tomadas, escenarios con números y lo que
queda por validar.

---

## 1. Posicionamiento

**Para quién:** el entrenador personal **presencial** que quiere dar el salto
al híbrido — autónomo en gimnasio ajeno, con estudio propio o a domicilio.
No el coach 100% online (ese ya tiene a Dupla y a los americanos).

**El problema real que resolvemos:** cuando el cliente no puede ir, la sesión
se cae y el entrenador pierde ese ingreso. Viajes, niños, trabajo, una lesión
leve. Es una fuga constante e invisible.

**Lo que hace Coachify:** convierte la cancelación en continuidad. El cliente
no va, pero tiene su entreno en casa, lo registra y manda su vídeo de técnica.
El vínculo no se rompe y el entrenador no pierde el mes.

**La consecuencia para el entrenador (aquí está el valor):** puede pasar de
**cobrar por sesión** a **cobrar una cuota mensual**. Le estabiliza los
ingresos y le sube el valor de cada cliente. No le vendemos "gestiona rutinas",
le vendemos previsibilidad en su facturación.

> **Frase de venta:** *Una sola sesión recuperada al mes ya paga la
> suscripción.* A 40-50 € la sesión, Coachify a 29 €/mes se amortiza con
> menos de una cancelación rescatada.

---

## 2. Modelo de precios

Decisión: **precio plano por entrenador**, no por número de clientes.

**Por qué podemos permitírnoslo y la competencia no:**

1. El tope de 2 vídeos por ejercicio acota el coste por cliente a ~0,04 $/mes.
2. Nuestro segmento está limitado por las horas del día: un entrenador
   presencial no puede tener 200 clientes, tiene 20-40. El riesgo de que
   alguien reviente el plan es teórico.

Los tres competidores (Trainerize, TrueCoach, Dupla) cobran por cliente. Ese
es el hueco: **no penalizamos al que crece**.

| Plan | Precio | Qué incluye |
|---|---|---|
| **Prueba** | 14 días gratis | Todo. Sin tarjeta. |
| **Pro** | **29 €/mes** | Todo: entrenamientos, agenda, seguimiento, ficha, corrección de técnica. Hasta 40 clientes (tope de seguridad, no comercial). |
| **Studio** | **79 €/mes** | Varios entrenadores bajo una marca. Para estudios y boxes. |

**Sin plan gratuito permanente.** En modo bootstrap, el free tier genera coste
de soporte sin ingreso y atrae al que nunca va a pagar. Mejor prueba de 14 días
y conversación directa.

**Referencia de mercado:** Dupla 15-100 USD/mes (por cliente, en dólares),
TrueCoach 26-165 USD, Trainerize 115-200 USD con add-ons. A 29 € estamos en
la mitad del rango con más producto para el presencial.

---

## 3. Economía unitaria

**Costes fijos:** ~70 $/mes (Supabase 25, Vercel 20, email 20, dominio 5).
**Coste variable:** ~0,04 $ por cliente/mes → un entrenador con 18 clientes
cuesta ~0,72 $/mes.

| Entrenadores | Ingreso/mes | Coste | Beneficio | Margen |
|---:|---:|---:|---:|---:|
| 5 | 145 € | 74 $ | 77 € | 53% |
| 25 | 725 € | 88 $ | 644 € | 89% |
| 40 | 1.160 € | 99 $ | 1.069 € | 92% |
| 60 | 1.740 € | 113 $ | 1.635 € | 94% |
| 100 | 2.900 € | 142 $ | 2.769 € | 95% |
| 150 | 4.350 € | 178 $ | 4.185 € | 96% |

**Punto de equilibrio: 3 entrenadores.**

Cuántos hacen falta para vivir de esto:

- 500 €/mes netos → **20 entrenadores**
- 1.000 €/mes netos → **38 entrenadores**
- 2.000 €/mes netos → **73 entrenadores**
- 3.000 €/mes netos → **108 entrenadores**

---

## 4. Escenarios a 18 meses

### A · Conservador
25 entrenadores. **~725 €/mes** (8.700 €/año). Proyecto rentable que se paga
solo y deja margen, pero no sustituye un sueldo. Válido como negocio paralelo.

### B · Objetivo
60-75 entrenadores. **~1.800-2.200 €/mes**. Ya es un sueldo. Aquí tiene
sentido plantearse dedicarle jornada completa y contratar apoyo de soporte.

### C · Consolidado
150+ entrenadores. **~4.400 €/mes** solo de suscripción. En este punto se
activa la segunda capa (cobros integrados) y tiene sentido plantear la ronda
desde una posición de fuerza: con ingresos, no con promesas.

**Lectura:** el escenario A se alcanza con 25 clientes. Eso son 25
conversaciones que salen bien. Es un objetivo de venta directa, no de
marketing masivo.

---

## 5. Segunda capa de ingresos (más adelante)

Si queremos que el ingreso escale con el éxito del entrenador, el sitio
correcto **no es el número de clientes, son los cobros**.

Un porcentaje pequeño sobre lo que el entrenador factura a través de la app
escala con su negocio, no con nuestro coste de servidor. Y se explica bien:
*ganamos cuando tú ganas*, frente a *te cobramos más por tener más gente*.

Ojo: TrueCoach metió un 5% en 2026 y es muy criticado. Si lo hacemos, con un
porcentaje bajo y transparente desde el principio, nunca como subida sorpresa.

---

## 6. Lo que hay que validar (beta cerrada)

Preguntas concretas para las primeras 10 conversaciones:

1. **¿Cuántas sesiones se te caen al mes por cancelación?** → cuantifica el
   dolor y valida la tesis completa.
2. **¿Cómo cobras hoy: sesión, bonos o cuota?** → si es sesión/bonos, somos
   el vehículo para pasar a cuota.
3. **¿Pagarías 29 €/mes por esto?** → preguntar directamente, no insinuar.
4. **¿Usarías la corrección por vídeo, o es una idea bonita?** → es nuestro
   diferenciador; si no la usan, el posicionamiento cambia.
5. **¿Qué te falta para dejar el Excel/WhatsApp hoy mismo?** → la respuesta
   marca el roadmap real.

---

## 7. Riesgos anotados

- **El coste que sí escala es el soporte humano**, no el almacenamiento. 100
  entrenadores con dudas son una persona a tiempo parcial.
- **Guerra de precios:** Dupla arranca en 15 USD. No competir por precio;
  competir por segmento (presencial) y por producto (agenda + técnica).
- **Dependencia de un canal:** si toda la captación es Instagram y cambia el
  algoritmo, se seca. Diversificar pronto.

---

## 8. Decisiones pendientes

- [ ] Nombre definitivo (Coachify tiene conflicto; Entrenify es el favorito)
- [ ] Confirmar precio 29 € tras las primeras conversaciones
- [ ] Canal de captación principal para los primeros 25
- [ ] Si el plan Studio se lanza ya o se deja para más adelante
