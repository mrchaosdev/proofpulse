/**
 * Confidence: 0..100.
 *
 * Question: how much trust should be placed in this investigation's evidence
 * coverage and consistency? Confidence describes evidence quality, not the
 * probability that price will rise (02-product-rules 2.3).
 *
 * Components: 05-data-and-scoring "2. Confidence".
 */

import type {
  NormalizedInvestigation,
  Segment,
  SegmentFlow,
  SourceCapability,
  SourceStatus,
} from "../investigation/investigation";
import { REQUIRED_CAPABILITIES } from "../investigation/investigation";
import { warningEvidenceId } from "../evidence/evidence";
import type { ConfidenceLabel, ScoreComponent } from "./score";
import { clamp, confidenceLabel, isUsableNumber, roundScore } from "./score";
import { ageSeconds, freshnessFactor } from "./freshness";

export const COVERAGE_MAXIMUM = 30;
export const FRESHNESS_MAXIMUM = 20;
export const BREADTH_MAXIMUM = 20;
export const CONSISTENCY_MAXIMUM = 20;
export const QUALITY_MAXIMUM = 10;

/** Wallet count at which participant breadth is considered fully covered. */
export const BREADTH_SATURATION_WALLETS = 120;

/**
 * A fixture investigation can never present itself as a live one
 * (05-data-and-scoring, acceptance case U-08).
 */
export const FIXTURE_CONFIDENCE_CAP = 69;

/** Higher-trust cohorts, used for cross-segment consistency only. */
const HIGH_TRUST_SEGMENTS: readonly Segment[] = [
  "smart_trader",
  "top_pnl",
  "whale",
];

export type ConfidenceScore = {
  readonly value: number;
  readonly label: ConfidenceLabel;
  readonly components: readonly ScoreComponent[];
  readonly cappedByFixtureMode: boolean;
};

export function calculateConfidence(
  investigation: NormalizedInvestigation,
): ConfidenceScore {
  const components = [
    coverageComponent(investigation.sourceStatuses),
    freshnessComponent(investigation),
    breadthComponent(investigation.segmentFlows),
    consistencyComponent(investigation.segmentFlows),
    qualityComponent(investigation),
  ];
  const raw = components.reduce((sum, component) => sum + component.value, 0);
  const isFixture = investigation.input.mode === "fixture";
  const capped = isFixture ? Math.min(raw, FIXTURE_CONFIDENCE_CAP) : raw;
  const value = roundScore(clamp(capped, 0, 100));
  return {
    value,
    label: confidenceLabel(value),
    components,
    cappedByFixtureMode: isFixture && raw > FIXTURE_CONFIDENCE_CAP,
  };
}

function coverageComponent(statuses: readonly SourceStatus[]): ScoreComponent {
  const ready = REQUIRED_CAPABILITIES.filter((capability) =>
    isUsable(statuses, capability),
  );
  const ratio = ready.length / REQUIRED_CAPABILITIES.length;
  const missing = REQUIRED_CAPABILITIES.filter(
    (capability) => !ready.includes(capability),
  );
  return {
    key: "coverage",
    label: "Required-source coverage",
    value: COVERAGE_MAXIMUM * ratio,
    maximum: COVERAGE_MAXIMUM,
    detail:
      `${ready.length} of ${REQUIRED_CAPABILITIES.length} required datasets ` +
      `returned usable records` +
      (missing.length > 0 ? `; missing: ${missing.join(", ")}` : ""),
    evidenceIds: missing.map((_, index) => warningEvidenceId(index)),
  };
}

function isUsable(
  statuses: readonly SourceStatus[],
  capability: SourceCapability,
): boolean {
  const status = statuses.find((item) => item.capability === capability);
  return status?.state === "ready";
}

function freshnessComponent(
  investigation: NormalizedInvestigation,
): ScoreComponent {
  const ready = investigation.sourceStatuses.filter(
    (status) =>
      status.state === "ready" &&
      REQUIRED_CAPABILITIES.includes(status.capability),
  );
  if (ready.length === 0) {
    return {
      key: "freshness",
      label: "Freshness",
      value: 0,
      maximum: FRESHNESS_MAXIMUM,
      detail:
        "No required dataset returned, so no collection time can be aged.",
      evidenceIds: [],
    };
  }
  const factors = ready.map((status) => {
    const age =
      status.state === "ready"
        ? ageSeconds(status.source.collectedAt, investigation.evaluatedAt)
        : 0;
    return freshnessFactor(status.capability, age);
  });
  const mean =
    factors.reduce((sum, factor) => sum + factor, 0) / factors.length;
  return {
    key: "freshness",
    label: "Freshness",
    value: FRESHNESS_MAXIMUM * mean,
    maximum: FRESHNESS_MAXIMUM,
    detail:
      `Mean freshness factor ${mean.toFixed(3)} across ${ready.length} ` +
      `required datasets; 1 within the fresh target, decaying to 0 at stale.`,
    evidenceIds: [],
  };
}

function breadthComponent(flows: readonly SegmentFlow[]): ScoreComponent {
  const counts = flows
    .map((flow) => flow.walletCount)
    .filter(isUsableNumber)
    .filter((count) => count > 0);
  if (counts.length === 0) {
    return {
      key: "breadth",
      label: "Participant breadth",
      value: 0,
      maximum: BREADTH_MAXIMUM,
      detail: "No cohort returned a wallet count.",
      evidenceIds: [],
    };
  }
  const total = counts.reduce((sum, count) => sum + count, 0);
  // Capped and square-rooted so one very large cohort cannot dominate.
  const saturation = Math.min(1, Math.sqrt(total / BREADTH_SATURATION_WALLETS));
  return {
    key: "breadth",
    label: "Participant breadth",
    value: BREADTH_MAXIMUM * saturation,
    maximum: BREADTH_MAXIMUM,
    detail:
      `${total} wallets across ${counts.length} cohorts; ` +
      `sqrt(${total}/${BREADTH_SATURATION_WALLETS}) capped at 1 = ` +
      `${saturation.toFixed(3)}`,
    evidenceIds: [],
  };
}

function consistencyComponent(flows: readonly SegmentFlow[]): ScoreComponent {
  const highTrust = flows.filter(
    (flow) =>
      HIGH_TRUST_SEGMENTS.includes(flow.segment) &&
      isUsableNumber(flow.netFlowUsd) &&
      flow.netFlowUsd !== 0,
  );
  if (highTrust.length < 2) {
    return {
      key: "consistency",
      label: "Cross-segment consistency",
      value: 0,
      maximum: CONSISTENCY_MAXIMUM,
      detail:
        "Fewer than two higher-trust cohorts returned a signed flow, so " +
        "agreement cannot be assessed.",
      evidenceIds: [],
    };
  }
  const positives = highTrust.filter(
    (flow) => (flow.netFlowUsd ?? 0) > 0,
  ).length;
  const share =
    Math.max(positives, highTrust.length - positives) / highTrust.length;
  // 0.5 means an even split and scores zero; 1 means full agreement.
  const agreement = (share - 0.5) * 2;
  return {
    key: "consistency",
    label: "Cross-segment consistency",
    value: CONSISTENCY_MAXIMUM * agreement,
    maximum: CONSISTENCY_MAXIMUM,
    detail:
      `${positives} of ${highTrust.length} higher-trust cohorts show positive ` +
      `net flow; agreement ${agreement.toFixed(3)}. Contradicting cohorts ` +
      `remain displayed.`,
    evidenceIds: [],
  };
}

function qualityComponent(
  investigation: NormalizedInvestigation,
): ScoreComponent {
  const warnings = investigation.sourceStatuses.flatMap((status) =>
    status.state === "ready" || status.state === "empty"
      ? status.source.warnings
      : [],
  );
  const failed = investigation.sourceStatuses.filter(
    (status) => status.state === "error",
  );
  const usable = REQUIRED_CAPABILITIES.filter((capability) =>
    isUsable(investigation.sourceStatuses, capability),
  );
  if (usable.length === 0) {
    // With no usable dataset there is no evidence whose quality could be
    // scored, so this component awards nothing rather than a residual.
    return {
      key: "quality",
      label: "Warning and schema quality",
      value: 0,
      maximum: QUALITY_MAXIMUM,
      detail: "No required dataset returned usable records.",
      evidenceIds: warnings.map((_, index) => warningEvidenceId(index)),
    };
  }
  // Each upstream warning and each failed source removes 2 points.
  const penalty = (warnings.length + failed.length) * 2;
  return {
    key: "quality",
    label: "Warning and schema quality",
    value: Math.max(0, QUALITY_MAXIMUM - penalty),
    maximum: QUALITY_MAXIMUM,
    detail:
      `${warnings.length} upstream warnings and ${failed.length} failed ` +
      `sources; 2 points removed each.`,
    evidenceIds: warnings.map((_, index) => warningEvidenceId(index)),
  };
}
