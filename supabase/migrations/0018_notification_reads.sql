-- =============================================================================
-- Migración 0018 · Marcas de lectura de los avisos
-- =============================================================================
-- LO QUE ESTA TABLA NO ES: una tabla de notificaciones.
--
-- Los avisos del entrenador ya existen todos en la base, solo que repartidos:
--
--   citas por confirmar  → sessions con status = 'requested'
--   técnica por corregir → technique_videos con coach_comment a null
--   cuotas vencidas      → client_info.paid_until pasado
--   clientes sin entreno → ausencia de filas en workouts
--
-- Se DERIVAN al consultar. No hace falta generarlas, ni un disparador que las
-- cree, ni mantenerlas sincronizadas con el hecho que las provocó. Duplicar
-- todo eso en una tabla de eventos sería trabajo y una fuente más de
-- discrepancias.
--
-- Lo único que no se puede derivar es si el entrenador YA LO HA VISTO. Para
-- eso basta con esto.
--
-- CONSECUENCIA QUE HAY QUE TENER PRESENTE
--
-- Un aviso derivado desaparece cuando el hecho deja de ser cierto: confirmas
-- la cita y se va, aunque no la hubieras marcado como leída. Eso es correcto
-- para una bandeja de "cosas por hacer" y es INÚTIL como historial. Si algún
-- día hace falta "esto te llegó el martes", entonces sí tocará una tabla de
-- eventos de verdad.
-- =============================================================================

create table if not exists public.notification_reads (
  coach_id   uuid not null references public.profiles(id) on delete cascade,
  -- Qué clase de aviso. Se guarda porque el id de la entidad solo es único
  -- dentro de su tabla: una cita y un vídeo podrían compartir uuid.
  kind       text not null check (kind in ('cita', 'revision', 'pago', 'sin_entreno')),
  -- A qué apunta: id de la sesión, del vídeo, o del cliente en los dos casos
  -- que no tienen entidad propia (un pago vencido y un cliente sin entreno son
  -- estados de un cliente, no filas).
  entity_id  uuid not null,
  read_at    timestamptz not null default now(),
  primary key (coach_id, kind, entity_id)
);

create index if not exists notification_reads_coach_idx
  on public.notification_reads(coach_id, kind);

alter table public.notification_reads enable row level security;

-- Cada entrenador manda en sus marcas y nadie más las ve.
drop policy if exists "notification_reads_own" on public.notification_reads;
create policy "notification_reads_own"
  on public.notification_reads for all
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid());

grant select, insert, update, delete on public.notification_reads to authenticated;

comment on table public.notification_reads is
  'Marcas de "ya lo he visto". Los avisos NO se guardan: se derivan de sessions, technique_videos, client_info y workouts. Aquí solo vive el estado de lectura.';
