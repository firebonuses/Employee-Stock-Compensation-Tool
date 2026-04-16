import { useState } from "react";
import { useStore } from "../store/useStore";
import type { Grant, GrantType } from "../engine/types";
import { vestedShares, parseDate } from "../engine/equity";
import { fmt } from "../utils/format";
import { Plus, Trash } from "./icons";

const TYPE_INFO: Record<GrantType, { label: string; tint: string; help: string }> = {
  ISO: { label: "ISO", tint: "text-accent-400 bg-accent/10 border-accent/30", help: "Incentive stock option. AMT preference on exercise; LTCG if held 2yr from grant + 1yr from exercise." },
  NQSO: { label: "NQSO", tint: "text-amber2 bg-amber2/10 border-amber2/30", help: "Non-qualified option. Bargain element is ordinary income at exercise." },
  RSU: { label: "RSU", tint: "text-emerald2 bg-emerald2/10 border-emerald2/30", help: "Restricted stock unit. Ordinary income at vest = FMV × shares vested." },
  RSA: { label: "RSA", tint: "text-emerald2 bg-emerald2/10 border-emerald2/30", help: "Restricted stock award. With 83(b), tax at grant on (FMV − price) × shares." },
  ESPP: { label: "ESPP", tint: "text-accent-400 bg-accent/10 border-accent/30", help: "Employee stock purchase plan. Discount can be ordinary income; balance is gain." },
};

export function Grants() {
  const grants = useStore((s) => s.grants);
  const addGrant = useStore((s) => s.addGrant);
  const company = useStore((s) => s.company);
  const today = new Date();

  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-6 max-w-6xl">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink-50">Equity grants</h1>
          <p className="text-sm text-ink-400 mt-1">
            Add every option, RSU, RSA, and ESPP purchase you've received from {company.companyName}.
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            addGrant();
            // open the just-added grant
            setTimeout(() => {
              const next = useStore.getState().grants;
              setEditingId(next[next.length - 1].id);
            }, 0);
          }}
        >
          <Plus className="h-4 w-4" /> Add grant
        </button>
      </header>

      {grants.length === 0 ? (
        <div className="card-pad text-center py-12 text-ink-400">
          No grants yet. Click <span className="text-ink-100 font-medium">Add grant</span> to get started.
        </div>
      ) : (
        <div className="space-y-3">
          {grants.map((g) => (
            <GrantCard
              key={g.id}
              grant={g}
              price={company.currentPrice}
              today={today}
              isEditing={editingId === g.id}
              onToggleEdit={() => setEditingId(editingId === g.id ? null : g.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface CardProps {
  grant: Grant;
  price: number;
  today: Date;
  isEditing: boolean;
  onToggleEdit: () => void;
}

function GrantCard({ grant, price, today, isEditing, onToggleEdit }: CardProps) {
  const updateGrant = useStore((s) => s.updateGrant);
  const removeGrant = useStore((s) => s.removeGrant);
  const vested = vestedShares(grant, today);
  const intrinsic = grant.type === "ISO" || grant.type === "NQSO" ? Math.max(0, price - grant.strikePrice) : price;
  const value = vested * intrinsic;
  const tint = TYPE_INFO[grant.type].tint;

  return (
    <div className="card overflow-hidden">
      <button
        className="w-full text-left p-5 flex items-center gap-4 hover:bg-ink-800/30 transition"
        onClick={onToggleEdit}
      >
        <span className={`pill !text-xs !font-semibold border ${tint}`}>{grant.type}</span>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-ink-50 truncate">{grant.label}</div>
          <div className="text-xs text-ink-400 mt-0.5">
            {fmt.num(grant.shares)} shares
            {grant.strikePrice > 0 ? ` · strike $${grant.strikePrice}` : ""}
            {" · granted "}{fmt.shortDate(grant.grantDate)}
          </div>
        </div>
        <div className="hidden sm:block text-right">
          <div className="kpi">Vested</div>
          <div className="font-mono tabular-nums text-ink-100 text-sm">{fmt.num(vested)} / {fmt.num(grant.shares)}</div>
        </div>
        <div className="hidden md:block text-right">
          <div className="kpi">Intrinsic value</div>
          <div className="font-mono tabular-nums text-ink-100 text-sm">{fmt.usd(value)}</div>
        </div>
        <div className="text-ink-500 text-sm">{isEditing ? "−" : "+"}</div>
      </button>

      {isEditing && (
        <div className="border-t border-ink-800/70 p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Type">
            <select className="input" value={grant.type} onChange={(e) => updateGrant(grant.id, { type: e.target.value as GrantType })}>
              {Object.keys(TYPE_INFO).map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Label">
            <input className="input" value={grant.label} onChange={(e) => updateGrant(grant.id, { label: e.target.value })} />
          </Field>
          <Field label="Grant date">
            <input type="date" className="input" value={grant.grantDate} onChange={(e) => updateGrant(grant.id, { grantDate: e.target.value })} />
          </Field>
          <Field label="Total shares">
            <input type="number" className="input font-mono" value={grant.shares} onChange={(e) => updateGrant(grant.id, { shares: Number(e.target.value) || 0 })} />
          </Field>
          {(grant.type === "ISO" || grant.type === "NQSO" || grant.type === "ESPP") && (
            <Field label={grant.type === "ESPP" ? "Purchase price" : "Strike price"}>
              <input type="number" step="0.01" className="input font-mono" value={grant.strikePrice} onChange={(e) => updateGrant(grant.id, { strikePrice: Number(e.target.value) || 0 })} />
            </Field>
          )}
          <Field label="FMV at grant">
            <input type="number" step="0.01" className="input font-mono" value={grant.fmvAtGrant} onChange={(e) => updateGrant(grant.id, { fmvAtGrant: Number(e.target.value) || 0 })} />
          </Field>
          {(grant.type === "ISO" || grant.type === "NQSO") && (
            <Field label="Expiration date">
              <input type="date" className="input" value={grant.expirationDate ?? ""} onChange={(e) => updateGrant(grant.id, { expirationDate: e.target.value })} />
            </Field>
          )}
          {grant.type !== "ESPP" && (
            <>
              <Field label="Vesting (months)">
                <input type="number" className="input font-mono" value={grant.vesting?.totalMonths ?? 48}
                  onChange={(e) => updateGrant(grant.id, { vesting: { ...grant.vesting!, totalMonths: Number(e.target.value) || 48 } })} />
              </Field>
              <Field label="Cliff (months)">
                <input type="number" className="input font-mono" value={grant.vesting?.cliffMonths ?? 12}
                  onChange={(e) => updateGrant(grant.id, { vesting: { ...grant.vesting!, cliffMonths: Number(e.target.value) || 0 } })} />
              </Field>
              <Field label="Cadence">
                <select className="input" value={grant.vesting?.cadence ?? "monthly"}
                  onChange={(e) => updateGrant(grant.id, { vesting: { ...grant.vesting!, cadence: e.target.value as "monthly" | "quarterly" } })}>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                </select>
              </Field>
            </>
          )}
          {grant.type === "RSA" && (
            <Field label="83(b) election filed?">
              <select className="input" value={grant.election83b ? "y" : "n"} onChange={(e) => updateGrant(grant.id, { election83b: e.target.value === "y" })}>
                <option value="n">No</option>
                <option value="y">Yes</option>
              </select>
            </Field>
          )}
          {grant.type === "ESPP" && (
            <Field label="Discount %">
              <input type="number" step="0.5" className="input font-mono" value={(grant.esppDiscount ?? 0) * 100}
                onChange={(e) => updateGrant(grant.id, { esppDiscount: (Number(e.target.value) || 0) / 100 })} />
            </Field>
          )}

          <div className="md:col-span-3 flex items-center justify-between mt-2">
            <div className="text-xs text-ink-400">{TYPE_INFO[grant.type].help}</div>
            <button
              className="btn-danger"
              onClick={() => {
                if (confirm("Delete this grant?")) removeGrant(grant.id);
              }}
            >
              <Trash className="h-3.5 w-3.5" /> Delete
            </button>
          </div>

          {grant.expirationDate && parseDate(grant.expirationDate) < new Date(today.getTime() + 1000 * 60 * 60 * 24 * 365) && (
            <div className="md:col-span-3 rounded-lg bg-amber2/10 border border-amber2/30 text-amber2 text-xs px-3 py-2">
              Expires within 12 months. Plan exercise before forfeiture.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}
