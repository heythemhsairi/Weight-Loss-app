import { redirect } from 'next/navigation';
import { isOnboarded, getWeights, getGoal } from '@/lib/queries';
import { computeProgress, smoothedSeries, isoToday } from '@/lib/logic';
import { addWeight, deleteWeight, updateWeight } from '@/app/actions';
import { PageHeader, Stat, FlagBanner } from '@/components/ui';
import { detectFlags } from '@/lib/logic';
import WeightChart from '@/components/WeightChart';
import EditToggle from '@/components/EditToggle';

export const dynamic = 'force-dynamic';

export default async function WeightPage() {
  if (!(await isOnboarded())) redirect('/onboarding');
  const [goalRow, weights] = await Promise.all([getGoal(), getWeights()]);
  const goal = goalRow!;
  const progress = computeProgress(goal, weights);
  const series = smoothedSeries(weights);
  const fastFlag = detectFlags({ progress, weights, meals: [], workouts: [], checkins: [] })
    .find((f) => f.type === 'fast_loss' || f.type === 'plateau');

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      <PageHeader title="Weight" subtitle="Log it the same way each time — e.g. mornings, before eating." />

      {fastFlag && <FlagBanner flag={fastFlag} />}

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Current" value={`${progress.currentWeight}`} sub="kg" />
        <Stat label="Lost" value={`${progress.lostSoFar}`} sub="kg" tone="brand" />
        <Stat label="To target" value={`${progress.remaining}`} sub="kg" />
      </div>

      <div className="card">
        <h2 className="font-semibold mb-2">Trend (7-day average)</h2>
        <WeightChart data={series} target={goal.target_weight} start={goal.start_weight} />
      </div>

      <form action={addWeight} className="card flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[120px]">
          <label className="label">Date</label>
          <input name="date" type="date" defaultValue={isoToday()} className="input" />
        </div>
        <div className="flex-1 min-w-[120px]">
          <label className="label">Weight (kg)</label>
          <input name="weight" type="number" step="0.1" required className="input" />
        </div>
        <div className="flex-[2] min-w-[160px]">
          <label className="label">Note</label>
          <input name="note" className="input" placeholder="optional" />
        </div>
        <button className="btn-primary">Save</button>
      </form>

      <div className="card">
        <h2 className="font-semibold mb-3">History</h2>
        <div className="divide-y divide-line">
          {[...weights].reverse().map((w) => (
            <div key={w.id} className="py-2 text-sm">
              <EditToggle
                display={
                  <div className="flex items-center gap-2">
                    <span className="text-muted w-28">{w.date}</span>
                    <span className="font-medium">{w.weight} kg</span>
                    <span className="flex-1 text-muted truncate px-3">{w.note}</span>
                    <form action={deleteWeight}>
                      <input type="hidden" name="id" value={w.id} />
                      <button className="text-danger text-xs hover:underline">delete</button>
                    </form>
                  </div>
                }
                edit={
                  <form action={updateWeight} className="flex flex-wrap items-end gap-2">
                    <input type="hidden" name="id" value={w.id} />
                    <div><label className="label">Date</label><input name="date" type="date" defaultValue={w.date} className="input w-auto" /></div>
                    <div className="w-24"><label className="label">kg</label><input name="weight" type="number" step="0.1" defaultValue={w.weight} className="input" /></div>
                    <div className="flex-1 min-w-[120px]"><label className="label">Note</label><input name="note" defaultValue={w.note ?? ''} className="input" /></div>
                    <button className="btn-primary py-1.5" type="submit">Save</button>
                  </form>
                }
              />
            </div>
          ))}
          {weights.length === 0 && <p className="text-sm text-muted py-4">No entries yet.</p>}
        </div>
      </div>
    </div>
  );
}
