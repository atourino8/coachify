# Plan técnico · Vídeos de técnica del cliente

Feature: el cliente sube un vídeo corto ejecutando un ejercicio; el coach lo
revisa y le deja una corrección. El vídeo se va reemplazando para ver la
evolución de la técnica.

---

## 1. Decisión de diseño: cuántos vídeos se guardan

El riesgo de la feature es el almacenamiento. Se resuelve con un tope duro:

**Máximo 2 vídeos por (cliente, ejercicio):**

| kind | qué es | comportamiento |
|---|---|---|
| `first` | el primero que subió | no se pisa nunca (referencia "antes") |
| `latest` | el más reciente | **se sobrescribe** en cada subida nueva |

Por qué no solo el último: "sobrescribir siempre" y "ver la evolución" se
contradicen. Guardando el primero + el último tienes el **antes/después**, que
es el gancho real de la feature, y el almacenamiento sigue acotado.

Cota máxima = `2 × (nº clientes × ejercicios que practican)`. No crece sin
control. A ~25 MB por vídeo, 50 clientes × 10 ejercicios ≈ 25 GB en el peor
caso (todos con dos vídeos en todos los ejercicios), y en la práctica mucho menos.

Secuencia de subidas:

1. Primera subida → se guarda como `first`.
2. Segunda subida → se crea `latest`.
3. Tercera y siguientes → **pisan** `latest`. Nunca hay una tercera fila.

---

## 2. Límites (se validan en el navegador ANTES de subir)

- Duración: **≤ 70 s** (margen sobre el minuto).
- Tamaño: **≤ 50 MB** (tope duro también en el bucket).
- Formatos: `video/mp4`, `video/webm`, `video/quicktime`.

Sin transcodificación en servidor: es cara y compleja. Con el tope de
duración/tamaño es suficiente para el MVP.

---

## 3. Datos (migración `0009_technique_videos.sql`, ya creada)

Tabla `technique_videos`:

- `client_id`, `coach_id`, `exercise_id`
- `kind` (`first` | `latest`)
- `storage_path`, `duration_seconds`, `size_bytes`
- `coach_comment`, `coach_comment_at` ← el bucle de feedback
- índice **único** `(client_id, exercise_id, kind)` → garantiza el tope de 2

Bucket de Storage `technique-videos`:

- **privado** (nunca público)
- tope de 50 MB y mime types restringidos a nivel de bucket
- ruta: `{client_id}/{exercise_id}/{kind}.{ext}`

RLS:

- Tabla: ve el propio cliente y su coach; el cliente crea/edita/borra los suyos;
  el coach solo puede actualizar (para dejar el comentario).
- Storage: el cliente gestiona **solo su carpeta**; el coach puede **leer** la de
  sus clientes. La ruta empieza por `client_id`, y las políticas lo comprueban.

---

## 4. Flujo de subida (cliente)

1. En el ejercicio (dentro de su entreno) aparece "Subir vídeo de técnica".
2. `<input type="file" accept="video/*" capture>` → en móvil abre la cámara.
3. Validación local: duración (leyendo metadata del vídeo) y tamaño. Si se pasa,
   se rechaza con un mensaje claro **sin subir nada**.
4. Subida directa del navegador a Supabase Storage (`upload` con `upsert: true`
   para que `latest` se pise solo).
5. `upsert` en `technique_videos` con la fila correspondiente (`first` la primera
   vez, `latest` a partir de la segunda).
6. Barra de progreso durante la subida (es un archivo grande, el feedback es
   imprescindible).

## 5. Flujo de revisión (coach)

1. En la ficha del cliente, pestaña nueva **"Técnica"**: lista de ejercicios con
   vídeo pendiente de revisar arriba.
2. Reproductor con el antes/después cuando existen los dos (`first` + `latest`).
3. Campo de comentario → guarda `coach_comment` + `coach_comment_at`.
4. El cliente ve la corrección junto a su vídeo.

Las URLs de reproducción son **firmadas y temporales**, generadas en el `load`
del servidor (nunca enlaces públicos).

---

## 6. Privacidad y GDPR (no opcional)

Son vídeos del cuerpo de personas identificables:

- **Consentimiento explícito** la primera vez que sube un vídeo, con aviso de
  quién lo verá (solo su coach).
- **Acceso cerrado**: bucket privado + RLS + URLs firmadas caducas.
- **Derecho de borrado**: el cliente puede eliminar sus vídeos cuando quiera.
- **Borrado en cascada**: al eliminar cliente o ejercicio se borran las filas;
  los archivos del bucket hay que limpiarlos explícitamente (la BD no borra
  archivos de Storage por sí sola).
- **Menores**: prohibido en términos, o requerir consentimiento del tutor.
- Actualizar la **política de privacidad** con esta nueva categoría de datos.

---

## 7. Orden de implementación

1. Aplicar migración `0009` en Supabase (crea tabla + bucket + políticas).
2. Tipos `TechniqueVideo` en `src/lib/supabase/types.ts`.
3. Helper `src/lib/technique.ts`: validar límites, calcular ruta, subir, upsert.
4. Cliente: subida desde la vista del ejercicio + ver comentario del coach.
5. Coach: pestaña "Técnica" en la ficha del cliente + comentar.
6. Consentimiento + textos legales.
7. Aviso en el home del coach: "X vídeos de técnica por revisar".

---

## 8. Riesgos y decisiones abiertas

- **Egress**: el coste real no es guardar, es el ancho de banda al reproducir.
  Vigilar en Supabase; si crece, considerar CDN o caducidad de vídeos antiguos.
- **Limpieza de archivos huérfanos**: si se borra la fila pero no el archivo del
  bucket. Conviene un borrado explícito en el mismo action, o una tarea periódica.
- **Vídeos verticales de móvil**: cuidar el reproductor (aspect ratio) para que
  no se vea deformado.
- ¿Caducidad? Opción futura: borrar `latest` con más de N meses sin actividad
  para acotar aún más el almacenamiento.
