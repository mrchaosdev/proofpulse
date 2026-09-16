/**
 * The deterministic brief.
 *
 * Core analytics must survive model failure (decision D-005), so this brief is
 * always available and is what renders whenever model output is missing or
 * fails validation (02-product-rules 3.6).
 *
 * It is assembled by selection, not by generation: every sentence is built
 * from an evidence item that already exists, and every claim cites the item it
 * came from. It is pure, so the same investigation always produces the same
 * brief.
 */

import type { Evidence } from "../evidence/evidence";
import type { NormalizedInvestigation } from "../investigation/investigation";
import type { InvestigationScores } from "../investigation/investigation-result";
import type { BriefClaim, InvestigationBrief } from "./brief";

const MAX_CLAIMS_PER_SIDE = 3;

function strongest(
  evidence: readonly Evidence[],
  polarity: Evidence["polarity"],
): readonly Evidence[] {
  return evidence
    .filter(
      (item) =>
        item.kind === "observation" &&
        item.polarity === polarity &&
        item.numericValue !== undefined,
    )
    .sort(
      (left, right) =>
        Math.abs(right.numericValue ?? 0) - Math.abs(left.numericValue ?? 0),
    )
    .slice(0, MAX_CLAIMS_PER_SIDE);
}

function toClaim(item: Evidence): BriefClaim {
  return { text: item.statement, evidenceIds: [item.id] };
}

function describeDirection(scores: InvestigationScores): string {
  if (scores.direction.state !== "available") {
    return "Direction could not be derived, because no cohort returned a usable net flow.";
  }
  return `Observed flow direction is ${scores.direction.value}, which is ${scores.direction.label.replace(/-/g, " ")}.`;
}

function describeConfidence(scores: InvestigationScores): string {
  return `Evidence confidence is ${scores.confidence.value}, which is ${scores.confidence.label.replace(/-/g, " ")}.`;
}

function describeCoordination(scores: InvestigationScores): string {
  const coordination = scores.coordinationRisk;
  if (coordination.state === "not-assessed") {
    return "Coordination risk is not assessed, because no relationship evidence has been requested.";
  }
  return `Coordination risk is ${coordination.value}, which is ${coordination.label}${coordination.state === "preliminary" ? ", and preliminary because only concentration has been measured" : ""}.`;
}

/**
 * Conditions that would overturn the current reading. These follow from the
 * inputs rather than from speculation about the market.
 */
function invalidationConditions(
  investigation: NormalizedInvestigation,
  scores: InvestigationScores,
  evidence: readonly Evidence[],
): readonly BriefClaim[] {
  const conditions: BriefClaim[] = [];
  const directionDerivation = evidence.find((item) => item.id === "DER-DIR-01");

  if (directionDerivation !== undefined) {
    conditions.push({
      text: "A reversal in the higher-trust cohorts would move direction first, because they carry the largest weights.",
      evidenceIds: [directionDerivation.id],
    });
  }

  const failed = investigation.sourceStatuses.filter(
    (status) => status.state === "error",
  );
  const warning = evidence.find((item) => item.kind === "warning");
  if (failed.length > 0 && warning !== undefined) {
    conditions.push({
      text: "Recovering the sources that failed would change confidence, and could change direction if they carry cohort flows.",
      evidenceIds: [warning.id],
    });
  }

  const coordinationDerivation = evidence.find(
    (item) => item.id === "DER-COORD-01",
  );
  if (
    scores.coordinationRisk.state === "preliminary" &&
    coordinationDerivation !== undefined
  ) {
    conditions.push({
      text: "Expanding an actor would replace the preliminary coordination reading with an assessed one, in either direction.",
      evidenceIds: [coordinationDerivation.id],
    });
  }

  return conditions;
}

function limitations(
  investigation: NormalizedInvestigation,
  scores: InvestigationScores,
): readonly string[] {
  const notes = [
    "This is research software. It describes observed flows and relationships, and it is not financial advice.",
    "Direction describes observed flow balance. It is not a price forecast.",
    "A wallet relationship is an observed link. Ownership is unknown.",
    `Scores use formula version ${scores.formulaVersion}, whose thresholds are uncalibrated hypotheses.`,
  ];

  if (investigation.input.mode === "fixture") {
    notes.push(
      "This investigation replays a historical capture, so it is not live data.",
    );
  }
  const untracked = investigation.segmentFlows.filter(
    (flow) => flow.walletCount === null && flow.netFlowUsd !== null,
  );
  if (untracked.length > 0) {
    notes.push(
      "Some cohorts report flow without a wallet count, so participant breadth is measured from the cohorts that do.",
    );
  }
  return notes;
}

export function buildDeterministicBrief(
  investigation: NormalizedInvestigation,
  scores: InvestigationScores,
  evidence: readonly Evidence[],
): InvestigationBrief {
  const support = strongest(evidence, "supports_accumulation");
  const contradiction = strongest(evidence, "supports_distribution");

  return {
    observation: [
      describeDirection(scores),
      describeConfidence(scores),
      describeCoordination(scores),
    ].join(" "),
    support: support.map(toClaim),
    contradiction: contradiction.map(toClaim),
    invalidationConditions: invalidationConditions(
      investigation,
      scores,
      evidence,
    ),
    limitations: limitations(investigation, scores),
    provenance: "deterministic",
  };
}
