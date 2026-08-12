# Pruebas manuales · lo que no se puede verificar sin ejecutar

**Por qué existe este documento.** Todo lo que se comprueba automáticamente en
este proyecto —`svelte-check`, el guardián de diseño, el formato, los bytes—
es **estático**. Demuestra que el código existe, compila y es coherente
consigo mismo. No demuestra que funcione.

Y en la última tanda se han escrito **siete migraciones (0014–0020)**, dos
políticas de almacenamiento y un disparador que **nunca se han ejecutado**.
Ahí está concentrado casi todo el riesgo que queda.

Esta lista va ordenada por riesgo: probabilidad de estar roto × lo caro que
sale enterarse tarde. Con la base sembrada, son unos veinte minutos.

```
node scripts/seed-demo.mjs <tu-email>
```

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
