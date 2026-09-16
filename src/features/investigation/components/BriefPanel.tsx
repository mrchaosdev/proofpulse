/**
 * Model-assisted brief (04-information-architecture section 6).
 *
 * Required sections in order: observed state, strongest supporting evidence,
 * strongest contradicting evidence, invalidation conditions, limitations.
 * Every claim shows the evidence IDs it rests on.
 *
 * The heading states which engine wrote it. Generated prose is labelled
 * "Model-assisted brief" (DESIGN-RULES 13); the deterministic fallback says so
 * plainly rather than passing itself off as model output.
 */

import type { BriefClaim } from "@/domain/brief/brief";
import type { BriefOutcome } from "@/domain/brief/brief-outcome";

const FALLBACK_REASONS: Readonly<
  Record<NonNullable<BriefOutcome["fallbackReason"]>, string>
> = {
  "no-provider":
    "No model provider is configured, so this brief was assembled directly from the evidence.",
  "provider-failed":
    "The model provider did not respond, so this brief was assembled directly from the evidence.",
  "validation-failed":
    "The generated brief failed validation and was discarded. This brief was assembled directly from the evidence.",
};

function ClaimList({
  heading,
  claims,
  emptyMessage,
}: {
  heading: string;
  claims: readonly BriefClaim[];
  emptyMessage: string;
}) {
  return (
    <section className="brief-section">
      <h3 className="brief-heading">{heading}</h3>
      {claims.length === 0 ? (
        <p className="card-question">{emptyMessage}</p>
      ) : (
        <ul className="brief-list">
          {claims.map((claim) => (
            <li className="brief-claim" key={claim.text}>
              <span>{claim.text}</span>
              <span className="brief-citations">
                {claim.evidenceIds.map((id) => (
                  <span className="brief-citation identifier" key={id}>
                    {id}
                  </span>
                ))}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function BriefPanel({ outcome }: { outcome: BriefOutcome }) {
  const { brief, fallbackReason, rejections } = outcome;
  const isModel: boolean = brief.provenance === "model";

  return (
    <div className="stack">
      <p className="brief-provenance" data-provenance={brief.provenance}>
        {isModel ? "Model-assisted brief" : "Deterministic brief"}
      </p>

      {fallbackReason === null ? null : (
        <p className="card-question">{FALLBACK_REASONS[fallbackReason]}</p>
      )}

      {rejections.length === 0 ? null : (
        <div className="banner" data-state="partial" role="note">
          <span className="banner-title">Generated brief rejected</span>
          <span>
            {rejections.map((rejection) => rejection.detail).join(" ")}
          </span>
        </div>
      )}

      <section className="brief-section">
        <h3 className="brief-heading">Observed state</h3>
        <p>{brief.observation}</p>
      </section>

      <ClaimList
        heading="Strongest supporting evidence"
        claims={brief.support}
        emptyMessage="No observation supports accumulation in this investigation."
      />

      <ClaimList
        heading="Strongest contradicting evidence"
        claims={brief.contradiction}
        emptyMessage="No observation supports distribution in this investigation."
      />

      <ClaimList
        heading="What would invalidate this"
        claims={brief.invalidationConditions}
        emptyMessage="No invalidation condition could be derived."
      />

      <section className="brief-section">
        <h3 className="brief-heading">Limitations</h3>
        <ul className="brief-list">
          {brief.limitations.map((limitation) => (
            <li key={limitation}>{limitation}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
