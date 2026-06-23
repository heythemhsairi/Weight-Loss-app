import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isOnboarded, getMealsByDate, getGoal } from '@/lib/queries';
import { isoToday } from '@/lib/logic';
import { addMeal, deleteMeal, updateMeal } from '@/app/actions';
import { togglePlanMeal } from '@/app/plan-actions';
import { getPlan, getPlanMeals, planDayFor, loggedPlanMealIds } from '@/lib/plan';
import EditToggle from '@/components/EditToggle';
import PlanCheck from '@/components/PlanCheck';
import { PageHeader } from '@/components/ui';
import DateNav from '@/components/DateNav';

export const dynamic = 'force-dynamic';

const adherenceChip: Record<string, string> = {
  followed: 'chip bg-brand/15 text-brand',
  partial: 'chip bg-warn/15 text-warn',
  cheated: 'chip bg-danger/15 text-danger',
};

export default async function MealsPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  if (!(await isOnboarded())) redirect('/onboarding');
  const sp = await searchParams;
  const date = sp.date ?? isoToday();
  const [goal, meals, plan] = await Promise.all([getGoal(), getMealsByDate(date), getPlan()]);
  const total = meals.reduce((s, m) => s + m.calories, 0);
  const target = goal?.daily_calorie_target;

  // Today's plan checklist (if a coach plan exists).
  let planDay = 0;
  let planMeals: Awaited<ReturnType<typeof getPlanMeals>> = [];
  let loggedIds = new Set<number>();
  if (plan) {
    planDay = planDayFor(plan, date);
    [planMeals, loggedIds] = await Promise.all([getPlanMeals(planDay), loggedPlanMealIds(date)]);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <PageHeader title="Meals" subtitle={`Logging for ${date}`} action={<DateNav date={date} />} />

      {plan ? (
        <div className="card border-brand/30">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-semibold">🍽️ Coach plan — Day {planDay} of {plan.cycle_length}</h2>
            <Link href="/plan" className="text-xs text-accent">Edit plan →</Link>
          </div>
          <p className="text-xs text-muted mb-2">Tick each meal as you eat it — it logs automatically.</p>
          <div className="divide-y divide-line">
            {planMeals.map((pm) => (
              <PlanCheck key={pm.id}
                action={togglePlanMeal}
                fields={{ date, plan_meal_id: pm.id }}
                checked={loggedIds.has(pm.id)}
                label={<><span className="capitalize text-muted mr-2">{pm.type}</span>{pm.name}</>}
                sub={`${pm.calories} kcal`}
              />
            ))}
            {planMeals.length === 0 && <p className="text-sm text-muted py-2">No meals planned for Day {planDay}. <Link href={`/plan?day=${planDay}`} className="text-accent">Add some →</Link></p>}
          </div>
        </div>
      ) : (
        <div className="card border-accent/30 text-sm">
          📋 Got a plan from your coach? <Link href="/plan" className="text-accent font-medium">Set up your repeating plan →</Link> and tick meals off here each day.
        </div>
      )}

      <div className="card flex items-center justify-between">
        <div>
          <p className="text-xs text-muted">Calories today</p>
          <p className="text-2xl font-bold">{total}{target ? <span className="text-muted text-base"> / {target}</span> : ''}</p>
        </div>
        {target && (
          <div className={`chip ${total > target ? 'bg-warn/15 text-warn' : 'bg-brand/15 text-brand'}`}>
            {total > target ? `${total - target} over` : `${target - total} left`}
          </div>
        )}
      </div>

      <form action={addMeal} className="card space-y-3">
        <input type="hidden" name="date" value={date} />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Meal</label>
            <select name="type" className="input">
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
            </select>
          </div>
          <div><label className="label">Calories</label><input name="calories" type="number" className="input" placeholder="0" /></div>
        </div>
        <div><label className="label">What did you eat?</label><input name="name" required className="input" placeholder="e.g. Chicken, rice, salad" /></div>
        <div>
          <label className="label">Did you follow the plan?</label>
          <select name="adherence" className="input">
            <option value="followed">✅ Followed the plan</option>
            <option value="partial">🟡 Partly off-plan</option>
            <option value="cheated">🔴 Cheat meal</option>
          </select>
        </div>
        <div><label className="label">Note</label><input name="note" className="input" placeholder="reason / how you felt (esp. for cheat meals)" /></div>
        <button className="btn-primary w-full">Add meal</button>
      </form>

      <div className="card">
        <h2 className="font-semibold mb-3">Today&apos;s meals</h2>
        <div className="divide-y divide-line">
          {meals.map((m) => (
            <div key={m.id} className="py-2.5 text-sm">
              <EditToggle
                display={
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{m.name} <span className="text-muted capitalize text-xs">· {m.type}</span></p>
                      {m.note && <p className="text-xs text-muted truncate">{m.note}</p>}
                    </div>
                    <span className={adherenceChip[m.adherence]}>{m.adherence}</span>
                    <span className="w-16 text-right">{m.calories} kcal</span>
                    <form action={deleteMeal}>
                      <input type="hidden" name="id" value={m.id} />
                      <button className="text-danger text-xs hover:underline">✕</button>
                    </form>
                  </div>
                }
                edit={
                  <form action={updateMeal} className="space-y-2">
                    <input type="hidden" name="id" value={m.id} />
                    <div className="grid grid-cols-2 gap-2">
                      <select name="type" defaultValue={m.type} className="input">
                        <option value="breakfast">Breakfast</option>
                        <option value="lunch">Lunch</option>
                        <option value="dinner">Dinner</option>
                        <option value="snack">Snack</option>
                      </select>
                      <input name="calories" type="number" defaultValue={m.calories} className="input" placeholder="calories" />
                    </div>
                    <input name="name" defaultValue={m.name} className="input" placeholder="what you ate" />
                    <select name="adherence" defaultValue={m.adherence} className="input">
                      <option value="followed">✅ Followed the plan</option>
                      <option value="partial">🟡 Partly off-plan</option>
                      <option value="cheated">🔴 Cheat meal</option>
                    </select>
                    <input name="note" defaultValue={m.note ?? ''} className="input" placeholder="note" />
                    <button className="btn-primary py-1.5" type="submit">Save</button>
                  </form>
                }
              />
            </div>
          ))}
          {meals.length === 0 && <p className="text-sm text-muted py-4">No meals logged for this day.</p>}
        </div>
      </div>
    </div>
  );
}
