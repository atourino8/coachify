-- =============================================================================
-- Migración 0007 · Categoría en plantillas de entreno
-- =============================================================================
-- Permite clasificar las plantillas (hipertrofia, fuerza, cardio…) para
-- filtrarlas cuando el coach tiene muchas.
-- =============================================================================

alter table public.workout_templates
  add column if not exists category text
  check (category in (
    'hipertrofia', 'fuerza', 'resistencia', 'movilidad',
    'perdida_grasa', 'rehabilitacion', 'otro'
  ) or category is null);
