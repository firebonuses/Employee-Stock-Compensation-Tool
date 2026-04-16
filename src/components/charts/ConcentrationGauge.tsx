import { fmt } from "../../utils/format";

interface Props {
  /** 0–1 */
  current: number;
  /** 0–1, user's max acceptable */
  ceiling: number;
}

export function ConcentrationGauge({ current, ceiling }: Props) {
  const clamped = Math.max(0, Math.min(1.05, current));
  const ceilingPct = Math.max(0.05, Math.min(1, ceiling));
  const over = current > ceiling;

  const radius = 76;
  const stroke = 14;
  const cx = 100;
  const cy = 100;
  const start = Math.PI; // 180°
  const sweep = Math.PI; // half circle
  const valueAngle = start + sweep * clamped;
  const ceilingAngle = start + sweep * ceilingPct;

  const arc = (a0: number, a1: number) => {
    const x0 = cx + radius * Math.cos(a0);
    const y0 = cy + radius * Math.sin(a0);
    const x1 = cx + radius * Math.cos(a1);
    const y1 = cy + radius * Math.sin(a1);
    const large = a1 - a0 > Math.PI ? 1 : 0;
    return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${radius} ${radius} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
  };

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 120" className="w-full max-w-[260px]">
        {/* Track */}
        <path d={arc(start, start + sweep)} stroke="#1f2533" strokeWidth={stroke} fill="none" strokeLinecap="round" />
        {/* Value */}
        <path
          d={arc(start, valueAngle)}
          stroke={over ? "#ef4f6c" : "#22c39a"}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
        />
        {/* Ceiling tick */}
        <line
          x1={cx + (radius - stroke) * Math.cos(ceilingAngle)}
          y1={cy + (radius - stroke) * Math.sin(ceilingAngle)}
          x2={cx + (radius + stroke / 2) * Math.cos(ceilingAngle)}
          y2={cy + (radius + stroke / 2) * Math.sin(ceilingAngle)}
          stroke="#f5a524"
          strokeWidth={2}
        />
      </svg>
      <div className="-mt-12 text-center">
        <div className="text-3xl font-mono tabular-nums font-semibold text-ink-50">
          {fmt.pct(current)}
        </div>
        <div className="text-[11px] uppercase tracking-wider text-ink-400">
          ceiling: <span className="text-amber2 font-mono">{fmt.pct(ceiling)}</span>
        </div>
      </div>
    </div>
  );
}
