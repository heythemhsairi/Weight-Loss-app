import type { Flag } from '@/lib/types';

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'brand' | 'warn' | 'danger' }) {
  const color = tone === 'warn' ? 'text-warn' : tone === 'danger' ? 'text-danger' : tone === 'brand' ? 'text-brand' : 'text-white';
  return (
    <div className="card">
      <p className="text-xs text-muted">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
      {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
    </div>
  );
}

export function FlagBanner({ flag }: { flag: Flag }) {
  const styles = {
    info: 'border-accent/40 bg-accent/10 text-accent',
    warn: 'border-warn/40 bg-warn/10 text-warn',
    danger: 'border-danger/40 bg-danger/10 text-danger',
  }[flag.severity];
  const icon = { info: 'ℹ️', warn: '⚠️', danger: '🚨' }[flag.severity];
  return (
    <div className={`rounded-xl2 border p-4 ${styles}`}>
      <div className="flex gap-3">
        <span className="text-lg leading-none">{icon}</span>
        <div>
          <p className="font-semibold text-sm">{flag.title}</p>
          <p className="text-sm text-white/80 mt-1">{flag.message}</p>
        </div>
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, hint }: { icon: string; title: string; hint?: string }) {
  return (
    <div className="card text-center py-10">
      <div className="text-4xl mb-3">{icon}</div>
      <p className="font-medium">{title}</p>
      {hint && <p className="text-sm text-muted mt-1">{hint}</p>}
    </div>
  );
}
