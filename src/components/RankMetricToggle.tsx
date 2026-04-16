import { useStore } from "../store/useStore";
import type { RankMetric } from "../engine/types";

const METRICS: { id: RankMetric; label: string; hint: string }[] = [
  { id: "mean", label: "Mean", hint: "Expected value — drift dominates; best if you're maximizing outcomes over many repetitions." },
  { id: "median", label: "Median", hint: "Typical outcome — acknowledges volatility drag; a conservative middle-of-the-road view." },
  { id: "p10", label: "P10 (downside)", hint: "10th percentile — what a bad-but-not-catastrophic path looks like; best if you're risk-averse." },
];

export function RankMetricToggle() {
  const rankBy = useStore((s) => s.profile.rankBy);
  const setProfile = useStore((s) => s.setProfile);
  const active = METRICS.find((m) => m.id === rankBy) ?? METRICS[1];

  return (
    <div className="flex flex-col gap-1">
      <div className="label !mb-0">Rank strategies by</div>
      <div className="inline-flex items-center rounded-lg border border-ink-700/70 bg-ink-900/70 p-0.5">
        {METRICS.map((m) => {
          const isActive = m.id === rankBy;
          return (
            <button
              key={m.id}
              onClick={() => setProfile({ rankBy: m.id })}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                isActive
                  ? "bg-accent text-white shadow-glow"
                  : "text-ink-300 hover:text-ink-100 hover:bg-ink-800/60"
              }`}
              title={m.hint}
            >
              {m.label}
            </button>
          );
        })}
      </div>
      <div className="text-[11px] text-ink-500 max-w-xs">{active.hint}</div>
    </div>
  );
}
