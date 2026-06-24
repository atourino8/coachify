-- =============================================================================
-- Migración 0003 · Esquema completo: ejercicios, workouts, sessions
-- =============================================================================
-- Crea TODAS las tablas restantes que necesita la app:
--   - exercises (biblioteca del coach)
--   - workouts + workout_items + set_logs (entrenamientos)
--   - sessions + availability_slots (calendario de citas)
-- Con sus RLS policies usando las helpers SECURITY DEFINER de 0002.
-- =============================================================================

-- =============================================================================
-- EXERCISES
-- =============================================================================
create table public.exercises (
  id            uuid primary key default uuid_generate_v4(),
  coach_id      uuid not null references public.profiles(id) on delete cascade,
  name          text not null,
  description   text,
  video_url     text,
  video_poster  text,
  duration_seconds int,
  muscle_group  text check (muscle_group in ('chest','back','legs','shoulders','arms','core','cardio','full_body')),
  equipment     text check (equipment in ('barbell','dumbbell','machine','bodyweight','kettlebell','band','other')),
  archived      boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index exercises_coach_id_idx on public.exercises(coach_id) where archived = false;
create index exercises_muscle_group_idx on public.exercises(muscle_group);

create trigger exercises_set_updated_at
  before update on public.exercises
  for each row execute function public.handle_updated_at();

alter table public.exercises enable row level security;

create policy "exercises_select_own_or_client"
  on public.exercises for select
  using (
    coach_id = auth.uid()
    OR coach_id = public.current_user_coach_id()
  );

create policy "exercises_insert_own"
  on public.exercises for insert
  with check (coach_id = auth.uid());

create policy "exercises_update_own"
  on public.exercises for update
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid());

create policy "exercises_delete_own"
  on public.exercises for delete
  using (coach_id = auth.uid());


-- =============================================================================
-- WORKOUTS (entreno asignado a un cliente en una fecha)
-- =============================================================================
create table public.workouts (
  id            uuid primary key default uuid_generate_v4(),
  client_id     uuid not null references public.profiles(id) on delete cascade,
  coach_id      uuid not null references public.profiles(id) on delete cascade,
  date          date not null,
  title         text,
  notes         text,
  published     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index workouts_client_date_idx on public.workouts(client_id, date);
create index workouts_coach_idx on public.workouts(coach_id);

create trigger workouts_set_updated_at
  before update on public.workouts
  for each row execute function public.handle_updated_at();

alter table public.workouts enable row level security;

create policy "workouts_select_own_or_client"
  on public.workouts for select
  using (
    client_id = auth.uid()
    OR coach_id = auth.uid()
  );

create policy "workouts_coach_full_access"
  on public.workouts for all
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid());


-- =============================================================================
-- WORKOUT_ITEMS (ejercicio dentro de un workout)
-- =============================================================================
create table public.workout_items (
  id                uuid primary key default uuid_generate_v4(),
  workout_id        uuid not null references public.workouts(id) on delete cascade,
  exercise_id       uuid not null references public.exercises(id) on delete restrict,
  order_index       int not null,
  sets              int not null default 1,
  reps_prescribed   text,
  weight_prescribed text,
  rest_seconds      int,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index workout_items_workout_idx on public.workout_items(workout_id, order_index);

create trigger workout_items_set_updated_at
  before update on public.workout_items
  for each row execute function public.handle_updated_at();

alter table public.workout_items enable row level security;

create policy "workout_items_select_via_workout"
  on public.workout_items for select
  using (
    exists (
      select 1 from public.workouts w
      where w.id = workout_id
        and (w.client_id = auth.uid() or w.coach_id = auth.uid())
    )
  );

create policy "workout_items_coach_full_access"
  on public.workout_items for all
  using (
    exists (
      select 1 from public.workouts w
      where w.id = workout_id and w.coach_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workouts w
      where w.id = workout_id and w.coach_id = auth.uid()
    )
  );


-- =============================================================================
-- SET_LOGS (lo que el cliente registró de verdad)
-- =============================================================================
create table public.set_logs (
  id              uuid primary key default uuid_generate_v4(),
  workout_item_id uuid not null references public.workout_items(id) on delete cascade,
  client_id       uuid not null references public.profiles(id) on delete cascade,
  exercise_id     uuid not null references public.exercises(id) on delete restrict,
  set_number      int not null,
  reps_done       int,
  weight_done     numeric(6,2),
  completed_at    timestamptz not null default now(),
  feedback        text check (feedback in ('easy','just_right','hard') or feedback is null)
);

create index set_logs_client_exercise_idx on public.set_logs(client_id, exercise_id, completed_at desc);
create index set_logs_workout_item_idx on public.set_logs(workout_item_id);

alter table public.set_logs enable row level security;

create policy "set_logs_select_own_or_coach"
  on public.set_logs for select
  using (
    client_id = auth.uid()
    OR client_id IN (
      select id from public.profiles where coach_id = auth.uid()
    )
  );

create policy "set_logs_client_full_access_own"
  on public.set_logs for all
  using (client_id = auth.uid())
  with check (client_id = auth.uid());


-- =============================================================================
-- SESSIONS (citas / sesiones presenciales y online)
-- =============================================================================
create table public.sessions (
  id                uuid primary key default uuid_generate_v4(),
  coach_id          uuid not null references public.profiles(id) on delete cascade,
  client_id         uuid not null references public.profiles(id) on delete cascade,
  workout_id        uuid references public.workouts(id) on delete set null,
  starts_at         timestamptz not null,
  ends_at           timestamptz not null,
  status            text not null check (status in ('requested','confirmed','rejected','cancelled','completed')),
  modality          text not null check (modality in ('presencial','online','remoto')),
  location          text,
  notes             text,
  google_event_id   text,
  requested_by      uuid references public.profiles(id) on delete set null,
  decided_at        timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index sessions_coach_starts_idx on public.sessions(coach_id, starts_at);
create index sessions_client_starts_idx on public.sessions(client_id, starts_at);
create index sessions_status_idx on public.sessions(status);

create trigger sessions_set_updated_at
  before update on public.sessions
  for each row execute function public.handle_updated_at();

alter table public.sessions enable row level security;

create policy "sessions_select_own_or_client"
  on public.sessions for select
  using (
    coach_id = auth.uid()
    OR client_id = auth.uid()
  );

create policy "sessions_insert_coach_or_client"
  on public.sessions for insert
  with check (
    coach_id = auth.uid()
    OR client_id = auth.uid()
  );

create policy "sessions_update_coach_or_client_cancel"
  on public.sessions for update
  using (
    coach_id = auth.uid()
    OR client_id = auth.uid()
  )
  with check (
    coach_id = auth.uid()
    OR client_id = auth.uid()
  );

create policy "sessions_delete_coach_only"
  on public.sessions for delete
  using (coach_id = auth.uid());


-- =============================================================================
-- AVAILABILITY_SLOTS (huecos publicados por el coach)
-- =============================================================================
create table public.availability_slots (
  id                uuid primary key default uuid_generate_v4(),
  coach_id          uuid not null references public.profiles(id) on delete cascade,
  kind              text not null check (kind in ('recurring','specific')),
  day_of_week       int check (day_of_week between 0 and 6),
  specific_date     date,
  start_time        time not null,
  end_time          time not null,
  duration_minutes  int not null default 60,
  modalities        text[] not null default array['presencial']::text[],
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  -- Si es recurring necesita day_of_week; si es specific necesita specific_date
  check (
    (kind = 'recurring' and day_of_week is not null and specific_date is null)
    OR (kind = 'specific' and specific_date is not null and day_of_week is null)
  )
);

create index availability_coach_idx on public.availability_slots(coach_id);

create trigger availability_set_updated_at
  before update on public.availability_slots
  for each row execute function public.handle_updated_at();

alter table public.availability_slots enable row level security;

-- Cualquier autenticado ve los slots (necesario para que los clientes vean los huecos
-- de su coach al pedir cita). Granularidad puede aumentarse si hace falta.
create policy "availability_select_authenticated"
  on public.availability_slots for select
  using (auth.role() = 'authenticated');

create policy "availability_coach_full_access"
  on public.availability_slots for all
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid());


-- =============================================================================
-- Permisos para el role 'authenticated'
-- =============================================================================
grant select, insert, update, delete on public.exercises to authenticated;
grant select, insert, update, delete on public.workouts to authenticated;
grant select, insert, update, delete on public.workout_items to authenticated;
grant select, insert, update, delete on public.set_logs to authenticated;
grant select, insert, update, delete on public.sessions to authenticated;
grant select, insert, update, delete on public.availability_slots to authenticated;
