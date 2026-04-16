import { Area, ResponsiveContainer, Tooltip, XAxis, YAxis, Line, ComposedChart } from "recharts";
import type { PathResult } from "../../engine/simulation/monteCarlo";
import { fmt } from "../../utils/format";

interface Props {
  fan: PathResult;
}

export function PriceFanChart({ fan }: Props) {
  const data = fan.t.map((t, i) => ({
    t: Number(t.toFixed(2)),
    p10: fan.p10[i],
    p25: fan.p25[i],
    p50: fan.p50[i],
    p75: fan.p75[i],
    p90: fan.p90[i],
    band1090Lo: fan.p10[i],
    band1090Hi: fan.p90[i] - fan.p10[i],
    band2575Lo: fan.p25[i],
    band2575Hi: fan.p75[i] - fan.p25[i],
  }));

  return (
    <div className="h-[260px] -ml-2">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 12, bottom: 0, left: 12 }}>
          <defs>
            <linearGradient id="band90" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7c5cff" stopOpacity={0.18} />
              <stop offset="100%" stopColor="#7c5cff" stopOpacity={0.04} />
            </linearGradient>
            <linearGradient id="band75" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#9a82ff" stopOpacity={0.32} />
              <stop offset="100%" stopColor="#9a82ff" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="t"
            tickFormatter={(v) => `${v.toFixed(0)}y`}
            stroke="#5b6577"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#5b6577"
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => fmt.compactUsd(v)}
            width={50}
          />
          <Tooltip
            formatter={(v: number, name: string) => {
              if (["band1090Lo", "band1090Hi", "band2575Lo", "band2575Hi"].includes(name)) return [];
              const map: Record<string, string> = {
                p10: "10th",
                p25: "25th",
                p50: "median",
                p75: "75th",
                p90: "90th",
              };
              return [fmt.usd2(v), map[name] ?? name];
            }}
            labelFormatter={(t) => `Year ${Number(t).toFixed(2)}`}
          />
          {/* 10–90 band as stacked area: lo (transparent) + (hi-lo) (filled). */}
          <Area
            type="monotone"
            dataKey="band1090Lo"
            stackId="b1090"
            stroke="none"
            fill="transparent"
          />
          <Area
            type="monotone"
            dataKey="band1090Hi"
            stackId="b1090"
            stroke="none"
            fill="url(#band90)"
          />
          <Area
            type="monotone"
            dataKey="band2575Lo"
            stackId="b2575"
            stroke="none"
            fill="transparent"
          />
          <Area
            type="monotone"
            dataKey="band2575Hi"
            stackId="b2575"
            stroke="none"
            fill="url(#band75)"
          />
          <Line
            type="monotone"
            dataKey="p50"
            stroke="#9a82ff"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
