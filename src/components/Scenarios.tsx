import type { EvaluationResult } from "../engine/strategies";
import { STRATEGY_LIBRARY, type RankMetric, type StrategyOutcome } from "../engine/types";
import { fmt } from "../utils/format";
import { useStore } from "../store/useStore";
import { StrategyWealthBars } from "./charts/StrategyBars";
import { Check, Sparkle } from "./icons";
import { RankMetricToggle } from "./RankMetricToggle";
import { ReinvestmentRateToggle } from "./ReinvestmentRateToggle";

interface Props {
  evaluation: EvaluationResult;
}

function metricValue(o: StrategyOutcome, m: RankMetric): number {
  return m === "mean" ? o.meanTerminalWealth : m === "p10" ? o.p10TerminalWealth : o.medianTerminalWealth;
}

export function Scenarios({ evaluation }: Props) {
  const rankBy = useStore((s) => s.profile.rankBy);
  const sorted = evaluation.outcomes
    .slice()
    .sort((a, b) => metricValue(b, rankBy) - metricValue(a, rankBy));

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink-50">Scenario comparison</h1>
          <p className="text-sm text-ink-400 mt-1 max-w-2xl">
            Six strategies, modeled side-by-side. The table shows mean (drift-driven) and
            median (drag-aware) terminal wealth, plus the 10th–90th percentile range across
            {" "}{fmt.num(1500)} Monte Carlo paths. Pick a ranking metric below to change
            how the recommendation is chosen.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <RankMetricToggle />
          <ReinvestmentRateToggle />
        </div>
      </header>

      <section className="card-pad">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold text-ink-100">
            {rankBy === "mean" ? "Mean" : rankBy === "p10" ? "10th-percentile" : "Median"} terminal wealth, by strategy
          </div>
          <div className="text-xs text-ink-400">Higher is better</div>
        </div>
        <StrategyWealthBars outcomes={sorted} recommendedId={evaluation.recommendedId} metric={rankBy} />
      </section>

      <section className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm table-mono">
            <thead className="bg-ink-900/60 border-b border-ink-800/70">
              <tr className="text-left">
                <Th>Strategy</Th>
                <Th align="right" active={rankBy === "mean"}>Mean wealth</Th>
                <Th align="right" active={rankBy === "median"}>Median wealth</Th>
                <Th align="right" active={rankBy === "p10"}>10th–90th</Th>
                <Th align="right">Total tax</Th>
                <Th align="right">Peak AMT</Th>
                <Th align="right">Peak conc.</Th>
                <Th align="right">Goal Pr.</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-800/70">
              {sorted.map((o) => {
                const meta = STRATEGY_LIBRARY.find((s) => s.id === o.strategyId)!;
                const recommended = o.strategyId === evaluation.recommendedId;
                const ceilingFriendly = o.strategyId === evaluation.ceilingFriendlyId;
                return (
                  <tr
                    key={o.strategyId}
                    className={
                      recommended
                        ? "bg-emerald2/5"
                        : ceilingFriendly
                          ? "bg-amber2/5"
                          : "hover:bg-ink-800/30"
                    }
                  >
                    <td className="px-4 py-3 font-sans">
                      <div className="flex items-start gap-2">
                        <div className="flex flex-col items-start gap-1 shrink-0 mt-0.5">
                          {recommended && (
                            <span className="inline-flex items-center gap-1 text-emerald2 text-[10px] uppercase tracking-wider">
                              <Sparkle className="h-3 w-3" /> Best on metric
                            </span>
                          )}
                          {ceilingFriendly && (
                            <span className="inline-flex items-center gap-1 text-amber2 text-[10px] uppercase tracking-wider">
                              Under ceiling
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="text-ink-50 font-medium">{meta.name}</div>
                          <div className="text-xs text-ink-400 font-sans">{meta.description}</div>
                        </div>
                      </div>
                    </td>
                    <Td className={rankBy === "mean" ? "text-emerald2" : ""}>
                      {fmt.usd(o.meanTerminalWealth)}
                    </Td>
                    <Td className={rankBy === "median" ? "text-emerald2" : ""}>
                      {fmt.usd(o.medianTerminalWealth)}
                    </Td>
                    <Td>
                      <span className={rankBy === "p10" ? "text-emerald2" : "text-ink-400"}>
                        {fmt.compactUsd(o.p10TerminalWealth)} – {fmt.compactUsd(o.p90TerminalWealth)}
                      </span>
                    </Td>
                    <Td>{fmt.usd(o.totalTaxes)}</Td>
                    <Td className={o.peakAmt > 0 ? "text-amber2" : "text-ink-400"}>
                      {o.peakAmt > 0 ? fmt.usd(o.peakAmt) : "—"}
                    </Td>
                    <Td>{fmt.pct(o.peakConcentrationPct)}</Td>
                    <Td>{fmt.pct(o.goalProbability)}</Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {headlineCards(evaluation, sorted).map(({ o, badge, badgeTone }) => {
          const meta = STRATEGY_LIBRARY.find((s) => s.id === o.strategyId)!;
          return (
            <div key={`${o.strategyId}-${badge}`} className="card-pad">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider text-ink-400">{meta.shortName}</div>
                  <div className="text-base font-semibold text-ink-50 mt-0.5">{meta.name}</div>
                </div>
                <span
                  className={`pill !border ${
                    badgeTone === "emerald"
                      ? "!text-emerald2 !border-emerald2/40"
                      : "!text-amber2 !border-amber2/40"
                  }`}
                >
                  {badgeTone === "emerald" ? <Check className="h-3 w-3" /> : null}
                  {badge}
                </span>
              </div>
              <p className="text-sm text-ink-300 mt-3 leading-relaxed">{meta.description}</p>
              <div className="grid grid-cols-3 gap-3 mt-4">
                <Mini label="Mean wealth" value={fmt.compactUsd(o.meanTerminalWealth)} />
                <Mini label="Median wealth" value={fmt.compactUsd(o.medianTerminalWealth)} />
                <Mini label="Peak conc." value={fmt.pct(o.peakConcentrationPct)} />
              </div>
              <div className="text-[11px] text-ink-500 mt-3 italic">Best for: {meta.bestFor}</div>
            </div>
          );
        })}
      </section>
    </div>
  );
}

type HeadlineCard = { o: StrategyOutcome; badge: string; badgeTone: "emerald" | "amber" };

function headlineCards(
  evaluation: EvaluationResult,
  sorted: StrategyOutcome[],
): HeadlineCard[] {
  const cards: HeadlineCard[] = [];
  const rec = sorted.find((o) => o.strategyId === evaluation.recommendedId);
  if (rec) cards.push({ o: rec, badge: "Best on metric", badgeTone: "emerald" });
  if (evaluation.ceilingFriendlyId) {
    const cf = sorted.find((o) => o.strategyId === evaluation.ceilingFriendlyId);
    if (cf) cards.push({ o: cf, badge: "Best under ceiling", badgeTone: "amber" });
  } else {
    // Fall back to the runner-up so we always show two cards
    const runnerUp = sorted.find((o) => o.strategyId !== evaluation.recommendedId);
    if (runnerUp) cards.push({ o: runnerUp, badge: "Runner-up", badgeTone: "emerald" });
  }
  return cards;
}

function Th({ children, align, active }: { children: React.ReactNode; align?: "right"; active?: boolean }) {
  return (
    <th className={`px-4 py-2.5 text-[11px] uppercase tracking-wider font-medium ${align === "right" ? "text-right" : ""} ${active ? "text-emerald2" : "text-ink-400"}`}>
      {children}
    </th>
  );
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 text-right tabular-nums text-ink-100 ${className ?? ""}`}>{children}</td>;
}
function Mini({ label, value, mono = true, small }: { label: string; value: string; mono?: boolean; small?: boolean }) {
  return (
    <div className="rounded-lg bg-ink-900/60 border border-ink-800/70 px-3 py-2">
      <div className="kpi">{label}</div>
      <div className={`mt-1 text-ink-100 ${mono ? "font-mono tabular-nums" : ""} ${small ? "text-xs" : "text-sm font-semibold"}`}>
        {value}
      </div>
    </div>
  );
}
