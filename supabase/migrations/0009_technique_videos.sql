-- =============================================================================
-- Migración 0009 · Vídeos de técnica del cliente
-- =============================================================================
-- El cliente sube un vídeo corto (≤1 min) ejecutando un ejercicio para que su
-- coach le corrija la postura. El coach responde con un comentario.
--
-- CONTROL DE ALMACENAMIENTO (clave de la feature):
-- Se guardan como MUCHO 2 vídeos por (cliente, ejercicio):
--   · kind='first'  → el primero que subió (referencia "antes", no se pisa)
--   · kind='latest' → el más reciente (se SOBRESCRIBE en cada subida nueva)
-- Así el almacenamiento queda acotado a 2 × (clientes × ejercicios que practican)
-- y a la vez se conserva la evolución antes/después.
--
-- Convención de ruta en el bucket (importante para las políticas RLS):
--   {client_id}/{exercise_id}/{kind}.{ext}
-- =============================================================================

create table if not exists public.technique_videos (
  id               uuid primary key default uuid_generate_v4(),
  client_id        uuid not null references public.profiles(id) on delete cascade,
  coach_id         uuid not null references public.profiles(id) on delete cascade,
  exercise_id      uuid not null references public.exercises(id) on delete cascade,
  kind             text not null check (kind in ('first', 'latest')),
  storage_path     text not null,
  duration_seconds int,
  size_bytes       bigint,
  -- Feedback del coach sobre este vídeo (el bucle que da valor a la feature).
  coach_comment    text,
  coach_comment_at timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Garantiza el tope: máximo un 'first' y un 'latest' por cliente+ejercicio.
create unique index if not exists technique_videos_unique_kind_idx
  on public.technique_videos(client_id, exercise_id, kind);

create index if not exists technique_videos_coach_idx
  on public.technique_videos(coach_id, created_at desc);
create index if not exists technique_videos_client_idx
  on public.technique_videos(client_id, exercise_id);

drop trigger if exists technique_videos_set_updated_at on public.technique_videos;
create trigger technique_videos_set_updated_at
  before update on public.technique_videos
  for each row execute function public.handle_updated_at();

-- =============================================================================
-- RLS de la tabla
-- =============================================================================
alter table public.technique_videos enable row level security;

-- Ver: el propio cliente y su coach.
create policy "technique_videos_select_own_or_coach"
  on public.technique_videos for select
  using (client_id = auth.uid() or coach_id = auth.uid());

-- El cliente crea sus propios vídeos (y debe declararse bajo su coach real).
create policy "technique_videos_client_insert_own"
  on public.technique_videos for insert
  with check (
    client_id = auth.uid()
    and coach_id = (select coach_id from public.profiles where id = auth.uid())
  );

-- El cliente actualiza/borra los suyos (sobrescribir 'latest', o retirarlo).
create policy "technique_videos_client_update_own"
  on public.technique_videos for update
  using (client_id = auth.uid())
  with check (client_id = auth.uid());

create policy "technique_videos_client_delete_own"
  on public.technique_videos for delete
  using (client_id = auth.uid());

-- El coach actualiza (para dejar su comentario de corrección) los de sus clientes.
create policy "technique_videos_coach_update"
  on public.technique_videos for update
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid());

grant select, insert, update, delete on public.technique_videos to authenticated;

-- =============================================================================
-- Bucket de Storage (PRIVADO) + políticas
-- =============================================================================
-- Privado a propósito: son vídeos del cuerpo de personas. El acceso se hace
-- siempre con URLs firmadas temporales generadas en el servidor.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'technique-videos',
  'technique-videos',
  false,
  52428800, -- 50 MB de tope duro por archivo
  array['video/mp4', 'video/webm', 'video/quicktime']
)
on conflict (id) do update
  set public = false,
      file_size_limit = 52428800,
      allowed_mime_types = array['video/mp4', 'video/webm', 'video/quicktime'];

-- El cliente gestiona los archivos bajo su propia carpeta {client_id}/...
create policy "technique videos: client manages own folder"
  on storage.objects for all
  to authenticated
  using (
    bucket_id = 'technique-videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'technique-videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- El coach puede LEER los archivos de sus clientes.
create policy "technique videos: coach reads their clients"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'technique-videos'
    and exists (
      select 1 from public.profiles p
      where p.id = ((storage.foldername(name))[1])::uuid
        and p.coach_id = auth.uid()
    )
  );
