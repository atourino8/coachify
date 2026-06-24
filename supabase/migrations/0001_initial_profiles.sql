-- =============================================================================
-- Migración 0001 · Profiles + trigger de auto-creación
-- =============================================================================
-- Esta migración crea la tabla `profiles` que se vincula con `auth.users` de
-- Supabase. Cada vez que un usuario se registra (signUp), un trigger crea
-- automáticamente su fila en `profiles` leyendo el `role` desde los metadatos.
-- =============================================================================

-- Extensión necesaria para UUIDs si no está ya activa
create extension if not exists "uuid-ossp";

-- =============================================================================
-- Tabla profiles
-- =============================================================================
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  role         text not null check (role in ('coach', 'client')),
  full_name    text,
  coach_id     uuid references public.profiles(id) on delete set null,
  avatar_url   text,
  timezone     text not null default 'Europe/Madrid',
  locale       text not null default 'es',
  archived     boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Índices útiles
create index profiles_coach_id_idx on public.profiles(coach_id);
create index profiles_role_idx on public.profiles(role);

-- =============================================================================
-- Trigger updated_at
-- =============================================================================
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();

-- =============================================================================
-- Trigger: auto-crear profile al registrarse en auth.users
-- =============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'coach'),
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table public.profiles enable row level security;

-- Cada usuario ve su propio perfil
create policy "users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- El coach ve los perfiles de sus clientes
create policy "coach can view their clients"
  on public.profiles for select
  using (
    auth.uid() = coach_id
  );

-- El cliente ve el perfil de su coach
create policy "client can view their coach"
  on public.profiles for select
  using (
    id = (select coach_id from public.profiles where id = auth.uid())
  );

-- Cada usuario actualiza solo su propio perfil
create policy "users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- El coach puede dar de alta clientes (asignándose como coach_id)
-- En Fase B esto se hará principalmente vía función server-side con service_role.
-- Por ahora dejamos la política preparada.
create policy "coach can insert clients"
  on public.profiles for insert
  with check (
    role = 'client' and coach_id = auth.uid()
  );

-- =============================================================================
-- Permisos para el role 'anon' y 'authenticated'
-- =============================================================================
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
