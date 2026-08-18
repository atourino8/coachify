// Export de la cartera de clientes.  /clientes-export
//
// Sirve para dos cosas distintas:
//   · Copia de seguridad del entrenador: sus contactos y sus fichas fuera de
//     nuestra base de datos. Nadie debería quedarse atrapado en una app.
//   · Portabilidad del RGPD, que la política de privacidad ya promete.
//
// NO incluye las notas privadas del entrenador sobre el cliente. Están
// pensadas para no salir de la ficha, y un CSV es justo lo que se acaba
// reenviando por correo sin pensar.

import { redirect } from '@sveltejs/kit';
import { construirCSV, numeroCSV, respuestaCSV } from '$lib/csv';
import { todayISOLocal } from '$lib/week';
import { supabaseAdmin } from '$lib/supabase/admin';
import { paymentStatus } from '$lib/supabase/types';
import type { RequestHandler } from './$types';

const ETIQUETA_ESTADO: Record<string, string> = {
  al_dia: 'Al día',
  vence_pronto: 'Vence pronto',
  vencido: 'Vencido',
  sin_cuota: 'Sin cuota'
};

export const GET: RequestHandler = async ({ locals: { supabase, user } }) => {
  if (!user) redirect(303, '/login');

  const hoy = todayISOLocal();

  const [{ data: clientesRaw }, { data: infoRaw }, { data: pagosRaw }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, created_at, archived')
      .eq('coach_id', user.id)
      .order('full_name'),
    supabase
      .from('client_info')
      .select(
        'client_id, goals, injuries, training_days_per_week, level, height_cm, birth_date, fee_amount, fee_currency, paid_until'
      )
      .eq('coach_id', user.id),
    supabase.from('client_payments').select('client_id, amount').eq('coach_id', user.id)
  ]);

  const clientes = (clientesRaw ?? []) as {
    id: string;
    full_name: string | null;
    created_at: string;
    archived: boolean;
  }[];

  type Info = {
    client_id: string;
    goals: string | null;
    injuries: string | null;
    training_days_per_week: number | null;
    level: string | null;
    height_cm: number | null;
    birth_date: string | null;
    fee_amount: number | null;
    fee_currency: string | null;
    paid_until: string | null;
  };
  const infoPorId = new Map(((infoRaw ?? []) as Info[]).map((i) => [i.client_id, i]));

  // Total cobrado por cliente: el dato que convierte la lista en algo útil
  // para revisar el año.
  const totalPorId = new Map<string, number>();
  for (const p of (pagosRaw ?? []) as { client_id: string; amount: number }[]) {
    totalPorId.set(p.client_id, (totalPorId.get(p.client_id) ?? 0) + Number(p.amount));
  }

  // El email vive en auth.users, así que hace falta el cliente admin.
  const emailPorId = new Map<string, string>();
  try {
    const { data } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    for (const u of data?.users ?? []) {
      if (u.email) emailPorId.set(u.id, u.email);
    }
  } catch {
    // Si no se puede leer, el export sale sin emails en vez de fallar entero.
  }

  const filas = clientes.map((c) => {
    const info = infoPorId.get(c.id);
    const estado = paymentStatus(info ?? null, hoy);
    return [
      c.full_name ?? '',
      emailPorId.get(c.id) ?? '',
      c.archived ? 'Archivado' : 'Activo',
      c.created_at.slice(0, 10),
      numeroCSV(info?.fee_amount ?? null),
      info?.fee_currency ?? '',
      ETIQUETA_ESTADO[estado] ?? estado,
      info?.paid_until ?? '',
      numeroCSV(totalPorId.get(c.id) ?? 0),
      info?.level ?? '',
      info?.training_days_per_week ?? '',
      info?.goals ?? '',
      info?.injuries ?? ''
    ];
  });

  const csv = construirCSV(
    [
      'Nombre',
      'Email',
      'Estado',
      'Cliente desde',
      'Cuota',
      'Moneda',
      'Estado de pago',
      'Pagado hasta',
      'Total cobrado',
      'Nivel',
      'Días por semana',
      'Objetivos',
      'Lesiones'
    ],
    filas
  );

  return respuestaCSV(`treno-clientes-${hoy}.csv`, csv);
};
