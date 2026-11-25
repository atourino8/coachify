# Sacar los vídeos a S3: qué dicen los números y cómo probarlo sin pagar

Investigación previa, antes de tocar nada. Fecha: 17 de septiembre de 2026.

---

## El titular, porque cambia el motivo de hacerlo

**Guardar en S3 no es más barato que guardar en Supabase.** Los precios de
almacenamiento son prácticamente el mismo número:

| | Por GB al mes |
| --- | --- |
| Supabase Storage | **0,0213 $** |
| Amazon S3 Standard | **≈ 0,023 $** |

S3 sale, si acaso, un pelín más caro.

**Lo que sí cambia de orden de magnitud es la salida de datos** —el *egress*—,
que en una aplicación de vídeo es el gasto que manda: un vídeo se guarda una vez
y se ve cientos.

| | Salida |
| --- | --- |
| Supabase Pro | 250 GB incluidos, después **0,09 $/GB** |
| CloudFront (el CDN de AWS) | **1 TB al mes gratis, para siempre**, y 10 millones de peticiones |

Ese «para siempre» es literal: es parte de los servicios *always free*, no del
periodo de prueba, y sigue vigente en 2026.

**Conclusión: el ahorro no está en S3, está en CloudFront.** Mover los ficheros
a S3 y servirlos desde la propia URL de S3 no ahorra prácticamente nada y añade
un proveedor. Lo que tiene sentido es S3 **con CloudFront delante**.

---

## Cuándo empieza a importar

Con una estimación gruesa: un cliente que entrena 3 días por semana y abre unos
12 vídeos semanales de 30 MB de media son ~1,5 GB al mes. Quince clientes por
entrenador, ~22 GB al mes por entrenador.

| Entrenadores | Salida al mes | Supabase Pro | S3 + CloudFront |
| --- | --- | --- | --- |
| 10 | ~220 GB | incluido | incluido |
| 25 | ~550 GB | ~27 $/mes | incluido |
| 50 | ~1,1 TB | ~76 $/mes | ~0–10 $/mes |
| 100 | ~2,2 TB | ~176 $/mes | ~110 $/mes |

**Hasta unos 25 entrenadores esto no ahorra un euro.** A 50 empieza a doler, y
ahí el cambio se paga solo.

Hoy hay **cero usuarios**. Así que esto no es una optimización urgente: es
averiguar con tiempo si el camino existe, para no descubrirlo con prisa el día
que la factura suba.

---

## Lo que cuesta, y no es dinero

1. **Las URL firmadas cambian de dueño.** Hoy quien decide si un cliente puede
   ver un vídeo es **Supabase**, con las políticas del cubo y `createSignedUrls`.
   Con CloudFront, firmar pasa a ser cosa nuestra (pares de claves, caducidad).
   Es decir: **una garantía que hoy vive en la base de datos se muda al código
   de la aplicación**. Se puede hacer bien, pero deja de estar protegida por RLS
   y pasa a depender de que no nos equivoquemos.

2. **Un proveedor más y unas credenciales más.** Con las reglas que ya tenemos:
   las claves no van al repositorio.

3. **Dos sitios donde pueden quedar huérfanos.** Ya arrastramos las dos formas
   de ruta del cubo (ver ADR-005). Añadir un tercer sitio sin resolver aquello
   es acumular.

---

## La prueba de concepto: qué probar exactamente

No «montar S3». Tres preguntas concretas, y ninguna necesita tocar Treno:

1. **¿Se puede servir un vídeo desde CloudFront con URL firmada y caducidad?**
   Subir un MP4 de prueba, dejar el cubo **privado**, poner CloudFront delante
   con OAC, generar una URL firmada de 5 minutos y comprobar dos cosas: que se
   reproduce, y que **pasados los 5 minutos deja de reproducirse**. Lo segundo
   importa más que lo primero.

2. **¿La URL del cubo, sin firmar, está realmente cerrada?** Intentar abrir el
   objeto directamente por su URL de S3 y confirmar que da 403. Si no, todo lo
   anterior es decorado.

3. **¿Cuánto cuesta de verdad?** Dejarlo una semana y mirar el desglose de
   facturación. Los números de arriba son estimaciones mías; la factura no
   estima.

---

## Cómo no pagar: esto va primero, antes de crear nada

**La capa gratuita de AWS cambió el 15 de julio de 2025.** Una cuenta nueva ya
no tiene los 12 meses de antes: elige plan gratuito o de pago, con 100 $ de
crédito (200 $ completando las tareas de bienvenida), y **el plan gratuito
caduca a los 6 meses o al agotar el crédito, lo que llegue antes**.

> **Y al caducar, la cuenta se cierra y los recursos se apagan.** Hay 90 días
> para pasar a plan de pago y recuperar los datos antes de que se borren. Por
> eso esto es una **prueba**, y nada que queramos conservar puede vivir aquí.

Pasos, en este orden:

1. **Antes de crear el cubo**, en *Billing → Budgets*, un presupuesto de coste
   con aviso en **1 $**. Es el freno de mano y cuesta un minuto.
2. Activar también el aviso de uso de la capa gratuita al **85 %**.
3. Un cubo en **eu-west-1** (Irlanda) o **eu-south-2** (España). En la UE, por
   los datos personales: son vídeos de gente entrenando.
4. **Bloquear todo el acceso público** en el cubo. Es la opción por defecto;
   la prueba consiste precisamente en servirlo sin abrirlo.
5. Subir **un** vídeo de prueba. No el material real de nadie.
6. CloudFront delante, con OAC, y las pruebas 1 y 2 de arriba.
7. **Al terminar, borrar el cubo y la distribución.** Lo que no existe no
   factura.

---

## Lo que NO hay que hacer en esta prueba

- **No mover el material real.** Es una prueba en una cuenta que se
  autodestruye a los seis meses.
- **No meter las claves en el repositorio**, ni en `.env` del proyecto.
- **No usar la clave raíz de la cuenta.** Un usuario IAM con permiso sobre ese
  único cubo.
- **No tocar el código de Treno todavía.** Si la prueba sale bien, entonces se
  escribe un ADR y se decide. Si sale mal, no hemos tocado nada.

---

## Lo que no sé y habría que comprobar

- **El precio exacto de S3 en las regiones europeas.** Los 0,023 $ son de
  Virginia; Irlanda y España son algo distintos y no lo he confirmado.
- **Si Supabase cobra egress por las URL firmadas igual que por el resto.**
  Doy por hecho que sí, pero no lo he verificado en su documentación.
- **El consumo real de Treno**, que es el dato que más falta hace y no existe:
  sin usuarios no hay medida. Toda la tabla de arriba es aritmética sobre una
  estimación inventada por mí, no una observación.
