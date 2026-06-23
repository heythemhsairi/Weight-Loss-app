import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isOnboarded, getProfile, getMealsByDate, getWorkoutByDate, getCheckinByDate } from '@/lib/queries';
import { gatherInsights, dayNumber } from '@/lib/dashboard';
import { getPlan, planDayToday, getPlanMeals, loggedPlanMealIds } from '@/lib/plan';
import { dietAdherence, workoutAdherence } from '@/lib/logic';
import { FlagBanner, Stat } from '@/components/ui';
import WeightChart from '@/components/WeightChart';
import { smoothedSeries } from '@/lib/logic';

export const dynamic = 'force-dynamic';

export default async function Home() {
  if (!(await isOnboarded())) redirect('/onboarding');

  const profile = (await getProfile())!;
  const { goal, weights, progress, meals7, workouts7, flags, streak, today } = await gatherInsights();

  const [todayMeals, todayWorkout, todayCheckin] = await Promise.all([
    getMealsByDate(today),
    getWorkoutByDate(today),
    getCheckinByDate(today),
  ]);
  const diet = dietAdherence(meals7);
  const wk = workoutAdherence(workouts7);
  const series = smoothedSeries(weights).slice(-30);
  const day = dayNumber(weights, goal.start_date);

  // Coach plan progress for today.
  const plan = await getPlan();
  let planInfo: { day: number; cycle: number; done: number; total: number } | null = null;
  if (plan) {
    const pd = planDayToday(plan);
    const [pm, logged] = await Promise.all([getPlanMeals(pd), loggedPlanMealIds(today)]);
    planInfo = { day: pd, cycle: plan.cycle_length, total: pm.length, done: pm.filter((m) => logged.has(m.id)).length };
  }

  const rateLabel = progress.weeklyRateKg == null ? '—'
    : `${progress.weeklyRateKg > 0 ? '↓' : '↑'} ${Math.abs(progress.weeklyRateKg)} kg/wk`;
  const rateTone = progress.weeklyRatePct != null && progress.weeklyRatePct > 1 ? 'danger' : 'brand';

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hi {profile.name} 👋</h1>
          <p className="text-sm text-muted">Day {day} · {streak > 0 ? `🔥 ${streak}-day check-in streak` : 'Start your streak today'}</p>
        </div>
      </div>

      {flags.length > 0 && (
        <div className="space-y-3">
          {flags.map((f) => <FlagBanner key={f.key} flag={f} />)}
          <Link href="/insights" className="text-xs text-accent underline">See all insights →</Link>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Current weight" value={`${progress.currentWeight} kg`} sub={`start ${progress.startWeight} · target ${progress.targetWeight}`} />
        <Stat label="Lost so far" value={`${progress.lostSoFar} kg`} sub={`${progress.pctToGoal}% to goal`} tone="brand" />
        <Stat label="Weekly rate" value={rateLabel} sub={progress.weeklyRatePct != null ? `${progress.weeklyRatePct}%/wk` : 'need more data'} tone={rateTone as 'brand' | 'danger'} />
        <Stat label="To go" value={`${progress.remaining} kg`} sub={progress.projectedDate ? `est. ${progress.projectedDate}` : 'keep logging'} />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="card md:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">Weight trend</h2>
            <Link href="/weight" className="text-xs text-accent">Log weight →</Link>
          </div>
          <WeightChart data={series} target={goal.target_weight} start={goal.start_weight} />
        </div>

        <div className="card space-y-3">
          <h2 className="font-semibold">Today</h2>
          {planInfo && (
            <Link href="/plan" className="block rounded-lg bg-brand/10 border border-brand/30 px-3 py-2 text-sm hover:border-brand">
              <div className="flex items-center justify-between">
                <span className="font-medium text-brand">📋 Plan · Day {planInfo.day}/{planInfo.cycle}</span>
                <span className="text-xs text-muted">{planInfo.done}/{planInfo.total} meals ✓</span>
              </div>
            </Link>
          )}
          <Row label="🍽️ Meals" value={`${todayMeals.length} logged`} href="/meals" />
          <Row label="🏋️ Workout" value={
            todayWorkout ? (todayWorkout.day_type === 'rest' ? 'Rest day' : todayWorkout.status) : 'not set'
          } href="/workouts" />
          <Row label="📝 Check-in" value={todayCheckin ? 'done' : 'pending'} href="/checkin" />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="font-semibold mb-2">This week</h2>
          <Bar label="Diet adherence" pct={diet.pct} caption={`${diet.followed}/${diet.total} meals on plan`} />
          <Bar label="Workouts done" pct={wk.pct} caption={`${wk.completed}/${wk.planned} training days`} />
        </div>
        <div className="card">
          <h2 className="font-semibold mb-3">Quick actions</h2>
          <div className="grid grid-cols-2 gap-2">
            <Link href="/checkin" className="btn-ghost">📝 Check-in</Link>
            <Link href="/meals" className="btn-ghost">🍽️ Add meal</Link>
            <Link href="/workouts" className="btn-ghost">🏋️ Workout</Link>
            <Link href="/weight" className="btn-ghost">⚖️ Weigh-in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, href }: { label: string; value: string; href: string }) {
  return (
    <Link href={href} className="flex items-center justify-between text-sm py-1 hover:text-brand">
      <span className="text-muted">{label}</span>
      <span className="font-medium capitalize">{value}</span>
    </Link>
  );
}

function Bar({ label, pct, caption }: { label: string; pct: number; caption: string }) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex justify-between text-xs mb-1">
        <span>{label}</span><span className="text-muted">{caption}</span>
      </div>
      <div className="h-2 rounded-full bg-panel2 overflow-hidden">
        <div className="h-full bg-brand" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
