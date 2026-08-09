# Principios de diseño · Coachify

Documento de obligado cumplimiento al construir o modificar interfaz en este
proyecto.

> **Por qué existe este archivo.** Un modelo de lenguaje no tiene gusto: tiene
> correlaciones estadísticas. Sin una dirección escrita, produce **la media de
> lo que ha visto**, y la media del código web de los últimos años es Tailwind
> con `indigo-500`, tipografía Inter, tres tarjetas redondeadas en fila y un
> degradado morado. Por eso el criterio tiene que vivir **en el repositorio y
> no en la cabeza de quien lo escribe**: la conversación se pierde, el archivo
> no. Si algo de aquí se incumple, el fallo es de este documento por no ser
> suficientemente concreto — arréglalo aquí, no solo en la pantalla.

---

## 1. Las señales de "hecho por IA"

Lista concreta. Si una pantalla tiene tres o más, hay que rehacerla.

**Tipografía**

- Inter, Poppins o Montserrat sin una razón. Inter es la fuente por defecto del
  ecosistema y aparece en todas las listas de delatores.
- Un único tamaño de titular para todo, con saltos pequeños respecto al cuerpo.

**Color**

- Cualquier color por defecto de Tailwind (`indigo-500`, `slate-800`,
  `blue-600`…). En este proyecto **está prohibido**: solo tokens.
- Degradados de morado a azul. Degradados en texto. Degradados en el logo.
- Un acento neón (cian, morado, lima ácido) sobre casi-negro azulado, que es lo
  que usa el sector fitness entero.

**Estructura**

- Tres tarjetas de características en fila, con icono, título y dos líneas.
- Tabla de precios de tres planes con el del medio elevado y una etiqueta
  "Popular".
- Acordeón de preguntas frecuentes al final de la página.
- Todo dentro de tarjetas redondeadas del mismo tamaño y el mismo peso visual.
- Icono dentro de un círculo de color, repetido en cada sección.
- Rejillas perfectamente simétricas para todo. Espaciado uniforme en toda la
  pantalla: nada destaca porque todo destaca.
- Estados vacíos con un icono gigante centrado y dos líneas de texto gris.

Ninguna de estas decisiones está mal por separado. El problema es usarlas
**todas a la vez y siempre**, que es exactamente lo que sale por defecto.

### Auditoría del proyecto (agosto de 2026)

Medido sobre el código, no de oído:

| Señal                        | Estado                                                     |
| ---------------------------- | ---------------------------------------------------------- |
| Colores por defecto Tailwind | **0** · limpio, la disciplina de tokens funciona            |
| Degradados                   | **0** · limpio                                              |
| Tipografía Inter             | **Presente** · pendiente de sustituir                       |
| Serif decorativa (Fraunces)  | **Presente** · era el disfraz de cuaderno, hay que quitarla |
| Tres tarjetas + precios      | **En la landing** · `src/routes/+page.svelte`               |

Las rejillas de tres columnas del resto de la aplicación (tres estadísticas,
tres opciones de esfuerzo) **no son la señal**: ahí el tres viene del dato, no
de la plantilla. La señal es el bloque de marketing de tres tarjetas iguales.

---

## 2. El error del cuaderno (aprendido a base de equivocarse)

La primera dirección de este proyecto fue "cuaderno de entrenador": fondo
papel, tinta y una serif con carácter. Nació de una intención correcta —salir
del oscuro con neón del sector— y **estaba mal por dos motivos**:

1. **Contradecía la promesa del producto.** Coachify se vende como "deja el
   Excel, el WhatsApp y la libreta". Diseñar algo que parece una libreta le
   recuerda al entrenador exactamente lo que quiere abandonar.
2. **El feedback de entrenadores reales fue unánime:** el blanco chirriaba, en
   el panel del entrenador, en la landing y en la pantalla del cliente. Buscan
   dinamismo; el papel les resultaba sobrio e inerte.

**Lo que sobrevive de aquella dirección es el esqueleto** (las reglas de la
sección 3): densidad, jerarquía tipográfica, ausencia de decoración. Lo que se
descarta es la piel: papel, serif y nostalgia.

Lección general: *huir de un cliché no garantiza acertar*. La primera dirección
evitaba el cliché del sector y aun así fallaba, porque se eligió por oposición
a otra cosa en vez de por lo que el producto necesita.

---

## 3. Reglas de construcción

### 3.1 La jerarquía la marca la tipografía, no la decoración

Antes de añadir un color, un borde o un icono, resolver la jerarquía con tamaño
y peso. Saltos **agresivos**: si el titular es 32 px y el cuerpo 14 px, se ve
la diferencia; si es 18 y 14, no se ve nada.

### 3.2 En esta aplicación, los números son el contenido

`4×8 a 60 kg`, `+20 kg en ocho semanas`, `3 de 5 series`. Hoy muchos se pintan
en gris pequeño, como si fueran metadatos. **Los datos de entrenamiento van
grandes y en cifras tabulares** (`tabular-nums`, para que no bailen al
actualizarse). Agrandarlos no es decorar: es poner delante lo que importa.

### 3.3 Densidad de instrumento, no de landing

La herramienta se usa muchas veces al día y con prisa, a menudo con el móvil en
la mano en el gimnasio. Prioriza ver más información por pantalla antes que
dejar aire decorativo. El aire separa bloques con significado distinto; no
rellena.

### 3.4 Una tarjeta solo si hay algo que agrupar

Una lista puede ser una lista, con separadores finos (`.row`). Las tarjetas son
para agrupar cosas que van juntas, no un estilo por defecto.

### 3.5 Los estados vacíos tienen que ser útiles

Nada de icono grande y "aún no hay nada". Debe explicar **qué gano si lo
relleno** y dar el botón para hacerlo. Es el momento de máxima atención de un
usuario nuevo.

### 3.6 Asimetría intencionada

Si un dato importa más que otros tres, que ocupe más. Cuatro columnas iguales
comunican que da igual cuál mires.

### 3.7 Los iconos, cuando aportan reconocimiento

No como adorno junto a cada título. Sobre los emojis, matiz aprendido: **como
codificación tienen valor** —las caras de esfuerzo (😌 😅 🥵) comunican
intensidad más rápido que tres etiquetas de texto—; **como iconografía general
son la marca de la casa de cualquier IA**. La diferencia es si el emoji *dice
algo que el texto no dice*.

### 3.8 Prohibiciones

- Barras o franjas de color decorativas.
- Líneas de acento bajo los títulos.
- Degradados, en cualquier sitio.
- Colores literales en las plantillas: siempre tokens.

---

## 4. Cómo se comprueba

1. **¿Esta pantalla podría ser de otro producto cualquiera?** Si sí, no hay
   ninguna decisión de diseño dentro, solo componentes por defecto.
2. **¿Qué es lo primero que mira el ojo?** Si no hay respuesta clara, o si lo
   primero no es lo más importante, la jerarquía está rota.
3. **¿Cuántas señales de la sección 1 tiene?** Tres o más, se rehace.

---

## 5. La paleta: dónde vive y cómo se cambia

Los colores **no están en `tailwind.config.js`**. Están en un único bloque
`:root` de `src/app.css` como variables CSS; la configuración de Tailwind solo
dice qué variable usa cada token.

**Para cambiar la paleta entera se tocan esas variables y nada más.** Ningún
componente menciona un color concreto. Probar una dirección visual distinta es
reescribir trece líneas, no treinta archivos.

### Por qué canales RGB y no hexadecimal

Las variables guardan `179 68 30`, no `#B3441E`. Es obligatorio: el proyecto
usa transparencias por todas partes (`bg-accent/5`, `border-line/50`) y
Tailwind las compone como `rgb(var(--c-accent) / 0.05)`. Con un hexadecimal
dentro de la variable, **todas esas opacidades dejarían de aplicarse sin dar
ningún error**. Es la peor forma de romperse: en silencio.

### Marca por entrenador (decidido, pendiente de implementar)

Cada entrenador podrá poner su color, y lo verán **tanto él como sus
clientes** — es su espacio dentro de la aplicación. Incluido desde el primer
plan: pesa más el boca a boca que cobrarlo aparte.

Mecanismo: redefinir `--c-accent` en un contenedor. Las variables cascadean,
así que repinta todo lo de dentro —transparencias incluidas— sin tocar una
plantilla.

1. **Se deriva una familia de su tono, no se usa su color en todas partes.** Lo
   que alguien reconoce como "su color" es el tono, no la luminosidad. De su
   hex se generan una variante clara (fondos, pastillas), la suya tal cual
   (superficies grandes) y una oscurecida para texto pequeño y enlaces, que es
   lo único obligado a cumplir 4.5:1. Así un celeste o un amarillo funcionan
   sin pedirle a nadie que cambie de color.
2. **`danger`, `warning` y `success` no se personalizan.** Comunican
   significado, no identidad.
3. **Dentro es su espacio; fuera somos nosotros.** La aplicación va con su
   marca, incluida la pantalla donde su cliente estrena la contraseña. La
   landing y el login genérico siguen siendo de Coachify.

Efecto secundario valioso: si el color fuerte lo pone cada entrenador,
**dos instalaciones no pueden parecerse**. Es una defensa estructural contra
el aspecto genérico.

### Dirección visual: pendiente de decidir

Descartado el papel, hay tres candidatas sobre la mesa (grafito cálido, negro
técnico, arena profunda). **Mientras no se decida, no se toca la paleta.**
Cuando se decida, se anota aquí con el motivo.

Pendiente también: sustituir Inter y eliminar la serif.

---

## 6. Cómo trabajar con un diseñador (cuando lo haya)

Escrito de antemano para que la incorporación no se convierta en rehacerlo
todo. **El reparto es: el diseñador decide, yo ejecuto con fidelidad.**

### Lo que necesito recibir

No hacen falta cuarenta pantallas. Hacen falta cuatro cosas:

1. **Tokens de color con nombre y función**, no una lista de hexadecimales
   sueltos. `superficie-elevada`, `acento`, `línea` — el nombre dice dónde va.
   Entran directos en `src/app.css`.
2. **Escala tipográfica**: familia, tamaños y pesos, y para qué sirve cada
   escalón. Con el detalle de cómo se pintan los números, que en este producto
   son el contenido.
3. **Escala de espaciado**: qué valores existen. Si no está en la escala, no
   se usa.
4. **Dos o tres pantallas de referencia completas**, no bocetos. Con esas
   deduzco el resto; sin ellas, invento — y lo que invento es la media.

### Lo que me comprometo a hacer

- **No inventar valores.** Si un color, un tamaño o un espaciado no está en el
  sistema, se pregunta antes de improvisarlo.
- **No añadir componentes** que no estén en el sistema por comodidad.
- Traducir cada decisión a los tokens existentes, para que un cambio suyo se
  propague solo.
- Avisar cuando algo del diseño **rompa accesibilidad** (contraste por debajo
  de 4.5:1, objetivos táctiles pequeños) en vez de implementarlo callado. Un
  diseñador agradece el dato; nadie agradece descubrirlo en producción.
- Avisar cuando algo sea **caro de implementar** y exista una alternativa
  visualmente equivalente, con el coste de las dos.

### Lo que no debe pedírseme

Elegir la dirección visual. Puedo auditar, medir contraste, mantener
coherencia, implementar rápido y detectar cuándo algo se parece a todo lo
demás. Lo que no tengo es criterio propio fiable: si me dejan elegir, tiendo a
la media. Este documento existe justamente para tapar ese agujero mientras no
haya alguien con criterio.
