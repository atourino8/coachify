// Tipos de la base de datos de Coachify (manualmente).
// En el futuro se generará con `supabase gen types typescript`.

export type Role = 'coach' | 'client';
export type MuscleGroup =
  | 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core' | 'cardio' | 'full_body';
export type Equipment =
  | 'barbell' | 'dumbbell' | 'machine' | 'bodyweight' | 'kettlebell' | 'band' | 'other';
export type SessionStatus =
  | 'requested' | 'confirmed' | 'rejected' | 'cancelled' | 'completed';
export type Modality = 'presencial' | 'online' | 'remoto';
export type Feedback = 'easy' | 'just_right' | 'hard';

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

export interface Exercise {
  id: string;
  coach_id: string;
  name: string;
  description: string | null;
  video_url: string | null;
  video_poster: string | null;
  duration_seconds: number | null;
  muscle_group: MuscleGroup | null;
  equipment: Equipment | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Workout {
  id: string;
  client_id: string;
  coach_id: string;
  date: string; // YYYY-MM-DD
  title: string | null;
  notes: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkoutItem {
  id: string;
  workout_id: string;
  exercise_id: string;
  order_index: number;
  sets: number;
  reps_prescribed: string | null;
  weight_prescribed: string | null;
  rest_seconds: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SetLog {
  id: string;
  workout_item_id: string;
  client_id: string;
  exercise_id: string;
  set_number: number;
  reps_done: number | null;
  weight_done: number | null;
  completed_at: string;
  feedback: Feedback | null;
}

export interface Session {
  id: string;
  coach_id: string;
  client_id: string;
  workout_id: string | null;
  starts_at: string;
  ends_at: string;
  status: SessionStatus;
  modality: Modality;
  location: string | null;
  notes: string | null;
  google_event_id: string | null;
  requested_by: string | null;
  decided_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AvailabilitySlot {
  id: string;
  coach_id: string;
  kind: 'recurring' | 'specific';
  day_of_week: number | null;
  specific_date: string | null;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  modalities: string[];
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
      exercises: {
        Row: Exercise;
        Insert: Omit<Exercise, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Omit<Exercise, 'id' | 'coach_id' | 'created_at'>>;
      };
      workouts: {
        Row: Workout;
        Insert: Omit<Workout, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Omit<Workout, 'id' | 'created_at'>>;
      };
      workout_items: {
        Row: WorkoutItem;
        Insert: Omit<WorkoutItem, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Omit<WorkoutItem, 'id' | 'created_at'>>;
      };
      set_logs: {
        Row: SetLog;
        Insert: Omit<SetLog, 'id' | 'completed_at'> & { id?: string; completed_at?: string };
        Update: Partial<Omit<SetLog, 'id' | 'client_id'>>;
      };
      sessions: {
        Row: Session;
        Insert: Omit<Session, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Omit<Session, 'id' | 'created_at'>>;
      };
      availability_slots: {
        Row: AvailabilitySlot;
        Insert: Omit<AvailabilitySlot, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Omit<AvailabilitySlot, 'id' | 'coach_id' | 'created_at'>>;
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}
