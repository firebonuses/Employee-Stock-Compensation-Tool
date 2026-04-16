import type { PropsWithChildren } from "react";
import type { RouteId } from "../App";
import { useStore } from "../store/useStore";
import { fmt } from "../utils/format";
import { Compass, LayoutDashboard, User, Briefcase, GitCompare, ListChecks, Info, RotateCcw } from "./icons";

interface NavItem {
  id: RouteId;
  label: string;
  Icon: (p: { className?: string }) => JSX.Element;
}

const NAV: NavItem[] = [
  { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { id: "profile", label: "Profile", Icon: User },
  { id: "grants", label: "Equity grants", Icon: Briefcase },
  { id: "scenarios", label: "Scenarios", Icon: GitCompare },
  { id: "plan", label: "Action plan", Icon: ListChecks },
  { id: "about", label: "About & methodology", Icon: Info },
];

interface Props extends PropsWithChildren {
  route: RouteId;
  setRoute: (r: RouteId) => void;
}

export function Layout({ route, setRoute, children }: Props) {
  const company = useStore((s) => s.company);
  const updatedAt = useStore((s) => s.updatedAt);
  const reset = useStore((s) => s.resetAll);

  return (
    <div className="min-h-screen flex">
      <aside className="hidden lg:flex w-72 shrink-0 flex-col border-r border-ink-800/70 bg-ink-950/70 backdrop-blur-md">
        <div className="px-5 py-5 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-accent to-emerald2 flex items-center justify-center shadow-glow">
            <Compass className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight">Equity Compass</div>
            <div className="text-[11px] text-ink-400">Stock-comp planning, decoded</div>
          </div>
        </div>
        <div className="px-3 mt-1">
          <div className="card-pad py-3">
            <div className="kpi mb-1">Company</div>
            <div className="font-semibold text-ink-50">{company.companyName}</div>
            <div className="text-xs text-ink-400 flex items-center gap-2 mt-0.5">
              <span className="font-mono tabular-nums">{company.ticker}</span>
              <span>·</span>
              <span className="font-mono tabular-nums">{fmt.usd2(company.currentPrice)}</span>
              <span className={`pill !py-0 !px-1.5 ${company.isPublic ? "text-emerald2" : "text-amber2"}`}>
                {company.isPublic ? "Public" : "Private"}
              </span>
            </div>
          </div>
        </div>
        <nav className="mt-4 px-3 flex-1 space-y-0.5">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setRoute(n.id)}
              className={`nav-link w-full text-left ${route === n.id ? "nav-link-active" : ""}`}
            >
              <n.Icon className="h-4 w-4 opacity-80" />
              <span>{n.label}</span>
            </button>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-ink-800/70">
          <div className="text-[11px] text-ink-500 mb-2">
            Updated {new Date(updatedAt).toLocaleString()}
          </div>
          <button
            onClick={() => {
              if (confirm("Reset all inputs to the demo dataset? Your current data will be lost.")) reset();
            }}
            className="btn-ghost w-full text-xs"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset to demo data
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-20 border-b border-ink-800/60 bg-ink-950/80 backdrop-blur-md">
          <div className="px-6 lg:px-10 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Compass className="h-4 w-4 text-accent lg:hidden" />
              <div className="font-medium text-ink-200">
                {NAV.find((n) => n.id === route)?.label}
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 text-xs text-ink-400">
              <span className="pill">Educational tool · not tax advice</span>
            </div>
          </div>
          {/* Mobile nav */}
          <div className="lg:hidden border-t border-ink-800/60 overflow-x-auto">
            <div className="flex gap-1 px-3 py-2">
              {NAV.map((n) => (
                <button
                  key={n.id}
                  onClick={() => setRoute(n.id)}
                  className={`nav-link whitespace-nowrap ${route === n.id ? "nav-link-active" : ""}`}
                >
                  <n.Icon className="h-4 w-4 opacity-80" />
                  <span>{n.label}</span>
                </button>
              ))}
            </div>
          </div>
        </header>
        <main className="px-6 lg:px-10 py-8 max-w-[1400px] animate-fadeIn">
          {children}
        </main>
        <footer className="px-6 lg:px-10 py-8 text-center text-[11px] text-ink-500">
          Equity Compass · v1 · Built for clarity, not fortunetelling. Always consult a CPA before
          executing material exercises or sales.
        </footer>
      </div>
    </div>
  );
}
