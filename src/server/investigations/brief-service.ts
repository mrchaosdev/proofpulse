import "server-only";

/**
 * Brief orchestration.
 *
 * Generation is attempted only when a provider is configured. Whatever comes
 * back is validated against the investigation's own evidence, and anything
 * that fails is discarded in favour of the deterministic brief
 * (02-product-rules 3.6). Model failure never blocks core analytics.
 */

import type { BriefOutcome } from "@/domain/brief/brief-outcome";
import { buildDeterministicBrief } from "@/domain/brief/deterministic-brief";
import { validateBrief } from "@/domain/brief/validate-brief";
import type { InvestigationResult } from "@/domain/investigation/investigation-result";
import type { BriefGenerator } from "@/integrations/model/brief-generator";
import { UnavailableBriefGenerator } from "@/integrations/model/brief-generator";
import { buildGroundedBriefInput } from "@/integrations/model/grounded-brief-input";
import { getAppConfig } from "@/config/app-config";

export type { BriefOutcome } from "@/domain/brief/brief-outcome";

export function defaultBriefGenerator(): BriefGenerator {
  const config = getAppConfig();
  if (config.modelApiKey === undefined || config.modelName === undefined) {
    return new UnavailableBriefGenerator();
  }
  // A configured provider adapter is selected here once one exists. Until
  // then the honest answer is that no generator is available, rather than a
  // silent placeholder that appears to be a model.
  return new UnavailableBriefGenerator();
}

export async function buildBrief(
  result: InvestigationResult,
  generator: BriefGenerator = defaultBriefGenerator(),
): Promise<BriefOutcome> {
  const deterministic = buildDeterministicBrief(
    result.investigation,
    result.scores,
    result.evidence,
  );

  const generated = await generator.generate(buildGroundedBriefInput(result));
  if (!generated.ok) {
    return {
      brief: deterministic,
      fallbackReason:
        generated.code === "MODEL_UNAVAILABLE"
          ? "no-provider"
          : "provider-failed",
      rejections: [],
    };
  }

  const validation = validateBrief(generated.brief, result.evidence);
  if (!validation.ok) {
    return {
      brief: deterministic,
      fallbackReason: "validation-failed",
      rejections: validation.rejections,
    };
  }

  return { brief: validation.brief, fallbackReason: null, rejections: [] };
}
