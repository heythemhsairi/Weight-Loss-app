import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isOnboarded, getExercises, getOrCreateWorkout } from '@/lib/queries';
import { isoToday } from '@/lib/logic';
import { saveWorkout, addExercise, toggleExercise, deleteExercise, updateExercise } from '@/app/actions';
import { togglePlanExercise } from '@/app/plan-actions';
import { getPlan, getPlanExercises, planDayFor, loggedPlanExerciseIds } from '@/lib/plan';
import { PageHeader } from '@/components/ui';
import PlanCheck from '@/components/PlanCheck';
import DateNav from '@/components/DateNav';
import EditToggle from '@/components/EditToggle';

export const dynamic = 'force-dynamic';

const statusOpts = [
  { value: 'planned', label: '⏳ Planned' },
  { value: 'completed', label: '✅ Completed' },
  { value: 'partial', label: '🟡 Partial' },
  { value: 'missed', label: '❌ Missed' },
];

export default async function WorkoutsPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  if (!(await isOnboarded())) redirect('/onboarding');
  const sp = await searchParams;
  const date = sp.date ?? isoToday();

  const workout = await getOrCreateWorkout(date);
  const exercises = await getExercises(workout.id);

  const plan = await getPlan();
  let planDay = 0;
  let planExercises: Awaited<ReturnType<typeof getPlanExercises>> = [];
  let loggedEx = new Set<number>();
  if (plan) {
    planDay = planDayFor(plan, date);
    [planExercises, loggedEx] = await Promise.all([getPlanExercises(planDay), loggedPlanExerciseIds(workout.id)]);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <PageHeader title="Workouts" subtitle={`Training for ${date}`} action={<DateNav date={date} />} />

      {plan && (
        <div className="card border-brand/30">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-semibold">🏋️ Coach plan — Day {planDay} of {plan.cycle_length}</h2>
            <Link href="/plan" className="text-xs text-accent">Edit plan →</Link>
          </div>
          {planExercises.length > 0 ? (
            <>
              <p className="text-xs text-muted mb-2">Tick each exercise as you complete it.</p>
              <div className="divide-y divide-line">
                {planExercises.map((pe) => (
                  <PlanCheck key={pe.id}
                    action={togglePlanExercise}
                    fields={{ date, plan_exercise_id: pe.id, workout_id: workout.id }}
                    checked={loggedEx.has(pe.id)}
                    label={pe.name}
                    sub={`${pe.sets ? `${pe.sets}×${pe.reps ?? '?'}` : pe.reps ?? ''} ${pe.weight ? `@ ${pe.weight}` : ''}`}
                  />
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted">😴 Day {planDay} is a rest day in your plan.</p>
          )}
        </div>
      )}

      <form action={saveWorkout} className="card space-y-3">
        <input type="hidden" name="date" value={date} />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Day type</label>
            <select name="day_type" defaultValue={workout.day_type} className="input">
              <option value="training">🏋️ Training day</option>
              <option value="rest">😴 Rest day</option>
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select name="status" defaultValue={workout.status} className="input">
              {statusOpts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
        <div><label className="label">Session title</label><input name="title" defaultValue={workout.title ?? ''} className="input" placeholder="e.g. Push day (from coach)" /></div>
        <div><label className="label">Performance note</label><textarea name="note" rows={2} defaultValue={workout.note ?? ''} className="input" placeholder="How did it feel? Weights used?" /></div>
        <button className="btn-primary w-full">Save workout</button>
      </form>

      <div className="card">
        <h2 className="font-semibold mb-3">Exercises (from your coach)</h2>
        <div className="divide-y divide-line mb-3">
          {exercises.map((ex) => (
            <div key={ex.id} className="flex items-center gap-3 py-2 text-sm">
              <form action={toggleExercise}>
                <input type="hidden" name="id" value={ex.id} />
                <input type="hidden" name="completed" value={ex.completed ? '0' : '1'} />
                <button className={`w-5 h-5 rounded border ${ex.completed ? 'bg-brand border-brand text-ink' : 'border-line'}`}>
                  {ex.completed ? '✓' : ''}
                </button>
              </form>
              <div className="flex-1 min-w-0">
                <EditToggle
                  display={
                    <div className="flex items-center gap-3">
                      <span className={`flex-1 ${ex.completed ? 'line-through text-muted' : ''}`}>{ex.name}</span>
                      <span className="text-muted text-xs">
                        {ex.sets ? `${ex.sets}×${ex.reps ?? '?'}` : ex.reps ?? ''} {ex.weight ? `@ ${ex.weight}` : ''}
                      </span>
                      <form action={deleteExercise}>
                        <input type="hidden" name="id" value={ex.id} />
                        <button className="text-danger text-xs">✕</button>
                      </form>
                    </div>
                  }
                  edit={
                    <form action={updateExercise} className="flex flex-wrap items-end gap-2">
                      <input type="hidden" name="id" value={ex.id} />
                      <div className="flex-1 min-w-[100px]"><label className="label">Exercise</label><input name="name" defaultValue={ex.name} className="input" /></div>
                      <div className="w-14"><label className="label">Sets</label><input name="sets" type="number" defaultValue={ex.sets ?? ''} className="input" /></div>
                      <div className="w-16"><label className="label">Reps</label><input name="reps" defaultValue={ex.reps ?? ''} className="input" /></div>
                      <div className="w-20"><label className="label">Weight</label><input name="weight" defaultValue={ex.weight ?? ''} className="input" /></div>
                      <button className="btn-primary py-1.5" type="submit">Save</button>
                    </form>
                  }
                />
              </div>
            </div>
          ))}
          {exercises.length === 0 && <p className="text-sm text-muted py-3">No exercises added yet.</p>}
        </div>

        <form action={addExercise} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="date" value={date} />
          <div className="flex-1 min-w-[120px]"><label className="label">Exercise</label><input name="name" required className="input" placeholder="Bench press" /></div>
          <div className="w-16"><label className="label">Sets</label><input name="sets" type="number" className="input" /></div>
          <div className="w-20"><label className="label">Reps</label><input name="reps" className="input" placeholder="8-10" /></div>
          <div className="w-24"><label className="label">Weight</label><input name="weight" className="input" placeholder="40kg" /></div>
          <button className="btn-ghost">Add</button>
        </form>
      </div>
    </div>
  );
}
