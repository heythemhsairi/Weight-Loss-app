import { redirect } from 'next/navigation';
import { isOnboarded, getCheckinByDate, getCheckinsBetween } from '@/lib/queries';
import { isoToday, addDays } from '@/lib/logic';
import { saveCheckin } from '@/app/actions';
import { PageHeader } from '@/components/ui';
import { Rating, Choice } from '@/components/Rating';

export const dynamic = 'force-dynamic';

export default async function CheckinPage() {
  if (!(await isOnboarded())) redirect('/onboarding');
  const today = isoToday();
  const [existing, recentAsc] = await Promise.all([
    getCheckinByDate(today),
    getCheckinsBetween(addDays(today, -6), today),
  ]);
  const recent = [...recentAsc].reverse();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <PageHeader title="Daily check-in" subtitle="30 seconds. Honest beats perfect." />

      <form action={saveCheckin} className="card space-y-4">
        <input type="hidden" name="date" value={today} />
        <Rating name="mood" label="Mood" defaultValue={existing?.mood} emojis={['😞', '🙁', '😐', '🙂', '😄']} />
        <Rating name="energy" label="Energy" defaultValue={existing?.energy} emojis={['🪫', '🔋', '🔋', '⚡', '⚡']} />
        <Rating name="motivation" label="Motivation" defaultValue={existing?.motivation} emojis={['😴', '😕', '😐', '💪', '🔥']} />
        <Choice name="can_train" label="Can you train today?" defaultValue={existing?.can_train}
          options={[{ value: 'yes', label: '✅ Yes' }, { value: 'unsure', label: '🤔 Unsure' }, { value: 'no', label: '🛑 No' }]} />
        <div className="grid grid-cols-2 gap-3">
          <Rating name="sleep_quality" label="Sleep quality" defaultValue={existing?.sleep_quality} />
          <div>
            <label className="label">Sleep (hours)</label>
            <input name="sleep_hours" type="number" step="0.5" defaultValue={existing?.sleep_hours ?? ''} className="input" />
          </div>
        </div>
        <Rating name="stress" label="Stress" defaultValue={existing?.stress} emojis={['😌', '🙂', '😐', '😣', '🤯']} />
        <div>
          <label className="label">Notes</label>
          <textarea name="note" rows={3} defaultValue={existing?.note ?? ''} className="input" placeholder="Anything worth remembering or telling your coach…" />
        </div>
        <button className="btn-primary w-full">{existing ? 'Update check-in' : 'Save check-in'}</button>
      </form>

      <div className="card">
        <h2 className="font-semibold mb-3">Recent days</h2>
        <div className="divide-y divide-line">
          {recent.map((c) => (
            <div key={c.id} className="flex items-center gap-3 py-2 text-sm">
              <span className="text-muted w-24">{c.date}</span>
              <span>Mood {c.mood ?? '–'}</span>
              <span>Energy {c.energy ?? '–'}</span>
              <span className="capitalize text-muted">train: {c.can_train ?? '–'}</span>
            </div>
          ))}
          {recent.length === 0 && <p className="text-sm text-muted py-4">No check-ins yet.</p>}
        </div>
      </div>
    </div>
  );
}
