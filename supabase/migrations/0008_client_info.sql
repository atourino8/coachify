-- =============================================================================
-- Migración 0008 · Ficha del cliente (client_info)
-- =============================================================================
-- Datos de ficha que gestiona el coach sobre cada cliente: objetivos, lesiones,
-- frecuencia, nivel, datos físicos y notas privadas.
--
-- Se guarda en una tabla APARTE (no en profiles) a propósito: así las notas
-- privadas del coach y el resto de la ficha son accesibles SOLO por el coach
-- vía RLS. Si estuvieran en profiles, el cliente podría leer su propia fila
-- (incluidas las notas) mediante la API.
-- =============================================================================

create table if not exists public.client_info (
  client_id               uuid primary key references public.profiles(id) on delete cascade,
  coach_id                uuid not null references public.profiles(id) on delete cascade,
  goals                   text,
  injuries                text,
  training_days_per_week  smallint check (training_days_per_week is null or (training_days_per_week between 0 and 14)),
  level                   text check (level is null or level in ('principiante', 'intermedio', 'avanzado')),
  height_cm               smallint check (height_cm is null or (height_cm between 50 and 260)),
  birth_date              date,
  coach_notes             text,
  updated_at              timestamptz not null default now()
);

create index if not exists client_info_coach_id_idx on public.client_info(coach_id);

-- updated_at automático (reutiliza la función de 0001).
drop trigger if exists client_info_set_updated_at on public.client_info;
create trigger client_info_set_updated_at
  before update on public.client_info
  for each row
  execute function public.handle_updated_at();

-- =============================================================================
-- Row Level Security: SOLO el coach dueño accede a la ficha de sus clientes.
-- El cliente no tiene ninguna política → sin acceso (ni lectura).
-- =============================================================================
alter table public.client_info enable row level security;

create policy "coach reads own clients info"
  on public.client_info for select
  using (coach_id = auth.uid());

create policy "coach inserts own clients info"
  on public.client_info for insert
  with check (
    coach_id = auth.uid()
    and exists (
      select 1 from public.profiles p
      where p.id = client_id and p.coach_id = auth.uid()
    )
  );

create policy "coach updates own clients info"
  on public.client_info for update
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid());

create policy "coach deletes own clients info"
  on public.client_info for delete
  using (coach_id = auth.uid());

grant select, insert, update, delete on public.client_info to authenticated;
