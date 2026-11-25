# Las plantillas de correo, en castellano

Para pegar en *Authentication → Email Templates* del panel de Supabase. Una
pestaña por plantilla: se cambia el **asunto** y el **cuerpo**.

De fábrica salen en inglés. El primer correo de prueba de Treno llegó con el
asunto «Reset your password», que es lo que habría recibido el cliente de un
entrenador español.

---

## Antes de tocar nada: las dos cosas que las rompen

**1. Las variables se escriben exactamente así, con los espacios incluidos:**
`{{ .ConfirmationURL }}`. Si se escribe `{{.ConfirmationURL}}` o se traduce el
nombre, **no falla nada**: se envía el correo con el texto literal donde debería
ir el enlace, y el cliente recibe un correo roto. Es el mismo tipo de fallo
silencioso que los «campos fantasma» de las plantillas de Svelte.

**2. `{{ .Data.loquesea }}` con un dato que no existe imprime `<no value>`**,
no una cadena vacía. Por eso abajo va siempre dentro de un `{{ if }}`.

---

## 1 · Invitación de un cliente

Es **el correo más importante de Treno**: es el primer contacto de una persona
con la herramienta, y llega sin que lo haya pedido. Si parece publicidad, se
borra.

**Asunto**

```
Tu entrenador te ha dado acceso a Treno
```

**Cuerpo**

```html
<h2>Tu entrenador te ha dado acceso</h2>

<p>
  Tu entrenador usa Treno para prepararte los entrenamientos y seguir cómo van.
  Aquí verás lo que te toca cada día, con sus vídeos y sus notas.
</p>

<p>Para entrar, elige una contraseña:</p>

<p><a href="{{ .ConfirmationURL }}">Elegir mi contraseña</a></p>

<p>
  Si no esperabas este correo, puedes ignorarlo: sin contraseña no se crea
  ninguna cuenta.
</p>
```

> **Por qué no dice el nombre del entrenador**, que es lo que de verdad haría
> creíble la invitación: hoy no se puede. En los metadatos de la invitación
> (`clients/+page.server.ts`) solo viajan `full_name`, `role` y `coach_id` —y
> `coach_id` es un identificador, no un nombre—. Se arregla añadiendo
> `coach_name` ahí, y entonces la primera línea pasa a ser
> `{{ if .Data.coach_name }}{{ .Data.coach_name }} te ha dado acceso{{ end }}`.
> Es un cambio pequeño y merece la pena.

---

## 2 · Confirmar el registro de un entrenador

Este lo recibe quien se da de alta, o sea alguien que acaba de pulsar un botón y
está esperando el correo. Cuanto más corto, mejor.

**Asunto**

```
Confirma tu correo para empezar
```

**Cuerpo**

```html
<h2>Confirma tu correo</h2>

<p>Pulsa para confirmar esta dirección y terminar de crear tu cuenta:</p>

<p><a href="{{ .ConfirmationURL }}">Confirmar mi correo</a></p>

<p>Si no has sido tú, ignora este mensaje.</p>
```

---

## 3 · Recuperar la contraseña

**Asunto**

```
Cambiar tu contraseña de Treno
```

**Cuerpo**

```html
<h2>Cambiar tu contraseña</h2>

<p>Has pedido cambiar la contraseña de tu cuenta. Pulsa para elegir una nueva:</p>

<p><a href="{{ .ConfirmationURL }}">Elegir una contraseña nueva</a></p>

<p>
  El enlace caduca en una hora y solo sirve una vez. Si no has sido tú, ignora
  este correo: tu contraseña no cambia mientras no uses el enlace.
</p>
```

> Esa última frase no es relleno. Quien recibe esto sin haberlo pedido se
> asusta, y lo que necesita saber es exactamente eso: que no tiene que hacer
> nada.

---

## 4 · Cambiar la dirección de correo

**Asunto**

```
Confirma tu nueva dirección de correo
```

**Cuerpo**

```html
<h2>Confirma tu nueva dirección</h2>

<p>Pulsa para confirmar {{ .NewEmail }} como tu nuevo correo en Treno:</p>

<p><a href="{{ .ConfirmationURL }}">Confirmar la nueva dirección</a></p>

<p>Si no has pedido este cambio, ignora este correo y no se cambiará nada.</p>
```

> `{{ .NewEmail }}` **solo existe en esta plantilla**. En cualquier otra
> imprime vacío.

---

## Por qué son tan sosas

No es pereza; es lo que recomienda la documentación de Supabase para que no
acaben en spam, y encaja con lo que ya decidimos en `CORREO.md`:

- **Ni una palabra de marketing.** Los filtros clasifican como promocional
  cualquier correo de autenticación que explique lo buena que es la
  herramienta, y a partir de ahí va a la carpeta de spam.
- **Un solo enlace** por correo, el que hay que pulsar.
- **Sin imágenes ni logotipo.** Una imagen incrustada en un correo de
  autenticación resta más de lo que suma.
- **Sin emojis en el asunto**, y el asunto corto.
- **Se cambian poco.** Cada cambio de plantilla mueve la reputación; mejor uno
  grande que cinco pequeños.

---

## Cómo comprobar que quedaron bien

El panel tiene vista previa, pero **no sustituye las variables**: ahí siempre se
ve `{{ .ConfirmationURL }}` tal cual, y eso no dice nada. La comprobación de
verdad es mandarse uno:

1. Guarda las cuatro.
2. Pide recuperar tu contraseña desde `/recover`.
3. En el correo que llegue, mira **tres cosas**: que el asunto esté en
   castellano, que el enlace sea un enlace de verdad (azul y pulsable, no el
   texto `{{ .ConfirmationURL }}`), y que al pulsarlo llegues a elegir
   contraseña.

Las otras tres no se pueden probar así de fácil: la invitación necesita un
segundo destinatario —o sea, dominio verificado en Resend—, y el cambio de
correo necesita recorrerlo desde ajustes. Quedan pendientes de comprobar y
conviene saberlo.
