// Cobros del entrenador: lo que ha entrado, lo que falta por entrar y el
// export para la gestoría.
//
// Existe porque `client_info.paid_until` es un estado y la contabilidad
// necesita hechos. Todo lo de aquí sale de `client_payments` (migración 0013).

import { redirect } from '@sveltejs/kit';
import { todayISOLocal } from '$lib/week';
import type { PaymentMethod } from '$lib/supabase/types';
import type { PageServerLoad } from './$types';

type PagoRow = {
  id: string;
  client_id: string;
  paid_on: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  covers_from: string | null;
  covers_until: string | null;
  notes: string | null;
};

export const load: PageServerLoad = async ({ url, locals: { supabase, user } }) => {
  if (!user) redirect(303, '/login');

  // Año en curso por defecto. Se puede cambiar con ?anio=2025.
  const hoy = todayISOLocal();
  const anio = Number(url.searchParams.get('anio')) || Number(hoy.slice(0, 4));

  const [{ data: pagosRaw }, { data: clientesRaw }, { data: cuotasRaw }] = await Promise.all([
    supabase
      .from('client_payments')
      .select('id, client_id, paid_on, amount, currency, method, covers_from, covers_until, notes')
      .eq('coach_id', user.id)
      .gte('paid_on', `${anio}-01-01`)
      .lte('paid_on', `${anio}-12-31`)
      .order('paid_on', { ascending: false }),
    supabase.from('profiles').select('id, full_name').eq('coach_id', user.id).eq('archived', false),
    supabase.from('client_info').select('client_id, fee_amount').eq('coach_id', user.id)
  ]);

  const pagos = (pagosRaw ?? []) as PagoRow[];
  const clientes = (clientesRaw ?? []) as { id: string; full_name: string | null }[];
  const nombrePorId = new Map(clientes.map((c) => [c.id, c.full_name ?? 'Cliente']));

  // Total por mes. Se agrupa por los 7 primeros caracteres de la fecha
  // (YYYY-MM) porque paid_on es DATE: sin horas no hay líos de zona horaria.
  const porMes = new Map<string, { total: number; cobros: number }>();
  for (const p of pagos) {
    const mes = p.paid_on.slice(0, 7);
    const acc = porMes.get(mes) ?? { total: 0, cobros: 0 };
    acc.total += Number(p.amount);
    acc.cobros += 1;
    porMes.set(mes, acc);
  }
  const meses = [...porMes.entries()]
    .map(([mes, v]) => ({ mes, ...v }))
    .sort((a, b) => b.mes.localeCompare(a.mes));

  // Previsión: lo que entraría este mes si todos pagasen su cuota. No es una
  // promesa, es el techo; sirve para comparar contra lo cobrado de verdad.
  const cuotas = (cuotasRaw ?? []) as { client_id: string; fee_amount: number | null }[];
  const activos = new Set(clientes.map((c) => c.id));
  const prevision = cuotas
    .filter((c) => activos.has(c.client_id) && c.fee_amount !== null)
    .reduce((s, c) => s + Number(c.fee_amount), 0);

  const mesActual = hoy.slice(0, 7);
  const cobradoEsteMes = porMes.get(mesActual)?.total ?? 0;

  return {
    anio,
    anios: [anio + 1, anio, anio - 1, anio - 2].filter((a) => a <= Number(hoy.slice(0, 4)) + 1),
    meses,
    totalAnio: pagos.reduce((s, p) => s + Number(p.amount), 0),
    prevision,
    cobradoEsteMes,
    mesActual,
    pagos: pagos.map((p) => ({
      ...p,
      amount: Number(p.amount),
      cliente: nombrePorId.get(p.client_id) ?? 'Cliente'
    }))
  };
};
