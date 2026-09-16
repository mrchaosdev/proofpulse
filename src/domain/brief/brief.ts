/**
 * Brief contract (05-data-and-scoring "Brief contract").
 *
 * A brief is prose that is only ever assembled from evidence already present
 * in the investigation. `provenance` records whether a model wrote it or
 * whether the deterministic fallback did, and the interface always shows which.
 */

export type BriefClaim = {
  readonly text: string;
  /** Evidence IDs that must exist in the same investigation. */
  readonly evidenceIds: readonly string[];
};

export type BriefProvenance = "model" | "deterministic";

export type InvestigationBrief = {
  /** Observed state, at most OBSERVATION_WORD_LIMIT words. */
  readonly observation: string;
  readonly support: readonly BriefClaim[];
  readonly contradiction: readonly BriefClaim[];
  readonly invalidationConditions: readonly BriefClaim[];
  readonly limitations: readonly string[];
  readonly provenance: BriefProvenance;
};

export const OBSERVATION_WORD_LIMIT = 80;

export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed === "" ? 0 : trimmed.split(/\s+/).length;
}

/** Why the deterministic brief is showing, when it is. */
export type BriefFallbackReason =
  "no-provider" | "provider-failed" | "validation-failed";
