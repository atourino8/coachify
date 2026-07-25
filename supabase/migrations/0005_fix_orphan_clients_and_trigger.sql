-- =============================================================================
-- Migración 0005 · Reparar clientes huérfanos + reforzar trigger
-- =============================================================================
-- Problema detectado: clientes invitados quedaban con coach_id = null (no
-- vinculados a su entrenador). Causa probable: la migración 0004 (que enseña
-- al trigger a leer coach_id del metadata) no se llegó a aplicar en la BD, o
-- el metadata no se proceso.
--
-- Esta migración:
--  1. Reaplica el trigger correcto (idempotente, no rompe si ya estaba).
--  2. Backfill: intenta vincular clientes huérfanos leyendo el coach_id que
--     quedó guardado en su raw_user_meta_data de auth.users.
-- =============================================================================

-- ---- 1. Reaplicar el trigger correcto (mismo de 0004, idempotente) ----
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  meta_coach_id uuid;
begin
  begin
    meta_coach_id := (new.raw_user_meta_data->>'coach_id')::uuid;
  exception when others then
    meta_coach_id := null;
  end;

  insert into public.profiles (id, role, full_name, coach_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'coach'),
    new.raw_user_meta_data->>'full_name',
    meta_coach_id
  );
  return new;
end;
$$;

-- ---- 2. Backfill de clientes huérfanos ----
-- Para cada profile de tipo 'client' con coach_id null, buscamos el coach_id
-- que Supabase guardó en auth.users.raw_user_meta_data al invitarlo.
update public.profiles p
set coach_id = (au.raw_user_meta_data->>'coach_id')::uuid
from auth.users au
where p.id = au.id
  and p.role = 'client'
  and p.coach_id is null
  and au.raw_user_meta_data->>'coach_id' is not null
  and (au.raw_user_meta_data->>'coach_id') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- ---- 3. Diagnóstico: cuántos clientes quedan huérfanos tras el backfill ----
-- (Este bloque solo emite un NOTICE, no cambia datos. Útil para ver en logs.)
do $$
declare
  huerfanos int;
begin
  select count(*) into huerfanos
  from public.profiles
  where role = 'client' and coach_id is null;
  raise notice 'Clientes sin coach tras backfill: %', huerfanos;
end $$;
