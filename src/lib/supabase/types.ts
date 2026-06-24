// Tipos de la base de datos de Coachify (manualmente, en Fase B.1).
// En Fase B.2 generaremos estos tipos automáticamente con `supabase gen types typescript`.

export type Role = 'coach' | 'client';

export interface Profile {
  id: string;
  role: Role;
  full_name: string | null;
  coach_id: string | null;
  avatar_url: string | null;
  timezone: string;
  locale: string;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}
