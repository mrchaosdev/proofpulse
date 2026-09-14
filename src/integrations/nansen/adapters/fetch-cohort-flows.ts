import "server-only";

/** Flow Intelligence adapter: primary directional evidence. */

import type { Chain, Timeframe } from "@/domain/investigation/scope";
import type { SegmentFlow } from "@/domain/investigation/investigation";
import { callNansen } from "../nansen-client";
import { ENDPOINTS, flowTimeframe } from "../nansen-endpoints";
import { flowIntelligenceResponseSchema } from "../schemas/flow-intelligence";
import { normalizeFlowIntelligence } from "../normalizers/normalize-flow-intelligence";
import type { AdapterOutcome } from "./adapter-result";
import { failureStatus, schemaErrorStatus, sourceMeta } from "./adapter-result";

const CAPABILITY = ENDPOINTS.flowIntelligence.capability;

export async function fetchCohortFlows(input: {
  readonly chain: Chain;
  readonly tokenAddress: string;
  readonly timeframe: Timeframe;
  readonly collectedAt: string;
}): Promise<AdapterOutcome<readonly SegmentFlow[]>> {
  const result = await callNansen({
    path: ENDPOINTS.flowIntelligence.path,
    body: {
      chain: input.chain,
      token_address: input.tokenAddress,
      timeframe: flowTimeframe(input.timeframe),
    },
  });

  if (!result.ok) {
    return { data: null, status: failureStatus(CAPABILITY, result) };
  }

  const parsed = flowIntelligenceResponseSchema.safeParse(result.body);
  if (!parsed.success) {
    return { data: null, status: schemaErrorStatus(CAPABILITY) };
  }

  // Upstream warnings are preserved and lower Confidence (rule 1.7).
  const meta = sourceMeta(
    CAPABILITY,
    input.collectedAt,
    parsed.data.warnings,
    true,
  );
  const record = parsed.data.data[0];
  if (record === undefined) {
    return {
      data: null,
      status: { state: "empty", capability: CAPABILITY, source: meta },
    };
  }

  const flows = normalizeFlowIntelligence(record, meta);
  return {
    data: flows,
    status: {
      state: "ready",
      capability: CAPABILITY,
      source: meta,
      recordCount: flows.length,
    },
  };
}
