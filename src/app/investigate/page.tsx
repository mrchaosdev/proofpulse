import type { Metadata } from "next";
import { InvestigationForm } from "@/features/investigation/components/InvestigationForm";
import { describeFixture } from "@/server/fixtures/fixture-loader";

export const metadata: Metadata = {
  title: "Investigate",
  description:
    "Choose a chain, token address, and timeframe to run an evidence-first investigation.",
};

/** Empty workspace and scope input (04-information-architecture). */
export default function InvestigatePage() {
  const fixture = describeFixture();

  return (
    <div className="page-region stack">
      <h1>Start an investigation</h1>
      <p>
        ProofPulse separates observed flow direction, evidence confidence, and
        wallet coordination risk. It does not predict price and gives no trading
        advice.
      </p>

      <div className="card">
        <InvestigationForm />
      </div>

      <section className="stack">
        <h2>Or open the deterministic demo</h2>
        <p>
          A timestamped capture of real Nansen responses, replayed through the
          same normalization and scoring as live data. It spends no credits and
          stays labelled as a fixture throughout.
        </p>
        <p>
          <a
            className="button"
            data-variant="secondary"
            href={`/investigate/${fixture.chain}/${fixture.tokenAddress}?timeframe=${fixture.timeframe}&mode=fixture`}
          >
            Open {fixture.tokenSymbol} fixture from{" "}
            {fixture.capturedAt.slice(0, 10)}
          </a>
        </p>
      </section>
    </div>
  );
}
