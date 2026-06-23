export type Profile = {
  id: number;
  name: string | null;
  age: number | null;
  sex: string | null;
  height_cm: number | null;
  coach_name: string | null;
  coach_contact: string | null;
  disclaimer_accepted: number;
  created_at: string;
};

export type Goal = {
  id: number;
  start_weight: number;
  start_date: string;
  target_weight: number;
  target_date: string | null;
  weekly_rate_target: number | null;
  daily_calorie_target: number | null;
  status: string;
};

export type WeightEntry = {
  id: number;
  date: string;
  weight: number;
  note: string | null;
};

export type Adherence = 'followed' | 'partial' | 'cheated';

export type Meal = {
  id: number;
  date: string;
  type: string;
  name: string;
  calories: number;
  adherence: Adherence;
  is_cheat: number;
  note: string | null;
  created_at: string;
  plan_meal_id?: number | null;
};

export type WorkoutStatus = 'planned' | 'completed' | 'missed' | 'partial';

export type Workout = {
  id: number;
  date: string;
  day_type: 'training' | 'rest';
  status: WorkoutStatus;
  title: string | null;
  note: string | null;
};

export type Exercise = {
  id: number;
  workout_id: number;
  name: string;
  sets: number | null;
  reps: string | null;
  weight: string | null;
  completed: number;
  plan_exercise_id?: number | null;
};

export type CheckIn = {
  id: number;
  date: string;
  mood: number | null;
  energy: number | null;
  motivation: number | null;
  can_train: 'yes' | 'no' | 'unsure' | null;
  sleep_quality: number | null;
  sleep_hours: number | null;
  stress: number | null;
  note: string | null;
};

export type CoachPlan = {
  id: number;
  name: string;
  cycle_length: number;
  start_date: string;
  active: boolean;
};

export type PlanMeal = {
  id: number;
  day_index: number;
  type: string;
  name: string;
  calories: number;
  sort: number;
};

export type PlanExercise = {
  id: number;
  day_index: number;
  name: string;
  sets: number | null;
  reps: string | null;
  weight: string | null;
  sort: number;
};

export type Flag = {
  key: string;
  type: 'fast_loss' | 'slow_loss' | 'plateau' | 'missed_workouts' | 'frequent_cheat' | 'low_energy' | 'overtraining';
  severity: 'info' | 'warn' | 'danger';
  title: string;
  message: string;
};
