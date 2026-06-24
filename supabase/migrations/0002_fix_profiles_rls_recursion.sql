-- =============================================================================
-- Migración 0002 · Fix de recursión infinita en políticas RLS de profiles
-- =============================================================================
-- La política "client can view their coach" hacía subquery a profiles dentro
-- de una policy de profiles → recursión infinita (error 42P17).
--
-- Solución: helper function con SECURITY DEFINER que lee profiles saltándose
-- RLS internamente, y la usamos en la policy.
-- =============================================================================

-- Helper: devuelve el coach_id del usuario actualmente autenticado.
-- SECURITY DEFINER → corre con permisos del owner, sin pasar por RLS.
create or replace function public.current_user_coach_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coach_id from public.profiles where id = auth.uid();
$$;

-- Helper: devuelve el rol del usuario actualmente autenticado.
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- =============================================================================
-- Drop policies existentes y recrear sin recursión
-- =============================================================================

drop policy if exists "users can view own profile" on public.profiles;
drop policy if exists "coach can view their clients" on public.profiles;
drop policy if exists "client can view their coach" on public.profiles;
drop policy if exists "users can update own profile" on public.profiles;
drop policy if exists "coach can insert clients" on public.profiles;

-- SELECT: cualquier usuario autenticado puede leer su propio perfil + el de su coach + los de sus clientes
create policy "profiles_select_own_or_related"
  on public.profiles for select
  using (
    auth.uid() = id
    OR auth.uid() = coach_id
    OR id = public.current_user_coach_id()
  );

-- UPDATE: solo el propio user puede actualizar su perfil
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- INSERT: el coach puede crear filas de tipo 'client' asignándose como coach_id
create policy "profiles_insert_client_by_coach"
  on public.profiles for insert
  with check (
    role = 'client' AND coach_id = auth.uid()
  );

-- (El INSERT de perfiles de tipo 'coach' lo hace el trigger handle_new_user,
--  que tiene SECURITY DEFINER y se salta RLS.)
