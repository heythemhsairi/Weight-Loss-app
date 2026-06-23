import { redirect } from 'next/navigation';
import { isOnboarded, getProfile } from '@/lib/queries';
import { gatherInsights } from '@/lib/dashboard';
import { dietAdherence, workoutAdherence } from '@/lib/logic';
import { PageHeader, FlagBanner, Stat, EmptyState } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function InsightsPage() {
  if (!(await isOnboarded())) redirect('/onboarding');
  const profile = (await getProfile())!;
  const { progress, meals7, workouts7, flags } = await gatherInsights();
  const diet = dietAdherence(meals7);
  const wk = workoutAdherence(workouts7);
  const coach = profile.coach_name;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      <PageHeader title="Insights" subtitle="Honest signals — and when to loop in your coach." />

      {flags.length > 0 ? (
        <div className="space-y-3">
          {flags.map((f) => <FlagBanner key={f.key} flag={f} />)}
          {coach && (
            <div className="card border-accent/40 text-sm">
              💬 Consider messaging <strong>{coach}</strong>
              {profile.coach_contact ? ` (${profile.coach_contact})` : ''} about the points above.
            </div>
          )}
        </div>
      ) : (
        <EmptyState icon="🌿" title="No warnings right now" hint="You're tracking in a healthy, consistent range. Keep it up." />
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Weekly rate" value={progress.weeklyRatePct != null ? `${progress.weeklyRatePct}%` : '—'} sub="of body weight" />
        <Stat label="Diet adherence" value={`${diet.pct}%`} sub={`${diet.followed}/${diet.total} meals`} tone="brand" />
        <Stat label="Workouts" value={`${wk.pct}%`} sub={`${wk.completed}/${wk.planned} done`} tone="brand" />
        <Stat label="To goal" value={`${progress.pctToGoal}%`} sub={`${progress.remaining} kg left`} />
      </div>

      <div className="card text-sm space-y-2">
        <h2 className="font-semibold">How these signals work</h2>
        <ul className="text-muted space-y-1 list-disc pl-5">
          <li>Weekly rate uses a 7-day average to ignore daily water-weight noise.</li>
          <li>A sustainable rate is roughly <strong>0.5–1% of body weight per week</strong>. Faster isn&apos;t better.</li>
          <li>Warnings appear only when a threshold is crossed — and always point you to your coach, never to a crash diet.</li>
        </ul>
      </div>

      <div className="card text-xs text-muted border-warn/40">
        ⚠️ This is a tracking tool, not medical advice. It doesn&apos;t replace your coach, doctor, or dietitian.
        If you feel unwell or notice unhealthy patterns with food, rest, or your body image, please stop and seek professional help.
      </div>
    </div>
  );
}
