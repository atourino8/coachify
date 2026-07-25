-- =============================================================================
-- Migración 0006 · Plantillas de entreno reutilizables
-- =============================================================================
-- Permite al coach crear entrenos "plantilla" (hipertrofia principiante,
-- cardio avanzado...) no atados a cliente ni fecha, para reutilizarlos.
-- Estructura espejo de workouts/workout_items pero sin client_id ni date.
-- =============================================================================

-- ---- Plantilla (cabecera) ----
create table public.workout_templates (
  id          uuid primary key default uuid_generate_v4(),
  coach_id    uuid not null references public.profiles(id) on delete cascade,
  name        text not null,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index workout_templates_coach_idx on public.workout_templates(coach_id);

create trigger workout_templates_set_updated_at
  before update on public.workout_templates
  for each row execute function public.handle_updated_at();

alter table public.workout_templates enable row level security;

create policy "templates_coach_full_access"
  on public.workout_templates for all
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid());


-- ---- Items de la plantilla ----
create table public.workout_template_items (
  id                uuid primary key default uuid_generate_v4(),
  template_id       uuid not null references public.workout_templates(id) on delete cascade,
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

create index workout_template_items_tpl_idx on public.workout_template_items(template_id, order_index);

create trigger workout_template_items_set_updated_at
  before update on public.workout_template_items
  for each row execute function public.handle_updated_at();

alter table public.workout_template_items enable row level security;

create policy "template_items_select_via_template"
  on public.workout_template_items for select
  using (
    exists (
      select 1 from public.workout_templates t
      where t.id = template_id and t.coach_id = auth.uid()
    )
  );

create policy "template_items_coach_full_access"
  on public.workout_template_items for all
  using (
    exists (
      select 1 from public.workout_templates t
      where t.id = template_id and t.coach_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workout_templates t
      where t.id = template_id and t.coach_id = auth.uid()
    )
  );


-- ---- Grants ----
grant select, insert, update, delete on public.workout_templates to authenticated;
grant select, insert, update, delete on public.workout_template_items to authenticated;
