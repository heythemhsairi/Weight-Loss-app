import { supabase } from './supabase';
import { daysBetween, isoToday } from './logic';
import type { CoachPlan, PlanMeal, PlanExercise } from './types';

/* ---------- plan-day computation (the looping cycle) ---------- */

// Which template day applies on `date`, given the cycle. Returns 1..cycle_length.
export function planDayFor(plan: CoachPlan, date: string): number {
  const diff = daysBetween(plan.start_date, date); // can be negative if date < start
  const mod = ((diff % plan.cycle_length) + plan.cycle_length) % plan.cycle_length;
  return mod + 1;
}

export function planDayToday(plan: CoachPlan): number {
  return planDayFor(plan, isoToday());
}

/* ---------- plan CRUD ---------- */

export async function getPlan(): Promise<CoachPlan | undefined> {
  const { data } = await supabase().from('coach_plan').select('*').eq('id', 1).maybeSingle();
  return (data as CoachPlan) ?? undefined;
}

export async function upsertPlan(p: { name: string; cycle_length: number; start_date: string }) {
  await supabase().from('coach_plan').upsert({ id: 1, ...p, active: true });
}

export async function getPlanMeals(dayIndex?: number): Promise<PlanMeal[]> {
  let q = supabase().from('plan_meals').select('*');
  if (dayIndex != null) q = q.eq('day_index', dayIndex);
  const { data } = await q.order('day_index', { ascending: true }).order('sort', { ascending: true });
  return (data as PlanMeal[]) ?? [];
}

export async function getPlanExercises(dayIndex?: number): Promise<PlanExercise[]> {
  let q = supabase().from('plan_exercises').select('*');
  if (dayIndex != null) q = q.eq('day_index', dayIndex);
  const { data } = await q.order('day_index', { ascending: true }).order('sort', { ascending: true });
  return (data as PlanExercise[]) ?? [];
}

export async function addPlanMeal(m: { day_index: number; type: string; name: string; calories: number }) {
  await supabase().from('plan_meals').insert({ ...m, sort: Date.now() % 100000 });
}
export async function deletePlanMeal(id: number) {
  await supabase().from('plan_meals').delete().eq('id', id);
}

export async function addPlanExercise(e: {
  day_index: number; name: string; sets: number | null; reps: string | null; weight: string | null;
}) {
  await supabase().from('plan_exercises').insert({ ...e, sort: Date.now() % 100000 });
}
export async function deletePlanExercise(id: number) {
  await supabase().from('plan_exercises').delete().eq('id', id);
}

/* ---------- ticking a planned item logs/unlogs it for a date ---------- */

// Returns the set of plan_meal_ids already logged on `date`.
export async function loggedPlanMealIds(date: string): Promise<Set<number>> {
  const { data } = await supabase().from('meals').select('plan_meal_id').eq('date', date).not('plan_meal_id', 'is', null);
  return new Set((data ?? []).map((r: any) => r.plan_meal_id as number));
}

export async function tickPlanMeal(date: string, pm: PlanMeal) {
  await supabase().from('meals').insert({
    date, type: pm.type, name: pm.name, calories: pm.calories,
    adherence: 'followed', is_cheat: false, note: 'from coach plan', plan_meal_id: pm.id,
  });
}
export async function untickPlanMeal(date: string, planMealId: number) {
  await supabase().from('meals').delete().eq('date', date).eq('plan_meal_id', planMealId);
}

// Exercises live under a per-date workout row; we mark/remove by plan_exercise_id.
export async function loggedPlanExerciseIds(workoutId: number): Promise<Set<number>> {
  const { data } = await supabase().from('exercises').select('plan_exercise_id').eq('workout_id', workoutId).not('plan_exercise_id', 'is', null);
  return new Set((data ?? []).map((r: any) => r.plan_exercise_id as number));
}

export async function tickPlanExercise(workoutId: number, pe: PlanExercise) {
  await supabase().from('exercises').insert({
    workout_id: workoutId, name: pe.name, sets: pe.sets, reps: pe.reps, weight: pe.weight,
    completed: true, plan_exercise_id: pe.id,
  });
}
export async function untickPlanExercise(workoutId: number, planExerciseId: number) {
  await supabase().from('exercises').delete().eq('workout_id', workoutId).eq('plan_exercise_id', planExerciseId);
}
