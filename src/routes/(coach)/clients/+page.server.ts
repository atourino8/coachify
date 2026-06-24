// Lista de clientes + action para invitar uno nuevo.

import { fail, redirect } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabase/admin';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, user } }) => {
  if (!user) redirect(303, '/login');

  const { data: clients } = await supabase
    .from('profiles')
    .select('*')
    .eq('coach_id', user.id)
    .eq('archived', false)
    .order('full_name', { ascending: true });

  return { clients: clients ?? [] };
};

export const actions: Actions = {
  invite: async ({ request, locals: { user }, url }) => {
    if (!user) redirect(303, '/login');

    const formData = await request.formData();
    const email = (formData.get('email') as string)?.trim().toLowerCase();
    const full_name = (formData.get('full_name') as string)?.trim();

    if (!email || !full_name) {
      return fail(400, { error: 'Nombre y email son obligatorios.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return fail(400, { error: 'Email no válido.' });
    }

    // Usamos admin client para enviar invitación con coach_id en metadata.
    // El flag ?invite=1 hace que el callback redirija a /set-password tras autenticar.
    const redirectTo = `${url.origin}/auth/callback?invite=1`;
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name,
        role: 'client',
        coach_id: user.id
      },
      redirectTo
    });

    if (error) {
      // Errores típicos: "User already registered", límite de emails…
      let message = error.message;
      if (message.includes('already')) {
        message = 'Este email ya tiene cuenta en Coachify. Pídele que entre y se vincule a ti.';
      }
      return fail(500, { error: message });
    }

    return { success: true, invited_email: email };
  }
};
