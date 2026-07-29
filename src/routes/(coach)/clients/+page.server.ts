// Lista de clientes (activos + invitaciones pendientes) + acciones para
// invitar, reenviar y cancelar invitaciones.
//
// El estado "aceptó / sigue pendiente" y el email viven en auth.users, no en
// public.profiles. Los leemos con el admin client (fuente de verdad), así que
// no hace falta ninguna columna nueva ni migración.

import { fail, redirect } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabase/admin';
import type { PageServerLoad, Actions } from './$types';

type ClientRow = {
  id: string;
  full_name: string | null;
  created_at: string;
  email: string | null;
  invited_at: string | null;
  accepted: boolean;
};

export const load: PageServerLoad = async ({ locals: { supabase, user } }) => {
  if (!user) redirect(303, '/login');

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, created_at')
    .eq('coach_id', user.id)
    .eq('archived', false)
    .order('full_name', { ascending: true });

  const rows = (profiles ?? []) as { id: string; full_name: string | null; created_at: string }[];

  // Enriquecer cada cliente con el email y si ya aceptó (auth.users).
  const enriched: ClientRow[] = await Promise.all(
    rows.map(async (p) => {
      let email: string | null = null;
      let acceptedAt: string | null = null;
      let invitedAt: string | null = null;
      try {
        const { data: au } = await supabaseAdmin.auth.admin.getUserById(p.id);
        const u = au?.user as
          | { email?: string; last_sign_in_at?: string | null; email_confirmed_at?: string | null; invited_at?: string | null; created_at?: string }
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
        created_at: p.created_at,
        email,
        invited_at: invitedAt,
        accepted: !!acceptedAt
      };
    })
  );

  const active = enriched.filter((c) => c.accepted);
  const pending = enriched.filter((c) => !c.accepted);

  return { active, pending };
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
      message = 'Este email ya tiene cuenta en Coachify. Pídele que entre y se vincule a ti.';
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
  invite: async ({ request, locals: { user }, url }) => {
    if (!user) redirect(303, '/login');

    const formData = await request.formData();
    const email = (formData.get('email') as string)?.trim().toLowerCase();
    const full_name = (formData.get('full_name') as string)?.trim();

    if (!email || !full_name) return fail(400, { error: 'Nombre y email son obligatorios.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return fail(400, { error: 'Email no válido.' });
    }

    const res = await sendInvite(url.origin, user.id, email, full_name);
    if ('error' in res) return fail(500, { error: res.error });

    return { success: true, invited_email: email };
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
