-- =============================================================================
-- Migración 0016 · Un ejercicio puede tener varios grupos musculares y varios
--                  materiales
-- =============================================================================
-- Un press de banca trabaja pecho, hombro y tríceps. Obligar a elegir uno solo
-- hace que la biblioteca mienta y que el filtro no encuentre lo que debería.
--
-- POR QUÉ ARRAYS Y NO TABLAS DE UNIÓN
--
-- El vocabulario es cerrado y pequeño: ocho grupos y siete materiales, fijados
-- por una restricción. No hay atributos que colgar de la relación (no existe
-- "cuánto de pecho"), no hay que renombrar etiquetas ni que el entrenador cree
-- las suyas. Con dos tablas de unión tendríamos dos `join` en cada consulta de
-- la biblioteca a cambio de flexibilidad que nadie ha pedido.
--
-- Si algún día el entrenador puede inventarse sus propias etiquetas, entonces
-- sí toca tabla. Hoy sería complejidad por adelantado.
--
-- LO IMPORTANTE: LAS COLUMNAS VIEJAS NO SE VAN
--
-- `muscle_group` y `equipment` se quedan, sincronizadas por un disparador con
-- el primer elemento del array. Eso resuelve dos problemas de golpe:
--
--   1. Las quince pantallas que solo enseñan la etiqueta principal —progreso,
--      hoy, ficha del cliente, plantillas, constructor— siguen funcionando sin
--      tocar una línea. Solo se adapta lo que de verdad necesita varias.
--
--   2. El disparador funciona EN LOS DOS SENTIDOS. Si llega una escritura que
--      solo trae la columna vieja (código sin desplegar todavía, un script
--      antiguo, una inserción a mano desde Supabase), el array se rellena a
--      partir de ella. Así la ventana entre aplicar esta migración y desplegar
--      el código no rompe nada, que es justo cuando estas cosas explotan.
-- =============================================================================

alter table public.exercises
  add column if not exists muscle_groups   text[] not null default '{}',
  add column if not exists equipment_types text[] not null default '{}';

-- Traspaso de lo que ya hay. Un ejercicio sin grupo se queda con array vacío,
-- que es distinto de un array con un null dentro.
update public.exercises
   set muscle_groups = array[muscle_group]
 where muscle_group is not null
   and muscle_groups = '{}';

update public.exercises
   set equipment_types = array[equipment]
 where equipment is not null
   and equipment_types = '{}';

-- Validación del contenido. `<@` es "contenido en": todos los elementos del
-- array de la izquierda tienen que estar en el de la derecha. Es el equivalente
-- para arrays del CHECK ... IN que tenían las columnas sueltas, y evita que se
-- cuele una etiqueta inventada que luego no sabría pintar ninguna pantalla.
alter table public.exercises
  drop constraint if exists exercises_muscle_groups_validos;
alter table public.exercises
  add constraint exercises_muscle_groups_validos
  check (
    muscle_groups <@ array['chest','back','legs','shoulders','arms','core','cardio','full_body']::text[]
  );

alter table public.exercises
  drop constraint if exists exercises_equipment_types_validos;
alter table public.exercises
  add constraint exercises_equipment_types_validos
  check (
    equipment_types <@ array['barbell','dumbbell','machine','bodyweight','kettlebell','band','other']::text[]
  );

-- Índices GIN: son los que hacen que "dame los que contengan 'chest'" no
-- recorra la tabla entera. Sin ellos, filtrar por grupo con la biblioteca base
-- de casi cincuenta ejercicios por entrenador escala mal en cuanto haya
-- entrenadores de verdad.
create index if not exists exercises_muscle_groups_idx
  on public.exercises using gin (muscle_groups);
create index if not exists exercises_equipment_types_idx
  on public.exercises using gin (equipment_types);

-- =============================================================================
-- Sincronía en los dos sentidos
-- =============================================================================
-- El orden de las comprobaciones importa. Se mira primero si vienen arrays,
-- porque es lo que manda el código nuevo; solo si no vienen se recurre a la
-- columna vieja. Al revés, una escritura nueva que vaciara los arrays a
-- propósito se vería pisada por el valor antiguo de la columna suelta.
create or replace function public.exercises_sync_tags()
returns trigger
language plpgsql
as $$
begin
  -- Camino normal: manda el array, la columna suelta es su reflejo.
  if new.muscle_groups is not null and array_length(new.muscle_groups, 1) > 0 then
    new.muscle_group := new.muscle_groups[1];

  -- Camino de compatibilidad: solo llegó la columna vieja.
  elsif new.muscle_group is not null then
    new.muscle_groups := array[new.muscle_group];

  else
    new.muscle_groups := '{}';
    new.muscle_group := null;
  end if;

  if new.equipment_types is not null and array_length(new.equipment_types, 1) > 0 then
    new.equipment := new.equipment_types[1];
  elsif new.equipment is not null then
    new.equipment_types := array[new.equipment];
  else
    new.equipment_types := '{}';
    new.equipment := null;
  end if;

  return new;
end;
$$;

drop trigger if exists exercises_sync_tags_trg on public.exercises;
create trigger exercises_sync_tags_trg
  before insert or update on public.exercises
  for each row
  execute function public.exercises_sync_tags();

comment on column public.exercises.muscle_groups is
  'Grupos musculares que trabaja. El primero es el principal y se refleja en muscle_group, que se mantiene por compatibilidad.';
comment on column public.exercises.equipment_types is
  'Material necesario. El primero se refleja en equipment.';
comment on column public.exercises.muscle_group is
  'DERIVADA: primer elemento de muscle_groups, mantenida por disparador. No escribir directamente en código nuevo.';
comment on column public.exercises.equipment is
  'DERIVADA: primer elemento de equipment_types, mantenida por disparador. No escribir directamente en código nuevo.';
