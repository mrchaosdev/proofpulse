import "server-only";

/**
 * The model boundary (06-technical-architecture "Model boundary").
 *
 * One replaceable server-side interface. The provider never receives an API
 * key belonging to Nansen, raw headers, a user IP, or unnecessary raw response
 * fields (07-security-and-privacy "Model safety boundary").
 */

import type { InvestigationBrief } from "@/domain/brief/brief";
import type { GroundedBriefInput } from "./grounded-brief-input";

export type BriefGenerationResult =
  | { readonly ok: true; readonly brief: InvestigationBrief }
  | {
      readonly ok: false;
      readonly code: "MODEL_UNAVAILABLE" | "MODEL_MALFORMED";
      readonly message: string;
    };

export interface BriefGenerator {
  generate(input: GroundedBriefInput): Promise<BriefGenerationResult>;
}

/**
 * Used when no model credential is configured. Reporting unavailability is the
 * honest outcome; the caller then renders the deterministic brief, which is
 * always available (02-product-rules 3.6).
 */
export class UnavailableBriefGenerator implements BriefGenerator {
  generate(): Promise<BriefGenerationResult> {
    return Promise.resolve({
      ok: false,
      code: "MODEL_UNAVAILABLE",
      message: "No model provider is configured.",
    });
  }
}
