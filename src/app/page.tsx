import Link from "next/link";
import {
  getChainProfile,
  listChainProfiles,
} from "@/domain/investigation/scope";
import { SpotlightCard } from "@/components/effects/SpotlightCard";
import { InvestigationForm } from "@/features/investigation/components/InvestigationForm";
import { SignalLens } from "@/features/investigation/components/SignalLens";
import { MemoryCacheStore } from "@/server/cache/cache-store";
import { describeFixture } from "@/server/fixtures/fixture-loader";
import { runInvestigation } from "@/server/investigations/investigation-service";
import { Button } from "@/components/ui/button";

/**
 * Landing page. The example is a real captured investigation scored by the
 * same pipeline as live mode; the hero itself waits on no visual effect.
 */
export default async function LandingPage() {
  const chains = listChainProfiles();
  const fixture = describeFixture();
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
    <div className="page-region landing-page">
      <section className="hero">
        <div className="hero-copy">
          <p className="hero-eyebrow">
            <span className="hero-eyebrow-mark" aria-hidden="true" />
            Evidence-first onchain intelligence
          </p>
          <h1 className="text-display">
            See who moved.
            <span className="hero-accent">
              Know what the evidence can prove.
            </span>
          </h1>
          <p className="hero-lead">
            A token starts moving and the explanation arrives late. ProofPulse
            turns Nansen cohort flows and wallet activity into one traceable
            investigation, without collapsing uncertainty into a verdict.
          </p>
          <ul className="hero-signals">
            <li>
              <span className="hero-signal-index">01</span>
              <span>
                <strong>Direction</strong>
                Observed flow balance
              </span>
            </li>
            <li>
              <span className="hero-signal-index">02</span>
              <span>
                <strong>Confidence</strong>
                Evidence quality
              </span>
            </li>
            <li>
              <span className="hero-signal-index">03</span>
              <span>
                <strong>Coordination</strong>
                Wallet concentration
              </span>
            </li>
          </ul>
        </div>

        <SpotlightCard layout="form">
          <div className="hero-panel-heading">
            <div>
              <p className="section-kicker">Start with a contract</p>
              <h2>Investigate a token</h2>
            </div>
            <span className="hero-panel-badge">4 sources</span>
          </div>
          <InvestigationForm />
          <p className="hero-panel-note">
            Address validated before any paid request. Partial data remains
            visible and lowers confidence.
          </p>
        </SpotlightCard>
      </section>

      <section
        className="section proof-section"
        aria-labelledby="example-heading"
      >
        <div className="section-heading">
          <p className="section-kicker">Captured evidence</p>
          <h2 id="example-heading">A real investigation, not a mock-up</h2>
          <p>
            The same pipeline, formulas and evidence ledger used by live mode.
          </p>
        </div>
        <div className="example-stage">
          <div className="example-copy">
            <span className="example-label">Case 001</span>
            <h3>{fixture.tokenSymbol} flow intelligence</h3>
            <p>
              This is {fixture.tokenSymbol} on{" "}
              {getChainProfile(fixture.chain).displayName}, captured from the
              live Nansen API on{" "}
              <span className="identifier">
                {fixture.capturedAt.slice(0, 10)}
              </span>{" "}
              and scored by the same code that scores a live investigation.
            </p>
            <p>
              Direction sits near zero while Confidence stays low: the cohorts
              disagree and the evidence is thin. A product that merged these
              into one number would have hidden that.
            </p>
            <p className="example-action">
              <Button asChild variant="default">
                <Link
                  href={`/investigate/${fixture.chain}/${fixture.tokenAddress}?timeframe=${fixture.timeframe}&mode=fixture`}
                >
                  Open the full investigation
                </Link>
              </Button>
            </p>
          </div>
          <div className="example-lens">
            <p className="example-lens-label">Three signals, kept separate</p>
            <SignalLens scores={example.scores} />
          </div>
        </div>
      </section>

      <section
        className="section process-section"
        aria-labelledby="how-heading"
      >
        <div className="section-heading">
          <p className="section-kicker">The investigation path</p>
          <h2 id="how-heading">How evidence becomes an answer</h2>
          <p>Fast enough for a live demo, explicit enough to audit later.</p>
        </div>
        <ol className="step-list">
          <li>
            <SpotlightCard layout="step">
              <span className="step-index">01</span>
              <span className="step-name">Collect</span>
              <p>
                Four Nansen datasets run in parallel. One failed source never
                discards the evidence that returned.
              </p>
            </SpotlightCard>
          </li>
          <li>
            <SpotlightCard layout="step">
              <span className="step-index">02</span>
              <span className="step-name">Separate</span>
              <p>
                Deterministic formulas keep direction, confidence and
                coordination independent. Missing never becomes zero.
              </p>
            </SpotlightCard>
          </li>
          <li>
            <SpotlightCard layout="step">
              <span className="step-index">03</span>
              <span className="step-name">Explain</span>
              <p>
                Every conclusion resolves to an evidence row with its source,
                collection time and formula version.
              </p>
            </SpotlightCard>
          </li>
        </ol>
      </section>

      <section className="section guardrail-section">
        <article className="guardrail-block" aria-labelledby="chains-heading">
          <p className="section-kicker">Coverage</p>
          <h2 id="chains-heading">Supported scope</h2>
          <ul className="scope-list">
            {chains.map((profile) => (
              <li key={profile.chain}>
                <span>{profile.displayName}</span>
                <span className="identifier">
                  {profile.timeframes.join(" · ")}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-meta">
            Without a Nansen credential, the workspace runs on a clearly
            labelled historical fixture.
          </p>
        </article>

        <article
          className="guardrail-block"
          aria-labelledby="boundaries-heading"
        >
          <p className="section-kicker">Research boundaries</p>
          <h2 id="boundaries-heading">What this does not do</h2>
          <ul className="boundary-list">
            <li>No trade execution, wallet connection, or custody.</li>
            <li>No price targets, forecasts, or buy and sell commands.</li>
            <li>No claim that related wallets share an owner.</li>
            <li>
              No hidden formulas. Read the{" "}
              <Link href="/methodology">methodology</Link>.
            </li>
          </ul>
        </article>
      </section>
    </div>
  );
}
