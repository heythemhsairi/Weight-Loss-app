import { supabase } from './supabase';
import type { Profile, Goal, WeightEntry, Meal, Workout, Exercise, CheckIn, Adherence } from './types';

// All functions are async (Supabase is over the network). Booleans coming back
// from Postgres are normalized to the 0/1 numbers the UI expects, so pages keep
// using `is_cheat === 1` / `completed === 1` etc.

const b2n = (v: unknown): number => (v ? 1 : 0);

function mapMeal(r: any): Meal {
  return { ...r, is_cheat: b2n(r.is_cheat), adherence: r.adherence as Adherence };
}
function mapExercise(r: any): Exercise {
  return { ...r, completed: b2n(r.completed) };
}
function mapProfile(r: any): Profile {
  return { ...r, disclaimer_accepted: b2n(r.disclaimer_accepted) };
}

/* ---------- Profile & Goal ---------- */

export async function getProfile(): Promise<Profile | undefined> {
  const { data } = await supabase().from('profile').select('*').eq('id', 1).maybeSingle();
  return data ? mapProfile(data) : undefined;
}

export async function getGoal(): Promise<Goal | undefined> {
  const { data } = await supabase().from('goal').select('*').eq('id', 1).maybeSingle();
  return (data as Goal) ?? undefined;
}

export async function isOnboarded(): Promise<boolean> {
  const [p, g] = await Promise.all([getProfile(), getGoal()]);
  return !!(p && p.disclaimer_accepted && g);
}

export async function saveOnboarding(input: {
  name: string; sex: string | null; age: number | null; height_cm: number | null;
  coach_name: string | null; coach_contact: string | null;
  start_weight: number; target_weight: number; start_date: string;
  target_date: string | null; weekly_rate_target: number | null;
  daily_calorie_target: number | null;
}) {
  const sb = supabase();
  await sb.from('profile').upsert({
    id: 1, name: input.name, age: input.age, sex: input.sex, height_cm: input.height_cm,
    coach_name: input.coach_name, coach_contact: input.coach_contact, disclaimer_accepted: true,
  });
  await sb.from('goal').upsert({
    id: 1, start_weight: input.start_weight, start_date: input.start_date,
    target_weight: input.target_weight, target_date: input.target_date,
    weekly_rate_target: input.weekly_rate_target, daily_calorie_target: input.daily_calorie_target,
    status: 'active',
  });
  await addWeight(input.start_date, input.start_weight, null);
}

export async function updateProfileGoal(input: {
  name: string; sex: string | null; age: number | null; height_cm: number | null;
  coach_name: string | null; coach_contact: string | null;
  start_weight: number; target_weight: number; start_date: string;
  target_date: string | null; weekly_rate_target: number | null;
  daily_calorie_target: number | null;
}) {
  const sb = supabase();
  await sb.from('profile').update({
    name: input.name, age: input.age, sex: input.sex, height_cm: input.height_cm,
    coach_name: input.coach_name, coach_contact: input.coach_contact,
  }).eq('id', 1);
  await sb.from('goal').update({
    start_weight: input.start_weight, start_date: input.start_date,
    target_weight: input.target_weight, target_date: input.target_date,
    weekly_rate_target: input.weekly_rate_target, daily_calorie_target: input.daily_calorie_target,
  }).eq('id', 1);
}

/* ---------- Weight ---------- */

export async function getWeights(): Promise<WeightEntry[]> {
  const { data } = await supabase().from('weight_entries').select('*').order('date', { ascending: true });
  return (data as WeightEntry[]) ?? [];
}

export async function latestWeight(): Promise<WeightEntry | undefined> {
  const { data } = await supabase().from('weight_entries').select('*').order('date', { ascending: false }).limit(1);
  return (data?.[0] as WeightEntry) ?? undefined;
}

export async function addWeight(date: string, weight: number, note: string | null) {
  await supabase().from('weight_entries').upsert({ date, weight, note }, { onConflict: 'date' });
}

export async function updateWeight(id: number, date: string, weight: number, note: string | null) {
  await supabase().from('weight_entries').update({ date, weight, note }).eq('id', id);
}

export async function deleteWeight(id: number) {
  await supabase().from('weight_entries').delete().eq('id', id);
}

/* ---------- Meals ---------- */

export async function getMealsByDate(date: string): Promise<Meal[]> {
  const { data } = await supabase().from('meals').select('*').eq('date', date).order('id', { ascending: true });
  return (data ?? []).map(mapMeal);
}

export async function getMealsBetween(start: string, end: string): Promise<Meal[]> {
  const { data } = await supabase().from('meals').select('*').gte('date', start).lte('date', end).order('date', { ascending: true });
  return (data ?? []).map(mapMeal);
}

export async function addMeal(m: {
  date: string; type: string; name: string; calories: number; adherence: string; note: string | null;
}) {
  await supabase().from('meals').insert({
    date: m.date, type: m.type, name: m.name, calories: m.calories,
    adherence: m.adherence, is_cheat: m.adherence === 'cheated', note: m.note,
  });
}

export async function updateMeal(id: number, m: {
  type: string; name: string; calories: number; adherence: string; note: string | null;
}) {
  await supabase().from('meals').update({
    type: m.type, name: m.name, calories: m.calories,
    adherence: m.adherence, is_cheat: m.adherence === 'cheated', note: m.note,
  }).eq('id', id);
}

export async function deleteMeal(id: number) {
  await supabase().from('meals').delete().eq('id', id);
}

/* ---------- Workouts ---------- */

export async function getWorkoutByDate(date: string): Promise<Workout | undefined> {
  const { data } = await supabase().from('workouts').select('*').eq('date', date).maybeSingle();
  return (data as Workout) ?? undefined;
}

export async function getWorkoutsBetween(start: string, end: string): Promise<Workout[]> {
  const { data } = await supabase().from('workouts').select('*').gte('date', start).lte('date', end).order('date', { ascending: true });
  return (data as Workout[]) ?? [];
}

export async function upsertWorkout(w: {
  date: string; day_type: string; status: string; title: string | null; note: string | null;
}): Promise<number> {
  const { data } = await supabase()
    .from('workouts')
    .upsert({ date: w.date, day_type: w.day_type, status: w.status, title: w.title, note: w.note }, { onConflict: 'date' })
    .select('id')
    .single();
  return (data as { id: number }).id;
}

// Returns the full workout row for a date, creating a default one if missing.
export async function getOrCreateWorkout(date: string): Promise<Workout> {
  const existing = await getWorkoutByDate(date);
  if (existing) return existing;
  const { data } = await supabase()
    .from('workouts')
    .upsert({ date, day_type: 'training', status: 'planned', title: null, note: null }, { onConflict: 'date' })
    .select('*')
    .single();
  return data as Workout;
}

export async function getExercises(workoutId: number): Promise<Exercise[]> {
  const { data } = await supabase().from('exercises').select('*').eq('workout_id', workoutId).order('id', { ascending: true });
  return (data ?? []).map(mapExercise);
}

export async function addExercise(e: {
  workout_id: number; name: string; sets: number | null; reps: string | null; weight: string | null;
}) {
  await supabase().from('exercises').insert({ ...e, completed: false });
}

export async function toggleExercise(id: number, completed: boolean) {
  await supabase().from('exercises').update({ completed }).eq('id', id);
}

export async function updateExercise(id: number, e: {
  name: string; sets: number | null; reps: string | null; weight: string | null;
}) {
  await supabase().from('exercises').update(e).eq('id', id);
}

export async function deleteExercise(id: number) {
  await supabase().from('exercises').delete().eq('id', id);
}

/* ---------- Check-ins ---------- */

export async function getCheckinByDate(date: string): Promise<CheckIn | undefined> {
  const { data } = await supabase().from('checkins').select('*').eq('date', date).maybeSingle();
  return (data as CheckIn) ?? undefined;
}

export async function getCheckinsBetween(start: string, end: string): Promise<CheckIn[]> {
  const { data } = await supabase().from('checkins').select('*').gte('date', start).lte('date', end).order('date', { ascending: true });
  return (data as CheckIn[]) ?? [];
}

export async function upsertCheckin(c: {
  date: string; mood: number | null; energy: number | null; motivation: number | null;
  can_train: string | null; sleep_quality: number | null; sleep_hours: number | null;
  stress: number | null; note: string | null;
}) {
  await supabase().from('checkins').upsert({
    date: c.date, mood: c.mood, energy: c.energy, motivation: c.motivation,
    can_train: c.can_train, sleep_quality: c.sleep_quality, sleep_hours: c.sleep_hours,
    stress: c.stress, note: c.note,
  }, { onConflict: 'date' });
}

export async function deleteCheckin(id: number) {
  await supabase().from('checkins').delete().eq('id', id);
}
