// Cliente Supabase universal (browser + SSR). Se hidrata en cada navegación
// para mantener la sesión sincronizada.

import { createBrowserClient, createServerClient, isBrowser } from '@supabase/ssr';
import { env as publicEnv } from '$env/dynamic/public';

const PUBLIC_SUPABASE_URL = publicEnv.PUBLIC_SUPABASE_URL;
const PUBLIC_SUPABASE_ANON_KEY = publicEnv.PUBLIC_SUPABASE_ANON_KEY;
import type { LayoutLoad } from './$types';
import type { Database } from '$lib/supabase/types';

export const load: LayoutLoad = async ({ fetch, data, depends }) => {
  depends('supabase:auth');

  const supabase = isBrowser()
    ? createBrowserClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
        global: { fetch }
      })
    : createServerClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
        global: { fetch },
        cookies: {
          getAll: () => data.cookies
        }
      });

  const {
    data: { session }
  } = await supabase.auth.getSession();

  return { supabase, session };
};
