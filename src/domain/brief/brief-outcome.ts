/**
 * The result of asking for a brief: the brief itself, and an honest record of
 * why the deterministic one is showing when it is.
 *
 * This lives in the domain so the interface can render it without importing
 * server code (CODEBASE-RULES 4).
 */

import type { BriefFallbackReason, InvestigationBrief } from "./brief";
import type { BriefRejection } from "./validate-brief";

export type BriefOutcome = {
  readonly brief: InvestigationBrief;
  readonly fallbackReason: BriefFallbackReason | null;
  /** Why generated output was discarded, when it was. */
  readonly rejections: readonly BriefRejection[];
};
