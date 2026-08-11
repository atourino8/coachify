-- =============================================================================
-- Migración 0020 · Dónde entrena habitualmente
-- =============================================================================
-- En el wireframe, debajo del nombre del entrenador pone "Gimnasio Pepe". Yo
-- había puesto ahí "Ver ajustes", que me lo inventé: no había ningún dato que
-- poner y rellené el hueco con una instrucción.
--
-- Este es el dato. Un texto libre y opcional, porque un entrenador puede tener
-- dos gimnasios al día o moverse a domicilio, y obligarle a elegir uno sería
-- pedirle que mienta.
--
-- No sustituye a `sessions.location`: cada cita sigue teniendo el suyo, que es
-- lo correcto. Esto es el valor POR DEFECTO, el que sale propuesto al crear
-- una cita y el que le identifica en su propia cabecera.
-- =============================================================================

alter table public.profiles
  add column if not exists default_location text
  check (default_location is null or char_length(trim(default_location)) between 1 and 60);

comment on column public.profiles.default_location is
  'Dónde entrena habitualmente. Se enseña bajo su nombre y sirve de valor por defecto al crear una cita. Opcional: no todos tienen un sitio fijo.';
