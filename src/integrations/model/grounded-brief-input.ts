import "server-only";

/**
 * The compact, grounded input a brief generator receives.
 *
 * Evidence statements, token symbols, and wallet labels are untrusted strings
 * from upstream. They are carried as data fields and never concatenated into
 * instructions (02-product-rules 3.2, 07-security-and-privacy "Model safety
 * boundary"), so a token whose name contains an instruction cannot become one.
 */

import type { Evidence } from "@/domain/evidence/evidence";
import type { InvestigationResult } from "@/domain/investigation/investigation-result";

export type GroundedEvidence = {
  readonly id: string;
  readonly kind: Evidence["kind"];
  readonly statement: string;
  readonly numericValue?: number;
  readonly unit?: Evidence["unit"];
  readonly polarity: Evidence["polarity"];
};

export type GroundedBriefInput = {
  readonly scope: {
    readonly chain: string;
    readonly tokenAddress: string;
    readonly timeframe: string;
    readonly mode: "live" | "fixture";
    readonly collectedAt: string;
  };
  readonly scores: {
    readonly direction: number | null;
    readonly directionLabel: string | null;
    readonly confidence: number;
    readonly confidenceLabel: string;
    readonly coordination: number | null;
    readonly coordinationLabel: string | null;
    readonly formulaVersion: string;
  };
  /** The only evidence IDs the brief may cite. */
  readonly evidence: readonly GroundedEvidence[];
  readonly forbidden: readonly string[];
};

const FORBIDDEN_ACTIONS = [
  "Do not recommend a trade, position size, leverage, entry, exit, or price target.",
  "Do not predict price or return.",
  "Do not claim that related wallets share an owner.",
  "Do not cite an evidence ID that is not in the evidence list.",
  "Do not state a number that is not in the evidence you cite.",
  "Say plainly when evidence is mixed, incomplete, or stale.",
];

export function buildGroundedBriefInput(
  result: InvestigationResult,
): GroundedBriefInput {
  const { investigation, scores, evidence } = result;
  const coordination = scores.coordinationRisk;

  return {
    scope: {
      chain: investigation.input.chain,
      tokenAddress: investigation.input.tokenAddress,
      timeframe: investigation.input.timeframe,
      mode: investigation.input.mode,
      collectedAt: investigation.evaluatedAt,
    },
    scores: {
      direction:
        scores.direction.state === "available" ? scores.direction.value : null,
      directionLabel:
        scores.direction.state === "available" ? scores.direction.label : null,
      confidence: scores.confidence.value,
      confidenceLabel: scores.confidence.label,
      coordination:
        coordination.state === "not-assessed" ? null : coordination.value,
      coordinationLabel:
        coordination.state === "not-assessed" ? null : coordination.label,
      formulaVersion: scores.formulaVersion,
    },
    evidence: evidence.map((item) => ({
      id: item.id,
      kind: item.kind,
      statement: item.statement,
      ...(item.numericValue === undefined
        ? {}
        : { numericValue: item.numericValue }),
      ...(item.unit === undefined ? {} : { unit: item.unit }),
      polarity: item.polarity,
    })),
    forbidden: FORBIDDEN_ACTIONS,
  };
}
