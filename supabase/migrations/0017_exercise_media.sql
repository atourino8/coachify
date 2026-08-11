-- =============================================================================
-- Migración 0017 · Vídeo e imagen del ejercicio, subidos o enlazados
-- =============================================================================
-- Cuatro combinaciones, decididas a propósito: vídeo subido o enlazado de
-- YouTube, imagen subida o enlazada. Se le RECOMIENDA subir, pero no se le
-- obliga: un entrenador que ya tiene sus vídeos en YouTube no va a resubirlos
-- para probar la aplicación, y ponerle esa barrera el primer día es perderlo
-- el primer día.
--
-- La imagen no es la miniatura del vídeo, es contenido con valor propio. Quien
-- ya ha visto el vídeo tres veces no necesita el vídeo: necesita acordarse de
-- la posición, y una foto en el gimnasio con el móvil en la mano es más rápida
-- que cargar uno y buscar el segundo doce.
--
-- CUBO NUEVO, SEPARADO DEL DE TÉCNICA
--
-- `technique-videos` guarda vídeos PERSONALES de cada cliente, y su política
-- dice "cada uno manda en su carpeta". Este cubo guarda material del ENTRENADOR
-- que ven todos sus clientes: la regla es la contraria. Meterlos juntos
-- obligaría a que una sola política distinguiera dos casos opuestos por la
-- forma de la ruta, que es como se cuelan los agujeros.
-- =============================================================================

alter table public.exercises
  add column if not exists image_url  text,
  add column if not exists video_path text,
  add column if not exists image_path text;

-- Enlazado y subido son excluyentes: si estuvieran los dos, ninguna pantalla
-- sabría cuál enseñar y la respuesta dependería del orden en que se leyera.
alter table public.exercises
  drop constraint if exists exercises_video_uno_u_otro;
alter table public.exercises
  add constraint exercises_video_uno_u_otro
  check (video_url is null or video_path is null);

alter table public.exercises
  drop constraint if exists exercises_imagen_uno_u_otro;
alter table public.exercises
  add constraint exercises_imagen_uno_u_otro
  check (image_url is null or image_path is null);

comment on column public.exercises.video_url is
  'Vídeo ENLAZADO (YouTube). Excluyente con video_path.';
comment on column public.exercises.video_path is
  'Ruta del vídeo SUBIDO en el cubo coach-media. Excluyente con video_url.';
comment on column public.exercises.image_url is
  'Imagen ENLAZADA. Excluyente con image_path.';
comment on column public.exercises.image_path is
  'Ruta de la imagen SUBIDA en el cubo coach-media. Excluyente con image_url.';

-- =============================================================================
-- Cubo del material del entrenador
-- =============================================================================
-- Privado, como el de técnica. Se sirve con URL firmadas.
--
-- Es material del entrenador y podría razonarse que da igual quién lo vea,
-- pero es su trabajo y es parte de lo que vende. Un cubo público significa que
-- basta con adivinar una URL para llevarse su biblioteca entera de vídeos, y
-- "es difícil de adivinar" no es un control de acceso.
--
-- Tope de 100 MB: el doble que el de técnica. Un vídeo del cliente es un móvil
-- grabando un minuto; uno del entrenador puede venir editado y en mejor
-- calidad, y es contenido que va a ver mucha gente muchas veces.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'coach-media',
  'coach-media',
  false,
  104857600,
  array[
    'video/mp4', 'video/webm', 'video/quicktime',
    'image/jpeg', 'image/png', 'image/webp'
  ]
)
on conflict (id) do update
  set public = false,
      file_size_limit = 104857600,
      allowed_mime_types = array[
        'video/mp4', 'video/webm', 'video/quicktime',
        'image/jpeg', 'image/png', 'image/webp'
      ];

-- Convención de ruta: {coach_id}/{exercise_id}/{video|imagen}.{ext}
-- La primera carpeta es lo que usan las políticas para decidir de quién es.

drop policy if exists "coach media: coach manages own folder" on storage.objects;
create policy "coach media: coach manages own folder"
  on storage.objects for all
  to authenticated
  using (
    bucket_id = 'coach-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'coach-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Los clientes LEEN el material de SU entrenador, y solo el de él.
--
-- Se compara contra profiles.coach_id del que pide, no contra una lista: así
-- el día que un cliente cambie de entrenador deja de ver el material del
-- anterior sin que haya que tocar nada.
drop policy if exists "coach media: clients read their coach" on storage.objects;
create policy "coach media: clients read their coach"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'coach-media'
    and (storage.foldername(name))[1] = (
      select coach_id::text from public.profiles where id = auth.uid()
    )
  );
