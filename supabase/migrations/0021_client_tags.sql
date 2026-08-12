-- =============================================================================
-- Migración 0021 · Etiquetas de cliente
-- =============================================================================
-- «VIP», «Online», «Rehabilitación», «Mañanas». Sirven para encontrar a alguien
-- cuando la lista pasa de treinta nombres, que es cuando dejar de reconocerlos
-- de un vistazo empieza a costar tiempo de verdad.
--
-- SE REAPROVECHA TODO LO DE LA 0019, Y NO ES PEREZA
--
-- `coach_tags` ya es exactamente esto: el vocabulario propio de un entrenador,
-- con su identificador, su texto visible y su RLS. Un grupo muscular y una
-- etiqueta de cliente se comportan igual: se crean, se renombran, se borran y
-- se ponen. Lo único que cambia es a qué se pegan.
--
-- Así que se añade una tercera clase en vez de una tabla gemela. La pantalla de
-- Ajustes, el selector de pastillas y la lógica de borrado valen sin tocarlas.
--
-- DIFERENCIA CON LAS OTRAS DOS: NO HAY VOCABULARIO BASE
--
-- Los grupos musculares y el material los traemos nosotros porque son
-- anatomía y hierros: iguales para todos. Cómo cada entrenador clasifica a su
-- gente no lo es. Uno separa por objetivo, otro por horario y otro por si le
-- paga la empresa. Traer un «VIP» de fábrica sería decidir por él cómo mira su
-- cartera.
-- =============================================================================

alter table public.coach_tags
  drop constraint if exists coach_tags_kind_check;
alter table public.coach_tags
  add constraint coach_tags_kind_check
  check (kind in ('muscle', 'equipment', 'client'));

-- Las etiquetas puestas van en client_info y no en profiles, y la razón es de
-- propiedad: `profiles` es la fila del CLIENTE —su nombre, su zona horaria—,
-- mientras que `client_info` es lo que el ENTRENADOR sabe y anota sobre él.
-- Una etiqueta es opinión del entrenador, no un dato del cliente. Además
-- client_info ya tiene la RLS correcta (solo el entrenador) y coach_id, así
-- que no hay nada nuevo que proteger.
alter table public.client_info
  add column if not exists tags text[] not null default '{}';

-- Misma validación de forma que en la 0019, y por lo mismo: un CHECK no admite
-- subconsultas, así que la base garantiza la FORMA y el código el significado.
alter table public.client_info
  drop constraint if exists client_info_tags_forma;
alter table public.client_info
  add constraint client_info_tags_forma
  check (array_to_string(tags, ',') ~ '^([a-z0-9_]{2,32}(,[a-z0-9_]{2,32})*)?$');

-- Índice GIN: filtrar la lista por etiqueta es el único motivo por el que
-- existe esta función, así que conviene que no recorra la tabla.
create index if not exists client_info_tags_idx on public.client_info using gin (tags);

comment on column public.client_info.tags is
  'Etiquetas que el entrenador le pone a este cliente. Los textos visibles viven en coach_tags con kind = client.';
