/**
 * Investigation workspace composition.
 *
 * Section order follows 04-information-architecture: scope ribbon, score rail,
 * evidence status strip, cohort flows, actors, then the evidence ledger.
 * Supporting and contradicting evidence are both visible before any
 * interpretation (02-product-rules 7.4).
 */

import type { InvestigationResult } from "@/domain/investigation/investigation-result";
import { getChainProfile } from "@/domain/investigation/scope";
import { shortenAddress } from "@/domain/investigation/address";
import { formatUsd } from "@/domain/evidence/format-value";
import { StatusPill } from "@/components/feedback/StatusPill";
import { CopyButton } from "@/components/actions/CopyButton";
import { SignalLens } from "./SignalLens";
import { SourceStatusStrip } from "./SourceStatusStrip";
import { CohortFlowPanel } from "./CohortFlowPanel";
import { ActorPanel } from "./ActorPanel";
import { ScoreBreakdown } from "./ScoreBreakdown";
import { EvidenceLedger } from "./EvidenceLedger";

function buildSummary(result: InvestigationResult): string {
  const { investigation, scores } = result;
  const direction =
    scores.direction.state === "available"
      ? `${scores.direction.value} (${scores.direction.label.replace(/-/g, " ")})`
      : "not available";
  const coordination =
    scores.coordinationRisk.state === "not-assessed"
      ? "not assessed"
      : `${scores.coordinationRisk.value} (${scores.coordinationRisk.label})`;

  // Copy includes scope, time, mode, and the non-advice limitation
  // (02-product-rules 4.5).
  return [
    `ProofPulse investigation`,
    `Token: ${investigation.input.tokenAddress} on ${getChainProfile(investigation.input.chain).displayName}`,
    `Timeframe: ${investigation.input.timeframe}`,
    `Collected: ${investigation.evaluatedAt} UTC`,
    `Mode: ${investigation.input.mode === "live" ? "live" : "historical fixture, not live"}`,
    `Direction: ${direction} — observed flow balance, not a price forecast`,
    `Confidence: ${scores.confidence.value} (${scores.confidence.label.replace(/-/g, " ")}) — evidence quality`,
    `Coordination risk: ${coordination} — observable concentration, not manipulation or shared ownership`,
    `Formula: ${scores.formulaVersion}`,
    `ProofPulse is research software. It is not financial advice.`,
  ].join("\n");
}

export function InvestigationView({
  result,
  fixtureCapturedAt,
}: {
  result: InvestigationResult;
  fixtureCapturedAt?: string;
}) {
  const { investigation, scores, evidence } = result;
  const profile = getChainProfile(investigation.input.chain);
  const context = investigation.tokenContext;
  const isFixture = investigation.input.mode === "fixture";

  return (
    <div className="stack">
      {isFixture ? (
        <div className="banner" data-state="fixture" role="note">
          <span className="banner-title">Historical fixture — not live</span>
          <span>
            Captured{" "}
            <span className="identifier">
              {fixtureCapturedAt ?? investigation.evaluatedAt}
            </span>{" "}
            UTC and replayed through the same normalization and scoring as live
            data. Confidence is capped while this label is shown.
          </span>
        </div>
      ) : null}

      <section className="scope-ribbon" aria-label="Investigation scope">
        <div className="scope-identity">
          <span className="scope-token">
            {context?.symbol ?? "Unresolved token"}
          </span>
          <span className="scope-meta">
            <span
              className="identifier"
              title={investigation.input.tokenAddress}
            >
              <span aria-hidden="true">
                {shortenAddress(investigation.input.tokenAddress)}
              </span>
              <span className="visually-hidden">
                {investigation.input.tokenAddress}
              </span>
            </span>
            <CopyButton
              value={investigation.input.tokenAddress}
              description="token address"
            />
          </span>
        </div>
        <div className="scope-meta">
          <span>{profile.displayName}</span>
          <span>Timeframe {investigation.input.timeframe}</span>
          <span className="identifier">{investigation.evaluatedAt} UTC</span>
          <StatusPill tone={isFixture ? "fixture" : "ready"}>
            {isFixture ? "Fixture" : "Live"}
          </StatusPill>
        </div>
      </section>

      <div className="investigation-grid">
        <section className="card grid-lens" aria-labelledby="lens-heading">
          <h2 className="card-heading" id="lens-heading">
            Signal lens
          </h2>
          <p className="card-question">
            Three separate answers. They are never merged into one verdict.
          </p>
          <SignalLens scores={scores} />
        </section>

        <section
          className="card grid-overview"
          aria-labelledby="sources-heading"
        >
          <h2 className="card-heading" id="sources-heading">
            Evidence status
          </h2>
          <p className="card-question">
            Which datasets were requested, and what each returned.
          </p>
          <SourceStatusStrip investigation={investigation} />
          {context === null ? null : (
            <p className="card-footer">
              Reported liquidity{" "}
              {context.liquidityUsd === null
                ? "not returned"
                : formatUsd(context.liquidityUsd)}
              . This sets the flow scale used by Direction.
            </p>
          )}
        </section>

        <section className="card grid-flows" aria-labelledby="flows-heading">
          <h2 className="card-heading" id="flows-heading">
            Cohort flows
          </h2>
          <p className="card-question">
            Which participant groups accumulated or distributed this token?
          </p>
          <CohortFlowPanel flows={investigation.segmentFlows} />
        </section>

        <section
          className="card grid-brief"
          aria-labelledby="confidence-heading"
        >
          <h2 className="card-heading" id="confidence-heading">
            How the scores were derived
          </h2>
          {scores.direction.state === "available" ? (
            <ScoreBreakdown
              heading="Direction"
              components={scores.direction.components}
              formulaVersion={scores.formulaVersion}
            />
          ) : (
            <p className="card-question">
              Direction is unavailable: no cohort returned a usable net flow.
            </p>
          )}
          <ScoreBreakdown
            heading="Confidence"
            components={scores.confidence.components}
            formulaVersion={scores.formulaVersion}
          />
        </section>

        <section className="card grid-flows" aria-labelledby="buyers-heading">
          <h2 className="card-heading" id="buyers-heading">
            Top net buyers
          </h2>
          <p className="card-question">
            Labels come from Nansen and describe observed behaviour, not
            ownership.
          </p>
          <ActorPanel
            actors={investigation.buyers}
            emptyMessage="No buyer records were returned for this scope."
          />
        </section>

        <section className="card grid-brief" aria-labelledby="sellers-heading">
          <h2 className="card-heading" id="sellers-heading">
            Top net sellers
          </h2>
          <p className="card-question">
            Contradicting activity is shown alongside supporting activity.
          </p>
          <ActorPanel
            actors={investigation.sellers}
            emptyMessage="No seller records were returned for this scope."
          />
        </section>

        <section className="card grid-full" aria-labelledby="ledger-heading">
          <h2 className="card-heading" id="ledger-heading">
            Evidence ledger
          </h2>
          <p className="card-question">
            Every normalized item used by a score, including items that
            contradict the dominant direction.
          </p>
          <EvidenceLedger
            evidence={evidence}
            evaluatedAt={investigation.evaluatedAt}
          />
        </section>

        <section className="card grid-full" aria-labelledby="summary-heading">
          <h2 className="card-heading" id="summary-heading">
            Copy this investigation
          </h2>
          <p className="card-question">
            The summary carries scope, collection time, mode, and the
            limitation.
          </p>
          <pre className="identifier summary-block">{buildSummary(result)}</pre>
          <div className="cluster">
            <CopyButton
              value={buildSummary(result)}
              description="investigation summary"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
