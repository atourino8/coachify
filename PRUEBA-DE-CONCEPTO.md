# Prueba de concepto · todo lo nuevo de una sentada

Un recorrido único, en orden, que toca **las cinco migraciones nuevas
(0021–0025)** y **las quince pantallas** del wireframe. Unos cuarenta minutos.

No es el guion completo de pruebas: eso es `PRUEBAS-MANUALES.md`, que va por
riesgo. Este va por **recorrido**, como lo usaría un entrenador de verdad, y
sirve para enseñárselo a tu socio sin ir saltando de pantalla en pantalla.

## Antes de empezar

```
node scripts/seed-demo.mjs <tu-email> --limpiar
node scripts/seed-demo.mjs <tu-email>
```

Comprueba que las migraciones **0021 a 0025** están aplicadas. Si el sembrado
falla, para: lo que salga después no significará nada.

**Apunta lo que no cuadre tal cual pasó** —qué hiciste, qué esperabas, qué
viste— sin diagnosticarlo. El diagnóstico sale más rápido del síntoma exacto
que de una teoría intermedia.

---

## Acto 1 · Tú (pantallas 1 y 12-13)

1. **Ajustes → Tu foto.** Sube una. Debe aparecer al instante arriba a la
   derecha y en el cajón del móvil, **redonda**.
2. Abre el **cajón** en un móvil de verdad. Comprueba: flecha arriba a la
   izquierda, tu cara, tu nombre, «Gimnasio Pepe» debajo, separadores entre
   destinos, **«Pagos»** donde antes ponía «Cobros», y Configuración abajo
   del todo.
3. Entra en **Pagos** y comprueba que la URL es `/pagos`. Escribe a mano
   `/cobros`: tiene que redirigir sola.
4. **Clientes → + Añadir.** Nombre, Apellidos, correo, y en Grupo escribe uno
   nuevo: el desplegable de al lado debe **apagarse** y salir el aviso de que
   se creará.

   > **Usa direcciones tuyas de verdad**, con el truco del `+`: si tu correo es
   > `tuyo@gmail.com`, escribe `tuyo+prueba1@gmail.com`. Te llega a tu buzón y
   > **no rebota**.
   >
   > No inventes direcciones. Un correo a un buzón que no existe se devuelve, y
   > esas devoluciones cuentan contra la reputación del servidor de Supabase,
   > que está **compartido con todos sus proyectos**. Nos avisaron por esto y
   > amenazaron con cortarnos el envío. La aplicación ahora rechaza los dominios
   > reservados (`example.com`, `.test`, `.invalid`…), pero un dominio real
   > inventado —`asdf@gmail.com`— sí sale y sí rebota.
5. Envía. Sale la **confirmación a pantalla completa**. Pulsa **«Añadir
   otro»**: el formulario vuelve vacío. Invita a un segundo y ahora sí,
   «Volver al listado».
6. **Pestaña Pendientes**: los dos, en **tarjetas de dos columnas**, con la
   fecha de envío y «Reenviar» destacado.

> **Ojo aquí:** el grupo nuevo se crea al enviar. Si invitas a dos seguidos
> escribiendo el mismo nombre de grupo las dos veces, tendrás dos grupos
> iguales. Al pulsar «Añadir otro» el campo se vacía justo para eso.

---

## Acto 2 · Tu cartera (pantalla 11)

7. **Clientes**, vista **Lista**: cada fila con su cara, y bajo el nombre el
   **grupo** («Empleadas · Talleres López» o «Individual») y las etiquetas.
   Las fotos las genera el sembrado —patrones, no caras de gente real— y
   **Rubén se queda sin ninguna a propósito**: sirve para ver que su inicial
   sigue saliendo y que la rejilla no se descuadra por el hueco.
8. Cambia a **Fotos**: rejilla de dos columnas. Arriba a la derecha de cada
   tarjeta, el **punto de estado**. Pasa el ratón por encima: tiene que decir
   «Al día», «Vence pronto» o «Vencido» con palabras.
9. **Busca** «nadia» y luego busca por un trozo de correo. Las dos cosas
   filtran.
10. Filtra por la etiqueta **VIP**: quedan Lucía y Carla.
11. Abre la ficha de alguien y **pulsa su foto**: se abre el formulario para
    cambiársela tú.

---

## Acto 3 · La biblioteca (pantallas 4-7 y 8-10)

12. **Rutinas → Ejercicios.** Comprueba el orden: filtro y «+ Añadir» a la
    izquierda, conmutador a la derecha. Cambia entre **Grupos** y **Lista**.
13. En la lista, mira las pastillas: los que no tienen vídeo llevan **«Sin
    vídeo»**; los que sí, el icono de vídeo. **Ninguno puede llevar las dos.**
14. Abre el **menú de tres puntos** de una fila: Editar y Archivar.
15. **Entrenamientos**: busca uno por nombre con el buscador nuevo.
16. Abre uno. Escribe algo distinto en **«Notas para el cliente»** y en
    **«Notas para ti»**.
17. Pulsa **«+ Añadir ejercicio»**: se abre el modal. Busca, filtra por grupo,
    marca **seis**. El contador dice «6 ejercicios seleccionados». Añádelos.
18. **Pulsa «Deshacer» una vez**: se quitan **los seis de golpe**, no uno.
19. Cambia el peso de un ejercicio y **deshaz**: vuelve el valor anterior.
    Entra y sal de un campo sin tocar nada: el botón **no** debe encender un
    paso nuevo.
20. **Pliega** un ejercicio: plegado tiene que seguir diciendo `4×8-10 · 80kg`.
    Prueba «Plegar todos».
21. Pulsa **Cancelar** con cambios sin guardar: tiene que avisar.
22. Guarda. El botón «Deshacer» se **apaga**.

---

## Acto 4 · El día del cliente (pantalla 15)

23. Ficha de un cliente → pestaña **Calendario** (antes se llamaba
    «Entrenos»).
24. Pulsa un día **que tenga entreno**: se despliega el editor **ahí mismo**,
    sin cambiar de pantalla.
25. Cambia unas series y un peso. **Deshaz.** Añade un ejercicio con el modal.
    Quita otro con la ×.
26. Pulsa **otro día** sin guardar: tiene que preguntar antes de perder nada.
27. Vuelve, **Guarda**, y entra como ese cliente a **Hoy**: los cambios están.

---

## Acto 5 · Clases grupales (migración 0022)

28. **Agenda → Clases.** Crea una para mañana con **1 plaza**.
29. Abre la aplicación en **dos navegadores** con **dos clientes distintos**,
    los dos en Citas, y pulsad «Apuntarme» **a la vez**.
30. **Uno entra con plaza y el otro a la lista de espera. Nunca los dos.**
    Esto es lo único de todo el proyecto que no se puede comprobar leyendo el
    código.
31. El que tiene plaza la **suelta**: el otro pasa a «Tienes plaza» solo con
    recargar.
32. Crea una clase para **pasado mañana** (menos de dos días), apúntate y
    suéltala: el aviso sale **junto al botón, antes de pulsar**, y luego la
    falta aparece en su ficha y en el detalle de la clase.

---

## Acto 6 · Lo que no debe verse

33. Entra como cliente y busca por todas sus pantallas la **nota privada** que
    escribiste en el paso 16. **No puede aparecer en ninguna.**
34. Comprueba que sí ve la **nota para el cliente** en Hoy.
35. Como cliente, entra en **Tu perfil** (tu cara, arriba a la derecha) y
    cambia tu foto. Vuelve como entrenador: está cambiada.
36. Entra como **Nadia** con el bloqueo de impago activado: no puede apuntarse
    a clases —lo dice **antes** de pulsar— pero sí puede salirse de una y sí
    ve sus citas.

---

## Acto 7 · Lo que encontró la revisión por patrones

37. **La nota que sobrevive.** Constructor del día de un cliente: escribe en
    **«Nota para el cliente»** de un ejercicio, por ejemplo «baja despacio».
    Guarda. Vuelve a la ficha, pestaña Calendario, abre **ese mismo día ahí
    dentro**, cambia una serie y guarda. Entra como el cliente: **la nota tiene
    que seguir estando**. Antes desaparecía en ese segundo guardado.

38. **La nota en plantillas.** Abre un entrenamiento, despliega un ejercicio:
    ahora hay «Nota para el cliente». Escribe una, guarda, aplica esa plantilla
    a un día y entra como el cliente: tiene que verla.

39. **Buscar en Ejercicios.** Busca «press» y luego «frances» sin tilde: las
    dos encuentran. Con un filtro de material puesto, la pastilla **«Todos (N)»
    tiene que decir cuántos quedan, no cuántos hay**. Busca algo que no exista:
    debe salir una frase, no una pantalla en blanco.

40. **El doble clic del cobro.** En la ficha de un cliente, abre «Registrar
    cobro» y pulsa el botón **dos veces seguidas, rápido**. Tiene que quedarse
    en «Registrando…» y apuntar **un solo cobro**. Comprueba en Pagos que no hay
    dos apuntes y que el «pagado hasta» avanzó **un** mes.

41. **Las filas se comportan igual.** En Grupos, la fila ahora tiene los **tres
    puntos** con Abrir y Borrar, como en Ejercicios y Entrenamientos. En
    Disponibilidad, borrar un hueco es una **papelera**. No debe quedar ninguna
    × de borrar en toda la aplicación: la × solo cierra cosas.

---

## Lo que esta prueba no cubre

- **El correo de invitación** sale por el envío por defecto de Supabase
  mientras no montemos el SMTP propio (ver `CORREO.md`). Ese envío es
  compartido y va limitado a unos pocos por hora: si invitas a diez seguidos,
  alguno se quedará sin salir.

  *Esta nota antes decía que «alguno rebotará y no será culpa del código», y
  estaba mal en las dos mitades: un rebote no es lo mismo que un envío
  rechazado por límite de tasa, y los rebotes sí eran culpa nuestra —de las
  direcciones inventadas que este mismo guion mandaba usar.*
- **Los avisos no se envían**, se derivan al cargar la pantalla. Que la lista
  de espera ascienda a alguien no le manda ningún correo.
- **El rendimiento con datos de verdad**: el sembrado hace once clientes. Con
  sesenta, la lista y la rejilla se comportan distinto.
