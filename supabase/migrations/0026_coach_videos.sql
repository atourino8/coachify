-- =============================================================================
-- 0026 · El vídeo deja de pertenecer al ejercicio
-- =============================================================================
--
-- Ver ADR-005. Resumen del porqué:
--
-- El curl analítico y el isométrico son el MISMO movimiento grabado, pero dos
-- ejercicios. Con el vídeo dentro de la fila del ejercicio eso obliga a subir
-- dos veces lo mismo: el doble de almacenamiento —la parte cara de esta
-- aplicación— y dos sitios que actualizar cuando se regraba.
--
-- Los vídeos pasan a ser del ENTRENADOR y los ejercicios apuntan a uno.
--
-- Y lo que distingue a las variantes (qué mirar, y en qué tramo) se queda en el
-- EJERCICIO, no en el vídeo: si colgara del vídeo, las dos variantes verían la
-- misma nota y no habríamos resuelto nada.

-- --- La biblioteca de vídeos ------------------------------------------------

create table public.coach_videos (
  id         uuid primary key default uuid_generate_v4(),
  coach_id   uuid not null references public.profiles(id) on delete cascade,
  -- Cómo lo llama él. Sirve para reconocerlo al reutilizarlo en otra variante,
  -- que es justo el momento en el que se pierde de vista cuál era cuál.
  nombre     text not null,
  -- Igual que antes: o subido, o enlazado, nunca los dos.
  url        text,
  path       text,
  poster     text,
  duracion_s int,
  created_at timestamptz not null default now(),

  constraint coach_videos_una_fuente check (
    (url is not null and path is null) or (url is null and path is not null)
  )
);

create index coach_videos_coach_idx on public.coach_videos(coach_id, nombre);

comment on table public.coach_videos is
  'Vídeos de técnica del entrenador. Un vídeo, varios ejercicios (ADR-005).';
comment on column public.coach_videos.url is
  'Vídeo ENLAZADO (YouTube). Excluyente con path.';
comment on column public.coach_videos.path is
  'Ruta en el cubo coach-media. Excluyente con url.';

alter table public.coach_videos enable row level security;

-- Las mismas cuatro políticas que exercises, y por el mismo motivo: el cliente
-- tiene que poder VER el vídeo de su entrenador para hacer el entreno, pero no
-- tocarlo. `current_user_coach_id()` ya existe desde la 0003.
create policy "coach_videos_select_own_or_client"
  on public.coach_videos for select
  using (
    coach_id = auth.uid()
    OR coach_id = public.current_user_coach_id()
  );

create policy "coach_videos_insert_own"
  on public.coach_videos for insert
  with check (coach_id = auth.uid());

create policy "coach_videos_update_own"
  on public.coach_videos for update
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid());

create policy "coach_videos_delete_own"
  on public.coach_videos for delete
  using (coach_id = auth.uid());

-- --- El ejercicio apunta a un vídeo y dice qué mirar en él -------------------

alter table public.exercises
  -- `set null` y no `restrict`: borrar un vídeo que usan tres ejercicios tiene
  -- que poder hacerse diciendo a cuántos afecta. Con `restrict` habría que
  -- desengancharlos de uno en uno antes de poder borrar, que es peor.
  add column if not exists video_id    uuid references public.coach_videos(id) on delete set null,
  add column if not exists video_nota  text,
  add column if not exists video_desde int,
  add column if not exists video_hasta int;

comment on column public.exercises.video_nota is
  'Qué mirar en el vídeo PARA ESTA VARIANTE. Lo lee el cliente.';
comment on column public.exercises.video_desde is
  'Segundo en el que empieza el tramo que interesa. NULL = desde el principio.';
comment on column public.exercises.video_hasta is
  'Segundo en el que acaba. NULL = hasta el final.';

-- El tramo tiene que tener sentido. Sin esto, «desde 40 hasta 12» se guarda
-- tan ricamente y el reproductor no arranca nunca.
alter table public.exercises
  add constraint exercises_tramo_valido check (
    (video_desde is null or video_desde >= 0)
    and (video_hasta is null or video_hasta > 0)
    and (video_desde is null or video_hasta is null or video_hasta > video_desde)
  );

create index exercises_video_idx on public.exercises(video_id);

-- --- Mudanza de lo que ya existe --------------------------------------------
--
-- Un vídeo por ejercicio que tuviera uno, así que el comportamiento no cambia.
-- A partir de aquí ya se pueden compartir.
--
-- FILA A FILA, y no con un INSERT … RETURNING emparejado por nombre: el nombre
-- del ejercicio NO es único por entrenador, así que dos ejercicios llamados
-- igual se cruzarían y uno acabaría apuntando al vídeo del otro. Un bucle es
-- más lento y aquí da igual: esto se ejecuta una vez, sobre las filas que
-- existan hoy.
do $$
declare
  ej record;
  nuevo_id uuid;
begin
  for ej in
    select id, coach_id, name, video_url, video_path, video_poster
    from public.exercises
    where video_url is not null or video_path is not null
  loop
    insert into public.coach_videos (coach_id, nombre, url, path, poster)
    values (ej.coach_id, ej.name, ej.video_url, ej.video_path, ej.video_poster)
    returning id into nuevo_id;

    update public.exercises set video_id = nuevo_id where id = ej.id;
  end loop;
end $$;

-- --- Las columnas viejas NO se borran aquí ---------------------------------
--
-- Y esto sí merece explicación, porque va contra la regla de «una sola fuente
-- para cada dato» que seguimos en todo lo demás.
--
-- Si esta migración borrara `video_url` y `video_path`, entre aplicarla y
-- traerse el código nuevo la aplicación estaría ROTA: el código de hoy lee esas
-- columnas y ya no existirían. Y las migraciones se aplican a mano, antes del
-- pull, así que esa ventana es real.
--
-- Así que se hace en dos tiempos, que es el patrón de siempre para esto:
--
--   0026 (esta) · crea y COPIA. Nada se rompe: el código viejo sigue leyendo
--                 las columnas viejas, que siguen ahí con su contenido.
--   0027        · BORRA las columnas viejas. Va junto al código que ya lee de
--                 `coach_videos`, y se aplica después de traérselo.
--
-- La duplicación es temporal y tiene fecha de caducidad escrita: mientras
-- exista, manda `coach_videos`. Las columnas viejas están congeladas —nadie
-- escribe en ellas— y solo esperan a que la 0027 las quite.
