/**
 * Evidence contract.
 *
 * Every displayed analytical claim resolves to one or more evidence IDs
 * (02-product-rules 1.1). Evidence IDs are stable within an investigation,
 * readable, and non-secret (05-data-and-scoring "Evidence IDs").
 */

import type { Segment, SourceMeta } from "../investigation/investigation";

export type EvidenceKind = "observation" | "derivation" | "warning";

export type EvidencePolarity =
  "supports_accumulation" | "supports_distribution" | "neutral";

export type EvidenceUnit = "usd" | "count" | "ratio" | "score";

export type Evidence = {
  readonly id: string;
  readonly kind: EvidenceKind;
  /** Observation stated before any interpretation (DESIGN-RULES 13). */
  readonly statement: string;
  readonly numericValue?: number;
  readonly unit?: EvidenceUnit;
  readonly polarity: EvidencePolarity;
  /** Evidence this item was derived from. Empty for direct observations. */
  readonly sourceEvidenceIds: readonly string[];
  /** Formula or plain-language note, required for derivations (rule 1.3). */
  readonly derivation?: string;
  readonly source: SourceMeta;
};

const SEGMENT_CODES: Readonly<Record<Segment, string>> = {
  smart_trader: "SM",
  top_pnl: "PNL",
  whale: "WHALE",
  fresh_wallet: "FRESH",
  public_figure: "FIGURE",
  exchange: "EXCH",
};

function sequence(index: number): string {
  return String(index + 1).padStart(2, "0");
}

export function flowEvidenceId(segment: Segment, index = 0): string {
  return `FLOW-${SEGMENT_CODES[segment]}-${sequence(index)}`;
}

export function actorEvidenceId(
  side: "buyer" | "seller",
  index: number,
): string {
  return `ACTOR-${side === "buyer" ? "BUY" : "SELL"}-${sequence(index)}`;
}

export function relationshipEvidenceId(
  actorIndex: number,
  targetIndex: number,
): string {
  return `REL-${sequence(actorIndex)}-${sequence(targetIndex)}`;
}

export type DerivationSubject = "DIR" | "CONF" | "COORD";

export function derivationEvidenceId(
  subject: DerivationSubject,
  index = 0,
): string {
  return `DER-${subject}-${sequence(index)}`;
}

export function warningEvidenceId(index: number): string {
  return `WARN-SRC-${sequence(index)}`;
}

export function tokenContextEvidenceId(index = 0): string {
  return `TOKEN-CTX-${sequence(index)}`;
}

export function historyEvidenceId(index = 0): string {
  return `HIST-SM-${sequence(index)}`;
}

export function peerEvidenceId(index = 0): string {
  return `PEER-LIQ-${sequence(index)}`;
}

/** Index for O(1) lookup when validating model output against real evidence. */
export function indexEvidence(
  items: readonly Evidence[],
): ReadonlyMap<string, Evidence> {
  return new Map(items.map((item) => [item.id, item]));
}

export function hasEvidenceId(items: readonly Evidence[], id: string): boolean {
  return items.some((item) => item.id === id);
}
