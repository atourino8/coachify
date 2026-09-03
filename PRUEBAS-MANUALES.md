# Pruebas manuales · lo que no se puede verificar sin ejecutar

**Por qué existe este documento.** Todo lo que se comprueba automáticamente en
este proyecto —`svelte-check`, el guardián de diseño, el formato, los bytes—
es **estático**. Demuestra que el código existe, compila y es coherente
consigo mismo. No demuestra que funcione.

Y hasta ahora se han escrito **nueve migraciones (0014–0022)**, dos políticas
de almacenamiento, un disparador y **tres funciones** que **nunca se han
ejecutado**. Ahí está concentrado casi todo el riesgo que queda.

Esta lista va ordenada por riesgo: probabilidad de estar roto × lo caro que
sale enterarse tarde. Con la base sembrada, son unos veinte minutos.

```
node scripts/seed-demo.mjs <tu-email>
```

El sembrado también pone **fotos de perfil** generadas (migración 0024). Si el
cubo `avatars` no existe, lo dirá con ese nombre y seguirá con lo demás.


---

## 0 · La última plaza, a dos manos (migración 0022)

**Va primero porque es lo único de este proyecto que no se puede comprobar
leyendo el código.** Todo lo demás falla igual siempre; esto falla solo cuando
dos personas coinciden.

**Qué probar.**

1. Clases → Nueva clase → mañana a las 19:00, **1 plaza**.
2. Abre la aplicación en **dos navegadores distintos** (o uno normal y otro de
   incógnito) con **dos clientes distintos**.
3. Los dos en Citas, con el botón «Apuntarme» a la vista.
4. Púlsalos **a la vez**. Vale con que sea más o menos.

**Qué tiene que pasar.** Uno entra con plaza y el otro con el mensaje de lista
de espera. **Nunca los dos con plaza.**

**Si fallan los dos con plaza**, el `for update` de `book_class` no está
haciendo su trabajo: mira si la función se creó de verdad (`\df book_class` en
el SQL editor) o si alguien está insertando en `class_bookings` sin pasar por
ella.

---

## 0b · Que la lista de espera ascienda sola

**Qué probar.** Con la clase anterior —uno dentro, uno esperando—, entra como
el que tiene plaza y pulsa **Soltar la plaza**.

**Qué tiene que pasar.** El otro pasa de «En lista de espera» a «Tienes plaza»
**sin hacer nada**, solo recargando. Y el entrenador ve el movimiento en el
detalle de la clase.

**Qué se está comprobando.** Que el ascenso ocurre dentro de la misma
transacción que la cancelación. Si hiciera falta que alguien «refrescara» para
que la cola avanzase, la plaza se quedaría muerta.

---

## 0c · Las faltas

**Qué probar.**

1. Crea una clase para **pasado mañana** (menos de dos días).
2. Apúntate como cliente. Al lado del botón de soltar la plaza tiene que salir
   ya el aviso de que le constará.
3. Suéltala.
4. Mira la ficha de ese cliente como entrenador, y el detalle de la clase.

**Qué tiene que pasar.** Al soltar, el mensaje dice que le consta. En la ficha
sale «Ha soltado la plaza de una clase tarde 1 vez». En la clase, la pastilla
«1 falta» junto a su nombre.

**El caso que importa de verdad:** repite con una clase a **una semana vista**.
Esa **no** debe contar. Si cuenta, la resta de `starts_at - interval '2 days'`
está al revés.

**Y el que se olvida:** que el ENTRENADOR saque a alguien no cuenta como falta,
porque la decisión no fue del cliente.

---

## 0d · Que la nota privada no se escape (migración 0025)

**Qué probar.**

1. Entrenamientos → uno cualquiera → escribe algo distinto en los dos campos:
   en «Notas para el cliente», *«trae toalla»*; en «Notas para ti», *«ojo con
   el hombro, no forzar»*. Guarda.
2. Aplícalo a un cliente desde su Calendario.
3. Entra como ese cliente y abre Hoy.

**Qué tiene que pasar.** Ve *«trae toalla»* y **no** ve lo del hombro. En
ninguna pantalla, tampoco en el detalle del ejercicio.

**Y el caso que se olvida:** escribe una nota a mano en el entreno de un día
concreto —*«hoy suave, que vienes de gripe»*— y luego aplica encima una
plantilla que **no** tenga notas para el cliente. La nota del día **debe
seguir ahí**: aplicar una plantilla sin notas no borra lo que había.

---

## 1 · Guardar un ejercicio (migraciones 0016 y 0019)

**Qué probar.** Biblioteca → cualquier ejercicio → marcar tres grupos
musculares → Guardar.

**Qué tiene que pasar.** Guarda sin error, y al volver a la lista el ejercicio
aparece con sus tres pastillas.

**Por qué es lo primero.** La restricción de la 0019 valida el array
convertido a texto con una expresión regular. Si el patrón está mal, **falla
absolutamente todo guardado de ejercicio**, y es el cimiento de las cinco
pantallas de biblioteca. Si esto no pasa, no sigas con lo demás.

**Si falla:** el mensaje de Postgres dirá
`violates check constraint "exercises_muscle_groups_forma"`.

---

## 2 · Que el disparador rellene la columna vieja (migración 0016)

**Qué probar.** Después del paso 1, abrir la ficha de un cliente que tenga ese
ejercicio programado, o el constructor de un día.

**Qué tiene que pasar.** Debajo del nombre del ejercicio sale su grupo
principal, que es **el primero de los tres** que marcaste.

**Por qué importa.** Quince pantallas siguen leyendo `muscle_group`, la
columna suelta, que ya no se escribe desde el código: la mantiene un
disparador. Si no funciona, esas pantallas no dan error — simplemente **dejan
de enseñar la etiqueta**, que es mucho peor porque no se nota.

---

## 3 · Subir un vídeo y verlo como cliente (migración 0017)

**Qué probar.**

1. Biblioteca → un ejercicio → Vídeo → **Subir vídeo**.
2. Guardar.
3. Salir, entrar como `demo.lucia@<tu-dominio>` (contraseña `demo1234`).
4. Hoy → abrir ese ejercicio.

**Qué tiene que pasar.** La barra de progreso avanza de verdad y llega al
100 %; tras guardar pone «Subido»; y el cliente ve el vídeo reproducirse.

**Por qué es el más frágil.** Son tres cosas nuevas encadenadas: el cubo
`coach-media`, dos políticas de acceso escritas a mano, y una subida por
XMLHttpRequest contra un cubo distinto del de siempre.

**Los tres fallos posibles, y qué significan:**

| Síntoma                                  | Dónde está el problema                        |
| ---------------------------------------- | --------------------------------------------- |
| La subida da 403                          | La política de escritura del entrenador        |
| Sube bien pero el cliente no ve nada      | La política de lectura de los clientes         |
| Sube bien y el entrenador tampoco lo ve   | La URL firmada, no las políticas               |

---

## 4 · Etiquetas propias (migración 0019)

**Qué probar.** Ajustes → Etiquetas → escribir «Suelo pélvico» → Añadir.
Luego ir a un ejercicio y comprobar que sale en el selector. Luego volver a
Ajustes y borrarla.

**Qué tiene que pasar.** Se añade como «Suelo pélvico» (con su tilde), aparece
en el selector al final, y al borrarla el mensaje dice de cuántos ejercicios
se ha quitado.

**Qué se está probando de verdad.** Que el identificador derivado
(`suelo_pelvico`) pasa la restricción de forma, y que al borrar no queda
ningún ejercicio apuntando a una etiqueta que ya no existe.

---

## 5 · Pausar a quien no paga (migración 0015)

**Qué probar.**

1. Cobros → abajo → mirar **la lista de a quién afectaría**. Debería salir
   Nadia y solo Nadia.
2. Activar la pausa.
3. Entrar como `demo.nadia@<tu-dominio>`.

**Qué tiene que pasar.** Nadia ve la pantalla de acceso en pausa al ir a Hoy,
pero **sí** puede abrir Progreso y Citas. Iván (vencido hace tres días) sigue
entrando con normalidad y ve el aviso amarillo con la cuenta atrás.

**Lo que se está comprobando.** Que el corte pasa por el servidor y no solo
por la plantilla, y que el historial del cliente sigue siendo suyo.

---

## 6 · Avisos y la campana (migración 0018)

**Qué probar.** Marcar un aviso como visto, y volver a pulsar «Visto» en el
mismo. Después confirmar la cita de Marcos desde el inicio.

**Qué tiene que pasar.** Marcar dos veces no da error. Y al confirmar la cita,
**el aviso desaparece solo** y el número de la campana baja.

**Por qué la segunda parte.** Es la prueba de que los avisos se derivan y no
se guardan. Si el aviso se queda después de confirmar, algo se está
almacenando que no debería.

---

## 7 · El cajón, en un móvil de verdad

**Qué probar.** Abrir la aplicación **en el teléfono**, no en el navegador de
escritorio estrechado.

**Qué mirar:**

- El cajón ocupa la pantalla entera, no una franja de sesenta píxeles.
  (Si ocupa una franja, es el `backdrop-filter` de la cabecera.)
- La flecha de cerrar está arriba a la **izquierda** y no se solapa con la
  hamburguesa.
- Tocar un destino cierra el cajón.
- Los cinco destinos llevan icono.

**Por qué en el móvil de verdad.** El fallo del bloque contenedor de los
elementos `fixed` no se reproduce estrechando la ventana del escritorio.

---

## 8 · El sitio bajo el nombre (migración 0020)

**Qué probar.** Ajustes → «Dónde entrenas habitualmente» → «Gimnasio Pepe» →
Guardar. Abrir el cajón.

**Qué tiene que pasar.** Sale bajo tu nombre. Si lo borras, el cajón ofrece
ponerlo en vez de dejar el hueco.

---

## 9 · Lo que ya funcionaba y he tocado sin volver a probar

Esto no es funcionalidad nueva: es **regresión**. Se ha cambiado el layout del
cliente, su pantalla de Hoy y el detalle de ejercicio, y desde entonces nadie
los ha abierto.

- Entrar como cliente y **registrar una serie**: peso, repeticiones, marcar.
- **Subir un vídeo de técnica** desde el detalle de un ejercicio.
- **Pedir una cita** desde Citas.
- Ver la **gráfica de progreso** de Carla, que tiene ocho semanas de historial.

---

## Qué hacer con lo que salga

Apúntalo tal cual —qué hiciste, qué esperabas, qué pasó— sin intentar
diagnosticarlo. El diagnóstico es más rápido con el síntoma exacto que con una
teoría intermedia.
---

## Confirmar una cita (móvil)

Salió probando: se pulsaba «Confirmar» y **no pasaba nada visible** hasta
recargar, y entonces la fila había desaparecido.

1. En **Agenda → Citas**, una cita **futura** pendiente. Pulsa «Confirmar».
   - El botón tiene que decir **«Confirmando…»** y quedarse apagado.
   - Al volver: aviso verde **«Cita confirmada.»** arriba, y la pastilla de la
     fila pasa a **«Confirmada»**. La fila **no desaparece**.
2. Una petición **cuya hora ya pasó**. Tiene que estar en su propia sección,
   **«Sin contestar, y ya pasaron»**, y NO entre las próximas.
   - Ahí no hay «Confirmar» —no tiene sentido confirmar una hora que pasó— pero
     sí «Rechazar», para quitarla de en medio.
3. Con la red a 3G lenta (herramientas del navegador), repite el paso 1 y
   comprueba que **no se puede pulsar dos veces** mientras va.

---

## «Sin guardar» después de guardar

1. **Rutinas → Entrenamientos → abre uno.** Cambia un peso y comprueba que sale
   **«Sin guardar»** arriba.
2. Pulsa **Guardar**. Tiene que salir el aviso de guardado **y desaparecer el
   «Sin guardar»**. Antes se quedaban los dos a la vez, que es lo contrario de
   lo que hace falta saber.
3. Cambia otra cosa: vuelve a salir «Sin guardar». Guarda otra vez: se va.
4. **Que falle a propósito**: con las herramientas del navegador, corta la red y
   pulsa Guardar. El «Sin guardar» **tiene que seguir ahí** — los cambios de
   verdad no se guardaron.
5. Lo mismo en la **ficha del cliente → Calendario**, abriendo un día y
   guardándolo desde ahí.

---

## Los avisos, ahora que son uno solo

La idea a comprobar es sencilla: **ninguna acción se queda muda, y el aviso se
ve sin tener que subir**.

1. **En móvil (o con la ventana estrecha), Agenda → Proponer cita.** Rellena el
   formulario entero, que es largo, y envíalo **desde abajo del todo**. El aviso
   tiene que verse **sin desplazarte**: flota sobre la pantalla, no está en la
   cabecera. Este era el fallo original.
2. **Se va solo.** Espera cinco segundos: desaparece sin tocar nada.
3. **Sobrevive al salto.** Biblioteca → abre un ejercicio → menú → **Archivar**.
   Aterrizas en la biblioteca, con el ejercicio ya fuera de la lista, y el aviso
   **«Ejercicio archivado»** tiene que estar ahí. Si no, el mensaje se perdió en
   la redirección y estamos donde empezamos.
4. **No se repite.** Recarga esa misma página: el aviso **no** vuelve a salir.
5. **Los errores NO flotan.** Ajustes → crea una etiqueta con el nombre vacío.
   El error sale **junto al campo** y **no se va solo**.

### Las cuatro excepciones

6. **Inicio → rechazar una cita.** Arriba flota «Cita rechazada»; en la página
   se queda **«¿Le has dado sin querer? · Deshacer el rechazo»**. Espera diez
   segundos: el aviso se fue, **el botón sigue**. Púlsalo y comprueba que la
   cita vuelve a pendiente.
7. **Biblioteca → marca dos ejercicios → Archivar.** Igual: aviso flotante
   arriba, **«Deshacer el archivado»** abajo, y sigue ahí pasado el aviso.
8. **Clientes → invitar en lote** con dos correos válidos y uno inventado con
   dominio real. Tiene que quedarse en la página **la lista de los que
   fallaron**, con el motivo de cada uno.
   - Con todos válidos: **no** aparece ninguna lista, solo el aviso flotante.
9. **Clientes → Invitar cliente** (uno solo). La confirmación es la **pantalla
   del modal** con «Añadir otro» y «Volver al listado». **No** debe salir además
   un aviso flotante diciendo lo mismo.
10. **Entrenando (cliente) → registra doce series seguidas.** No sale ningún
    aviso flotante: cada serie se marca y ya está. Doce avisos tapando la
    pantalla sería peor que ninguno.
