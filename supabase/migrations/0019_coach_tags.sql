-- =============================================================================
-- Migración 0019 · El entrenador se hace su propio vocabulario
-- =============================================================================
-- Hasta ahora los grupos musculares y el material eran una lista cerrada de
-- ocho y siete valores, fijada por una restricción. La migración 0016 decía
-- literalmente: "si algún día el entrenador puede inventarse sus propias
-- etiquetas, entonces sí toca tabla". Ese día es hoy.
--
-- POR QUÉ AHORA SÍ Y ANTES NO
-- Antes no había demanda y una tabla habría sido complejidad por adelantado.
-- Ahora la hay, y además el vocabulario cerrado se queda corto de verdad: un
-- entrenador de rehabilitación quiere "suelo pélvico" o "manguito rotador", y
-- uno de crossfit quiere "anillas" o "cuerda". Obligarles a meter todo eso en
-- "Otro" convierte el filtro en inútil justo para quien más lo necesitaría.
--
-- QUÉ PASA CON LOS OCHO Y SIETE DE SIEMPRE
-- Se quedan, y NO se copian a esta tabla. Son el vocabulario base que ve todo
-- el mundo sin configurar nada, y viven en el código (src/lib/supabase/types.ts).
-- Sembrarlos por entrenador serían quince filas por cuenta que no aportan
-- nada y que habría que mantener sincronizadas con el código.
--
-- Lo que sí se puede es RENOMBRARLOS: guardando aquí una fila con el mismo
-- identificador y otra etiqueta, se pisa la del código. Así quien quiera que
-- ponga "Piernas" en vez de "Pierna" no tiene que discutirlo con nadie.
-- =============================================================================

create table if not exists public.coach_tags (
  id         uuid primary key default uuid_generate_v4(),
  coach_id   uuid not null references public.profiles(id) on delete cascade,
  -- Qué vocabulario. Los dos son listas de palabras y se comportan igual, así
  -- que una tabla con un discriminador en vez de dos tablas gemelas.
  kind       text not null check (kind in ('muscle', 'equipment')),
  -- El identificador que acaba dentro de exercises.muscle_groups. Minúsculas,
  -- sin acentos y sin espacios: es una clave, no un texto.
  slug       text not null check (slug ~ '^[a-z0-9_]{2,32}$'),
  -- Lo que se ve. Aquí sí van acentos y mayúsculas.
  label      text not null check (char_length(trim(label)) between 1 and 40),
  created_at timestamptz not null default now(),
  unique (coach_id, kind, slug)
);

create index if not exists coach_tags_coach_idx on public.coach_tags(coach_id, kind);

alter table public.coach_tags enable row level security;

-- El entrenador manda en las suyas.
drop policy if exists "coach_tags_own" on public.coach_tags;
create policy "coach_tags_own"
  on public.coach_tags for all
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid());

-- Sus clientes las LEEN: si no, verían el identificador crudo ("suelo_pelvico")
-- en vez de la etiqueta en su pantalla de progreso.
drop policy if exists "coach_tags_read_by_clients" on public.coach_tags;
create policy "coach_tags_read_by_clients"
  on public.coach_tags for select
  using (coach_id = public.current_user_coach_id());

grant select, insert, update, delete on public.coach_tags to authenticated;

-- =============================================================================
-- La restricción de valores cerrados se sustituye por una de FORMA
-- =============================================================================
-- La de antes enumeraba los ocho valores válidos. Con vocabulario propio eso
-- ya no vale, y comprobar "existe en coach_tags de ESE entrenador" no se puede
-- hacer con un CHECK: no admiten subconsultas.
--
-- Se podría con un disparador, pero sería una consulta más en cada escritura
-- de ejercicio para proteger de algo cuyo peor caso es que un entrenador vea
-- una etiqueta rara en SU propia biblioteca. Aquí la base garantiza la forma
-- —minúsculas, sin espacios, longitud acotada, sin basura ni inyecciones— y de
-- que el valor signifique algo se encarga src/lib/exercise-tags.ts, que además
-- puede explicar el problema en castellano.
-- =============================================================================

-- Se comprueba sobre el array UNIDO POR COMAS y no elemento a elemento,
-- porque un CHECK no admite subconsultas y `unnest` es una. El patrón exige
-- que cada trozo entre comas tenga la forma correcta, y acepta el array vacío
-- (la cadena resultante es '').
--
-- Como los identificadores no pueden contener comas —el propio patrón lo
-- impide—, unirlos por comas no puede juntar dos valores en uno ni partir uno
-- en dos, que es el fallo típico de validar arrays así.
alter table public.exercises
  drop constraint if exists exercises_muscle_groups_validos;
alter table public.exercises
  drop constraint if exists exercises_muscle_groups_forma;
alter table public.exercises
  add constraint exercises_muscle_groups_forma
  check (array_to_string(muscle_groups, ',') ~ '^([a-z0-9_]{2,32}(,[a-z0-9_]{2,32})*)?$');

alter table public.exercises
  drop constraint if exists exercises_equipment_types_validos;
alter table public.exercises
  drop constraint if exists exercises_equipment_types_forma;
alter table public.exercises
  add constraint exercises_equipment_types_forma
  check (array_to_string(equipment_types, ',') ~ '^([a-z0-9_]{2,32}(,[a-z0-9_]{2,32})*)?$');

comment on table public.coach_tags is
  'Vocabulario propio del entrenador. Se SUMA al base del código; una fila con un slug del base lo renombra.';
