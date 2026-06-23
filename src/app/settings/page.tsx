import { redirect } from 'next/navigation';
import { isOnboarded, getProfile, getGoal } from '@/lib/queries';
import { updateSettings } from '@/app/actions';
import { PageHeader } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  if (!(await isOnboarded())) redirect('/onboarding');
  const [profile, goal] = await Promise.all([getProfile(), getGoal()]);
  const p = profile!;
  const g = goal!;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <PageHeader title="Settings" subtitle="Edit your profile, goal, and coach details." />

      <form action={updateSettings} className="space-y-5">
        <section className="card space-y-3">
          <h2 className="font-semibold">About you</h2>
          <div>
            <label className="label">Name</label>
            <input name="name" className="input" defaultValue={p.name ?? ''} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Sex</label>
              <select name="sex" defaultValue={p.sex ?? ''} className="input">
                <option value="">—</option>
                <option value="male">male</option>
                <option value="female">female</option>
              </select>
            </div>
            <div><label className="label">Age</label><input name="age" type="number" defaultValue={p.age ?? ''} className="input" /></div>
            <div><label className="label">Height (cm)</label><input name="height_cm" type="number" defaultValue={p.height_cm ?? ''} className="input" /></div>
          </div>
        </section>

        <section className="card space-y-3">
          <h2 className="font-semibold">Your goal</h2>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Starting weight (kg) *</label><input name="start_weight" type="number" step="0.1" required defaultValue={g.start_weight} className="input" /></div>
            <div><label className="label">Target weight (kg) *</label><input name="target_weight" type="number" step="0.1" required defaultValue={g.target_weight} className="input" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Start date</label><input name="start_date" type="date" defaultValue={g.start_date} className="input" /></div>
            <div><label className="label">Target date</label><input name="target_date" type="date" defaultValue={g.target_date ?? ''} className="input" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Target weekly loss (kg)</label><input name="weekly_rate_target" type="number" step="0.1" defaultValue={g.weekly_rate_target ?? ''} className="input" /></div>
            <div><label className="label">Daily calorie target</label><input name="daily_calorie_target" type="number" defaultValue={g.daily_calorie_target ?? ''} className="input" /></div>
          </div>
          <p className="text-[11px] text-muted">
            A healthy, sustainable rate is usually ~0.5–1% of body weight per week. Your coach&apos;s targets take priority.
          </p>
        </section>

        <section className="card space-y-3">
          <h2 className="font-semibold">Your coach</h2>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Coach name</label><input name="coach_name" defaultValue={p.coach_name ?? ''} className="input" /></div>
            <div><label className="label">Coach contact</label><input name="coach_contact" defaultValue={p.coach_contact ?? ''} className="input" /></div>
          </div>
        </section>

        <button className="btn-primary w-full">Save changes</button>
      </form>

      <div className="card text-xs text-muted border-warn/40">
        ⚠️ Changing your starting weight or dates affects your progress and rate
        calculations. This is a tracking tool, not medical advice — follow your coach.
      </div>
    </div>
  );
}
