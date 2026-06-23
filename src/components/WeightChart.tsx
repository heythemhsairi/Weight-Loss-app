// Dependency-free SVG line chart: raw weight (dim) + 7-day average (bold),
// with start and target reference lines.

type Point = { date: string; raw: number; avg: number };

export default function WeightChart({
  data, target, start,
}: { data: Point[]; target: number; start: number }) {
  if (data.length === 0) {
    return <div className="text-sm text-muted py-12 text-center">No weight data yet.</div>;
  }

  const W = 640, H = 240, pad = { l: 36, r: 12, t: 12, b: 24 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;

  const values = [...data.map((d) => d.raw), ...data.map((d) => d.avg), target, start];
  const min = Math.min(...values) - 0.5;
  const max = Math.max(...values) + 0.5;
  const span = max - min || 1;

  const x = (i: number) => pad.l + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const y = (v: number) => pad.t + innerH - ((v - min) / span) * innerH;

  const line = (key: 'raw' | 'avg') =>
    data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(d[key]).toFixed(1)}`).join(' ');

  const gridYs = [min, min + span / 2, max];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
      {gridYs.map((g, i) => (
        <g key={i}>
          <line x1={pad.l} x2={W - pad.r} y1={y(g)} y2={y(g)} stroke="#2a2f3a" strokeWidth="1" />
          <text x={4} y={y(g) + 4} fill="#8b93a3" fontSize="10">{g.toFixed(1)}</text>
        </g>
      ))}

      {/* target line */}
      <line x1={pad.l} x2={W - pad.r} y1={y(target)} y2={y(target)} stroke="#4ade80" strokeWidth="1" strokeDasharray="4 4" />
      <text x={W - pad.r} y={y(target) - 4} fill="#4ade80" fontSize="10" textAnchor="end">target {target}</text>

      {/* raw */}
      <path d={line('raw')} fill="none" stroke="#3a4150" strokeWidth="1.5" />
      {/* 7-day avg */}
      <path d={line('avg')} fill="none" stroke="#4ade80" strokeWidth="2.5" />

      {/* last point */}
      {(() => {
        const last = data[data.length - 1];
        return <circle cx={x(data.length - 1)} cy={y(last.avg)} r="3.5" fill="#4ade80" />;
      })()}
    </svg>
  );
}
