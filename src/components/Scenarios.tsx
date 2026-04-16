import type { EvaluationResult } from "../engine/strategies";
import { STRATEGY_LIBRARY } from "../engine/types";
import { fmt } from "../utils/format";
import { StrategyWealthBars } from "./charts/StrategyBars";
import { Check, Sparkle } from "./icons";

interface Props {
  evaluation: EvaluationResult;
}

export function Scenarios({ evaluation }: Props) {
  const sorted = evaluation.outcomes.slice().sort((a, b) => b.medianTerminalWealth - a.medianTerminalWealth);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-ink-50">Scenario comparison</h1>
        <p className="text-sm text-ink-400 mt-1">
          Six strategies, modeled side-by-side. Median wealth uses your expected return; the 10th–90th
          range comes from {fmt.num(1500)} Monte Carlo paths.
        </p>
      </header>

      <section className="card-pad">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold text-ink-100">Median terminal wealth, by strategy</div>
          <div className="text-xs text-ink-400">Higher is better</div>
        </div>
        <StrategyWealthBars outcomes={sorted} recommendedId={evaluation.recommendedId} />
      </section>

      <section className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm table-mono">
            <thead className="bg-ink-900/60 border-b border-ink-800/70">
              <tr className="text-left">
                <Th>Strategy</Th>
                <Th align="right">Median wealth</Th>
                <Th align="right">10th–90th</Th>
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
                return (
                  <tr key={o.strategyId} className={recommended ? "bg-emerald2/5" : "hover:bg-ink-800/30"}>
                    <td className="px-4 py-3 font-sans">
                      <div className="flex items-center gap-2">
                        {recommended && (
                          <span className="inline-flex items-center gap-1 text-emerald2 text-[10px] uppercase tracking-wider">
                            <Sparkle className="h-3 w-3" /> Recommended
                          </span>
                        )}
                        <div>
                          <div className="text-ink-50 font-medium">{meta.name}</div>
                          <div className="text-xs text-ink-400 font-sans">{meta.description}</div>
                        </div>
                      </div>
                    </td>
                    <Td>{fmt.usd(o.medianTerminalWealth)}</Td>
                    <Td>
                      <span className="text-ink-400">
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
        {sorted.slice(0, 2).map((o) => {
          const meta = STRATEGY_LIBRARY.find((s) => s.id === o.strategyId)!;
          return (
            <div key={o.strategyId} className="card-pad">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider text-ink-400">{meta.shortName}</div>
                  <div className="text-base font-semibold text-ink-50 mt-0.5">{meta.name}</div>
                </div>
                {o.strategyId === evaluation.recommendedId && (
                  <span className="pill !text-emerald2 !border-emerald2/40">
                    <Check className="h-3 w-3" /> Recommended
                  </span>
                )}
              </div>
              <p className="text-sm text-ink-300 mt-3 leading-relaxed">{meta.description}</p>
              <div className="grid grid-cols-3 gap-3 mt-4">
                <Mini label="Median wealth" value={fmt.compactUsd(o.medianTerminalWealth)} />
                <Mini label="Tax (horizon)" value={fmt.compactUsd(o.totalTaxes)} />
                <Mini label="Best for" value={meta.bestFor} mono={false} small />
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}

function Th({ children, align }: { children: React.ReactNode; align?: "right" }) {
  return (
    <th className={`px-4 py-2.5 text-[11px] uppercase tracking-wider text-ink-400 font-medium ${align === "right" ? "text-right" : ""}`}>
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
