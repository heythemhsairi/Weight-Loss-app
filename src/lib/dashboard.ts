import * as q from './queries';
import { addDays, isoToday, computeProgress, detectFlags, streakDays, type Progress } from './logic';
import type { Flag, WeightEntry } from './types';

export async function gatherInsights() {
  const today = isoToday();
  const weekAgo = addDays(today, -6);

  const [goal, weights, meals7, workouts7, checkins7, allCheckins] = await Promise.all([
    q.getGoal(),
    q.getWeights(),
    q.getMealsBetween(weekAgo, today),
    q.getWorkoutsBetween(weekAgo, today),
    q.getCheckinsBetween(addDays(today, -13), today), // wider for streak detection
    q.getCheckinsBetween(addDays(today, -60), today),
  ]);

  const progress: Progress = computeProgress(goal!, weights);
  const flags: Flag[] = detectFlags({ progress, weights, meals: meals7, workouts: workouts7, checkins: checkins7 });
  const streak = streakDays(allCheckins);

  return { goal: goal!, weights, progress, meals7, workouts7, checkins7, flags, streak, today };
}

export function dayNumber(weights: WeightEntry[], startDate: string): number {
  const d = new Date().getTime() - new Date(startDate + 'T00:00:00').getTime();
  return Math.max(1, Math.round(d / 86_400_000) + 1);
}
