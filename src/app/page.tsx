import Link from "next/link";
import { listChainProfiles } from "@/domain/investigation/scope";
import { InvestigationForm } from "@/features/investigation/components/InvestigationForm";
import { describeFixture } from "@/server/fixtures/fixture-loader";

/**
 * Landing page (04-information-architecture).
 *
 * Every claim here describes behaviour that works today (02-product-rules 9.1),
 * and the hero renders without waiting for a visual effect or an API request.
 */
export default function LandingPage() {
  const chains = listChainProfiles();
  const fixture = describeFixture();

  return (
    <div className="page-region">
      <section className="hero">
        <div className="hero-copy">
          <h1 className="text-display">
            See who moved, why it matters, and what would break the thesis.
          </h1>
          <p className="hero-lead">
            A token starts moving and the explanation arrives late. ProofPulse
            turns Nansen cohort flows and wallet activity into one investigation
            that separates three questions instead of collapsing them into a
            verdict.
          </p>
          <ul className="boundary-list">
            <li>
              <strong>Direction</strong> — are observed flows leaning toward
              accumulation or distribution?
            </li>
            <li>
              <strong>Confidence</strong> — how complete and consistent is the
              evidence behind that reading?
            </li>
            <li>
              <strong>Coordination risk</strong> — is activity concentrated
              among a few dominant wallets?
            </li>
          </ul>
        </div>

        <div className="hero-panel">
          <h2>Investigate a token</h2>
          <InvestigationForm />
        </div>
      </section>

      <section className="section" aria-labelledby="example-heading">
        <h2 id="example-heading">See it on real captured data</h2>
        <p>
          A timestamped capture of live Nansen responses for{" "}
          {fixture.tokenSymbol}, replayed through exactly the same
          normalization, scoring, and interface as live mode. It spends no API
          credits and stays labelled as a fixture the whole way through.
        </p>
        <p>
          <Link
            className="button"
            data-variant="primary"
            href={`/investigate/${fixture.chain}/${fixture.tokenAddress}?timeframe=${fixture.timeframe}&mode=fixture`}
          >
            Open the {fixture.capturedAt.slice(0, 10)} capture
          </Link>
        </p>
      </section>

      <section className="section" aria-labelledby="how-heading">
        <h2 id="how-heading">How evidence becomes an answer</h2>
        <ol className="step-list">
          <li>
            <span className="step-name">Collect</span>
            Four Nansen datasets are requested in parallel: token context,
            cohort flows, top buyers, and top sellers. A failure in one never
            discards the others.
          </li>
          <li>
            <span className="step-name">Separate</span>
            Deterministic formulas produce three independent scores. Missing
            data stays missing, and a score with no usable input reports that it
            is unavailable rather than showing zero.
          </li>
          <li>
            <span className="step-name">Explain</span>
            Every score carries its component breakdown, and every conclusion
            resolves to an evidence row with its source and collection time.
          </li>
        </ol>
      </section>

      <section className="section" aria-labelledby="chains-heading">
        <h2 id="chains-heading">Supported scope</h2>
        <ul className="boundary-list">
          {chains.map((profile) => (
            <li key={profile.chain}>
              {profile.displayName} — timeframes{" "}
              <span className="identifier">
                {profile.timeframes.join(", ")}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-meta">
          Live investigations require a configured Nansen credential. Without
          one, the workspace runs in fixture mode and says so.
        </p>
      </section>

      <section className="section" aria-labelledby="boundaries-heading">
        <h2 id="boundaries-heading">What this does not do</h2>
        <ul className="boundary-list">
          <li>No trade execution, wallet connection, or custody.</li>
          <li>No price targets, return forecasts, or buy and sell commands.</li>
          <li>
            No claim that related wallets share an owner. A relationship is an
            observed link and nothing more.
          </li>
          <li>
            No hidden sources. Read the{" "}
            <Link href="/methodology">methodology</Link> for every formula and
            threshold.
          </li>
        </ul>
      </section>
    </div>
  );
}
