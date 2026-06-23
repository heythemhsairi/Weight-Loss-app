'use client';
import { useState } from 'react';

export function Rating({ name, label, defaultValue, emojis }: {
  name: string; label: string; defaultValue?: number | null; emojis?: string[];
}) {
  const [val, setVal] = useState<number>(defaultValue ?? 0);
  const faces = emojis ?? ['1', '2', '3', '4', '5'];
  return (
    <div>
      <label className="label">{label}</label>
      <input type="hidden" name={name} value={val || ''} />
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button type="button" key={n} onClick={() => setVal(n)}
            className={`pill-btn ${val === n ? 'pill-btn-active' : ''}`}>
            {faces[n - 1]}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Choice({ name, label, options, defaultValue }: {
  name: string; label: string; options: { value: string; label: string }[]; defaultValue?: string | null;
}) {
  const [val, setVal] = useState<string>(defaultValue ?? '');
  return (
    <div>
      <label className="label">{label}</label>
      <input type="hidden" name={name} value={val} />
      <div className="flex gap-2">
        {options.map((o) => (
          <button type="button" key={o.value} onClick={() => setVal(o.value)}
            className={`pill-btn ${val === o.value ? 'pill-btn-active' : ''}`}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
