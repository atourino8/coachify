-- =============================================================================
-- Migración 0004 · Soporte de invitaciones (coach_id en metadata)
-- =============================================================================
-- Actualiza el trigger handle_new_user para que lea `coach_id` desde
-- raw_user_meta_data. Cuando un coach invita a un cliente vía admin API,
-- pasa coach_id en el metadata; el trigger lo persiste en profiles.coach_id.
-- =============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  meta_coach_id uuid;
begin
  -- Intenta parsear coach_id si existe en metadata (solo para clients)
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
