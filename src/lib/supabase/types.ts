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
export type ClientLevel = 'principiante' | 'intermedio' | 'avanzado';
export type TechniqueVideoKind = 'first' | 'latest';

export interface ClientGroup {
  id: string;
  coach_id: string;
  name: string;
  notes: string | null;
  company: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientGroupMember {
  group_id: string;
  client_id: string;
  added_at: string;
}

export interface TechniqueVideo {
  id: string;
  client_id: string;
  coach_id: string;
  exercise_id: string;
  kind: TechniqueVideoKind;
  storage_path: string;
  duration_seconds: number | null;
  size_bytes: number | null;
  coach_comment: string | null;
  coach_comment_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientInfo {
  client_id: string;
  coach_id: string;
  goals: string | null;
  injuries: string | null;
  training_days_per_week: number | null;
  level: ClientLevel | null;
  height_cm: number | null;
  birth_date: string | null;
  coach_notes: string | null;
  // Cuota mensual acordada y hasta cuándo tiene pagado. El estado de pago se
  // deriva de paid_until para que no quede obsoleto.
  fee_amount: number | null;
  fee_currency: string;
  paid_until: string | null;
  updated_at: string;
}

export type PaymentStatus = 'sin_cuota' | 'al_dia' | 'vence_pronto' | 'vencido';

/** Estado de pago a partir de la cuota y la fecha pagada hasta. */
export function paymentStatus(
  info: { fee_amount: number | null; paid_until: string | null } | null | undefined,
  todayISO: string
): PaymentStatus {
  if (!info || info.fee_amount === null) return 'sin_cuota';
  if (!info.paid_until) return 'vencido';
  if (info.paid_until < todayISO) return 'vencido';
  // Avisar si le quedan 7 días o menos.
  const limite = new Date(todayISO + 'T00:00:00');
  limite.setDate(limite.getDate() + 7);
  const limiteISO = limite.toISOString().slice(0, 10);
  return info.paid_until <= limiteISO ? 'vence_pronto' : 'al_dia';
}

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

export type TemplateCategory =
  | 'hipertrofia'
  | 'fuerza'
  | 'resistencia'
  | 'movilidad'
  | 'perdida_grasa'
  | 'rehabilitacion'
  | 'otro';

export interface WorkoutTemplate {
  id: string;
  coach_id: string;
  name: string;
  notes: string | null;
  category: TemplateCategory | null;
  created_at: string;
  updated_at: string;
}

export interface WorkoutTemplateItem {
  id: string;
  template_id: string;
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

// ============== Tipos "compuestos" para joins ==============
// Los joins de Supabase se infieren mal (como arrays cuando son objetos), así
// que casteamos localmente con estos tipos en las páginas donde hacemos joins.

export type WorkoutItemWithRelations = WorkoutItem & {
  exercise: Exercise;
  set_logs: SetLog[];
};

export type WorkoutWithItems = Workout & {
  workout_items: WorkoutItemWithRelations[];
};

// Versión ligera para el calendario del coach (solo id/date/title/notes + items count)
export type WorkoutSummary = Pick<Workout, 'id' | 'date' | 'title' | 'notes'> & {
  workout_items: Pick<WorkoutItem, 'id'>[];
};

// Para el detalle de item con su workout (join hacia workouts)
export type WorkoutItemWithWorkout = WorkoutItem & {
  exercise: Exercise;
  workout: Pick<Workout, 'id' | 'date' | 'client_id'>;
  set_logs: SetLog[];
};

// Para queries que sólo necesitan el client_id del workout
export type WorkoutItemMinimal = {
  exercise_id: string;
  workout: Pick<Workout, 'client_id'>;
};

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
      workout_templates: {
        Row: WorkoutTemplate;
        Insert: Omit<WorkoutTemplate, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Omit<WorkoutTemplate, 'id' | 'coach_id' | 'created_at'>>;
      };
      workout_template_items: {
        Row: WorkoutTemplateItem;
        Insert: Omit<WorkoutTemplateItem, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Omit<WorkoutTemplateItem, 'id' | 'created_at'>>;
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
      client_info: {
        Row: ClientInfo;
        Insert: Omit<ClientInfo, 'updated_at'> & { updated_at?: string };
        Update: Partial<Omit<ClientInfo, 'client_id' | 'coach_id'>>;
      };
      technique_videos: {
        Row: TechniqueVideo;
        Insert: Omit<TechniqueVideo, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Omit<TechniqueVideo, 'id' | 'client_id' | 'created_at'>>;
      };
      client_groups: {
        Row: ClientGroup;
        Insert: Omit<ClientGroup, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Omit<ClientGroup, 'id' | 'coach_id' | 'created_at'>>;
      };
      client_group_members: {
        Row: ClientGroupMember;
        Insert: Omit<ClientGroupMember, 'added_at'> & { added_at?: string };
        Update: Partial<ClientGroupMember>;
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}
