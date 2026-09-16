/**
 * The authoritative explanation for a partial result
 * (04-information-architecture "Evidence status strip").
 *
 * "No records returned" and "source failed" are distinct states and are worded
 * differently (02-product-rules 9.5).
 */

import type {
  NormalizedInvestigation,
  SourceCapability,
  SourceStatus,
} from "@/domain/investigation/investigation";
import { SOURCE_CAPABILITIES } from "@/domain/investigation/investigation";
import { findSourceStatus } from "@/domain/investigation/investigation";
import { StatusPill } from "@/components/feedback/StatusPill";
import type { StatusTone } from "@/components/feedback/StatusPill";
import { ageSeconds, freshnessState } from "@/domain/scoring/freshness";
import { formatAge } from "@/domain/evidence/format-value";

const CAPABILITY_NAMES: Readonly<Record<SourceCapability, string>> = {
  "token-context": "Token context",
  "cohort-flows": "Cohort flows",
  buyers: "Top buyers",
  sellers: "Top sellers",
  "related-wallets": "Wallet relationships",
};

function describe(
  status: SourceStatus,
  evaluatedAt: string,
): { tone: StatusTone; word: string; detail: string } {
  switch (status.state) {
    case "ready": {
      const age = ageSeconds(status.source.collectedAt, evaluatedAt);
      const freshness = freshnessState(status.capability, age);
      const detail = `${status.recordCount} records, collected ${formatAge(age)}.`;
      return freshness === "stale"
        ? { tone: "stale", word: "Stale", detail }
        : { tone: "ready", word: "Ready", detail };
    }
    case "empty":
      return {
        tone: "empty",
        word: "Empty",
        detail:
          "No records returned for this scope. This is an absence of records, not evidence of no activity.",
      };
    case "error":
      return {
        tone: "error",
        word: "Error",
        detail: `${status.message}${status.retryable ? " This can be retried." : ""}`,
      };
    case "loading":
      return { tone: "neutral", word: "Loading", detail: "Requesting data." };
    case "not-requested":
      return {
        tone: "neutral",
        word: "Not requested",
        detail: "This dataset is fetched on demand and costs credits.",
      };
  }
}

export function SourceStatusStrip({
  investigation,
}: {
  investigation: NormalizedInvestigation;
}) {
  return (
    <ul className="status-strip">
      {SOURCE_CAPABILITIES.map((capability) => {
        const status = findSourceStatus(investigation, capability);
        const described = describe(status, investigation.evaluatedAt);
        return (
          <li className="status-strip-item" key={capability}>
            <span className="status-strip-name">
              {CAPABILITY_NAMES[capability]}
            </span>
            <StatusPill tone={described.tone}>{described.word}</StatusPill>
            <span className="status-strip-detail">{described.detail}</span>
          </li>
        );
      })}
    </ul>
  );
}
