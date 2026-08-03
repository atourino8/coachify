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
