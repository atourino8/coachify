# Principios de diseño · Coachify

Documento de obligado cumplimiento al construir o modificar interfaz en este
proyecto. Escrito tras analizar a la competencia y detectar que **nuestro
producto corría el mismo riesgo que el suyo: parecer generado por defecto**.

---

## El problema que estamos evitando

Al mirar el panel de Dupla, el diagnóstico no es "es feo". Es que es **inerte**:
podrías cambiarle el logo y el contenido y serviría para un CRM, un gestor de
proyectos o una app de finanzas. Nada en esa pantalla existe *porque sea una
herramienta para entrenadores*.

Los rasgos que delatan el patrón por defecto (y que Coachify ya tenía en parte):

- Fondo oscuro con un acento neón (cian, morado) y degradados en el logo.
- Todo en tarjetas redondeadas del mismo tamaño y el mismo peso visual.
- Icono dentro de un círculo de color, repetido en cada sección.
- Estados vacíos con un icono gigante centrado y dos líneas de texto gris.
- Espaciado uniforme en toda la pantalla: nada destaca porque todo destaca.
- Rejillas perfectamente simétricas de 2, 3 o 4 columnas.

Ninguna de esas decisiones está mal por separado. El problema es usarlas
**todas a la vez y siempre**, que es exactamente lo que sale por defecto.

---

## Reglas para este proyecto

### 1. La jerarquía la marca la tipografía, no la decoración
Antes de añadir un color, un borde o un icono, resolver la jerarquía con
tamaño y peso de texto. Saltos **agresivos**: si el titular es 32 px y el
cuerpo 14 px, se ve la diferencia; si es 18 y 14, no se ve nada.

### 2. Densidad de instrumento, no de landing
La herramienta de un entrenador se usa **muchas veces al día y con prisa**,
a menudo con el móvil en la mano en el gimnasio. Prioriza ver más información
por pantalla antes que dejar aire decorativo. El aire se reserva para separar
bloques con significado distinto, no para rellenar.

### 3. Una tarjeta solo si hay algo que agrupar
No convertir cada elemento en `card`. Una lista puede ser una lista, con
separadores finos. Las tarjetas son para agrupar cosas que van juntas, no un
estilo por defecto.

### 4. Nada de icono-en-círculo-de-color por sistema
Se permite un icono cuando **aporta reconocimiento** (un estado, una acción
repetida). No como adorno al lado de cada título.

### 5. Los estados vacíos tienen que ser útiles
Nada de icono grande + "aún no hay nada". Un estado vacío debe explicar **qué
gano si lo relleno** y darme el botón para hacerlo. Es el momento de máxima
atención del usuario nuevo: desperdiciarlo en un dibujo es un error caro.

### 6. Asimetría intencionada
No todo son rejillas iguales. Si un dato importa más que otros tres, que ocupe
más. Una columna ancha + una estrecha comunica prioridad; cuatro columnas
iguales comunican que da igual.

### 7. Una decisión cromática que sea nuestra
El azul oscuro corporativo es correcto pero anónimo. Hay que elegir **un** gesto
de color reconocible y sostenerlo — y evitar el cian/morado neón que usa
literalmente todo el sector.

### 8. Prohibiciones concretas
- Barras o franjas de color decorativas (cabeceras, laterales, bordes de un
  solo lado en tarjetas).
- Líneas de acento bajo los títulos.
- Degradados en texto.
- Emojis como iconografía de producto (distinto de un emoji puntual en copy).

---

## Cómo se comprueba

Antes de dar por buena una pantalla, dos preguntas:

1. **¿Esta pantalla podría ser de otro producto cualquiera?** Si la respuesta
   es sí, no hay ninguna decisión de diseño dentro, solo componentes por
   defecto.
2. **¿Qué es lo primero que mira el ojo?** Si no hay una respuesta clara, o si
   lo primero que se ve no es lo más importante de esa pantalla, la jerarquía
   está rota.

---

## Nota sobre el ritmo

Esto **no** significa rediseñarlo todo ahora. El orden acordado es: primero la
funcionalidad que necesita el caso corporativo, y el rediseño después, cuando
sepamos qué producto vamos a enseñar. Pero a partir de ya, **lo nuevo se
construye siguiendo estas reglas** en vez de acumular más deuda visual.

---

## La paleta: dónde vive y cómo se cambia

Los colores **no están en `tailwind.config.js`**. Están en un único bloque
`:root` de `src/app.css` como variables CSS, y la configuración de Tailwind
solo dice qué variable usa cada token.

**Para cambiar la paleta entera se tocan esas variables y nada más.** Ningún
componente menciona un color concreto: todos usan tokens (`bg`, `surface`,
`accent`, `line`, `text`…). Probar una dirección visual distinta es reescribir
trece líneas, no treinta archivos.

### Por qué canales RGB y no hexadecimal

Las variables guardan `179 68 30`, no `#B3441E`. Es obligatorio: el proyecto
usa transparencias por todas partes (`bg-accent/5`, `border-line/50`,
`bg-surface-2/60`) y Tailwind las compone como `rgb(var(--c-accent) / 0.05)`.
Con un hexadecimal dentro de la variable, **todas esas opacidades dejarían de
aplicarse sin dar ningún error**. Es la peor forma de romperse: en silencio.

### Marca por entrenador (pendiente de implementar)

La decisión tomada es que cada entrenador pueda poner su color, y que lo vean
**tanto él como sus clientes** — es su espacio dentro de la aplicación. Va
incluido desde el primer plan: pesa más el boca a boca que cobrarlo aparte.

El mecanismo, cuando toque, es directo: redefinir `--c-accent` en un
contenedor. Las variables CSS cascadean, así que repinta todo lo que hay dentro
—incluidas las transparencias— sin tocar una sola plantilla.

Tres reglas de esa personalización:

1. **Se deriva una familia de su tono, no se usa su color en todas partes.**
   Lo que alguien reconoce como "su color" es el tono, no la luminosidad. De su
   hex se generan una variante clara (fondos, pastillas), la suya tal cual
   (superficies grandes, elementos decorativos) y una oscurecida para texto
   pequeño y enlaces, que es lo único obligado a cumplir 4.5:1. Así un celeste
   o un amarillo funcionan sin pedirle a nadie que cambie de color.
2. **`danger`, `warning` y `success` no se personalizan.** Comunican
   significado. Un aviso de error en el verde de la marca de alguien deja de
   decir que es un error.
3. **Dentro es su espacio; fuera somos nosotros.** La aplicación va con su
   marca, incluida la pantalla donde su cliente estrena la contraseña (el
   enlace de invitación ya identifica al entrenador). La landing y el login
   genérico siguen siendo de Coachify: ahí no sabemos quién entra, y es nuestro
   escaparate.

### Deuda anotada

El feedback recibido sobre el papel blanco es que resulta **demasiado simple**.
Está pendiente de analizar; la sospecha es que no se resuelve solo con color
—la aplicación no tiene ni una sola imagen— pero el trabajo de modularidad de
arriba existe precisamente para que probar alternativas salga barato.
