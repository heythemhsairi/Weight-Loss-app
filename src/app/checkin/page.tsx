import { redirect } from 'next/navigation';
import { isOnboarded, getCheckinByDate, getCheckinsBetween } from '@/lib/queries';
import { isoToday, addDays } from '@/lib/logic';
import { saveCheckin, deleteCheckin } from '@/app/actions';
import { PageHeader } from '@/components/ui';
import { Rating, Choice } from '@/components/Rating';
import DateNav from '@/components/DateNav';

export const dynamic = 'force-dynamic';

export default async function CheckinPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  if (!(await isOnboarded())) redirect('/onboarding');
  const sp = await searchParams;
  const date = sp.date ?? isoToday();
  const isToday = date === isoToday();

  const [existing, recentAsc] = await Promise.all([
    getCheckinByDate(date),
    getCheckinsBetween(addDays(isoToday(), -29), isoToday()),
  ]);
  const recent = [...recentAsc].reverse();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <PageHeader
        title="Daily check-in"
        subtitle={isToday ? '30 seconds. Honest beats perfect.' : `Editing ${date}`}
        action={<DateNav date={date} />}
      />

      {/* key forces the form to reset its rating buttons when the date changes */}
      <form key={date} action={saveCheckin} className="card space-y-4">
        <input type="hidden" name="date" value={date} />
        <Rating name="mood" label="Mood" defaultValue={existing?.mood} emojis={['😞', '🙁', '😐', '🙂', '😄']} />
        <Rating name="energy" label="Energy" defaultValue={existing?.energy} emojis={['🪫', '🔋', '🔋', '⚡', '⚡']} />
        <Rating name="motivation" label="Motivation" defaultValue={existing?.motivation} emojis={['😴', '😕', '😐', '💪', '🔥']} />
        <Choice name="can_train" label="Can you train this day?" defaultValue={existing?.can_train}
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
        <h2 className="font-semibold mb-3">Recent check-ins</h2>
        <div className="divide-y divide-line">
          {recent.map((c) => (
            <div key={c.id} className="flex items-center gap-3 py-2 text-sm">
              <a href={`/checkin?date=${c.date}`} className="text-muted w-24 hover:text-brand">{c.date}</a>
              <span>Mood {c.mood ?? '–'}</span>
              <span>Energy {c.energy ?? '–'}</span>
              <span className="capitalize text-muted flex-1">train: {c.can_train ?? '–'}</span>
              <a href={`/checkin?date=${c.date}`} className="text-accent text-xs hover:underline">edit</a>
              <form action={deleteCheckin}>
                <input type="hidden" name="id" value={c.id} />
                <button className="text-danger text-xs hover:underline">delete</button>
              </form>
            </div>
          ))}
          {recent.length === 0 && <p className="text-sm text-muted py-4">No check-ins yet.</p>}
        </div>
      </div>
    </div>
  );
}
