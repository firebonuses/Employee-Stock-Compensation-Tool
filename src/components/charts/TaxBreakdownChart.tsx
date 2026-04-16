import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { YearlyTaxBreakdown } from "../../engine/types";
import { fmt } from "../../utils/format";

interface Props {
  breakdown?: YearlyTaxBreakdown;
}

const PALETTE = ["#7c5cff", "#9a82ff", "#22c39a", "#f5a524", "#ef4f6c"];

export function TaxBreakdownChart({ breakdown }: Props) {
  if (!breakdown) {
    return <div className="h-[220px] flex items-center justify-center text-ink-400 text-sm">No data</div>;
  }
  const data = [
    { name: "Federal regular", value: breakdown.federalRegular },
    { name: "AMT add-on", value: breakdown.federalAmt },
    { name: "NIIT 3.8%", value: breakdown.niit },
    { name: "State", value: breakdown.stateTax },
  ].filter((d) => d.value > 0);

  return (
    <div className="h-[220px] -ml-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 12, bottom: 0, left: 12 }}>
          <XAxis type="number" tickFormatter={(v) => fmt.compactUsd(v)} stroke="#5b6577" axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" stroke="#dde2ea" axisLine={false} tickLine={false} width={120} />
          <Tooltip formatter={(v: number) => fmt.usd(v)} />
          <Bar dataKey="value" radius={[6, 6, 6, 6]}>
            {data.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
