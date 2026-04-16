import { useMemo } from "react";
import { useStore, selectAppState } from "../store/useStore";
import { totalEquityValue, vestedEquityValue, vestEvents } from "../engine/equity";
import { fmt } from "../utils/format";
import type { EvaluationResult } from "../engine/strategies";
import { STRATEGY_LIBRARY } from "../engine/types";
import { ConcentrationGauge } from "./charts/ConcentrationGauge";
import { PriceFanChart } from "./charts/PriceFanChart";
import { TaxBreakdownChart } from "./charts/TaxBreakdownChart";
import { ArrowDown, ArrowUp, Calendar, Sparkle, TriangleAlert } from "./icons";

interface Props {
  evaluation: EvaluationResult;
}

export function Dashboard({ evaluation }: Props) {
  const state = useStore(selectAppState);
  const today = new Date();

  const totals = useMemo(() => {
    const total = totalEquityValue(state.grants, state.company.currentPrice, today);
    const vested = vestedEquityValue(state.grants, state.company.currentPrice, today);
    const concentration =
      total / Math.max(1, total + state.profile.outsideNetWorth);
    return { total, vested, concentration };
  }, [state]);

  const upcomingVests = useMemo(() => {
    const horizonDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 18, today.getUTCDate()));
    const all = state.grants.flatMap((g) => vestEvents(g, today, horizonDate));
    return all.sort((a, b) => (a.date < b.date ? -1 : 1)).slice(0, 6);
  }, [state.grants]);

  const recommended = evaluation.outcomes.find((o) => o.strategyId === evaluation.recommendedId)!;
  const baseline = evaluation.outcomes.find((o) => o.strategyId === "hold")!;
  const wealthDelta = recommended.medianTerminalWealth - baseline.medianTerminalWealth;
  const taxDelta = baseline.totalTaxes - recommended.totalTaxes;

  return (
    <div className="space-y-8">
      {/* Hero KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Kpi
          label="Total equity value"
          value={fmt.usd(totals.total)}
          sub={`${fmt.usd(totals.vested)} vested`}
          accent="violet"
        />
        <Kpi
          label="% of net worth in employer"
          value={fmt.pct(totals.concentration)}
          sub={`Cap ${state.profile.maxConcentrationPct}%`}
          accent={totals.concentration > state.profile.maxConcentrationPct / 100 ? "red" : "emerald"}
          warn={totals.concentration > state.profile.maxConcentrationPct / 100}
        />
        <Kpi
          label="Recommended strategy"
          value={STRATEGY_LIBRARY.find((s) => s.id === evaluation.recommendedId)!.shortName}
          sub={`${fmt.pct(recommended.goalProbability)} chance of meeting goal`}
          accent="violet"
        />
        <Kpi
          label="Modeled lift vs. hold"
          value={fmt.usd(Math.max(0, wealthDelta))}
          sub={taxDelta > 0 ? `${fmt.usd(taxDelta)} less tax` : `${fmt.usd(-taxDelta)} more tax`}
          delta={wealthDelta >= 0 ? "up" : "down"}
          accent={wealthDelta >= 0 ? "emerald" : "amber"}
        />
      </section>

      {/* Recommendation banner */}
      <section className="card-pad bg-gradient-to-br from-accent/10 to-emerald2/5 border-accent/30">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
            <Sparkle className="h-5 w-5 text-accent-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-ink-400">Equity Compass recommends</div>
            <div className="text-xl font-semibold text-ink-50 mt-0.5">
              {STRATEGY_LIBRARY.find((s) => s.id === evaluation.recommendedId)!.name}
            </div>
            <div className="text-sm text-ink-300 mt-2 leading-relaxed">
              {STRATEGY_LIBRARY.find((s) => s.id === evaluation.recommendedId)!.description}{" "}
              Median modeled wealth at year {state.horizonYears}:{" "}
              <span className="font-mono text-ink-50">{fmt.usd(recommended.medianTerminalWealth)}</span>{" "}
              (10th–90th: {fmt.compactUsd(recommended.p10TerminalWealth)} – {fmt.compactUsd(recommended.p90TerminalWealth)}).
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <a href="#scenarios" className="btn-ghost text-xs">Compare all 6 strategies</a>
              <a href="#plan" className="btn-primary text-xs">View action plan</a>
            </div>
          </div>
        </div>
      </section>

      {/* Charts row */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card-pad lg:col-span-2">
          <div className="flex items-baseline justify-between mb-2">
            <div>
              <div className="text-sm font-semibold text-ink-100">Stock price scenarios</div>
              <div className="text-xs text-ink-400">
                Monte Carlo ({state.horizonYears}y, μ={fmt.pct(state.company.expectedAnnualReturn)},
                σ={fmt.pct(state.company.annualVolatility)})
              </div>
            </div>
            <div className="text-xs text-ink-400">
              P(loss at horizon): <span className="font-mono text-ink-200">{fmt.pct(evaluation.priceFan.probLossAtHorizon)}</span>
            </div>
          </div>
          <PriceFanChart fan={evaluation.priceFan} />
        </div>
        <div className="card-pad">
          <div className="text-sm font-semibold text-ink-100">Concentration risk</div>
          <div className="text-xs text-ink-400 mb-3">Now vs. policy ceiling</div>
          <ConcentrationGauge
            current={totals.concentration}
            ceiling={state.profile.maxConcentrationPct / 100}
          />
          <div className="mt-4 text-xs text-ink-400 leading-relaxed">
            {totals.concentration > state.profile.maxConcentrationPct / 100 ? (
              <span className="text-amber2 inline-flex items-center gap-1.5">
                <TriangleAlert className="h-3.5 w-3.5" />
                You're above your concentration ceiling. The recommended plan trims this over time.
              </span>
            ) : (
              <>You're within your self-set ceiling. Watch this gauge as new grants vest.</>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card-pad">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-semibold text-ink-100">This year's tax stack</div>
              <div className="text-xs text-ink-400">Under the recommended strategy</div>
            </div>
            <div className="text-xs text-ink-400">
              Eff. rate{" "}
              <span className="font-mono text-ink-200">
                {fmt.pct(recommended.yearly[0]?.effectiveRate ?? 0)}
              </span>
            </div>
          </div>
          <TaxBreakdownChart breakdown={recommended.yearly[0]} />
        </div>

        <div className="card-pad">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink-100 mb-1">
            <Calendar className="h-4 w-4" /> Upcoming vests
          </div>
          <div className="text-xs text-ink-400 mb-3">Next 18 months</div>
          {upcomingVests.length === 0 ? (
            <div className="text-sm text-ink-400 italic">Nothing vesting in this window.</div>
          ) : (
            <ul className="divide-y divide-ink-800/70">
              {upcomingVests.map((v, i) => (
                <li key={i} className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-ink-100">
                      {v.shares.toLocaleString()} shares · <span className="text-ink-400">{v.grantLabel}</span>
                    </div>
                    <div className="text-xs text-ink-500">{fmt.date(v.date)}</div>
                  </div>
                  <span className="pill">{v.type}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  accent = "violet",
  delta,
  warn,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "violet" | "emerald" | "red" | "amber";
  delta?: "up" | "down";
  warn?: boolean;
}) {
  const ring = {
    violet: "ring-accent/20",
    emerald: "ring-emerald2/30",
    red: "ring-crimson/30",
    amber: "ring-amber2/30",
  }[accent];
  const accentText = {
    violet: "text-accent-400",
    emerald: "text-emerald2",
    red: "text-crimson",
    amber: "text-amber2",
  }[accent];
  return (
    <div className={`card-pad ring-1 ring-inset ${ring}`}>
      <div className="kpi flex items-center gap-1.5">
        {warn && <TriangleAlert className={`h-3 w-3 ${accentText}`} />}
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <div className="text-2xl font-semibold tracking-tight text-ink-50 font-mono tabular-nums">
          {value}
        </div>
        {delta === "up" && <ArrowUp className="h-4 w-4 text-emerald2" />}
        {delta === "down" && <ArrowDown className="h-4 w-4 text-crimson" />}
      </div>
      {sub && <div className={`text-xs mt-1 ${accentText}`}>{sub}</div>}
    </div>
  );
}
