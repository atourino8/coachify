-- =============================================================================
-- Migración 0024 · Fotos de perfil
-- =============================================================================
-- El wireframe de la cartera de clientes es una rejilla de caras. Es la mejor
-- justificación posible para una foto: el entrenador reconoce a la persona
-- antes de leer el nombre, y con sesenta clientes eso son segundos por cada
-- vez que abre la lista.
--
-- QUIÉN LA PONE
--
-- Cada uno la suya, y el entrenador también la de sus clientes. Lo segundo no
-- es un capricho: si depende de que el cliente entre a su perfil y suba una
-- foto, la rejilla se queda llena de iniciales y la característica no existe.
-- =============================================================================

-- =============================================================================
-- LA COLUMNA YA ESTABA
-- =============================================================================
-- `profiles.avatar_url` se creó en la migración 0001 y no la ha usado nunca
-- nadie: ni una consulta, ni una plantilla. Se renombra en vez de añadir una
-- al lado, porque dos columnas de foto —una muerta y otra viva— es justo el
-- tipo de cosa que dentro de un año nadie sabe explicar.
--
-- Y se llama _path y no _url porque eso es lo que guarda: la ruta dentro del
-- cubo. El cubo es privado, así que la URL no existe hasta que se firma, y
-- guardar una URL firmada sería guardar algo que caduca.
alter table public.profiles rename column avatar_url to avatar_path;

comment on column public.profiles.avatar_path is
  'Ruta de la foto en el cubo avatars. Nula = se pinta la inicial. No es una URL: el cubo es privado y las URL se firman al pedirlas.';

-- =============================================================================
-- EL CUBO
-- =============================================================================
-- Privado, como los otros dos.
--
-- Un cubo público de avatares es lo normal en media internet y aquí no vale:
-- son caras de personas identificables junto a su nombre, en una aplicación
-- donde además consta su peso, sus lesiones y lo que paga. Que la ruta lleve
-- un UUID no es un control de acceso, es una contraseña que se enseña en cada
-- petición.
--
-- 5 MB: una foto de perfil que pese más es una foto sin recortar.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = false,
      file_size_limit = 5242880,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- Convención de ruta: {profile_id}/avatar.{ext}
-- La primera carpeta dice DE QUIÉN es la cara, no quién la subió. Eso es lo
-- que hace que las políticas se puedan escribir en una línea cada una.

-- =============================================================================
-- POLÍTICAS
-- =============================================================================

-- 1 · La tuya es tuya: verla, cambiarla y borrarla.
drop policy if exists "avatars: cada uno la suya" on storage.objects;
create policy "avatars: cada uno la suya"
  on storage.objects for all
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 2 · El entrenador gestiona la de SUS clientes.
--
-- `for all` y no solo lectura: el sentido de esto es que pueda ponerla él
-- cuando el cliente no lo haga. Se comprueba contra profiles.coach_id, así
-- que el día que un cliente cambie de entrenador el anterior deja de poder
-- tocar su foto sin que haya que revocar nada.
drop policy if exists "avatars: el entrenador gestiona la de sus clientes" on storage.objects;
create policy "avatars: el entrenador gestiona la de sus clientes"
  on storage.objects for all
  to authenticated
  using (
    bucket_id = 'avatars'
    and exists (
      select 1 from public.profiles p
       where p.id::text = (storage.foldername(name))[1]
         and p.coach_id = auth.uid()
    )
  )
  with check (
    bucket_id = 'avatars'
    and exists (
      select 1 from public.profiles p
       where p.id::text = (storage.foldername(name))[1]
         and p.coach_id = auth.uid()
    )
  );

-- 3 · El cliente VE la de su entrenador, y solo verla.
--
-- Hace falta porque la cabecera del cliente lleva la identidad de su
-- entrenador (migración 0014). Sin esto, la marca se queda con la inicial
-- mientras el entrenador sí ve su propia foto: un fallo que no da error y que
-- solo se nota entrando como cliente.
drop policy if exists "avatars: el cliente ve la de su entrenador" on storage.objects;
create policy "avatars: el cliente ve la de su entrenador"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (
      select coach_id::text from public.profiles where id = auth.uid()
    )
  );

-- Los compañeros de una clase NO se ven las caras entre ellos: la lista de
-- apuntados es solo del entrenador (migración 0022), y no hay ninguna pantalla
-- donde un cliente vea a otro. Cuando la haya, será una política más y una
-- decisión consciente, no un efecto secundario de esta.
