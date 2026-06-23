import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isOnboarded, getMealsBetween, getWorkoutsBetween, getCheckinsBetween, getWeights } from '@/lib/queries';
import { PageHeader } from '@/components/ui';

export const dynamic = 'force-dynamic';

function monthMatrix(year: number, month: number): (string | null)[] {
  const first = new Date(Date.UTC(year, month, 1));
  const startDow = (first.getUTCDay() + 6) % 7; // Monday = 0
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= days; d++) {
    cells.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  if (!(await isOnboarded())) redirect('/onboarding');
  const sp = await searchParams;
  const now = new Date();
  const [yStr, mStr] = (sp.m ?? `${now.getUTCFullYear()}-${now.getUTCMonth()}`).split('-');
  const year = Number(yStr);
  const month = Number(mStr); // 0-based

  const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const end = `${year}-${String(month + 1).padStart(2, '0')}-31`;

  const [meals, workouts, checkins, weights] = await Promise.all([
    getMealsBetween(start, end),
    getWorkoutsBetween(start, end),
    getCheckinsBetween(start, end),
    getWeights(),
  ]);

  const byDay = (date: string) => ({
    cheat: meals.some((m) => m.date === date && m.is_cheat === 1),
    mealsLogged: meals.some((m) => m.date === date),
    workout: workouts.find((w) => w.date === date),
    checked: checkins.some((c) => c.date === date),
    weighed: weights.some((w) => w.date === date),
  });

  const cells = monthMatrix(year, month);
  const label = new Date(Date.UTC(year, month, 1)).toLocaleString('en', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const prev = month === 0 ? `${year - 1}-11` : `${year}-${month - 1}`;
  const next = month === 11 ? `${year + 1}-0` : `${year}-${month + 1}`;
  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
      <PageHeader title="Calendar" subtitle="Your plan vs. reality at a glance." />

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <Link href={`/calendar?m=${prev}`} className="btn-ghost px-3 py-1">←</Link>
          <h2 className="font-semibold">{label}</h2>
          <Link href={`/calendar?m=${next}`} className="btn-ghost px-3 py-1">→</Link>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-muted mb-1">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <div key={d}>{d}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((date, i) => {
            if (!date) return <div key={i} />;
            const info = byDay(date);
            const isToday = date === todayStr;
            const rest = info.workout?.day_type === 'rest';
            return (
              <Link key={i} href={`/meals?date=${date}`}
                className={`aspect-square rounded-lg border p-1 text-left text-[11px] relative
                  ${isToday ? 'border-brand' : 'border-line'}
                  ${rest ? 'bg-accent/5' : 'bg-panel2'} hover:border-brand transition-colors`}>
                <span className={isToday ? 'text-brand font-bold' : ''}>{Number(date.slice(-2))}</span>
                <div className="absolute bottom-1 left-1 right-1 flex flex-wrap gap-0.5 text-[9px] leading-none">
                  {info.workout?.status === 'completed' && <span title="workout done">✅</span>}
                  {info.workout?.status === 'missed' && <span title="missed">❌</span>}
                  {rest && <span title="rest">😴</span>}
                  {info.cheat && <span title="cheat meal">🍔</span>}
                  {info.weighed && <span title="weighed">⚖️</span>}
                  {info.checked && <span title="checked in">📝</span>}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="card text-xs text-muted flex flex-wrap gap-x-4 gap-y-1">
        <span>✅ workout done</span><span>❌ missed</span><span>😴 rest day</span>
        <span>🍔 cheat meal</span><span>⚖️ weighed</span><span>📝 checked in</span>
      </div>
    </div>
  );
}
