'use server';

import { revalidatePath } from 'next/cache';
import * as p from '@/lib/plan';

const num = (v: FormDataEntryValue | null): number | null => {
  const s = String(v ?? '').trim();
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};
const str = (v: FormDataEntryValue | null): string | null => {
  const s = String(v ?? '').trim();
  return s === '' ? null : s;
};

/* ---------- plan setup ---------- */
export async function savePlan(fd: FormData) {
  await p.upsertPlan({
    name: str(fd.get('name')) ?? 'Coach plan',
    cycle_length: num(fd.get('cycle_length')) ?? 14,
    start_date: str(fd.get('start_date')) ?? new Date().toISOString().slice(0, 10),
  });
  revalidatePath('/plan');
  revalidatePath('/');
}

/* ---------- template editing ---------- */
export async function addPlanMeal(fd: FormData) {
  await p.addPlanMeal({
    day_index: num(fd.get('day_index')) ?? 1,
    type: str(fd.get('type')) ?? 'breakfast',
    name: str(fd.get('name')) ?? 'Meal',
    calories: num(fd.get('calories')) ?? 0,
  });
  revalidatePath('/plan');
}
export async function deletePlanMeal(fd: FormData) {
  await p.deletePlanMeal(Number(fd.get('id')));
  revalidatePath('/plan');
}
export async function addPlanExercise(fd: FormData) {
  await p.addPlanExercise({
    day_index: num(fd.get('day_index')) ?? 1,
    name: str(fd.get('name')) ?? 'Exercise',
    sets: num(fd.get('sets')),
    reps: str(fd.get('reps')),
    weight: str(fd.get('weight')),
  });
  revalidatePath('/plan');
}
export async function deletePlanExercise(fd: FormData) {
  await p.deletePlanExercise(Number(fd.get('id')));
  revalidatePath('/plan');
}

/* ---------- ticking planned items (logs/unlogs for a date) ---------- */
export async function togglePlanMeal(fd: FormData) {
  const date = str(fd.get('date'))!;
  const planMealId = Number(fd.get('plan_meal_id'));
  const checked = fd.get('checked') === '1';
  if (checked) {
    const already = await p.loggedPlanMealIds(date);
    if (already.has(planMealId)) return; // idempotent
    const meals = await p.getPlanMeals();
    const pm = meals.find((m) => m.id === planMealId);
    if (pm) await p.tickPlanMeal(date, pm);
  } else {
    await p.untickPlanMeal(date, planMealId);
  }
  revalidatePath('/meals');
  revalidatePath('/');
}

export async function togglePlanExercise(fd: FormData) {
  const date = str(fd.get('date'))!;
  const planExerciseId = Number(fd.get('plan_exercise_id'));
  const workoutId = Number(fd.get('workout_id'));
  const checked = fd.get('checked') === '1';
  if (checked) {
    const already = await p.loggedPlanExerciseIds(workoutId);
    if (already.has(planExerciseId)) return;
    const exs = await p.getPlanExercises();
    const pe = exs.find((e) => e.id === planExerciseId);
    if (pe) await p.tickPlanExercise(workoutId, pe);
  } else {
    await p.untickPlanExercise(workoutId, planExerciseId);
  }
  revalidatePath('/workouts');
  revalidatePath('/');
}
