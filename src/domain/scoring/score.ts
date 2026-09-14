/**
 * Shared score contracts.
 *
 * Direction, Confidence, and Coordination Risk answer different questions and
 * are never merged (02-product-rules 2.1). Every score carries its component
 * breakdown; no score may render without one (rule 2.7).
 */

/** Stored with every investigation so a result can be reproduced. */
export const SCORE_FORMULA_VERSION = "score-v0.1";

export type ScoreComponent = {
  readonly key: string;
  readonly label: string;
  /** Contribution actually applied, in the score's own units. */
  readonly value: number;
  readonly maximum?: number;
  /** Plain-language derivation note or formula (02-product-rules 1.3). */
  readonly detail: string;
  readonly evidenceIds: readonly string[];
};

/**
 * Why a score could not be produced. Rendered as text, never as a zero
 * (04-information-architecture "Score rail").
 */
export type ScoreUnavailableReason =
  | "no-valid-segment-flows"
  | "no-actor-evidence"
  | "relationships-not-requested";

export type DirectionLabel =
  "accumulation-leaning" | "mixed" | "distribution-leaning";

export type ConfidenceLabel =
  "low-confidence" | "medium-confidence" | "high-confidence";

export type CoordinationLabel = "low" | "moderate" | "elevated";

export function directionLabel(value: number): DirectionLabel {
  if (value >= 35) return "accumulation-leaning";
  if (value <= -35) return "distribution-leaning";
  return "mixed";
}

export function confidenceLabel(value: number): ConfidenceLabel {
  if (value >= 70) return "high-confidence";
  if (value >= 45) return "medium-confidence";
  return "low-confidence";
}

export function coordinationLabel(value: number): CoordinationLabel {
  if (value >= 60) return "elevated";
  if (value >= 30) return "moderate";
  return "low";
}

/**
 * Clamps a final numeric result. Intermediate values are never clamped
 * silently; callers record out-of-range intermediates as derivation warnings
 * (05-data-and-scoring "Score safeguards").
 */
export function clamp(value: number, minimum: number, maximum: number): number {
  if (Number.isNaN(value)) return minimum;
  return Math.min(maximum, Math.max(minimum, value));
}

/** Rounding happens only after calculation (05-data-and-scoring). */
export function roundScore(value: number): number {
  return Math.round(value);
}

export function isUsableNumber(
  value: number | null | undefined,
): value is number {
  return typeof value === "number" && Number.isFinite(value);
}
