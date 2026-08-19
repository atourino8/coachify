-- =============================================================================
-- Migración 0025 · Dos notas en un entrenamiento: las suyas y las del cliente
-- =============================================================================
-- El wireframe 9 pide dos campos: «Notas para el cliente» y «Notas para el
-- entrenador». La regla que las separa la dio Toni y es la correcta:
--
--   Lo que escribe el entrenador NO lo lee el cliente, salvo que sea un
--   comentario dirigido a él. Las notas profesionales sobre alguien son
--   suyas.
--
-- QUÉ PASA CON LO YA ESCRITO
--
-- Se queda como nota del ENTRENADOR, privada. Y no es una decisión difícil una
-- vez comprobado el código: hoy `workout_templates.notes` **no llega al
-- cliente por ningún camino**. materializeTemplateWorkout copia el nombre de
-- la plantilla y sus ejercicios, y nunca las notas.
--
-- O sea que lo escrito hasta hoy se escribió sabiendo que nadie más lo leía.
-- Dejarlo privado conserva esa promesa; moverlo al campo visible la rompería
-- de golpe y sin avisar, en todas las plantillas a la vez.
--
-- Se renombra en vez de añadir dos columnas nuevas: `notes` a secas ya no
-- significa nada cuando hay dos clases de nota.
-- =============================================================================

alter table public.workout_templates rename column notes to coach_notes;

alter table public.workout_templates
  add column if not exists client_notes text;

comment on column public.workout_templates.coach_notes is
  'Privada. Solo la ve el entrenador, ni siquiera al aplicar la plantilla. Aquí van los apuntes profesionales: qué vigilar, por qué está montado así, qué probar la próxima vez.';

comment on column public.workout_templates.client_notes is
  'La lee el cliente. Al aplicar la plantilla se copia a workouts.notes, que es lo que sale en su pantalla de Hoy. Nace vacía: nadie ha escrito nunca nada sabiendo que se iba a publicar.';

-- NOTA SOBRE LO QUE ESTA MIGRACIÓN NO TOCA
--
-- `workout_template_items.notes` —la nota de cada ejercicio dentro del
-- entrenamiento— sigue siendo una sola y sigue siendo VISIBLE: se copia a
-- workout_items.notes y el cliente la lee en el detalle del ejercicio. Ahí la
-- nota es «baja despacio» o «si molesta la rodilla, para», que es exactamente
-- un comentario dirigido a él.
--
-- Si algún día hace falta una nota privada por ejercicio, será otra migración
-- y otra decisión. Partir las dos a la vez habría duplicado el trabajo sin
-- que nadie lo haya pedido.
