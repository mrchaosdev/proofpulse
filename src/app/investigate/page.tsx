import type { Metadata } from "next";
import Link from "next/link";
import { InvestigationForm } from "@/features/investigation/components/InvestigationForm";
import { describeFixture } from "@/server/fixtures/fixture-loader";
import { getChainProfile } from "@/domain/investigation/scope";
import { CREDITS_PER_CALL } from "@/domain/investigation/credits";
import { REQUIRED_CAPABILITIES } from "@/domain/investigation/investigation";
import { SpotlightCard } from "@/components/effects/SpotlightCard";
import { Button } from "@/components/ui/button";
import { getEffectiveMode } from "@/config/app-config";

export const metadata: Metadata = {
  title: "Investigate",
  description:
    "Choose a chain, token address, and timeframe to run an evidence-first investigation.",
};

/** Empty workspace and scope input (04-information-architecture). */
export default function InvestigatePage() {
  const fixture = describeFixture();
  const coreCost = REQUIRED_CAPABILITIES.length * CREDITS_PER_CALL;
  const fixtureOnly = getEffectiveMode() === "fixture";

  return (
    <div className="page-region investigate-entry">
      <header className="investigate-header">
        <p className="section-kicker">New research scope</p>
        <h1>Start an investigation</h1>
        <p>
          Follow flows, inspect dominant actors and keep uncertainty visible.
          ProofPulse does not predict price or give trading advice.
        </p>
      </header>

      <div className="investigate-split">
        <SpotlightCard layout="form">
          <div className="hero-panel-heading">
            <div>
              <p className="section-kicker">Scope</p>
              <h2>Choose a token</h2>
            </div>
            <span className="hero-panel-badge">4 credits</span>
          </div>
          <InvestigationForm
            {...(fixtureOnly
              ? {
                  availableTimeframes: [fixture.timeframe],
                  timeframeHelp: `Fixture mode contains one ${fixture.timeframe} capture. Configure NANSEN_API_KEY and APP_MODE=live to run 1h, 6h, or 7d.`,
                }
              : {})}
          />
        </SpotlightCard>

        <aside className="investigate-aside">
          <h2 className="card-heading">What happens when you run it</h2>
          <ol className="step-compact">
            <li>
              The address is validated for the chain you picked. An invalid one
              never reaches Nansen, so it costs nothing.
            </li>
            <li>
              Four datasets are requested in parallel: token context, cohort
              flows, top buyers and top sellers. That is {coreCost} credits.
            </li>
            <li>
              Whatever returns is scored. A source that fails lowers confidence
              instead of discarding the rest.
            </li>
            <li>
              Wallet relationships stay unrequested until you pick an actor,
              because they cost a credit each.
            </li>
          </ol>

          <p className="text-meta">
            No credential configured? The workspace runs on a recorded capture
            and labels every screen accordingly.
          </p>

          <p>
            <Button asChild variant="outline">
              <Link
                href={`/investigate/${fixture.chain}/${fixture.tokenAddress}?timeframe=${fixture.timeframe}&mode=fixture`}
              >
                Open the {fixture.tokenSymbol} capture
              </Link>
            </Button>
          </p>
          {/*
            The capture date sits here rather than in the label: the button
            cannot wrap, and the full sentence ran 293px wide against the
            288px a 320px phone leaves inside the gutter.
          */}
          <p className="text-meta">
            {getChainProfile(fixture.chain).displayName} ·{" "}
            {fixture.capturedAt.slice(0, 10)} · spends no credits
          </p>
        </aside>
      </div>
    </div>
  );
}
