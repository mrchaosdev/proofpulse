/**
 * Composes a normalized investigation into the scored, auditable result the
 * interface renders.
 *
 * This function is pure: no network, cache, clock, or model call happens here
 * (06-technical-architecture "Module boundaries"). The clock is read once per
 * investigation and arrives as `evaluatedAt`.
 */

import type { Evidence } from "../evidence/evidence";
import { derivationEvidenceId } from "../evidence/evidence";
import { buildObservationEvidence } from "../evidence/build-evidence";
import { formatScore } from "../evidence/format-value";
import type { DirectionScore } from "../scoring/calculate-direction";
import { calculateDirection } from "../scoring/calculate-direction";
import type { ConfidenceScore } from "../scoring/calculate-confidence";
import { calculateConfidence } from "../scoring/calculate-confidence";
import type { CoordinationRiskScore } from "../scoring/calculate-coordination-risk";
import { calculateCoordinationRisk } from "../scoring/calculate-coordination-risk";
import { SCORE_FORMULA_VERSION } from "../scoring/score";
import type { NormalizedInvestigation, SourceMeta } from "./investigation";

export type InvestigationScores = {
  readonly direction: DirectionScore;
  readonly confidence: ConfidenceScore;
  readonly coordinationRisk: CoordinationRiskScore;
  readonly formulaVersion: string;
};

export type InvestigationResult = {
  readonly investigation: NormalizedInvestigation;
  readonly scores: InvestigationScores;
  /** Observations, warnings, and score derivations in ledger order. */
  readonly evidence: readonly Evidence[];
};

export function scoreInvestigation(
  investigation: NormalizedInvestigation,
): InvestigationResult {
  const direction = calculateDirection({
    segmentFlows: investigation.segmentFlows,
    tokenLiquidityUsd: investigation.tokenContext?.liquidityUsd ?? null,
  });
  const confidence = calculateConfidence(investigation);
  const coordinationRisk = calculateCoordinationRisk({
    buyers: investigation.buyers,
    sellers: investigation.sellers,
    relationships: investigation.relationships,
    inspectedActorAddresses: investigation.inspectedActorAddresses,
  });

  const scores: InvestigationScores = {
    direction,
    confidence,
    coordinationRisk,
    formulaVersion: SCORE_FORMULA_VERSION,
  };

  return {
    investigation,
    scores,
    evidence: [
      ...buildObservationEvidence(investigation),
      ...buildDerivationEvidence(scores, derivationSource(investigation)),
    ],
  };
}

function derivationSource(investigation: NormalizedInvestigation): SourceMeta {
  return {
    provider: "nansen",
    capability: "cohort-flows",
    collectedAt: investigation.evaluatedAt,
    live: investigation.input.mode === "live",
    warnings: [],
  };
}

/**
 * Every score contribution generates a derivation evidence item, so no score
 * can render without an inspectable breakdown (02-product-rules 2.7).
 */
function buildDerivationEvidence(
  scores: InvestigationScores,
  source: SourceMeta,
): readonly Evidence[] {
  const items: Evidence[] = [];

  if (scores.direction.state === "available") {
    items.push({
      id: derivationEvidenceId("DIR"),
      kind: "derivation",
      statement:
        `Direction scored ${formatScore(scores.direction.value)} ` +
        `(${scores.direction.label.replace(/-/g, " ")}) from ` +
        `${scores.direction.components.length} weighted cohort flows. ` +
        `This is observed flow balance, not a price forecast.`,
      numericValue: scores.direction.value,
      unit: "score",
      polarity:
        scores.direction.value > 0
          ? "supports_accumulation"
          : scores.direction.value < 0
            ? "supports_distribution"
            : "neutral",
      sourceEvidenceIds: scores.direction.components.flatMap(
        (component) => component.evidenceIds,
      ),
      derivation: `${scores.formulaVersion}: round(100 x weighted mean of tanh(net flow / scale)); scale ${scores.direction.scaleUsd} from ${scores.direction.scaleBasis}`,
      source,
    });
  }

  items.push({
    id: derivationEvidenceId("CONF"),
    kind: "derivation",
    statement:
      `Confidence scored ${formatScore(scores.confidence.value)} ` +
      `(${scores.confidence.label.replace(/-/g, " ")}) from evidence ` +
      `coverage, freshness, breadth, consistency, and warnings.` +
      (scores.confidence.cappedByFixtureMode
        ? " Capped because this investigation uses a historical fixture."
        : ""),
    numericValue: scores.confidence.value,
    unit: "score",
    polarity: "neutral",
    sourceEvidenceIds: scores.confidence.components.flatMap(
      (component) => component.evidenceIds,
    ),
    derivation: `${scores.formulaVersion}: ${scores.confidence.components
      .map(
        (component) =>
          `${component.key} ${component.value.toFixed(1)}/${component.maximum ?? 0}`,
      )
      .join(", ")}`,
    source,
  });

  const coordination = scores.coordinationRisk;
  if (coordination.state !== "not-assessed") {
    items.push({
      id: derivationEvidenceId("COORD"),
      kind: "derivation",
      statement:
        `Coordination risk scored ${formatScore(coordination.value)} ` +
        `(${coordination.label}) from observed concentration` +
        (coordination.state === "preliminary"
          ? ` only; no relationship evidence has been requested.`
          : ` and first-degree wallet relationships.`) +
        ` This is not a claim of manipulation or shared ownership.`,
      numericValue: coordination.value,
      unit: "score",
      polarity: "neutral",
      sourceEvidenceIds: coordination.components.flatMap(
        (component) => component.evidenceIds,
      ),
      derivation: `${scores.formulaVersion}: ${coordination.components
        .map(
          (component) =>
            `${component.key} ${component.value.toFixed(1)}/${component.maximum ?? 0}`,
        )
        .join(", ")}`,
      source,
    });
  }

  return items;
}
