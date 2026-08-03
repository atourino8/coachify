// Biblioteca base de ejercicios.
//
// Un entrenador que entra por primera vez se encuentra el producto vacío: sin
// ejercicios no puede montar un entrenamiento, y sin entrenamiento no puede
// programar nada. Este catálogo le da un punto de partida usable en un clic.
//
// Son ejercicios genéricos y reconocibles; el entrenador los edita, borra o
// amplía con los suyos. No llevan vídeo: eso lo aporta él.

import type { MuscleGroup, Equipment } from './supabase/types';

export type SeedExercise = {
  name: string;
  description: string;
  muscle_group: MuscleGroup;
  equipment: Equipment;
};

export const SEED_EXERCISES: SeedExercise[] = [
  // ---- Pecho ----
  { name: 'Press de banca', description: 'Tumbado en banco plano, baja la barra al pecho controlando y empuja sin bloquear del todo.', muscle_group: 'chest', equipment: 'barbell' },
  { name: 'Press de banca con mancuernas', description: 'Mayor recorrido que con barra. Muñecas firmes y codos a unos 45°.', muscle_group: 'chest', equipment: 'dumbbell' },
  { name: 'Press inclinado con mancuernas', description: 'Banco a 30-45°. Incide en la porción superior del pectoral.', muscle_group: 'chest', equipment: 'dumbbell' },
  { name: 'Aperturas en polea', description: 'Codos ligeramente flexionados y fijos. Junta las manos por delante del pecho.', muscle_group: 'chest', equipment: 'machine' },
  { name: 'Flexiones', description: 'Cuerpo en línea recta, core apretado. Baja hasta rozar el suelo con el pecho.', muscle_group: 'chest', equipment: 'bodyweight' },
  { name: 'Fondos en paralelas', description: 'Inclina el torso hacia delante para cargar más pecho. Baja hasta 90° de codo.', muscle_group: 'chest', equipment: 'bodyweight' },

  // ---- Espalda ----
  { name: 'Dominadas', description: 'Agarre prono. Lleva el pecho a la barra activando escápulas antes de tirar.', muscle_group: 'back', equipment: 'bodyweight' },
  { name: 'Jalón al pecho', description: 'Alternativa a la dominada. Tira con los codos, no con las manos.', muscle_group: 'back', equipment: 'machine' },
  { name: 'Remo con barra', description: 'Torso inclinado 45°, espalda neutra. Lleva la barra al ombligo.', muscle_group: 'back', equipment: 'barbell' },
  { name: 'Remo con mancuerna a una mano', description: 'Apoyado en banco. Recorrido largo y sin rotar el tronco.', muscle_group: 'back', equipment: 'dumbbell' },
  { name: 'Remo en polea baja', description: 'Sentado, pecho alto. Junta las escápulas al final del tirón.', muscle_group: 'back', equipment: 'machine' },
  { name: 'Peso muerto', description: 'Cadera y rodillas a la vez, barra pegada al cuerpo, espalda neutra en todo el recorrido.', muscle_group: 'back', equipment: 'barbell' },
  { name: 'Face pull', description: 'Polea alta a la altura de la cara. Excelente para hombro posterior y salud escapular.', muscle_group: 'back', equipment: 'machine' },

  // ---- Pierna ----
  { name: 'Sentadilla trasera', description: 'Barra en trapecio. Baja controlando hasta romper la paralela si la movilidad lo permite.', muscle_group: 'legs', equipment: 'barbell' },
  { name: 'Sentadilla frontal', description: 'Barra delante, codos altos. Más demanda de cuádriceps y core.', muscle_group: 'legs', equipment: 'barbell' },
  { name: 'Prensa de piernas', description: 'Pies a la anchura de cadera. No bloquees rodillas arriba.', muscle_group: 'legs', equipment: 'machine' },
  { name: 'Zancadas', description: 'Paso largo, rodilla trasera al suelo sin tocarlo. Tronco erguido.', muscle_group: 'legs', equipment: 'dumbbell' },
  { name: 'Sentadilla búlgara', description: 'Pie trasero elevado. Muy exigente en glúteo y cuádriceps, ideal a poca carga.', muscle_group: 'legs', equipment: 'dumbbell' },
  { name: 'Peso muerto rumano', description: 'Rodillas casi fijas, cadera atrás. Estira isquios sin redondear la espalda.', muscle_group: 'legs', equipment: 'barbell' },
  { name: 'Curl femoral', description: 'Aislamiento de isquiotibiales. Controla la fase excéntrica.', muscle_group: 'legs', equipment: 'machine' },
  { name: 'Extensión de cuádriceps', description: 'Aislamiento de cuádriceps. Evita el latigazo al subir.', muscle_group: 'legs', equipment: 'machine' },
  { name: 'Hip thrust', description: 'Espalda apoyada en banco. Aprieta glúteo arriba sin hiperextender lumbar.', muscle_group: 'legs', equipment: 'barbell' },
  { name: 'Elevación de gemelos', description: 'Recorrido completo: estira abajo y sube a punta de pie.', muscle_group: 'legs', equipment: 'machine' },

  // ---- Hombro ----
  { name: 'Press militar', description: 'De pie, core apretado. Empuja sin arquear la lumbar.', muscle_group: 'shoulders', equipment: 'barbell' },
  { name: 'Press de hombro con mancuernas', description: 'Sentado con respaldo. Baja hasta la altura de las orejas.', muscle_group: 'shoulders', equipment: 'dumbbell' },
  { name: 'Elevaciones laterales', description: 'Sube hasta la horizontal con el codo ligeramente flexionado. Poco peso, mucho control.', muscle_group: 'shoulders', equipment: 'dumbbell' },
  { name: 'Elevaciones frontales', description: 'Alterna brazos. No pases de la altura del hombro.', muscle_group: 'shoulders', equipment: 'dumbbell' },
  { name: 'Pájaros', description: 'Torso inclinado. Abre los brazos apretando la escápula: deltoides posterior.', muscle_group: 'shoulders', equipment: 'dumbbell' },

  // ---- Brazo ----
  { name: 'Curl con barra', description: 'Codos pegados al cuerpo. Sin balanceo de tronco.', muscle_group: 'arms', equipment: 'barbell' },
  { name: 'Curl martillo', description: 'Agarre neutro. Trabaja braquial y antebrazo.', muscle_group: 'arms', equipment: 'dumbbell' },
  { name: 'Curl concentrado', description: 'Sentado, codo apoyado en el muslo. Máximo aislamiento del bíceps.', muscle_group: 'arms', equipment: 'dumbbell' },
  { name: 'Press francés', description: 'Tumbado, baja la barra a la frente. Codos apuntando al techo.', muscle_group: 'arms', equipment: 'barbell' },
  { name: 'Extensión de tríceps en polea', description: 'Codos fijos a los costados. Extiende completo abajo.', muscle_group: 'arms', equipment: 'machine' },
  { name: 'Fondos en banco', description: 'Manos en el banco a la espalda. Baja hasta 90° de codo.', muscle_group: 'arms', equipment: 'bodyweight' },

  // ---- Core ----
  { name: 'Plancha', description: 'Antebrazos y puntas de pie. Glúteo y abdomen apretados, cadera ni alta ni baja.', muscle_group: 'core', equipment: 'bodyweight' },
  { name: 'Plancha lateral', description: 'Apoyo en un antebrazo. Cadera alta y alineada.', muscle_group: 'core', equipment: 'bodyweight' },
  { name: 'Crunch abdominal', description: 'Despega solo escápulas. No tires del cuello.', muscle_group: 'core', equipment: 'bodyweight' },
  { name: 'Elevación de piernas colgado', description: 'Colgado de la barra, sube piernas sin balancearte.', muscle_group: 'core', equipment: 'bodyweight' },
  { name: 'Rueda abdominal', description: 'Avanza sin que la lumbar se arquee. Rango corto al principio.', muscle_group: 'core', equipment: 'other' },
  { name: 'Giro ruso', description: 'Sentado, pies elevados. Rota el tronco de lado a lado.', muscle_group: 'core', equipment: 'other' },

  // ---- Cardio ----
  { name: 'Carrera continua', description: 'Ritmo sostenible en el que se pueda hablar. Base aeróbica.', muscle_group: 'cardio', equipment: 'other' },
  { name: 'Bicicleta estática', description: 'Bajo impacto. Ideal para calentar o para trabajo de base.', muscle_group: 'cardio', equipment: 'machine' },
  { name: 'Remo ergómetro', description: 'Secuencia piernas-tronco-brazos al tirar, a la inversa al volver.', muscle_group: 'cardio', equipment: 'machine' },
  { name: 'Comba', description: 'Saltos cortos, muñecas relajadas. Excelente calentamiento.', muscle_group: 'cardio', equipment: 'other' },

  // ---- Full body ----
  { name: 'Burpees', description: 'Sentadilla, plancha, flexión y salto. Máxima demanda metabólica.', muscle_group: 'full_body', equipment: 'bodyweight' },
  { name: 'Swing con kettlebell', description: 'Movimiento de cadera, no de brazos. La pesa sube por inercia.', muscle_group: 'full_body', equipment: 'kettlebell' },
  { name: 'Thruster', description: 'Sentadilla frontal encadenada con press de hombro.', muscle_group: 'full_body', equipment: 'barbell' },
  { name: 'Peso muerto con kettlebell', description: 'Bisagra de cadera con una pesa rusa. Buena entrada al patrón de peso muerto.', muscle_group: 'full_body', equipment: 'kettlebell' }
];
