import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { RankMetric, StrategyOutcome } from "../../engine/types";
import { STRATEGY_LIBRARY } from "../../engine/types";
import { fmt } from "../../utils/format";

interface Props {
  outcomes: StrategyOutcome[];
  recommendedId: string;
  metric?: RankMetric;
}

export function StrategyWealthBars({ outcomes, recommendedId, metric = "median" }: Props) {
  const key = metric === "mean" ? "mean" : metric === "p10" ? "p10" : "median";
  const keyLabel = metric === "mean" ? "Mean" : metric === "p10" ? "P10" : "Median";
  const data = outcomes.map((o) => {
    const meta = STRATEGY_LIBRARY.find((s) => s.id === o.strategyId)!;
    return {
      name: meta.shortName,
      median: o.medianTerminalWealth,
      mean: o.meanTerminalWealth,
      p10: o.p10TerminalWealth,
      p90: o.p90TerminalWealth,
      id: o.strategyId,
    };
  });
  return (
    <div className="h-[280px] -ml-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 12 }}>
          <XAxis dataKey="name" stroke="#8a94a6" axisLine={false} tickLine={false} interval={0} angle={-12} dy={8} height={50} />
          <YAxis tickFormatter={(v) => fmt.compactUsd(v)} stroke="#5b6577" axisLine={false} tickLine={false} />
          <Tooltip formatter={(v: number) => [fmt.usd(v), keyLabel]} />
          <Bar dataKey={key} radius={[8, 8, 0, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.id === recommendedId ? "#22c39a" : "#7c5cff"} fillOpacity={d.id === recommendedId ? 1 : 0.7} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
