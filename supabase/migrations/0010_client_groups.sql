-- =============================================================================
-- Migración 0010 · Grupos de clientes
-- =============================================================================
-- Un grupo es una CAPA DE GESTIÓN sobre clientes que ya existen, no un tipo
-- distinto de cliente. Sirve para que el entrenador pueda actuar sobre muchos
-- a la vez (invitar en masa, programar un entrenamiento a todos) y para
-- filtrar su cartera.
--
-- Caso de uso que lo motiva: una empresa contrata al entrenador para sus
-- empleadas. El entrenador crea el grupo "Empresa X" y gestiona a las 30
-- personas como una unidad, pero cada una conserva su ficha, su calendario,
-- su progreso y sus vídeos de técnica igual que un cliente particular.
--
-- Se usa tabla de pertenencia (no una columna en profiles) para permitir que
-- un cliente esté en varios grupos sin rehacer el modelo más adelante.
-- =============================================================================

create table if not exists public.client_groups (
  id         uuid primary key default uuid_generate_v4(),
  coach_id   uuid not null references public.profiles(id) on delete cascade,
  name       text not null,
  notes      text,
  -- Datos de facturación del cliente corporativo (opcional).
  company    text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists client_groups_coach_idx on public.client_groups(coach_id);

drop trigger if exists client_groups_set_updated_at on public.client_groups;
create trigger client_groups_set_updated_at
  before update on public.client_groups
  for each row execute function public.handle_updated_at();

-- Pertenencia cliente ↔ grupo
create table if not exists public.client_group_members (
  group_id  uuid not null references public.client_groups(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  added_at  timestamptz not null default now(),
  primary key (group_id, client_id)
);

create index if not exists client_group_members_client_idx
  on public.client_group_members(client_id);

-- =============================================================================
-- RLS: solo el coach dueño del grupo. Los clientes no ven los grupos.
-- =============================================================================
alter table public.client_groups enable row level security;
alter table public.client_group_members enable row level security;

create policy "coach manages own groups"
  on public.client_groups for all
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid());

-- La pertenencia se valida contra el grupo: si el grupo es del coach, puede
-- gestionar a sus miembros.
create policy "coach manages own group members"
  on public.client_group_members for all
  using (
    exists (
      select 1 from public.client_groups g
      where g.id = group_id and g.coach_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.client_groups g
      where g.id = group_id and g.coach_id = auth.uid()
    )
    and exists (
      select 1 from public.profiles p
      where p.id = client_id and p.coach_id = auth.uid()
    )
  );

grant select, insert, update, delete on public.client_groups to authenticated;
grant select, insert, update, delete on public.client_group_members to authenticated;
