// Cliente Supabase con SERVICE_ROLE: bypassa RLS, solo se usa server-side.
// IMPORTANTE: este módulo SOLO debe importarse desde código server (.server.ts).
// Si se importa desde un .svelte o .ts cliente, la service_role se expone al
// navegador → catastrófico. Por eso vive en server-only.

import { createClient } from '@supabase/supabase-js';
import { env as publicEnv } from '$env/dynamic/public';
import { env as privateEnv } from '$env/dynamic/private';
import type { Database } from './types';

const supabaseUrl = publicEnv.PUBLIC_SUPABASE_URL;
const serviceRoleKey = privateEnv.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.warn(
    '[supabase/admin] Faltan PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY. ' +
      'Las invitaciones no funcionarán.'
  );
}

/**
 * Cliente Supabase con permisos de service_role. Bypassa RLS.
 * SOLO usar en código server (load functions, actions, endpoints API).
 */
export const supabaseAdmin = createClient<Database>(
  supabaseUrl ?? '',
  serviceRoleKey ?? '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
