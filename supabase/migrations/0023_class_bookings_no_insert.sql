-- =============================================================================
-- Migración 0023 · Que lo que dice la 0022 sea verdad
-- =============================================================================
-- La 0022 afirma, en un comentario de tabla y en el ADR-004, que «authenticated
-- no tiene permiso de INSERT sobre class_bookings». Eso era falso.
--
-- Supabase deja puestos unos permisos por defecto en el esquema public:
--
--   alter default privileges in schema public
--     grant all on tables to postgres, anon, authenticated, service_role;
--
-- Las migraciones corren como postgres, así que TODA tabla nueva nace con
-- INSERT concedido a anon y a authenticated, diga lo que diga después el
-- `grant select, update, delete` que se escriba a mano: conceder de menos no
-- retira lo que ya se dio.
--
-- Lo que sí bloqueaba el insert directo era la RLS: class_bookings tiene RLS
-- activada y NINGUNA política de INSERT, y sin política no se inserta. O sea
-- que la puerta estaba cerrada, pero con otra llave distinta de la que decía
-- el cartel.
--
-- Se arregla el cartel, y se cierra también con la llave anunciada. Dos
-- cerrojos en la misma puerta suena a exceso hasta que alguien añade una
-- política de INSERT «solo para este caso» y se lleva por delante el aforo,
-- que es exactamente el fallo que la 0022 existe para impedir.
-- =============================================================================

revoke insert on public.class_bookings from anon, authenticated;

comment on table public.class_bookings is
  'Inscripciones. NO se insertan directamente: el aforo solo se respeta a través de public.book_class(), que bloquea la fila de la clase antes de contar. Cerrado por dos sitios: no hay política de INSERT en la RLS, y el permiso de INSERT está revocado a anon y authenticated (migración 0023). Si algún día hace falta insertar desde fuera, la pregunta correcta no es cuál de los dos abrir, es por qué no vale la función.';
