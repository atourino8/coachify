// Hook server-side: rellena event.locals.supabase y event.locals.session en cada request.
// Esto permite que cualquier +page.server.ts pueda leer la sesión del usuario.

import { createServerClient } from '@supabase/ssr';
import { type Handle, redirect } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { env as publicEnv } from '$env/dynamic/public';

const PUBLIC_SUPABASE_URL = publicEnv.PUBLIC_SUPABASE_URL;
const PUBLIC_SUPABASE_ANON_KEY = publicEnv.PUBLIC_SUPABASE_ANON_KEY;
import type { Database } from '$lib/supabase/types';

const supabase: Handle = async ({ event, resolve }) => {
  event.locals.supabase = createServerClient<Database>(
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => event.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            event.cookies.set(name, value, { ...options, path: '/' });
          });
        }
      }
    }
  );

  // safeGetSession: valida el JWT con Supabase para evitar usar tokens manipulados
  event.locals.safeGetSession = async () => {
    const {
      data: { session }
    } = await event.locals.supabase.auth.getSession();
    if (!session) return { session: null, user: null };

    const {
      data: { user },
      error
    } = await event.locals.supabase.auth.getUser();
    if (error) return { session: null, user: null };

    return { session, user };
  };

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === 'content-range' || name === 'x-supabase-api-version';
    }
  });
};

// Protección de rutas: si entras a (coach) o (client) sin sesión, te mando a /login
const authGuard: Handle = async ({ event, resolve }) => {
  const { session, user } = await event.locals.safeGetSession();
  event.locals.session = session;
  event.locals.user = user;

  const isCoachRoute = event.url.pathname.startsWith('/dashboard') ||
    event.url.pathname.startsWith('/exercises') ||
    event.url.pathname.startsWith('/clients') ||
    event.url.pathname.startsWith('/calendar') ||
    event.url.pathname.startsWith('/settings');

  const isClientRoute = event.url.pathname.startsWith('/today') ||
    event.url.pathname.startsWith('/workout') ||
    event.url.pathname.startsWith('/history') ||
    event.url.pathname.startsWith('/my-calendar');

  if ((isCoachRoute || isClientRoute) && !session) {
    redirect(303, '/login');
  }

  return resolve(event);
};

export const handle: Handle = sequence(supabase, authGuard);
