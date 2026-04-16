export function About() {
  return (
    <div className="max-w-3xl space-y-8">
      <header>
        <h1 className="text-xl font-semibold text-ink-50">About & methodology</h1>
        <p className="text-sm text-ink-400 mt-1">
          What this tool does, how it computes, and what to verify before acting.
        </p>
      </header>

      <Section title="What this is">
        <p>
          Equity Compass models how the equity portion of your compensation could play out
          across a planning horizon under several established strategies — Hold, Sell-to-Cover,
          Same-Day Sale, Systematic Diversification, AMT-Optimized ISO Exercise, and Exercise &
          Hold for LTCG. It computes year-by-year tax (federal regular, AMT, NIIT, state),
          projects employer-stock concentration, and runs a Monte Carlo simulation of stock-price
          paths so you can see a range of outcomes — not just a single point estimate.
        </p>
      </Section>

      <Section title="Tax engine">
        <p>
          Federal brackets, standard deduction, AMT exemption, AMT rate break, LTCG brackets,
          NIIT thresholds, and the additional Medicare threshold are encoded as data
          (<code className="text-xs">src/engine/tax/brackets.ts</code>) using the most recently
          published IRS schedule. The AMT calculation applies the exemption and 25% phase-out,
          stacks LTCG on top of ordinary income (preferential rates preserved inside AMT), and
          surfaces an AMT "add-on" if tentative minimum tax exceeds regular tax.
        </p>
        <p>
          State tax uses each state's top marginal rate as a planning approximation; ten of the
          most relevant states (CA, NY, MA, WA, TX, FL, CO, IL, GA, NJ, OR, VA, NC, PA, TN, NV,
          DC) are included by default. Multi-state sourcing is not yet modeled.
        </p>
      </Section>

      <Section title="Monte Carlo">
        <p>
          Stock paths follow Geometric Brownian Motion:
          {" "}<code className="text-xs">S<sub>t+dt</sub> = S<sub>t</sub> · exp((μ − ½σ²)·dt + σ·√dt·Z)</code>.
          We simulate 1,500–2,000 paths at monthly resolution using a deterministic
          Mulberry32 PRNG (seed = 1337) so identical inputs always produce identical outputs.
          Percentile bands (10/25/50/75/90) are computed cross-sectionally at each timestep.
        </p>
      </Section>

      <Section title="Strategy evaluator">
        <p>
          For each strategy we walk all vest events between today and your horizon, generate the
          appropriate income (ordinary at vest for RSUs, bargain element for NQSO exercise,
          AMT preference for ISO exercise-and-hold, etc.), then call the tax engine year by year.
          Terminal wealth combines deterministic post-tax sale proceeds with the held portion
          valued at Monte Carlo terminal-price percentiles.
        </p>
      </Section>

      <Section title="What this is not">
        <p>
          This is an <strong>educational planning tool</strong>, not tax, legal, or investment
          advice. It does not consider every edge case (state AMT, ISO disqualifying disposition
          subtleties, QSBS §1202, multi-state sourcing, wash sales across accounts, foreign tax
          credits, NUA, etc.). The recommended strategy reflects modeled tradeoffs given your
          inputs, not a fiduciary recommendation.
        </p>
        <p>
          Before executing any material exercise or sale, validate the impact with a CPA and
          confirm trading is permitted under your company's insider-trading policy, blackout
          windows, and any 10b5-1 plan you have in place.
        </p>
      </Section>

      <Section title="Privacy">
        <p>
          All calculations run entirely in your browser. No data is sent to any server. Your
          inputs are stored only in your browser's <code className="text-xs">localStorage</code>{" "}
          under the key <code className="text-xs">equity-compass:v1</code>. To delete,
          clear site data or use "Reset to demo data" in the sidebar.
        </p>
      </Section>

      <Section title="Open source & accuracy">
        <p>
          The full source is auditable. Tax constants live in one file so you can review them
          against IRS publications. If you find an inaccuracy, please open an issue — accuracy
          on the tax engine is the single most important property of this tool.
        </p>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold text-ink-50 mb-3">{title}</h2>
      <div className="text-sm text-ink-300 leading-relaxed space-y-3">{children}</div>
    </section>
  );
}
