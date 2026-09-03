// Detalle de una clase: quién va, quién espera, y las tres cosas que el
// entrenador puede hacer (sacar a alguien, cambiar el aforo, cancelarla).

import { error, fail, redirect } from '@sveltejs/kit';
import { mensajeDeError } from '$lib/clases';
import { faltasPorCliente } from '$lib/faltas.server';
import { urlsDeAvatar } from '$lib/avatares.server';
import type { GroupClass, ClassBooking } from '$lib/supabase/types';
import { avisar } from '$lib/aviso.server';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, locals: { supabase, user } }) => {
  if (!user) redirect(303, '/login');

  const { data: claseRaw } = await supabase
    .from('group_classes')
    .select('*, client_groups(name)')
    .eq('id', params.id)
    .eq('coach_id', user.id)
    .maybeSingle();
  if (!claseRaw) error(404, 'Esa clase no existe.');
  const clase = claseRaw as unknown as GroupClass & { client_groups: { name: string } | null };

  const { data: inscripcionesRaw } = await supabase
    .from('class_bookings')
    .select('id, client_id, status, created_at, cancelled_at, had_seat')
    .eq('class_id', params.id)
    .order('created_at');
  const inscripciones = (inscripcionesRaw ?? []) as unknown as Pick<
    ClassBooking,
    'id' | 'client_id' | 'status' | 'created_at' | 'cancelled_at' | 'had_seat'
  >[];

  // Los nombres, de una vez. Con una consulta por inscrito esto sería el mismo
  // N+1 que ya se quitó de la agenda y de la lista de clientes.
  const ids = [...new Set(inscripciones.map((i) => i.client_id))];
  const nombres = new Map<string, string>();
  const rutas = new Map<string, string | null>();
  const avatares = new Map<string, string | null>();
  if (ids.length > 0) {
    const { data: perfiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_path')
      .in('id', ids);
    const filas = (perfiles ?? []) as {
      id: string;
      full_name: string | null;
      avatar_path: string | null;
    }[];
    for (const p of filas) {
      nombres.set(p.id, p.full_name ?? 'Sin nombre');
      rutas.set(p.id, p.avatar_path);
    }
    const firmadas = await urlsDeAvatar(
      supabase,
      filas.map((f) => f.avatar_path)
    );
    for (const [id, ruta] of rutas) {
      if (ruta) avatares.set(id, firmadas.get(ruta) ?? null);
    }
  }

  const faltas = await faltasPorCliente(supabase, user.id, ids);

  const conNombre = (i: (typeof inscripciones)[number]) => ({
    id: i.id,
    client_id: i.client_id,
    nombre: nombres.get(i.client_id) ?? 'Sin nombre',
    avatar: avatares.get(i.client_id) ?? null,
    faltas: faltas.get(i.client_id) ?? 0,
    created_at: i.created_at,
    cancelled_at: i.cancelled_at
  });

  return {
    clase: {
      id: clase.id,
      title: clase.title,
      starts_at: clase.starts_at,
      ends_at: clase.ends_at,
      capacity: clase.capacity,
      location: clase.location,
      notes: clase.notes,
      status: clase.status,
      grupo: clase.client_groups?.name ?? null
    },
    apuntados: inscripciones.filter((i) => i.status === 'seat').map(conNombre),
    enEspera: inscripciones.filter((i) => i.status === 'waitlist').map(conNombre),
    bajas: inscripciones
      .filter((i) => i.status === 'cancelled')
      .map(conNombre)
      .reverse()
  };
};

export const actions: Actions = {
  // Sacar a alguien. Pasa por la MISMA función que usa el cliente para
  // cancelar: es la que asciende al primero de la lista de espera. Un update
  // directo a 'cancelled' dejaría la plaza libre y la cola quieta.
  quitar: async ({ params, request, cookies, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const fd = await request.formData();
    const clientId = String(fd.get('client_id') ?? '');
    if (!clientId) return fail(400, { error: 'Falta a quién quitar.' });

    const { error: err } = await supabase.rpc('cancel_class_booking', {
      p_class_id: params.id,
      p_client_id: clientId
    });
    if (err) return fail(400, { error: mensajeDeError(err.message) });
    avisar(cookies, 'Fuera de la clase. Si había lista de espera, ha entrado el primero.');
    return { success: true };
  },

  aforo: async ({ params, request, cookies, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const fd = await request.formData();
    const capacity = Number(fd.get('capacity'));
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 200)
      return fail(400, { error: 'El aforo va de 1 a 200 plazas.' });

    const { error: err } = await supabase
      .from('group_classes')
      .update({ capacity } as never)
      .eq('id', params.id)
      .eq('coach_id', user.id);
    if (err) return fail(500, { error: err.message });

    // Subir el aforo NO asciende a nadie de la lista de espera. Se hace a
    // mano y a propósito: ascender en masa sin avisar mete en una clase a
    // gente que pidió sitio hace tres semanas y ya no cuenta con ello.
    avisar(
      cookies,
      'Aforo cambiado. Nadie de la lista de espera sube solo: métele tú si quieres.',
      'aviso'
    );
    return { success: true };
  },

  cancelar: async ({ params, cookies, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const { error: err } = await supabase
      .from('group_classes')
      .update({ status: 'cancelled' } as never)
      .eq('id', params.id)
      .eq('coach_id', user.id);
    if (err) return fail(500, { error: err.message });
    avisar(cookies, 'Clase cancelada. Los apuntados la verán marcada como cancelada.', 'aviso');
    return { success: true };
  },

  reabrir: async ({ params, cookies, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const { error: err } = await supabase
      .from('group_classes')
      .update({ status: 'published' } as never)
      .eq('id', params.id)
      .eq('coach_id', user.id);
    if (err) return fail(500, { error: err.message });
    avisar(cookies, 'Clase reabierta.');
    return { success: true };
  },

  borrar: async ({ params, cookies, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const { error: err } = await supabase
      .from('group_classes')
      .delete()
      .eq('id', params.id)
      .eq('coach_id', user.id);
    if (err) return fail(500, { error: err.message });
    // El aviso ANTES del redirect: se aterriza en el listado sin la clase, y
    // sin una palabra no se distingue de haberla borrado por error.
    avisar(cookies, 'Clase borrada.');
    redirect(303, '/clases');
  }
};
