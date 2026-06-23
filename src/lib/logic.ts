import type { WeightEntry, Meal, Workout, CheckIn, Goal, Flag } from './types';

/* ---------- date helpers ---------- */

export function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
  const ms = new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime();
  return Math.round(ms / 86_400_000);
}

/* ---------- moving average ---------- */

// 7-day trailing average over the weight series, smoothing daily water-weight noise.
export function smoothedSeries(weights: WeightEntry[], window = 7): { date: string; raw: number; avg: number }[] {
  return weights.map((w, i) => {
    const slice = weights.slice(Math.max(0, i - window + 1), i + 1);
    const avg = slice.reduce((s, x) => s + x.weight, 0) / slice.length;
    return { date: w.date, raw: w.weight, avg: round(avg, 2) };
  });
}

/* ---------- progress ---------- */

export type Progress = {
  startWeight: number;
  currentWeight: number;
  targetWeight: number;
  lostSoFar: number;
  remaining: number;
  pctToGoal: number;
  weeklyRatePct: number | null;   // % of body weight per week (smoothed)
  weeklyRateKg: number | null;
  projectionWeeks: number | null;
  projectedDate: string | null;
};

export function computeProgress(goal: Goal, weights: WeightEntry[]): Progress {
  const current = weights.length ? weights[weights.length - 1].weight : goal.start_weight;
  const lost = round(goal.start_weight - current, 2);
  const remaining = round(current - goal.target_weight, 2);
  const totalToLose = goal.start_weight - goal.target_weight;
  const pct = totalToLose > 0 ? clamp((lost / totalToLose) * 100, 0, 100) : 0;

  // Smoothed weekly rate from the last ~14 days of data.
  let weeklyKg: number | null = null;
  let weeklyPct: number | null = null;
  const smooth = smoothedSeries(weights);
  if (smooth.length >= 2) {
    const last = smooth[smooth.length - 1];
    // find a point ~7 days before the last
    const target = addDays(last.date, -7);
    let ref = smooth[0];
    for (const p of smooth) { if (p.date <= target) ref = p; }
    const span = daysBetween(ref.date, last.date);
    if (span >= 3) {
      const ratePerDay = (ref.avg - last.avg) / span;
      weeklyKg = round(ratePerDay * 7, 3);
      weeklyPct = current > 0 ? round((weeklyKg / current) * 100, 2) : null;
    }
  }

  let projWeeks: number | null = null;
  let projDate: string | null = null;
  if (weeklyKg && weeklyKg > 0.01 && remaining > 0) {
    projWeeks = Math.ceil(remaining / weeklyKg);
    projDate = addDays(isoToday(), projWeeks * 7);
  }

  return {
    startWeight: goal.start_weight,
    currentWeight: current,
    targetWeight: goal.target_weight,
    lostSoFar: lost,
    remaining: round(Math.max(0, remaining), 2),
    pctToGoal: round(pct, 1),
    weeklyRatePct: weeklyPct,
    weeklyRateKg: weeklyKg,
    projectionWeeks: projWeeks,
    projectedDate: projDate,
  };
}

/* ---------- adherence ---------- */

export function dietAdherence(meals: Meal[]): { followed: number; total: number; pct: number } {
  const total = meals.length;
  const followed = meals.filter((m) => m.adherence === 'followed').length;
  return { followed, total, pct: total ? Math.round((followed / total) * 100) : 0 };
}

export function workoutAdherence(workouts: Workout[]): { completed: number; planned: number; pct: number } {
  const training = workouts.filter((w) => w.day_type === 'training');
  const completed = training.filter((w) => w.status === 'completed').length;
  const planned = training.length;
  return { completed, planned, pct: planned ? Math.round((completed / planned) * 100) : 0 };
}

/* ---------- insight / problem detection ----------
   All thresholds are intentionally conservative and every flag routes the user
   back to their coach — never to a drastic self-directed change. */

export function detectFlags(input: {
  progress: Progress;
  weights: WeightEntry[];
  meals: Meal[];      // last 7 days
  workouts: Workout[]; // last 7 days
  checkins: CheckIn[]; // last 7 days
}): Flag[] {
  const flags: Flag[] = [];
  const { progress } = input;

  // 1. Too-fast loss (> 1% body weight / week)
  if (progress.weeklyRatePct != null && progress.weeklyRatePct > 1.0) {
    flags.push({
      key: 'fast_loss',
      type: 'fast_loss',
      severity: 'danger',
      title: 'Losing weight faster than the typical safe range',
      message: `You're down about ${progress.weeklyRatePct}% of body weight this week. Sustainable loss is usually ~0.5–1%/week. Please review this with your coach before continuing.`,
    });
  }

  // 2. Plateau / too-slow while presumably adherent (≥3 weeks of data, < 0.1%/wk)
  if (progress.weeklyRatePct != null && progress.weeklyRatePct >= 0 && progress.weeklyRatePct < 0.1 && input.weights.length >= 14) {
    flags.push({
      key: 'plateau',
      type: 'plateau',
      severity: 'info',
      title: 'Progress has stalled',
      message: 'Your weight has barely changed recently. Plateaus are normal — your coach may want to adjust your plan.',
    });
  }

  // 3. Missed workouts (≥3 missed in the rolling 7 days)
  const missed = input.workouts.filter((w) => w.day_type === 'training' && w.status === 'missed').length;
  if (missed >= 3) {
    flags.push({
      key: 'missed_workouts',
      type: 'missed_workouts',
      severity: 'warn',
      title: `You've missed ${missed} workouts this week`,
      message: 'Life happens — no shame. If this keeps up, a quick message to your coach can help you get back on track or adjust the plan.',
    });
  }

  // 4. Frequent cheat meals (≥4 in 7 days)
  const cheats = input.meals.filter((m) => m.is_cheat === 1).length;
  if (cheats >= 4) {
    flags.push({
      key: 'frequent_cheat',
      type: 'frequent_cheat',
      severity: 'warn',
      title: `Diet has been off-plan ${cheats} times this week`,
      message: "That's okay — it often means the plan needs a tweak rather than more willpower. Worth raising with your coach.",
    });
  }

  // 5. Low energy/mood for 4+ consecutive days
  const lowStreak = maxLowStreak(input.checkins);
  if (lowStreak >= 4) {
    flags.push({
      key: 'low_energy',
      type: 'low_energy',
      severity: 'danger',
      title: `Low energy/mood for ${lowStreak} days running`,
      message: 'This really matters. Prioritise rest and sleep, and please talk to your coach — or a qualified health professional if it persists.',
    });
  }

  // 6. Training through "can't train" days (overtraining signal)
  const trainedWhenShouldRest = input.checkins.filter((c) => {
    if (c.can_train !== 'no') return false;
    const w = input.workouts.find((x) => x.date === c.date);
    return w?.status === 'completed';
  }).length;
  if (trainedWhenShouldRest >= 2) {
    flags.push({
      key: 'overtraining',
      type: 'overtraining',
      severity: 'warn',
      title: 'Training through low-energy days',
      message: "You've trained on days you flagged as 'can't train'. Rest is part of progress — check in with your coach.",
    });
  }

  return flags;
}

function maxLowStreak(checkins: CheckIn[]): number {
  // checkins assumed sorted by date ascending
  let max = 0, cur = 0;
  for (const c of checkins) {
    const low = (c.mood != null && c.mood <= 2) || (c.energy != null && c.energy <= 2);
    if (low) { cur += 1; max = Math.max(max, cur); } else { cur = 0; }
  }
  return max;
}

/* ---------- misc ---------- */

export function streakDays(checkins: CheckIn[]): number {
  // consecutive days up to today with a check-in
  const dates = new Set(checkins.map((c) => c.date));
  let streak = 0;
  let cursor = isoToday();
  while (dates.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function round(n: number, d = 1): number {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}
export function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
