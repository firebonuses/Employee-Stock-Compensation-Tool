import { useEffect, useMemo, useState } from "react";
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import { Profile } from "./components/Profile";
import { Grants } from "./components/Grants";
import { Scenarios } from "./components/Scenarios";
import { ActionPlan } from "./components/ActionPlan";
import { About } from "./components/About";
import { useStore, selectAppState } from "./store/useStore";
import { evaluateAll, type EvaluationResult } from "./engine/strategies";

export type RouteId = "dashboard" | "profile" | "grants" | "scenarios" | "plan" | "about";

export default function App() {
  const [route, setRoute] = useState<RouteId>(() => {
    const hash = window.location.hash.slice(1);
    return (["dashboard", "profile", "grants", "scenarios", "plan", "about"] as const).includes(
      hash as RouteId,
    )
      ? (hash as RouteId)
      : "dashboard";
  });

  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash.slice(1) as RouteId;
      if (["dashboard", "profile", "grants", "scenarios", "plan", "about"].includes(h))
        setRoute(h);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const state = useStore(selectAppState);

  // Evaluate strategies whenever inputs change. Memoize to avoid
  // re-running the (somewhat expensive) Monte Carlo on every render.
  const evaluation: EvaluationResult = useMemo(
    () => evaluateAll(state, { paths: 1500 }),
    // Re-run when any input changes (use updatedAt as a coalesced key).
    [state.updatedAt, state.grants.length, state.horizonYears, state.company.currentPrice,
     state.company.expectedAnnualReturn, state.company.annualVolatility,
     state.profile.wages, state.profile.state, state.profile.filingStatus],
  );

  return (
    <Layout route={route} setRoute={(r) => { window.location.hash = r; setRoute(r); }}>
      {route === "dashboard" && <Dashboard evaluation={evaluation} />}
      {route === "profile" && <Profile />}
      {route === "grants" && <Grants />}
      {route === "scenarios" && <Scenarios evaluation={evaluation} />}
      {route === "plan" && <ActionPlan evaluation={evaluation} />}
      {route === "about" && <About />}
    </Layout>
  );
}
