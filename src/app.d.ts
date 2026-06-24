// Tipos globales del app.
// Documentación: https://kit.svelte.dev/docs/types#app

import type { SupabaseClient, Session, User } from '@supabase/supabase-js';
import type { Database } from '$lib/supabase/types';

declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      supabase: SupabaseClient<Database>;
      safeGetSession: () => Promise<{ session: Session | null; user: User | null }>;
      session: Session | null;
      user: User | null;
    }
    interface PageData {
      session: Session | null;
    }
    // interface PageState {}
    // interface Platform {}
  }
}

export {};
