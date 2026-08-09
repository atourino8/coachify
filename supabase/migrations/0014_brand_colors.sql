-- =============================================================================
-- Migración 0014 · Colores de marca del entrenador
-- =============================================================================
-- Cada entrenador puede pintar su espacio con su color. Lo ve él y lo ven sus
-- clientes: la aplicación es el sitio donde su cliente le ve a él, no a
-- nosotros.
--
-- Dos columnas, las dos opcionales. NULL significa "la paleta de Treno", que
-- es lo que ve quien no toque nada. No ponemos valor por defecto a propósito:
-- así se distingue "no lo he configurado" de "he elegido justo el naranja".
--
--   brand_accent    color principal. Pinta el acento entero.
--   brand_accent_2  segundo color, opcional. Solo para el degradado de la
--                   marca. Si está a NULL, la marca es plana.
--
-- Se guardan en hexadecimal de seis dígitos con almohadilla, que es lo que
-- devuelve <input type="color"> y lo que el entrenador tiene apuntado en su
-- manual de marca. La conversión a canales RGB sueltos (que es lo que exigen
-- las variables CSS) se hace en el código, no aquí.
--
-- RLS: no hace falta tocar nada. La política profiles_select_own_or_related de
-- la migración 0002 ya permite que un cliente lea la fila de su entrenador
-- (`id = public.current_user_coach_id()`), así que el color viaja solo.
-- =============================================================================

alter table public.profiles
  add column if not exists brand_accent   text,
  add column if not exists brand_accent_2 text;

-- La validación va en la base y no solo en el formulario. El color acaba
-- inyectado dentro de una etiqueta <style>, así que un valor con forma libre
-- sería una vía de inyección de CSS. Con esta restricción, lo único que puede
-- estar guardado ahí es una almohadilla y seis dígitos hexadecimales.
--
-- El código igualmente vuelve a validar antes de escribir el CSS: dos cierres
-- para lo mismo, porque el coste es cero y el fallo sería silencioso.
alter table public.profiles
  drop constraint if exists profiles_brand_accent_hex;
alter table public.profiles
  add constraint profiles_brand_accent_hex
  check (brand_accent is null or brand_accent ~ '^#[0-9A-Fa-f]{6}$');

alter table public.profiles
  drop constraint if exists profiles_brand_accent_2_hex;
alter table public.profiles
  add constraint profiles_brand_accent_2_hex
  check (brand_accent_2 is null or brand_accent_2 ~ '^#[0-9A-Fa-f]{6}$');

-- Un segundo color sin primero no significa nada: el degradado se define de
-- brand_accent a brand_accent_2. Sin el primero, no hay de dónde partir.
alter table public.profiles
  drop constraint if exists profiles_brand_accent_2_needs_1;
alter table public.profiles
  add constraint profiles_brand_accent_2_needs_1
  check (brand_accent_2 is null or brand_accent is not null);

comment on column public.profiles.brand_accent is
  'Color de marca del entrenador en hexadecimal (#RRGGBB). NULL = paleta de Treno. Lo ven él y sus clientes.';
comment on column public.profiles.brand_accent_2 is
  'Segundo color opcional para el degradado de la marca. Requiere brand_accent.';
