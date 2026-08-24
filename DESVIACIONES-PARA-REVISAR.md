# Seis sitios donde la aplicación no hace lo que dibuja el wireframe

Para enseñárselo al socio. Todo lo demás de las quince pantallas está tal cual
lo dibujó; esto es la lista completa de lo que no, con el motivo.

Ninguna es un olvido. Cada una se desvió por una razón concreta, y todas se
pueden cambiar. Lo que hace falta es que decida él, porque son decisiones de
diseño, no de código.

**Cómo contestar:** basta con «esta a mi manera» / «esta déjala». Al final de
cada punto pone lo que cuesta cambiarla.

---

## 1 · Aceptar o rechazar una cita (Agenda)

**El wireframe dibuja** dos iconos apilados al final de la fila: un ✓ verde
encima de una ✕ roja.

**La aplicación hace** un botón que pone **«Confirmar»**, y «Rechazar» dentro
del menú de tres puntos.

**Por qué.** Dos cosas, y la segunda pesa más que la primera:

- Apilados son dos zonas de pulgar de 24 px, una justo encima de la otra. Así
  es como se acepta una cita queriendo rechazarla, en el metro, con una mano.
- Aceptar y rechazar **no son la misma clase de acción**. Aceptar se deshace
  solo, rechazar le manda un aviso al cliente y no hay vuelta atrás. Ponerlos
  del mismo tamaño, uno al lado del otro, dice que dan igual. En el resto de
  la aplicación lo que destruye algo vive detrás del menú y pide confirmación.

**Si lo quiere a su manera:** un rato. Habría que decidir si el ✕ sigue
pidiendo confirmación (yo diría que sí, sea cual sea la forma).

---

## 2 · El separador de los avisos leídos

**El wireframe dibuja** «Notificaciones leídas».

**La aplicación pone** «Ya vistos (3)».

**Por qué.** El número. Con «Notificaciones leídas» hay que desplegar para
saber si hay tres o treinta. Y «avisos» es la palabra que usa el resto de la
aplicación: la pantalla se llama Avisos, no Notificaciones.

**Si lo quiere a su manera:** dos minutos. Es una frase.

---

## 3 · Elegir grupo al invitar a un cliente

**El wireframe dibuja** dos botones grandes: uno para elegir un grupo que ya
existe y otro para crear uno nuevo.

**La aplicación pone** un desplegable y un campo de texto, uno al lado del
otro. Al escribir en el campo, el desplegable se apaga y avisa de que se va a
crear el grupo.

**Por qué.** Los dos botones son un paso previo: eliges cuál de las dos cosas
vas a hacer, y luego la haces. Aquí las dos caben a la vez, así que el paso
previo no compra nada.

**Ojo, esto sí tiene un pero:** con dos campos a la vista, alguien puede
escribir el mismo nombre de grupo dos veces seguidas al invitar a dos personas
y acabar con dos grupos iguales. Con los dos botones eso no pasa tan fácil. Es
el argumento más fuerte a favor de su versión.

**Si lo quiere a su manera:** medio rato, y hay que dibujar qué pasa después
de pulsar cada botón.

---

## 4 · La barra Deshacer / Cancelar / Guardar del editor del día

**El wireframe la dibuja** pegada al fondo de la pantalla, siempre visible.

**La aplicación la pone** dentro del día desplegado, al final de sus
ejercicios.

**Por qué.** Esa pantalla es una lista de catorce días y se despliega **uno**
para editarlo. Una barra fija abajo que ponga «Guardar» no dice qué guarda: el
día abierto está a media pantalla de distancia y arriba y abajo hay otros
trece.

En la pantalla del entrenamiento completo —donde solo hay una cosa que
guardar— la barra sí está fija abajo, como él la dibuja.

**Si lo quiere a su manera:** habría que resolver antes qué dice la barra
para que se sepa a qué día pertenece.

---

## 5 · Abrir las etiquetas que no caben

**El wireframe dibuja** un `⌄` al final de la fila de etiquetas.

**La aplicación pone** `+3`, y al abrirlo «Ver menos».

**Por qué.** El `+3` dice **cuántas faltan**. Un chevrón dice que hay más,
pero no si es una o nueve, y eso cambia si te molestas en pulsarlo.

**Si lo quiere a su manera:** diez minutos.

---

## 6 · Lista o cuadrícula al abrir Clientes

**El wireframe dibuja** la cuadrícula de fotos.

**La aplicación abre en lista** la primera vez. Desde entonces recuerda lo que
elegiste, por dispositivo: si te quedas en cuadrícula, se queda en cuadrícula.

**Por qué.** En un móvil caben doce o catorce clientes en lista y siete en
cuadrícula. Con quince clientes la cuadrícula es más bonita; con sesenta es
desplazamiento. Como la elección se recuerda, esto solo decide **la primera
pantalla que ve alguien que acaba de entrar**.

**Si lo quiere a su manera:** un minuto, es cambiar el valor por defecto.

---

## Lo que no está a discusión

Una cosa más, por transparencia: el **punto de color** que marca si un cliente
está al día, vence pronto o está vencido **nunca va solo**. Lleva siempre
también la palabra, al pasar el ratón y para los lectores de pantalla.

Esto no es una preferencia. Uno de cada doce hombres no distingue el rojo del
verde, y el estado de pago no se puede comunicar solo con un color. El punto
se puede mover, agrandar o recolorear; lo que no puede es quedarse solo.
