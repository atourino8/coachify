-- =============================================================================
-- 0027 · Fuera las columnas de vídeo del ejercicio
-- =============================================================================
--
-- Segundo tiempo de la 0026. Ver ADR-005.
--
-- **APLICAR DESPUÉS DE TRAERSE EL CÓDIGO** que lee de `coach_videos`. Si se
-- aplica antes, la aplicación se queda pidiendo columnas que ya no existen.
--
-- Por qué se borran y no se dejan «por si acaso»: dos fuentes para el mismo
-- dato es el fallo que llevamos toda la semana persiguiendo. Con las dos vivas,
-- la mitad del código acabaría leyendo una y la otra mitad la otra, y nadie
-- sabría cuál manda. El dato no se pierde: se mudó a `coach_videos` en la 0026.

-- Comprobación de seguridad: si algún ejercicio tuviera vídeo en las columnas
-- viejas y NO hubiera quedado apuntado a uno nuevo, la 0026 no hizo su trabajo
-- y borrar aquí perdería datos de verdad. Mejor fallar ruidosamente.
do $$
declare
  huerfanos int;
begin
  select count(*) into huerfanos
  from public.exercises
  where (video_url is not null or video_path is not null)
    and video_id is null;

  if huerfanos > 0 then
    raise exception
      'Hay % ejercicio(s) con vídeo en las columnas viejas y sin video_id. '
      'Revisa que la migración 0026 se aplicó entera antes de borrar nada.',
      huerfanos;
  end if;
end $$;

alter table public.exercises
  drop constraint if exists exercises_video_uno_u_otro,
  drop column if exists video_url,
  drop column if exists video_path,
  drop column if exists video_poster;
