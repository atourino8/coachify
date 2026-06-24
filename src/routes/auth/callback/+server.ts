// Endpoint que captura el redirect tras confirmar email (link mágico).
// Intercambia el código por sesión, lee el perfil y redirige según el rol.

import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next');

  if (!code) {
    redirect(303, '/login?error=missing-code');
  }

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    redirect(303, '/login?error=auth');
  }

  // Si nos pasaron un destino explícito, lo respetamos
  if (next) {
    redirect(303, next);
  }

  // Si no, redirigir según rol del perfil
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single();

  if (profile?.role === 'coach') redirect(303, '/dashboard');
  if (profile?.role === 'client') redirect(303, '/today');

  // Sin perfil aún (caso raro): mandar a la home
  redirect(303, '/');
};
