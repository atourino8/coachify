// Avisos: todo lo que espera algo del entrenador, en un sitio.

import { fail, redirect } from '@sveltejs/kit';
import { avisosDelCoach, ETIQUETAS_AVISO, type TipoAviso } from '$lib/avisos.server';
import { avisar } from '$lib/aviso.server';
import type { PageServerLoad, Actions } from './$types';

const TIPOS = Object.keys(ETIQUETAS_AVISO) as TipoAviso[];

export const load: PageServerLoad = async ({ locals: { supabase, user } }) => {
  if (!user) redirect(303, '/login');

  const avisos = await avisosDelCoach(supabase, user.id);

  // Se agrupan aquí y no en la plantilla para que el contador de la pestaña y
  // su lista salgan del mismo sitio: si se calcularan por separado, un día
  // dirían números distintos y nadie sabría cuál creer.
  const porTipo = TIPOS.map((tipo) => {
    const suyos = avisos.filter((a) => a.tipo === tipo);
    return {
      tipo,
      etiqueta: ETIQUETAS_AVISO[tipo],
      sinVer: suyos.filter((a) => !a.leido),
      vistos: suyos.filter((a) => a.leido)
    };
  });

  return { porTipo, total: avisos.filter((a) => !a.leido).length };
};

export const actions: Actions = {
  marcar: async ({ request, cookies, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const fd = await request.formData();
    const kind = String(fd.get('kind') ?? '');
    const ids = fd
      .getAll('entity_id')
      .map(String)
      .filter((s) => /^[0-9a-fA-F-]{36}$/.test(s));

    if (!TIPOS.includes(kind as TipoAviso)) return fail(400, { error: 'Tipo de aviso no válido.' });
    if (ids.length === 0) return fail(400, { error: 'Nada que marcar.' });

    // upsert y no insert: marcar dos veces lo mismo no debe dar error. Pasa
    // con solo pulsar dos veces, y con la doble petición que se cuela cuando
    // la conexión va mal.
    const { error } = await supabase
      .from('notification_reads')
      .upsert(ids.map((entity_id) => ({ coach_id: user.id, kind, entity_id })) as never, {
        onConflict: 'coach_id,kind,entity_id'
      });

    if (error) return fail(500, { error: error.message });
    avisar(
      cookies,
      ids.length === 1 ? 'Aviso marcado como visto.' : `${ids.length} avisos marcados como vistos.`
    );
    return { success: true };
  },

  desmarcar: async ({ request, cookies, locals: { supabase, user } }) => {
    if (!user) redirect(303, '/login');
    const fd = await request.formData();
    const kind = String(fd.get('kind') ?? '');
    if (!TIPOS.includes(kind as TipoAviso)) return fail(400, { error: 'Tipo de aviso no válido.' });

    const { error } = await supabase
      .from('notification_reads')
      .delete()
      .eq('coach_id', user.id)
      .eq('kind', kind);

    if (error) return fail(500, { error: error.message });
    avisar(cookies, 'Avisos devueltos a pendientes.');
    return { success: true };
  }
};
