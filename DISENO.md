# Principios de diseño · Treno

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

1. **Contradecía la promesa del producto.** Treno se vende como "deja el
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

## 3.9 El texto también delata

Esto se me había escapado, y es la mitad del problema: el aspecto de "hecho por
IA" no es solo visual. Hay un vocabulario que produce el mismo rechazo aunque
el diseño esté bien. Antes de enseñarle una pantalla a nadie:

- Ninguna frase que empiece por **"Potencia", "Desbloquea", "Transforma"** ni
  sus equivalentes en inglés.
- Ningún título de dos sustantivos abstractos encadenados ("Integración
  fluida", "Gestión inteligente").
- **Al menos una afirmación concreta con un número.**
- **Al menos una frase que suene a persona**, no a folleto.

Un texto genérico delata igual que un degradado morado, y la gente no técnica
lo detecta aunque no sepa explicar por qué.

---

## 4. Cómo se comprueba

`npm run lint` incluye `scripts/check-design.mjs`, que **falla el build** si
aparece un color de la paleta por defecto de Tailwind, un degradado, un
hexadecimal suelto en una plantilla o un valor fuera de la escala
(`p-[13px]`, `text-[11px]`). Los colores por defecto además ya no compilan,
porque `tailwind.config.js` declara `colors` fuera de `extend` y eso borra la
paleta de fábrica.

Es deliberado que rompa en vez de avisar: revisar esto a ojo funciona con lo
obvio y falla con la deriva lenta, que es la que acaba haciendo que un producto
parezca genérico. Si la escala no llega a donde necesitas, **el arreglo es
añadir un escalón en la configuración**, no improvisar un valor.

Y tres preguntas antes de dar una pantalla por buena:

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

### Marca por entrenador (implementado, agosto de 2026)

Cada entrenador pone su color, y lo ven **tanto él como sus clientes** — es su
espacio dentro de la aplicación. Incluido desde el primer plan: pesa más el
boca a boca que cobrarlo aparte.

Mecanismo: el servidor calcula las variables y las declara en el atributo
`style` de un contenedor que envuelve todo. Las variables CSS cascadean, así
que repinta lo de dentro —transparencias incluidas— sin tocar una plantilla.
Va en un atributo y no en una etiqueta `<style>` a propósito: un `<style>`
generado en servidor hay que escribirlo con `{@html}`, y con CSS inyectado se
puede leer el contenido de un formulario a base de selectores de atributo. Un
atributo lo escapa Svelte solo.

Tres variables: `--c-accent` (el color corregido, para todo), `--c-marca-fondo`
(el relleno del cuadro del logotipo, que admite degradado) y `--c-marca-tinta`
(la letra que va encima). La matemática está en `src/lib/brand.ts`.

1. **Se corrige la luminosidad, no se deriva una familia.** El plan original
   preveía tres variantes (una clara para fondos, la suya para superficies y
   una oscurecida para texto). Se descartó al implementarlo: ese plan se
   escribió cuando el fondo era papel, y sobre grafito no se oscurece nada,
   se aclara. Con una sola variante corregida hacia arriba se cubren los
   cincuenta y tantos usos del acento sin multiplicar los tokens ni obligar a
   revisar qué variante toca en cada sitio.
2. **Se aclara en HSL, no mezclando con blanco.** Mezclar con blanco desatura:
   el rojo de bomberos acaba en rosa palo y el entrenador ya no reconoce su
   color. Subiendo la L se conservan el tono y buena parte de la saturación.
   La búsqueda es binaria para devolver el color **menos** aclarado que cumple.
3. **Se le dice.** Si hemos tenido que tocar su color, la pantalla de marca se
   lo enseña con los dos números: cuánto contrastaba el suyo y cuánto contrasta
   el que usamos. Corregirlo en silencio sería peor que no corregirlo.
4. **`danger`, `warning` y `success` no se personalizan.** Comunican
   significado, no identidad.
5. **`--c-bg` tampoco.** Cada fondo nuevo multiplica los pares que hay que
   verificar, y el grafito es justo lo que hace que cualquier marca se vea
   encima.
6. **Dentro es su espacio; fuera somos nosotros.** En la pantalla del cliente
   manda él: su nombre y su inicial arriba, y "Hecho con Treno" en el pie, una
   vez y sin color. En el panel del entrenador el nombre sigue siendo Treno
   —él es nuestro cliente y ha contratado esta herramienta— y lo que cambia es
   el color. La landing y el login son de Treno.

Efecto secundario valioso: si el color fuerte lo pone cada entrenador,
**dos instalaciones no pueden parecerse**. Es una defensa estructural contra
el aspecto genérico.

**El punto débil**: `brand.ts` necesita el fondo como número para calcular
contrastes, así que la paleta está duplicada en dos ficheros. Si alguien
cambiara `app.css` sin tocar `brand.ts`, los contrastes se calcularían contra
un fondo inexistente y nada daría error. Por eso `check-design.mjs` compara
los dos valores y falla el build si divergen.

### Dirección visual vigente: grafito cálido

Elegida en agosto de 2026 entre tres candidatas (grafito cálido, negro técnico,
arena profunda). **Reversible**: cambiarla son trece variables.

Fondo casi negro **con temperatura** —tiene marrón dentro, no azul— y acento
naranja quemado. El matiz importa por dos razones: el casi-negro azulado con
acento neón es lo que usa el sector fitness entero, y un fondo cálido convive
mejor con la variedad de colores de marca que traerá cada entrenador.

Al pasar de claro a oscuro, `primary` cambió de significado: ya no es "tinta",
es **"máximo contraste sobre el fondo"** (tinta sobre papel, hueso sobre
grafito). Gracias a eso los 148 usos de `bg-primary`, `text-primary` y
`border-primary` siguieron funcionando sin tocar una plantilla: un botón
primario es claro sobre fondo oscuro y un borde de foco se ve.

Contrastes verificados sobre la paleta actual: texto 15.6:1, texto atenuado
7.05:1, acento 5.40:1, y las cuatro pastillas por encima de 4.5:1. Los
separadores se subieron a propósito hasta 1.67:1 porque por debajo de 1.5
desaparecen, y las listas densas se sostienen sobre ellos.

Pendiente: sustituir Inter y eliminar la serif Fraunces, que era parte del
disfraz de cuaderno.

### Degradados: la excepción de marca

La sección 1 prohíbe los degradados, y sigue en pie **para nosotros**: el
degradado morado-azul es la firma del diseño generado por defecto.

La excepción es el entrenador. Si su marca tiene un degradado, su cliente debe
verlo — es lo que hace que la aplicación se sienta su espacio, y es lo que
justifica que quiera pagar por él. Tres condiciones, más estrictas que las que
se plantearon al decidirlo:

- **El degradado vive solo en el cuadro del logotipo.** El plan hablaba de
  "superficies grandes de marca". Al implementarlo se redujo al cuadro, porque
  no hay ninguna otra superficie grande en la aplicación que no lleve texto
  encima.
- **Botones, enlaces y pastillas van en sólido**, con el color principal
  corregido. No es purismo: sobre un degradado el contraste cambia según dónde
  caiga cada letra, y ahí la legibilidad deja de poder garantizarse.
- **La inicial del cuadro es decorativa** (`aria-hidden`), y el nombre completo
  va escrito al lado en tinta normal. Hace falta porque hay degradados donde
  ninguna tinta se lee: `#0B2E59 → #3B82F6` atraviesa la franja de luminosidad
  en la que ni la clara ni la oscura llegan a 4.5:1. No es un fallo del
  cálculo, es una propiedad de ese degradado. WCAG 2.1 excluye del criterio
  1.4.3 el texto que forma parte de un logotipo, pero eso no basta: lo que
  hace que no se pierda información es que el nombre esté al lado. Y aun así
  la pantalla de marca **avisa** con el número, para que pueda decidir.

Lo que no se hace es ponerle una sombra a la letra para maquillar el número.
Eso arregla la métrica, no la lectura.

La diferencia entre las dos cosas: un degradado nuestro es pereza; el de un
entrenador es identidad.

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
