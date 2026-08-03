-- =============================================================================
-- Migración 0011 · Cuota y estado de pago del cliente
-- =============================================================================
-- Si empujamos al entrenador a cobrar cuota mensual en vez de por sesión,
-- necesita ver de un vistazo quién está al día y quién le debe.
--
-- Decisión de diseño: NO se guarda un "estado" manual (al día / vencido),
-- porque se queda obsoleto solo con que pase el tiempo. Se guarda hasta cuándo
-- está pagado (paid_until) y el estado se DERIVA comparando con la fecha de
-- hoy. Así nunca miente.
--
-- Esto es control interno del entrenador, no cobro real: no hay pasarela.
-- =============================================================================

alter table public.client_info
  add column if not exists fee_amount numeric(8,2)
    check (fee_amount is null or fee_amount >= 0),
  add column if not exists fee_currency text not null default 'EUR',
  add column if not exists paid_until date;

comment on column public.client_info.fee_amount is
  'Cuota mensual acordada con el cliente. Null = sin cuota definida.';
comment on column public.client_info.paid_until is
  'Fecha hasta la que el cliente tiene pagado. El estado se deriva de aquí.';
