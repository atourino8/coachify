// Export de cobros para la gestoría.  /cobros/export?anio=2026
//
// Una fila por cobro, con el periodo que cubre. Eso último importa más de lo
// que parece: un cobro del 3 de agosto puede corresponder a la cuota de julio,
// y sin esa columna la gestoría no puede imputarlo al mes correcto.

import { redirect } from '@sveltejs/kit';
import { construirCSV, numeroCSV, respuestaCSV } from '$lib/csv';
import { todayISOLocal } from '$lib/week';
import { PAYMENT_METHOD_LABELS, type PaymentMethod } from '$lib/supabase/types';
import type { RequestHandler } from './$types';

type PagoRow = {
  client_id: string;
  paid_on: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  covers_from: string | null;
  covers_until: string | null;
  notes: string | null;
};

export const GET: RequestHandler = async ({ url, locals: { supabase, user } }) => {
  if (!user) redirect(303, '/login');

  const anio = Number(url.searchParams.get('anio')) || Number(todayISOLocal().slice(0, 4));

  const [{ data: pagosRaw }, { data: clientesRaw }] = await Promise.all([
    supabase
      .from('client_payments')
      .select('client_id, paid_on, amount, currency, method, covers_from, covers_until, notes')
      .eq('coach_id', user.id)
      .gte('paid_on', `${anio}-01-01`)
      .lte('paid_on', `${anio}-12-31`)
      .order('paid_on', { ascending: true }),
    supabase.from('profiles').select('id, full_name').eq('coach_id', user.id)
  ]);

  const nombrePorId = new Map(
    ((clientesRaw ?? []) as { id: string; full_name: string | null }[]).map((c) => [
      c.id,
      c.full_name ?? 'Cliente'
    ])
  );

  const pagos = (pagosRaw ?? []) as PagoRow[];

  const filas = pagos.map((p) => [
    p.paid_on,
    nombrePorId.get(p.client_id) ?? 'Cliente',
    numeroCSV(Number(p.amount)),
    p.currency,
    PAYMENT_METHOD_LABELS[p.method] ?? p.method,
    p.covers_from ?? '',
    p.covers_until ?? '',
    p.notes ?? ''
  ]);

  // Fila de total al final: es lo primero que busca cualquiera que abra esto.
  if (filas.length > 0) {
    const total = pagos.reduce((s, p) => s + Number(p.amount), 0);
    filas.push(['', 'TOTAL', numeroCSV(total), 'EUR', '', '', '', '']);
  }

  const csv = construirCSV(
    [
      'Fecha de cobro',
      'Cliente',
      'Importe',
      'Moneda',
      'Forma de pago',
      'Periodo desde',
      'Periodo hasta',
      'Notas'
    ],
    filas
  );

  return respuestaCSV(`treno-cobros-${anio}.csv`, csv);
};
