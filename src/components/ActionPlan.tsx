import { useMemo } from "react";
import type { EvaluationResult } from "../engine/strategies";
import { STRATEGY_LIBRARY, type ActionItem } from "../engine/types";
import { useStore } from "../store/useStore";
import { fmt } from "../utils/format";
import { Calendar, Check, Sparkle, TriangleAlert } from "./icons";

interface Props {
  evaluation: EvaluationResult;
}

export function ActionPlan({ evaluation }: Props) {
  const grants = useStore((s) => s.grants);
  const rec = evaluation.outcomes.find((o) => o.strategyId === evaluation.recommendedId)!;
  const meta = STRATEGY_LIBRARY.find((s) => s.id === evaluation.recommendedId)!;

  const grouped = useMemo(() => groupByYear(rec.actions), [rec.actions]);

  return (
    <div className="space-y-6 max-w-5xl">
      <header>
        <h1 className="text-xl font-semibold text-ink-50">Recommended action plan</h1>
        <p className="text-sm text-ink-400 mt-1">
          A concrete calendar of moves under <span className="text-ink-100 font-medium">{meta.name}</span>.
          Treat this as a starting point; always confirm tax impact with a CPA before executing.
        </p>
      </header>

      <section className="card-pad bg-gradient-to-br from-accent/10 to-emerald2/5 border-accent/30">
        <div className="flex items-start gap-4">
          <Sparkle className="h-5 w-5 text-accent-400 mt-0.5" />
          <div className="flex-1">
            <div className="text-sm font-semibold text-ink-100">{meta.name}</div>
            <div className="text-xs text-ink-400 mt-1">{meta.description}</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              <Mini label="Median wealth" value={fmt.usd(rec.medianTerminalWealth)} />
              <Mini label="Tax over horizon" value={fmt.usd(rec.totalTaxes)} />
              <Mini label="Peak AMT" value={rec.peakAmt > 0 ? fmt.usd(rec.peakAmt) : "—"} />
              <Mini label="Goal probability" value={fmt.pct(rec.goalProbability)} />
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        {Object.entries(grouped).length === 0 && (
          <div className="card-pad text-center text-ink-400">
            No actions required this horizon — your status quo aligns with the recommended strategy.
          </div>
        )}
        {Object.entries(grouped).map(([year, items]) => (
          <div key={year} className="card-pad">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-accent-400" />
              <h3 className="text-base font-semibold text-ink-50">{year}</h3>
              <span className="pill">{items.length} action{items.length === 1 ? "" : "s"}</span>
            </div>
            <ul className="divide-y divide-ink-800/70">
              {items.map((a, i) => (
                <li key={i} className="py-3 flex items-start gap-3">
                  <ActionDot action={a.action} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-ink-100">
                      <span className="font-medium capitalize">{a.action}</span>{" "}
                      <span className="font-mono tabular-nums">{fmt.num(a.shares)}</span> shares
                      {a.grantId && (
                        <span className="text-ink-400">
                          {" — "}{grants.find((g) => g.id === a.grantId)?.label ?? a.grantId}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-ink-400 mt-0.5">{a.rationale}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[11px] text-ink-500">{a.date}</div>
                    {a.estimatedProceeds !== undefined && (
                      <div className="text-xs font-mono text-ink-100">{fmt.usd(a.estimatedProceeds)}</div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="card-pad">
        <div className="text-sm font-semibold text-ink-100 mb-3 flex items-center gap-2">
          <TriangleAlert className="h-4 w-4 text-amber2" />
          Triggers to revisit this plan
        </div>
        <ul className="text-sm text-ink-300 space-y-2 pl-1">
          <Li>Stock moves ±25% from your assumed price.</Li>
          <Li>You change jobs, get married, divorce, or relocate to a new tax state.</Li>
          <Li>Company announces an IPO, acquisition, secondary, or tender offer.</Li>
          <Li>Your wages or filing status change materially within a tax year.</Li>
          <Li>Year-end approaches and you have unused AMT headroom.</Li>
        </ul>
      </section>
    </div>
  );
}

function ActionDot({ action }: { action: ActionItem["action"] }) {
  const cls = {
    exercise: "bg-accent",
    sell: "bg-emerald2",
    hold: "bg-ink-500",
    withhold: "bg-amber2",
  }[action];
  return <span className={`mt-1 h-2.5 w-2.5 rounded-full ${cls} shadow-glow`} />;
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-ink-900/60 border border-ink-800/70 px-3 py-2">
      <div className="kpi">{label}</div>
      <div className="mt-1 text-ink-100 font-mono tabular-nums text-sm font-semibold">{value}</div>
    </div>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <Check className="h-3.5 w-3.5 text-emerald2 mt-0.5 shrink-0" />
      <span>{children}</span>
    </li>
  );
}

function groupByYear(actions: ActionItem[]): Record<string, ActionItem[]> {
  const out: Record<string, ActionItem[]> = {};
  for (const a of actions) {
    const yr = a.date.slice(0, 4);
    (out[yr] ||= []).push(a);
  }
  // Sort years asc and items within years asc.
  return Object.fromEntries(
    Object.entries(out)
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([k, v]) => [k, v.sort((a, b) => (a.date < b.date ? -1 : 1))]),
  );
}
