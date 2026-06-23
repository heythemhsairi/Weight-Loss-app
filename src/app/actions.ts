'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import * as q from '@/lib/queries';

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

/* ---------- Onboarding ---------- */
export async function completeOnboarding(fd: FormData) {
  const start_weight = num(fd.get('start_weight'));
  const target_weight = num(fd.get('target_weight'));
  if (start_weight == null || target_weight == null) throw new Error('Start and target weight are required.');

  await q.saveOnboarding({
    name: str(fd.get('name')) ?? 'Me',
    sex: str(fd.get('sex')),
    age: num(fd.get('age')),
    height_cm: num(fd.get('height_cm')),
    coach_name: str(fd.get('coach_name')),
    coach_contact: str(fd.get('coach_contact')),
    start_weight,
    target_weight,
    start_date: str(fd.get('start_date')) ?? new Date().toISOString().slice(0, 10),
    target_date: str(fd.get('target_date')),
    weekly_rate_target: num(fd.get('weekly_rate_target')),
    daily_calorie_target: num(fd.get('daily_calorie_target')),
  });
  revalidatePath('/', 'layout');
  redirect('/');
}

/* ---------- Weight ---------- */
export async function addWeight(fd: FormData) {
  const date = str(fd.get('date'))!;
  const weight = num(fd.get('weight'));
  if (weight == null) throw new Error('Weight required');
  await q.addWeight(date, weight, str(fd.get('note')));
  revalidatePath('/weight');
  revalidatePath('/');
}
export async function updateWeight(fd: FormData) {
  const weight = num(fd.get('weight'));
  if (weight == null) throw new Error('Weight required');
  await q.updateWeight(Number(fd.get('id')), str(fd.get('date'))!, weight, str(fd.get('note')));
  revalidatePath('/weight');
  revalidatePath('/');
}
export async function deleteWeight(fd: FormData) {
  await q.deleteWeight(Number(fd.get('id')));
  revalidatePath('/weight');
}

/* ---------- Meals ---------- */
export async function addMeal(fd: FormData) {
  await q.addMeal({
    date: str(fd.get('date'))!,
    type: str(fd.get('type')) ?? 'snack',
    name: str(fd.get('name')) ?? 'Meal',
    calories: num(fd.get('calories')) ?? 0,
    adherence: str(fd.get('adherence')) ?? 'followed',
    note: str(fd.get('note')),
  });
  revalidatePath('/meals');
  revalidatePath('/');
}
export async function updateMeal(fd: FormData) {
  await q.updateMeal(Number(fd.get('id')), {
    type: str(fd.get('type')) ?? 'snack',
    name: str(fd.get('name')) ?? 'Meal',
    calories: num(fd.get('calories')) ?? 0,
    adherence: str(fd.get('adherence')) ?? 'followed',
    note: str(fd.get('note')),
  });
  revalidatePath('/meals');
  revalidatePath('/');
}
export async function deleteMeal(fd: FormData) {
  await q.deleteMeal(Number(fd.get('id')));
  revalidatePath('/meals');
}

/* ---------- Workouts ---------- */
export async function saveWorkout(fd: FormData) {
  const date = str(fd.get('date'))!;
  await q.upsertWorkout({
    date,
    day_type: str(fd.get('day_type')) ?? 'training',
    status: str(fd.get('status')) ?? 'planned',
    title: str(fd.get('title')),
    note: str(fd.get('note')),
  });
  revalidatePath('/workouts');
  revalidatePath('/');
}
export async function addExercise(fd: FormData) {
  const date = str(fd.get('date'))!;
  const existing = await q.getWorkoutByDate(date);
  const workoutId = await q.upsertWorkout({
    date, day_type: existing?.day_type ?? 'training', status: existing?.status ?? 'planned',
    title: existing?.title ?? null, note: existing?.note ?? null,
  });
  await q.addExercise({
    workout_id: workoutId,
    name: str(fd.get('name')) ?? 'Exercise',
    sets: num(fd.get('sets')),
    reps: str(fd.get('reps')),
    weight: str(fd.get('weight')),
  });
  revalidatePath('/workouts');
}
export async function toggleExercise(fd: FormData) {
  await q.toggleExercise(Number(fd.get('id')), fd.get('completed') === '1');
  revalidatePath('/workouts');
}
export async function updateExercise(fd: FormData) {
  await q.updateExercise(Number(fd.get('id')), {
    name: str(fd.get('name')) ?? 'Exercise',
    sets: num(fd.get('sets')),
    reps: str(fd.get('reps')),
    weight: str(fd.get('weight')),
  });
  revalidatePath('/workouts');
}
export async function deleteExercise(fd: FormData) {
  await q.deleteExercise(Number(fd.get('id')));
  revalidatePath('/workouts');
}

/* ---------- Settings (profile + goal) ---------- */
export async function updateSettings(fd: FormData) {
  const start_weight = num(fd.get('start_weight'));
  const target_weight = num(fd.get('target_weight'));
  if (start_weight == null || target_weight == null) throw new Error('Start and target weight are required.');
  await q.updateProfileGoal({
    name: str(fd.get('name')) ?? 'Me',
    sex: str(fd.get('sex')),
    age: num(fd.get('age')),
    height_cm: num(fd.get('height_cm')),
    coach_name: str(fd.get('coach_name')),
    coach_contact: str(fd.get('coach_contact')),
    start_weight,
    target_weight,
    start_date: str(fd.get('start_date')) ?? new Date().toISOString().slice(0, 10),
    target_date: str(fd.get('target_date')),
    weekly_rate_target: num(fd.get('weekly_rate_target')),
    daily_calorie_target: num(fd.get('daily_calorie_target')),
  });
  revalidatePath('/settings');
  revalidatePath('/');
}

/* ---------- Check-in ---------- */
export async function saveCheckin(fd: FormData) {
  await q.upsertCheckin({
    date: str(fd.get('date'))!,
    mood: num(fd.get('mood')),
    energy: num(fd.get('energy')),
    motivation: num(fd.get('motivation')),
    can_train: str(fd.get('can_train')),
    sleep_quality: num(fd.get('sleep_quality')),
    sleep_hours: num(fd.get('sleep_hours')),
    stress: num(fd.get('stress')),
    note: str(fd.get('note')),
  });
  revalidatePath('/checkin');
  revalidatePath('/');
}
