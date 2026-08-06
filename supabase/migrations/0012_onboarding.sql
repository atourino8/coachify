-- =============================================================================
-- Migración 0012 · Marca de onboarding completado
-- =============================================================================
-- Un entrenador que se registra hoy entra a una aplicación vacía y tiene que
-- adivinar el orden: biblioteca → horarios → cliente. El asistente de primer
-- login resuelve eso, pero necesita saber si ya se hizo.
--
-- Decisión: guardamos la FECHA en la que se completó, no un booleano.
-- Un `true` no dice cuándo, y para saber si el asistente funciona (¿lo
-- terminan? ¿cuánto tardan desde que se registran?) la fecha es lo único que
-- sirve. Null = todavía no lo ha hecho.
--
-- Se marca tanto si lo completa como si lo salta: si alguien decide saltárselo,
-- volver a plantárselo en cada login es hostil.
-- =============================================================================

alter table public.profiles
  add column if not exists onboarded_at timestamptz;

comment on column public.profiles.onboarded_at is
  'Cuándo terminó (o saltó) el asistente de primer login. Null = pendiente.';

-- Los coaches que ya existen no deben ver el asistente: llevan tiempo usando
-- la aplicación y plantárselo ahora sería absurdo. Los damos por hechos.
update public.profiles
set onboarded_at = coalesce(onboarded_at, created_at)
where role = 'coach'
  and onboarded_at is null;
