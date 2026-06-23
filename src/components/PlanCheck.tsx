'use client';
import { useTransition } from 'react';

// A checkbox that submits a server action on toggle. `action` is a server
// action; `fields` are hidden inputs; `checked` is current state. We flip
// `checked` to the opposite when submitting.

export default function PlanCheck({
  action, fields, checked, label, sub,
}: {
  action: (fd: FormData) => Promise<void>;
  fields: Record<string, string | number>;
  checked: boolean;
  label: React.ReactNode;
  sub?: React.ReactNode;
}) {
  const [pending, start] = useTransition();

  function onChange() {
    const fd = new FormData();
    for (const [k, v] of Object.entries(fields)) fd.set(k, String(v));
    fd.set('checked', checked ? '0' : '1'); // toggle
    start(() => { action(fd); });
  }

  return (
    <label className={`flex items-center gap-3 py-2 cursor-pointer ${pending ? 'opacity-50' : ''}`}>
      <input type="checkbox" checked={checked} onChange={onChange}
        className="w-5 h-5 accent-[#4ade80] shrink-0" disabled={pending} />
      <span className={`flex-1 text-sm ${checked ? 'text-muted line-through' : ''}`}>{label}</span>
      {sub && <span className="text-xs text-muted">{sub}</span>}
    </label>
  );
}
