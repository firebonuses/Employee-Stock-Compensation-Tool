import { useStore } from "../store/useStore";

const PRESETS: { rate: number; label: string; hint: string }[] = [
  { rate: 0, label: "0%", hint: "Mattress — cash earns nothing. Penalizes strategies that sell early." },
  { rate: 0.04, label: "4%", hint: "T-bills / HYSA — roughly the risk-free rate." },
  { rate: 0.07, label: "7%", hint: "Diversified equities — long-run broad-market expectation." },
];

function nearestPreset(rate: number): number {
  let best = PRESETS[0].rate;
  let bestDiff = Infinity;
  for (const p of PRESETS) {
    const d = Math.abs(p.rate - rate);
    if (d < bestDiff) {
      best = p.rate;
      bestDiff = d;
    }
  }
  return best;
}

export function ReinvestmentRateToggle() {
  const rate = useStore((s) => s.profile.reinvestmentRate);
  const setProfile = useStore((s) => s.setProfile);
  const active = PRESETS.find((p) => p.rate === nearestPreset(rate)) ?? PRESETS[1];

  return (
    <div className="flex flex-col gap-1">
      <div className="label !mb-0">Cash reinvestment rate</div>
      <div className="inline-flex items-center rounded-lg border border-ink-700/70 bg-ink-900/70 p-0.5">
        {PRESETS.map((p) => {
          const isActive = p.rate === nearestPreset(rate);
          return (
            <button
              key={p.rate}
              onClick={() => setProfile({ reinvestmentRate: p.rate })}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                isActive
                  ? "bg-accent text-white shadow-glow"
                  : "text-ink-300 hover:text-ink-100 hover:bg-ink-800/60"
              }`}
              title={p.hint}
            >
              {p.label}
            </button>
          );
        })}
      </div>
      <div className="text-[11px] text-ink-500 max-w-xs">{active.hint}</div>
    </div>
  );
}
