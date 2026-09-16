import Link from "next/link";
import {
  getChainProfile,
  listChainProfiles,
} from "@/domain/investigation/scope";
import { InvestigationForm } from "@/features/investigation/components/InvestigationForm";
import { describeFixture } from "@/server/fixtures/fixture-loader";
import { runInvestigation } from "@/server/investigations/investigation-service";
import { MemoryCacheStore } from "@/server/cache/cache-store";
import { SignalLens } from "@/features/investigation/components/SignalLens";

/**
 * Landing page (04-information-architecture).
 *
 * Every claim here describes behaviour that works today (02-product-rules 9.1),
 * and the hero renders without waiting for a visual effect or an API request.
 */
export default async function LandingPage() {
  const chains = listChainProfiles();
  const fixture = describeFixture();

  // The example is the real captured investigation, scored by the same code
  // that scores a live one. Nothing here is mocked up for display.
  const example = await runInvestigation(
    {
      chain: fixture.chain,
      tokenAddress: fixture.tokenAddress,
      timeframe: fixture.timeframe,
      mode: "fixture",
    },
    { cache: new MemoryCacheStore(), now: () => new Date() },
  );

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
        <h2 id="example-heading">A real investigation, not a mock-up</h2>
        <div className="example-split">
          <div className="stack">
            <p>
              This is {fixture.tokenSymbol} on{" "}
              {getChainProfile(fixture.chain).displayName}, captured from the
              live Nansen API on{" "}
              <span className="identifier">
                {fixture.capturedAt.slice(0, 10)}
              </span>{" "}
              and scored by exactly the code that scores a live investigation.
            </p>
            <p>
              Direction sits near zero while Confidence stays low: the cohorts
              disagree and the evidence is thin. A product that merged these
              into one number would have hidden that.
            </p>
            <p>
              <Link
                className="button"
                data-variant="primary"
                href={`/investigate/${fixture.chain}/${fixture.tokenAddress}?timeframe=${fixture.timeframe}&mode=fixture`}
              >
                Open the full investigation
              </Link>
            </p>
          </div>
          <div className="example-lens">
            <SignalLens scores={example.scores} />
          </div>
        </div>
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
