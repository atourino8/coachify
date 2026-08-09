-- =============================================================================
-- Migración 0013 · Registro de cobros
-- =============================================================================
-- Hasta ahora solo guardábamos `client_info.paid_until`, que es un ESTADO
-- ("está pagado hasta el 25 de julio"), no un hecho. Con eso no se puede hacer
-- contabilidad: una gestoría necesita "el 3 de marzo, Nadia, 45 €".
--
-- Esta tabla registra cada cobro como un hecho con su fecha y su importe. De
-- ahí salen tres cosas que antes eran imposibles: el export para la gestoría,
-- el histórico de facturación por mes, y saber cuánto se cobró de verdad
-- (que no siempre coincide con la cuota pactada).
--
-- IMPORTANTE para el futuro: esta es la MISMA tabla que recibirá los cobros
-- automáticos cuando se implemente la fase 1 del ADR-002 (Stripe). Por eso hay
-- `method` y `external_id`: un cobro en efectivo y uno de Stripe conviven aquí
-- sin tener que migrar nada.
--
-- Solo la ve el entrenador. Es información económica suya, no del cliente.
-- =============================================================================

create table if not exists public.client_payments (
  id            uuid primary key default uuid_generate_v4(),
  client_id     uuid not null references public.profiles(id) on delete cascade,
  coach_id      uuid not null references public.profiles(id) on delete cascade,

  -- Fecha en la que se cobró. Es una DATE y no un timestamp a propósito: para
  -- la contabilidad importa el día, no la hora, y así no hay líos de zona
  -- horaria al agrupar por mes.
  paid_on       date not null,
  amount        numeric(8, 2) not null check (amount >= 0),
  currency      text not null default 'EUR',

  -- Cómo se cobró. 'stripe' queda preparado aunque todavía no exista.
  method        text not null default 'efectivo'
                check (method in ('efectivo', 'transferencia', 'bizum', 'tarjeta', 'stripe', 'otro')),

  -- Qué periodo cubre este cobro. Permite exportar "la cuota de julio" aunque
  -- se haya pagado el 3 de agosto, que es lo normal.
  covers_from   date,
  covers_until  date,

  -- Identificador del cobro en el proveedor externo, cuando lo haya. Único
  -- para que un reintento de webhook no duplique la fila.
  external_id   text,

  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists client_payments_coach_date_idx
  on public.client_payments(coach_id, paid_on desc);
create index if not exists client_payments_client_idx
  on public.client_payments(client_id, paid_on desc);

-- Evita cobros duplicados si un webhook se reintenta. Parcial porque
-- external_id es null en los cobros que se apuntan a mano.
create unique index if not exists client_payments_external_idx
  on public.client_payments(external_id)
  where external_id is not null;

drop trigger if exists client_payments_set_updated_at on public.client_payments;
create trigger client_payments_set_updated_at
  before update on public.client_payments
  for each row execute function public.handle_updated_at();

-- =============================================================================
-- RLS · solo el entrenador
-- =============================================================================
alter table public.client_payments enable row level security;

create policy "coach reads own payments"
  on public.client_payments for select
  using (coach_id = auth.uid());

create policy "coach inserts own payments"
  on public.client_payments for insert
  with check (
    coach_id = auth.uid()
    and exists (
      select 1 from public.profiles p
      where p.id = client_id and p.coach_id = auth.uid()
    )
  );

create policy "coach updates own payments"
  on public.client_payments for update
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid());

create policy "coach deletes own payments"
  on public.client_payments for delete
  using (coach_id = auth.uid());

grant select, insert, update, delete on public.client_payments to authenticated;

comment on table public.client_payments is
  'Cobros recibidos de cada cliente. Un hecho por fila, con fecha e importe reales. Base de la contabilidad y del export; recibirá también los cobros de Stripe.';
