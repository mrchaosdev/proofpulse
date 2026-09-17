/**
 * Investigation workspace composition.
 *
 * Section order follows 04-information-architecture: scope ribbon, score rail,
 * evidence status strip, cohort flows, actors, then the evidence ledger.
 * Supporting and contradicting evidence are both visible before any
 * interpretation (02-product-rules 7.4).
 */

import Link from "next/link";
import type { InvestigationResult } from "@/domain/investigation/investigation-result";
import type { BriefOutcome } from "@/domain/brief/brief-outcome";
import { getChainProfile } from "@/domain/investigation/scope";
import { findSourceStatus } from "@/domain/investigation/investigation";
import { shortenAddress } from "@/domain/investigation/address";
import { formatUsd } from "@/domain/evidence/format-value";
import { CREDITS_PER_CALL } from "@/domain/investigation/credits";
import { LinkPending } from "@/components/actions/LinkPending";
import { StatusPill } from "@/components/feedback/StatusPill";
import { CopyButton } from "@/components/actions/CopyButton";
import { SignalLens } from "./SignalLens";
import { SourceStatusStrip } from "./SourceStatusStrip";
import { CohortFlowPanel } from "./CohortFlowPanel";
import { FlowRibbon } from "./FlowRibbon";
import { ActorPanel } from "./ActorPanel";
import { ScoreBreakdown } from "./ScoreBreakdown";
import { EvidenceLedger } from "./EvidenceLedger";
import { BriefPanel } from "./BriefPanel";
import { ScopeActions } from "./ScopeActions";
import { FixtureFallback } from "./FixtureFallback";
import { RelationshipPanel } from "@/features/relationships/components/RelationshipPanel";
import { SmartMoneyHistory } from "./SmartMoneyHistory";
import { LiquidityPeers } from "./LiquidityPeers";
import { Button } from "@/components/ui/button";

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

/** Two datasets, so two calls. Named so the cost in the copy cannot drift. */
const CONTEXT_PANEL_CALLS = 2;

/**
 * The same scope with the context flag added. Every other query value the
 * reader arrived with is preserved, so asking for context never silently
 * changes the timeframe or drops a selected actor.
 */
function contextHref(investigation: {
  readonly input: {
    readonly chain: string;
    readonly tokenAddress: string;
    readonly timeframe: string;
    readonly mode: string;
  };
  readonly inspectedActorAddresses: readonly string[];
}): string {
  const query = new URLSearchParams({
    timeframe: investigation.input.timeframe,
    context: "on",
  });
  if (investigation.input.mode === "fixture") query.set("mode", "fixture");
  const inspected = investigation.inspectedActorAddresses[0];
  if (inspected !== undefined) query.set("inspect", inspected);
  return `/investigate/${investigation.input.chain}/${investigation.input.tokenAddress}?${query.toString()}`;
}

export function InvestigationView({
  result,
  briefOutcome,
  fixtureCapturedAt,
  showsDifferentToken = false,
}: {
  result: InvestigationResult;
  briefOutcome: BriefOutcome;
  fixtureCapturedAt?: string;
  /** The capture does not cover the scope that was asked for. */
  showsDifferentToken?: boolean;
}) {
  const { investigation, scores, evidence } = result;
  const profile = getChainProfile(investigation.input.chain);
  const context = investigation.tokenContext;
  const isFixture = investigation.input.mode === "fixture";

  return (
    <div className="stack">
      {/*
        One notice, not two. The substitution and the capture caveat are the
        same fact seen from two sides, and stacked they cost 330px — on a
        390px phone the first number sat below the fold.
      */}
      {isFixture ? (
        <div
          className="banner"
          data-state={showsDifferentToken ? "partial" : "fixture"}
          role="note"
        >
          <span className="banner-title">
            {showsDifferentToken
              ? "Showing a different token — historical fixture"
              : "Historical fixture — not live"}
          </span>
          <span>
            {showsDifferentToken
              ? "No live credential is configured, so the demo capture is shown instead of the token you asked for. "
              : null}
            Captured{" "}
            <span className="identifier">
              {fixtureCapturedAt ?? investigation.evaluatedAt}
            </span>{" "}
            UTC and replayed through the same normalization and scoring as live
            data. Confidence is capped while this label is shown.
          </span>
        </div>
      ) : null}

      {isFixture ? null : <FixtureFallback investigation={investigation} />}

      <section className="scope-ribbon" aria-label="Investigation scope">
        <div className="scope-identity">
          <h1 className="scope-token">
            {context?.symbol ?? "Unresolved token"}
          </h1>
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
        <ScopeActions investigation={investigation} />
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
          <FlowRibbon flows={investigation.segmentFlows} />
          <CohortFlowPanel flows={investigation.segmentFlows} />
        </section>

        <section
          className="card grid-half"
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
          {scores.coordinationRisk.state === "not-assessed" ? (
            <p className="card-question">
              Coordination risk is not assessed. Expand an actor below to
              request relationship evidence.
            </p>
          ) : (
            <ScoreBreakdown
              heading="Coordination risk"
              components={scores.coordinationRisk.components}
              formulaVersion={scores.formulaVersion}
            />
          )}
        </section>

        <section className="card grid-half" aria-labelledby="brief-heading">
          <h2 className="card-heading" id="brief-heading">
            Brief
          </h2>
          <p className="card-question">
            Supporting and contradicting evidence appear before any
            interpretation, and every sentence cites the evidence it rests on.
          </p>
          <BriefPanel outcome={briefOutcome} />
        </section>

        <section className="card grid-half" aria-labelledby="buyers-heading">
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
            timeframe={investigation.input.timeframe}
            isFixture={isFixture}
            inspectedActorAddress={
              investigation.inspectedActorAddresses[0] ?? null
            }
          />
        </section>

        <section className="card grid-half" aria-labelledby="sellers-heading">
          <h2 className="card-heading" id="sellers-heading">
            Top net sellers
          </h2>
          <p className="card-question">
            Contradicting activity is shown alongside supporting activity.
          </p>
          <ActorPanel
            actors={investigation.sellers}
            emptyMessage="No seller records were returned for this scope."
            timeframe={investigation.input.timeframe}
            isFixture={isFixture}
            inspectedActorAddress={
              investigation.inspectedActorAddresses[0] ?? null
            }
          />
        </section>

        <section
          className="card grid-full"
          aria-labelledby="relationships-heading"
        >
          <h2 className="card-heading" id="relationships-heading">
            Wallet relationships
          </h2>
          <p className="card-question">
            Are the dominant actors connected to each other? An observed link is
            not shared ownership.
          </p>
          <RelationshipPanel
            timeframe={investigation.input.timeframe}
            isFixture={isFixture}
            actors={[...investigation.buyers, ...investigation.sellers]}
            relationships={investigation.relationships}
            inspectedActorAddress={
              investigation.inspectedActorAddresses[0] ?? null
            }
            status={findSourceStatus(investigation, "related-wallets")}
          />
        </section>

        {investigation.smartMoneyHistory !== null ||
        investigation.liquidityPeers !== null ? null : (
          <section className="card grid-full" aria-labelledby="context-heading">
            <h2 className="card-heading" id="context-heading">
              Deeper context
            </h2>
            <p className="card-question">
              Two more Nansen datasets: what smart money held across seven days,
              and how this pool&apos;s depth compares with the rest of the
              chain.
            </p>
            <p>
              <Button asChild variant="outline">
                <Link href={contextHref(investigation)} scroll={false}>
                  <LinkPending
                    label="Add seven-day history and liquidity context"
                    pendingLabel="Requesting two datasets…"
                  />
                </Link>
              </Button>
            </p>
            <p className="text-meta">
              Costs {CONTEXT_PANEL_CALLS * CREDITS_PER_CALL} Nansen credits.
              Unrequested datasets cost nothing.
            </p>
          </section>
        )}

        {investigation.smartMoneyHistory === null ? null : (
          <section className="card grid-full" aria-labelledby="history-heading">
            <h2 className="card-heading" id="history-heading">
              Smart money over seven days
            </h2>
            <p className="card-question">
              Did the smart money position change, or did only its price?
            </p>
            <SmartMoneyHistory
              history={investigation.smartMoneyHistory}
              symbol={investigation.tokenContext?.symbol ?? null}
            />
          </section>
        )}

        {investigation.liquidityPeers === null ? null : (
          <section className="card grid-full" aria-labelledby="peers-heading">
            <h2 className="card-heading" id="peers-heading">
              Liquidity in context
            </h2>
            <p className="card-question">
              Is this pool deep or thin compared with the rest of the chain?
            </p>
            <LiquidityPeers
              peers={investigation.liquidityPeers}
              symbol={investigation.tokenContext?.symbol ?? null}
            />
          </section>
        )}

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
