// =====================================================================
// Number, currency, and date formatters tuned for financial display.
// =====================================================================

const usdFmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const usdFmt2 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const compactUsd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

const pctFmt = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1,
});

const pctFmt0 = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 0,
});

const numFmt = new Intl.NumberFormat("en-US");

export const fmt = {
  usd: (n: number) => usdFmt.format(Math.round(n || 0)),
  usd2: (n: number) => usdFmt2.format(n || 0),
  compactUsd: (n: number) => compactUsd.format(n || 0),
  pct: (n: number) => pctFmt.format(n || 0),
  pct0: (n: number) => pctFmt0.format(n || 0),
  num: (n: number) => numFmt.format(Math.round(n || 0)),
  date: (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  },
  shortDate: (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  },
};

/** Tiny id generator for grants etc. */
export function rid(): string {
  return Math.random().toString(36).slice(2, 10);
}
