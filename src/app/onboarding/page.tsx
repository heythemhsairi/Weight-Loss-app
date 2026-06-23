import { redirect } from 'next/navigation';
import { isOnboarded } from '@/lib/queries';
import { completeOnboarding } from '@/app/actions';

export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  if (await isOnboarded()) redirect('/');
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-brand">Steady</h1>
        <p className="text-muted mt-1">Your private companion for coach-guided, healthy progress.</p>
      </div>

      <form action={completeOnboarding} className="space-y-5">
        <section className="card space-y-3">
          <h2 className="font-semibold">About you</h2>
          <div>
            <label className="label">Name</label>
            <input name="name" className="input" placeholder="Your name" defaultValue="Me" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Sex</label>
              <select name="sex" className="input">
                <option value="">—</option>
                <option>male</option>
                <option>female</option>
              </select>
            </div>
            <div><label className="label">Age</label><input name="age" type="number" className="input" /></div>
            <div><label className="label">Height (cm)</label><input name="height_cm" type="number" className="input" /></div>
          </div>
        </section>

        <section className="card space-y-3">
          <h2 className="font-semibold">Your goal</h2>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Starting weight (kg) *</label><input name="start_weight" type="number" step="0.1" required className="input" /></div>
            <div><label className="label">Target weight (kg) *</label><input name="target_weight" type="number" step="0.1" required className="input" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Start date</label><input name="start_date" type="date" defaultValue={today} className="input" /></div>
            <div><label className="label">Target date</label><input name="target_date" type="date" className="input" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Target weekly loss (kg)</label>
              <input name="weekly_rate_target" type="number" step="0.1" placeholder="e.g. 0.5" className="input" />
            </div>
            <div>
              <label className="label">Daily calorie target</label>
              <input name="daily_calorie_target" type="number" placeholder="from your coach" className="input" />
            </div>
          </div>
          <p className="text-[11px] text-muted">
            A healthy, sustainable rate is usually ~0.5–1% of body weight per week. Your coach&apos;s targets take priority.
          </p>
        </section>

        <section className="card space-y-3">
          <h2 className="font-semibold">Your coach</h2>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Coach name</label><input name="coach_name" className="input" /></div>
            <div><label className="label">Coach contact</label><input name="coach_contact" className="input" placeholder="phone / email" /></div>
          </div>
        </section>

        <section className="card text-sm space-y-2 border-warn/40">
          <h2 className="font-semibold text-warn">Please read before you start</h2>
          <p className="text-white/80">
            This app is a personal tracking tool — <strong>not medical or nutritional advice</strong>. It does not
            replace your coach, doctor, or dietitian. &ldquo;Healthy range&rdquo; guidance is a general estimate.
            Always follow your coach&apos;s and a qualified professional&apos;s advice. If you feel unwell, experience
            persistent fatigue, or any concerning thoughts about food or your body, stop and seek help.
          </p>
          <label className="flex items-center gap-2 pt-1">
            <input type="checkbox" required className="accent-[#4ade80] w-4 h-4" />
            <span>I understand and accept this.</span>
          </label>
        </section>

        <button className="btn-primary w-full">Start tracking</button>
      </form>
    </div>
  );
}
