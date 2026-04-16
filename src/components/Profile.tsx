import { useStore } from "../store/useStore";
import { STATE_TAXES } from "../engine/tax/brackets";
import type { FilingStatus } from "../engine/types";

const filingLabels: Record<FilingStatus, string> = {
  single: "Single",
  mfj: "Married filing jointly",
  mfs: "Married filing separately",
  hoh: "Head of household",
};

export function Profile() {
  const profile = useStore((s) => s.profile);
  const company = useStore((s) => s.company);
  const horizon = useStore((s) => s.horizonYears);
  const setProfile = useStore((s) => s.setProfile);
  const setCompany = useStore((s) => s.setCompany);
  const setHorizon = useStore((s) => s.setHorizon);

  return (
    <div className="space-y-6 max-w-5xl">
      <header>
        <h1 className="text-xl font-semibold text-ink-50">Profile & assumptions</h1>
        <p className="text-sm text-ink-400 mt-1">
          The accuracy of every output below depends on these inputs. Take five minutes to set them carefully.
        </p>
      </header>

      <section className="card-pad">
        <SectionTitle title="Personal & filing" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Filing status">
            <select
              className="input"
              value={profile.filingStatus}
              onChange={(e) => setProfile({ filingStatus: e.target.value as FilingStatus })}
            >
              {Object.entries(filingLabels).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </Field>
          <Field label="State of residence">
            <select
              className="input"
              value={profile.state}
              onChange={(e) => setProfile({ state: e.target.value })}
            >
              {STATE_TAXES.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Age">
            <NumInput value={profile.age} onChange={(v) => setProfile({ age: v })} />
          </Field>
        </div>
      </section>

      <section className="card-pad">
        <SectionTitle title="Income & taxes" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="W-2 wages (excluding equity)" hint="You + spouse for MFJ">
            <NumInput value={profile.wages} onChange={(v) => setProfile({ wages: v })} prefix="$" />
          </Field>
          <Field label="Other ordinary income" hint="Interest, non-qual dividends">
            <NumInput value={profile.otherOrdinaryIncome} onChange={(v) => setProfile({ otherOrdinaryIncome: v })} prefix="$" />
          </Field>
          <Field label="Qualified div + LTCG (non-equity)">
            <NumInput value={profile.qualifiedInvestmentIncome} onChange={(v) => setProfile({ qualifiedInvestmentIncome: v })} prefix="$" />
          </Field>
          <Field label="Itemized deductions" hint="Use 0 for standard">
            <NumInput value={profile.itemizedDeductions} onChange={(v) => setProfile({ itemizedDeductions: v })} prefix="$" />
          </Field>
          <Field label="Outside net worth" hint="Assets excluding employer stock">
            <NumInput value={profile.outsideNetWorth} onChange={(v) => setProfile({ outsideNetWorth: v })} prefix="$" />
          </Field>
          <Field label="Months of cash reserves">
            <NumInput value={profile.monthsOfReserves} onChange={(v) => setProfile({ monthsOfReserves: v })} />
          </Field>
        </div>
      </section>

      <section className="card-pad">
        <SectionTitle title="Risk preferences" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label={`Risk tolerance (${profile.riskTolerance}/10)`} hint="1 = capital preservation, 10 = aggressive">
            <input
              type="range"
              min={1}
              max={10}
              value={profile.riskTolerance}
              onChange={(e) => setProfile({ riskTolerance: Number(e.target.value) })}
              className="w-full accent-accent"
            />
          </Field>
          <Field label={`Concentration ceiling (${profile.maxConcentrationPct}% of NW)`}
                 hint="Maximum % of total net worth you'll keep in employer stock">
            <input
              type="range"
              min={5}
              max={75}
              value={profile.maxConcentrationPct}
              onChange={(e) => setProfile({ maxConcentrationPct: Number(e.target.value) })}
              className="w-full accent-accent"
            />
          </Field>
        </div>
      </section>

      <section className="card-pad">
        <SectionTitle title="Company & market" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Company name">
            <input
              className="input"
              value={company.companyName}
              onChange={(e) => setCompany({ companyName: e.target.value })}
            />
          </Field>
          <Field label="Ticker">
            <input
              className="input"
              value={company.ticker}
              onChange={(e) => setCompany({ ticker: e.target.value.toUpperCase() })}
            />
          </Field>
          <Field label="Public/private">
            <select
              className="input"
              value={company.isPublic ? "y" : "n"}
              onChange={(e) => setCompany({ isPublic: e.target.value === "y" })}
            >
              <option value="y">Public</option>
              <option value="n">Private</option>
            </select>
          </Field>
          <Field label={company.isPublic ? "Current share price" : "Most recent 409A / preferred"}>
            <NumInput value={company.currentPrice} onChange={(v) => setCompany({ currentPrice: v })} prefix="$" step={0.01} />
          </Field>
          <Field label="Expected annual return (μ)" hint="Forward-looking, after dilution">
            <PctInput value={company.expectedAnnualReturn} onChange={(v) => setCompany({ expectedAnnualReturn: v })} />
          </Field>
          <Field label="Annual volatility (σ)" hint="Single names: 35–70% typical">
            <PctInput value={company.annualVolatility} onChange={(v) => setCompany({ annualVolatility: v })} />
          </Field>
          <Field label={`Planning horizon (${horizon} years)`}>
            <input
              type="range"
              min={1}
              max={15}
              value={horizon}
              onChange={(e) => setHorizon(Number(e.target.value))}
              className="w-full accent-accent"
            />
          </Field>
        </div>
      </section>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <h2 className="text-sm font-semibold text-ink-50 tracking-wide uppercase">{title}</h2>
      <div className="flex-1 divider" />
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {hint && <div className="text-[11px] text-ink-500 mt-1">{hint}</div>}
    </div>
  );
}

function NumInput({ value, onChange, prefix, step }: { value: number; onChange: (v: number) => void; prefix?: string; step?: number }) {
  return (
    <div className="relative">
      {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500 text-sm">{prefix}</span>}
      <input
        type="number"
        className={`input font-mono tabular-nums ${prefix ? "pl-6" : ""}`}
        value={Number.isFinite(value) ? value : 0}
        step={step ?? 1}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
    </div>
  );
}

function PctInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="relative">
      <input
        type="number"
        className="input font-mono tabular-nums pr-7"
        value={Number((value * 100).toFixed(2))}
        step={0.5}
        onChange={(e) => onChange((Number(e.target.value) || 0) / 100)}
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 text-sm">%</span>
    </div>
  );
}
