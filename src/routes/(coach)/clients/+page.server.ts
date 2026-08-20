// Lista de clientes (activos + invitaciones pendientes) + acciones para
// invitar, reenviar y cancelar invitaciones.
//
// El estado "aceptó / sigue pendiente" y el email viven en auth.users, no en
// public.profiles. Los leemos con el admin client (fuente de verdad), así que
// no hace falta ninguna columna nueva ni migración.

import { fail, redirect } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabase/admin';
import { urlsDeAvatar } from '$lib/avatares.server';
import type { PageServerLoad, Actions } from './$types';

type ClientRow = {
  id: string;
  full_name: string | null;
  /** URL ya firmada, o nula: entonces se pinta la inicial. */
  avatar: string | null;
  /** Nombre del grupo, o null. La palabra «Individual» la pone la pantalla. */
  grupo: string | null;
  created_at: string;
  email: string | null;
  invited_at: string | null;
  accepted: boolean;
};

export const load: PageServerLoad = async ({ locals: { supabase, user } }) => {
  if (!user) redirect(303, '/login');

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, created_at, avatar_path')
    .eq('coach_id', user.id)
    .eq('archived', false)
    .order('full_name', { ascending: true });

  const rows = (profiles ?? []) as {
    id: string;
    full_name: string | null;
    created_at: string;
    avatar_path: string | null;
  }[];

  // Las fotos, todas de una llamada. Firmarlas de una en una serían sesenta
  // idas y venidas al almacenamiento para pintar una lista.
  const avatares = await urlsDeAvatar(
    supabase,
    rows.map((r) => r.avatar_path)
  );

  // A qué grupo pertenece cada uno. Una consulta para toda la cartera, no una
  // por cliente: es el mismo N+1 que ya se quitó tres veces de este proyecto.
  //
  // Un cliente puede estar en VARIOS grupos —la tabla de pertenencia se hizo
  // así a propósito en la migración 0010— pero la tarjeta solo tiene sitio
  // para uno. Se enseña el primero por orden alfabético, que al menos es
  // estable entre recargas; con dos grupos, el segundo se ve en su ficha.
  const { data: pertenencias } = await supabase
    .from('client_group_members')
    .select('client_id, client_groups!inner(name, coach_id)')
    .in(
      'client_id',
      rows.map((r) => r.id)
    );
  const grupoDe = new Map<string, string>();
  for (const p of (pertenencias ?? []) as unknown as {
    client_id: string;
    client_groups: { name: string; coach_id: string } | null;
  }[]) {
    if (!p.client_groups || p.client_groups.coach_id !== user.id) continue;
    const actual = grupoDe.get(p.client_id);
    if (!actual || p.client_groups.name.localeCompare(actual) < 0) {
      grupoDe.set(p.client_id, p.client_groups.name);
    }
  }

  // Enriquecer cada cliente con el email y si ya aceptó (auth.users).
  const enriched: ClientRow[] = await Promise.all(
    rows.map(async (p) => {
      let email: string | null = null;
      let acceptedAt: string | null = null;
      let invitedAt: string | null = null;
      try {
        const { data: au } = await supabaseAdmin.auth.admin.getUserById(p.id);
        const u = au?.user as
          | {
              email?: string;
              last_sign_in_at?: string | null;
              email_confirmed_at?: string | null;
              invited_at?: string | null;
              created_at?: string;
            }
          | undefined;
        email = u?.email ?? null;
        // "Aceptó" = ha iniciado sesión alguna vez o confirmó su email.
        acceptedAt = u?.last_sign_in_at ?? u?.email_confirmed_at ?? null;
        invitedAt = u?.invited_at ?? u?.created_at ?? null;
      } catch {
        // Si falla la consulta admin, tratamos al cliente como pendiente.
      }
      return {
        id: p.id,
        full_name: p.full_name,
        avatar: p.avatar_path ? (avatares.get(p.avatar_path) ?? null) : null,
        grupo: grupoDe.get(p.id) ?? null,
        created_at: p.created_at,
        email,
        invited_at: invitedAt,
        accepted: !!acceptedAt
      };
    })
  );

  // Cuota y estado de pago de cada cliente (client_info, solo-coach).
  const { data: feesRaw } = await supabase
    .from('client_info')
    .select('client_id, fee_amount, paid_until, tags')
    .eq('coach_id', user.id);
  const fees = new Map(
    (
      (feesRaw ?? []) as {
        client_id: string;
        fee_amount: number | null;
        paid_until: string | null;
        tags: string[] | null;
      }[]
    ).map((f) => [
      f.client_id,
      { fee_amount: f.fee_amount, paid_until: f.paid_until, tags: f.tags ?? [] }
    ])
  );

  const withFees = enriched.map((c) => {
    const info = fees.get(c.id) ?? null;
    return { ...c, fee: info, tags: info?.tags ?? [] };
  });

  const active = withFees.filter((c) => c.accepted);
  const pending = withFees.filter((c) => !c.accepted);

  // Grupos del coach (para poder invitar directamente a uno).
  const { data: groupsRaw } = await supabase
    .from('client_groups')
    .select('id, name')
    .eq('coach_id', user.id)
    .order('name');
  const groups = (groupsRaw ?? []) as { id: string; name: string }[];

  return { active, pending, groups };
};

// Envía (o reenvía) la invitación a un email, vinculando el cliente al coach.
async function sendInvite(
  origin: string,
  coachId: string,
  email: string,
  full_name: string
): Promise<{ userId: string } | { error: string }> {
  const redirectTo = `${origin}/auth/callback?invite=1`;
  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: { full_name, role: 'client', coach_id: coachId },
    redirectTo
  });

  if (error) {
    let message = error.message;
    if (message.includes('already')) {
      message = 'Este email ya tiene cuenta en Treno. Pídele que entre y se vincule a ti.';
    }
    return { error: message };
  }

  // Belt-and-suspenders: vincular explícitamente el profile al coach.
  if (data?.user?.id) {
    const { error: linkError } = await supabaseAdmin
      .from('profiles')
      .update({ coach_id: coachId, role: 'client', full_name })
      .eq('id', data.user.id);
    if (linkError) {
      console.error('[invite] No se pudo vincular el cliente al coach:', linkError);
      return { error: 'El email se envió pero no se pudo vincular el cliente a tu cuenta.' };
    }
    return { userId: data.user.id };
  }
  return { error: 'No se pudo crear la invitación.' };
}

export const actions: Actions = {
  invite: async ({ request, locals: { supabase, user }, url }) => {
    if (!user) redirect(303, '/login');

    const formData = await request.formData();
    const email = (formData.get('email') as string)?.trim().toLowerCase();
    const nombre = (formData.get('nombre') as string)?.trim() ?? '';
    const apellidos = (formData.get('apellidos') as string)?.trim() ?? '';

    // DOS CAMPOS EN EL FORMULARIO, UNA COLUMNA EN LA BASE.
    //
    // El wireframe pide Nombre y Apellidos separados, y tiene razón: pedirlo
    // junto hace que la mitad escriba solo el nombre de pila. Pero partir
    // `profiles.full_name` en dos columnas toca catorce sitios que hoy leen un
    // nombre entero, y no compra nada que se esté usando: no se ordena por
    // apellido ni se saluda por el nombre de pila en ninguna pantalla.
    //
    // Así que se piden separados y se guardan juntos. El día que haga falta
    // ordenar por apellido, partirlos será una migración con los datos ya
    // recogidos en el orden correcto.
    const full_name = [nombre, apellidos].filter(Boolean).join(' ');

    // Los tres, como marca el wireframe con el asterisco. Y se comprueba
    // aquí y no solo con el `required` del formulario: el `required` es una
    // ayuda del navegador, no una validación.
    if (!email || !nombre || !apellidos) {
      return fail(400, { error: 'El nombre, los apellidos y el correo son obligatorios.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return fail(400, { error: 'Ese correo no tiene buena pinta. Revísalo.' });
    }

    // Grupo: uno existente, o uno nuevo creado aquí mismo.
    let groupId = ((formData.get('group_id') as string) ?? '').trim() || null;
    const grupoNuevo = ((formData.get('grupo_nuevo') as string) ?? '').trim();
    if (grupoNuevo) {
      const { data: creado, error: errGrupo } = await supabase
        .from('client_groups')
        .insert({ coach_id: user.id, name: grupoNuevo.slice(0, 80) } as never)
        .select('id')
        .single();
      if (errGrupo) return fail(500, { error: errGrupo.message });
      groupId = (creado as { id: string }).id;
    }

    const res = await sendInvite(url.origin, user.id, email, full_name);
    if ('error' in res) return fail(500, { error: res.error });

    // El alta en el grupo va DESPUÉS de invitar y no antes: si el correo no
    // sale, no queda un grupo con un miembro fantasma que no existe todavía.
    if (groupId) {
      await supabaseAdmin
        .from('client_group_members')
        .upsert({ group_id: groupId, client_id: res.userId } as never, {
          onConflict: 'group_id,client_id'
        });
    }

    return { success: true, invited_email: email, invited_name: full_name };
  },

  // Reenvía la invitación a un cliente pendiente.
  resendInvite: async ({ request, locals: { user }, url }) => {
    if (!user) redirect(303, '/login');
    const fd = await request.formData();
    const email = (fd.get('email') as string)?.trim().toLowerCase();
    const full_name = (fd.get('full_name') as string)?.trim() || 'Cliente';
    if (!email) return fail(400, { error: 'Falta el email.' });

    const res = await sendInvite(url.origin, user.id, email, full_name);
    if ('error' in res) return fail(500, { error: res.error });

    return { success: true, resent_email: email };
  },

  // Invitación MASIVA: una lista de emails de golpe, opcionalmente a un grupo.
  // Informa de cuáles se enviaron y cuáles fallaron: con el envío por defecto
  // de Supabase hay límites de tasa bajos y algunos pueden rebotar.
  inviteBulk: async ({ request, locals: { user }, url }) => {
    if (!user) redirect(303, '/login');
    const fd = await request.formData();
    const raw = ((fd.get('emails') as string) ?? '').trim();
    const groupId = ((fd.get('group_id') as string) ?? '').trim() || null;
    if (!raw) return fail(400, { error: 'Pega al menos un email.' });

    // Acepta separación por saltos de línea, comas o punto y coma.
    const entries = raw
      .split(/[\n,;]+/)
      .map((line) => line.trim())
      .filter(Boolean);

    const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const ok: string[] = [];
    const errors: { email: string; reason: string }[] = [];

    for (const entry of entries) {
      // Permite "Nombre <email@dominio.com>" o solo el email.
      const m = entry.match(/^(.*?)[<\s]*([^\s<>]+@[^\s<>]+)>?$/);
      const email = (m ? m[2] : entry).trim().toLowerCase();
      const nameGuess = (m && m[1] ? m[1] : '').replace(/["']/g, '').trim();

      if (!re.test(email)) {
        errors.push({ email: entry, reason: 'Email no válido' });
        continue;
      }

      const full_name = nameGuess || email.split('@')[0];
      const res = await sendInvite(url.origin, user.id, email, full_name);
      if ('error' in res) {
        errors.push({ email, reason: res.error });
        continue;
      }
      ok.push(email);

      // Si venía un grupo, meter al cliente recién invitado.
      if (groupId) {
        await supabaseAdmin
          .from('client_group_members')
          .upsert({ group_id: groupId, client_id: res.userId } as never, {
            onConflict: 'group_id,client_id'
          });
      }
    }

    return {
      success: true,
      bulk: true,
      sent: ok.length,
      total: entries.length,
      errors: errors.slice(0, 10)
    };
  },

  // Cancela una invitación pendiente: borra el usuario auth (y su profile).
  cancelInvite: async ({ request, locals: { user } }) => {
    if (!user) redirect(303, '/login');
    const fd = await request.formData();
    const clientId = fd.get('client_id') as string;
    if (!clientId) return fail(400, { error: 'Falta el id.' });

    // Verificar que el cliente es de este coach antes de borrar nada.
    const { data: prof } = await supabaseAdmin
      .from('profiles')
      .select('id, coach_id')
      .eq('id', clientId)
      .maybeSingle();
    if (!prof || (prof as { coach_id: string | null }).coach_id !== user.id) {
      return fail(403, { error: 'Ese cliente no es tuyo.' });
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(clientId);
    if (error) return fail(500, { error: error.message });
    // Por si el borrado de auth no cascada al profile, lo quitamos también.
    await supabaseAdmin.from('profiles').delete().eq('id', clientId);

    return { success: true, cancelled: true };
  }
};
