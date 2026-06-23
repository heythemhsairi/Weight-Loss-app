import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isOnboarded } from '@/lib/queries';
import { getPlan, getPlanMeals, getPlanExercises, planDayToday } from '@/lib/plan';
import { savePlan, addPlanMeal, deletePlanMeal, addPlanExercise, deletePlanExercise } from '@/app/plan-actions';
import { PageHeader } from '@/components/ui';
import { isoToday } from '@/lib/logic';

export const dynamic = 'force-dynamic';

export default async function PlanPage({ searchParams }: { searchParams: Promise<{ day?: string }> }) {
  if (!(await isOnboarded())) redirect('/onboarding');
  const sp = await searchParams;
  const plan = await getPlan();

  // No plan yet → just show the setup form.
  if (!plan) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        <PageHeader title="Coach plan" subtitle="Enter the repeating diet + workout cycle your coach gave you." />
        <PlanSetupForm name="Coach plan" cycle={14} start={isoToday()} />
        <p className="text-sm text-muted">Once you set the cycle length and start date, you can fill in each day&apos;s meals and exercises. The plan then repeats automatically — when the cycle ends, it loops back to Day 1.</p>
      </div>
    );
  }

  const today = planDayToday(plan);
  const day = Math.min(Math.max(1, Number(sp.day) || today), plan.cycle_length);
  const [meals, exercises] = await Promise.all([getPlanMeals(day), getPlanExercises(day)]);
  const dayCalories = meals.reduce((s, m) => s + m.calories, 0);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <PageHeader title="Coach plan" subtitle={`${plan.name} · ${plan.cycle_length}-day cycle · today is Day ${today}`} />

      <details className="card">
        <summary className="cursor-pointer font-semibold text-sm">⚙️ Cycle settings (length / start date)</summary>
        <div className="mt-3"><PlanSetupForm name={plan.name} cycle={plan.cycle_length} start={plan.start_date} /></div>
      </details>

      {/* Day selector */}
      <div className="card">
        <p className="label">Editing day</p>
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: plan.cycle_length }, (_, i) => i + 1).map((d) => (
            <Link key={d} href={`/plan?day=${d}`}
              className={`w-9 h-9 rounded-lg border flex items-center justify-center text-sm font-medium
                ${d === day ? 'border-brand bg-brand/10 text-brand' : 'border-line bg-panel2 text-muted hover:border-brand'}
                ${d === today ? 'ring-1 ring-accent' : ''}`}>
              {d}
            </Link>
          ))}
        </div>
        <p className="text-[11px] text-muted mt-2">Blue ring = today (Day {today}).</p>
      </div>

      {/* Meals for this day */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Day {day} — meals</h2>
          <span className="text-xs text-muted">{dayCalories} kcal planned</span>
        </div>
        <div className="divide-y divide-line mb-3">
          {meals.map((m) => (
            <div key={m.id} className="flex items-center gap-3 py-2 text-sm">
              <span className="capitalize text-muted w-20">{m.type}</span>
              <span className="flex-1">{m.name}</span>
              <span className="w-16 text-right">{m.calories} kcal</span>
              <form action={deletePlanMeal}><input type="hidden" name="id" value={m.id} /><button className="text-danger text-xs">✕</button></form>
            </div>
          ))}
          {meals.length === 0 && <p className="text-sm text-muted py-3">No meals for Day {day} yet.</p>}
        </div>
        <form action={addPlanMeal} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="day_index" value={day} />
          <div className="w-28"><label className="label">Meal</label>
            <select name="type" className="input">
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
            </select>
          </div>
          <div className="flex-1 min-w-[120px]"><label className="label">Food</label><input name="name" required className="input" placeholder="e.g. Oats + eggs" /></div>
          <div className="w-20"><label className="label">kcal</label><input name="calories" type="number" className="input" /></div>
          <button className="btn-ghost">Add</button>
        </form>
      </div>

      {/* Exercises for this day */}
      <div className="card">
        <h2 className="font-semibold mb-3">Day {day} — workout</h2>
        <div className="divide-y divide-line mb-3">
          {exercises.map((e) => (
            <div key={e.id} className="flex items-center gap-3 py-2 text-sm">
              <span className="flex-1">{e.name}</span>
              <span className="text-muted text-xs">{e.sets ? `${e.sets}×${e.reps ?? '?'}` : e.reps ?? ''} {e.weight ? `@ ${e.weight}` : ''}</span>
              <form action={deletePlanExercise}><input type="hidden" name="id" value={e.id} /><button className="text-danger text-xs">✕</button></form>
            </div>
          ))}
          {exercises.length === 0 && <p className="text-sm text-muted py-3">No exercises — leave empty for a rest day.</p>}
        </div>
        <form action={addPlanExercise} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="day_index" value={day} />
          <div className="flex-1 min-w-[110px]"><label className="label">Exercise</label><input name="name" required className="input" placeholder="Bench press" /></div>
          <div className="w-14"><label className="label">Sets</label><input name="sets" type="number" className="input" /></div>
          <div className="w-16"><label className="label">Reps</label><input name="reps" className="input" placeholder="8-10" /></div>
          <div className="w-20"><label className="label">Weight</label><input name="weight" className="input" placeholder="40kg" /></div>
          <button className="btn-ghost">Add</button>
        </form>
      </div>

      <p className="text-xs text-muted text-center">
        Log what you actually eat/do from the <Link href="/meals" className="text-accent">Meals</Link> and <Link href="/workouts" className="text-accent">Workouts</Link> pages — today&apos;s plan shows there with checkboxes.
      </p>
    </div>
  );
}

function PlanSetupForm({ name, cycle, start }: { name: string; cycle: number; start: string }) {
  return (
    <form action={savePlan} className="space-y-3">
      <div><label className="label">Plan name</label><input name="name" defaultValue={name} className="input" placeholder="e.g. Cut block 1" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Cycle length (days)</label><input name="cycle_length" type="number" min={1} max={60} defaultValue={cycle} className="input" /></div>
        <div><label className="label">Start date</label><input name="start_date" type="date" defaultValue={start} className="input" /></div>
      </div>
      <button className="btn-primary w-full">Save cycle</button>
    </form>
  );
}
