-- =============================================================================
-- Migración 0015 · Pausar el acceso del cliente que no ha pagado
-- =============================================================================
-- El entrenador puede pausar lo que él produce —el entreno del día y los
-- vídeos de técnica— a un cliente con la cuota vencida.
--
-- APAGADO DE FÁBRICA, Y A PROPÓSITO.
--
-- `paid_until` no es un cobro verificado: es lo que el entrenador apuntó a
-- mano. No hay pasarela todavía. Si cobra por Bizum y tarda dos días en
-- registrarlo, un bloqueo automático le cierra la puerta a alguien que ya le
-- pagó, y el que queda mal delante de su cliente es él. Así que esto no se
-- enciende solo: lo enciende quien conoce su propia contabilidad.
--
-- Cuando los cobros pasen por Stripe y la fecha deje de depender de que
-- alguien la apunte, esta decisión se puede revisar (ver ADR-002).
--
-- LO QUE NO SE GUARDA AQUÍ
--
-- El periodo de gracia (7 días) vive en el código, no en esta tabla. Es
-- política del producto, no una preferencia del entrenador: si fuera un campo
-- configurable, alguien lo pondría a cero y tendríamos el bloqueo instantáneo
-- que estamos evitando a propósito. El día que haga falta hacerlo ajustable,
-- se añade la columna; hoy sería complejidad sin demanda.
-- =============================================================================

alter table public.profiles
  add column if not exists block_on_overdue boolean not null default false;

comment on column public.profiles.block_on_overdue is
  'Solo para perfiles de coach. Si está activo, sus clientes con la cuota vencida (más allá del periodo de gracia) dejan de ver entrenos y vídeos. Su historial de progreso sigue siendo accesible: son datos del cliente.';
