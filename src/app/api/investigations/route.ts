import { NextResponse } from "next/server";
import { validateInvestigationRequest } from "@/server/investigations/investigation-request";
import { MAX_BODY_BYTES } from "@/server/investigations/investigation-request";
import { runInvestigation } from "@/server/investigations/investigation-service";
import { MemoryCacheStore } from "@/server/cache/cache-store";
import {
  CORE_INVESTIGATION_RULE,
  MemoryRateLimiter,
} from "@/server/rate-limit/rate-limiter";
import {
  hashIdentifier,
  newRequestId,
} from "@/server/observability/request-id";

/**
 * POST /api/investigations
 *
 * Validates method, content type, body size, and input schema, and enforces a
 * rate limit, all before any external work (CODEBASE-RULES 9).
 */

// Module-scope instances keep the vertical slice self-contained. They are
// replaced by the shared cache and limiter when a deployment target is chosen.
const cache = new MemoryCacheStore();
const limiter = new MemoryRateLimiter();

function errorResponse(
  code: string,
  message: string,
  status: number,
  requestId: string,
  retryAfterSeconds?: number,
) {
  return NextResponse.json(
    {
      code,
      message,
      retryable: status >= 500 || status === 429,
      requestId,
      ...(retryAfterSeconds === undefined ? {} : { retryAfterSeconds }),
    },
    { status },
  );
}

export async function POST(request: Request) {
  const requestId = newRequestId();

  if (
    request.headers.get("content-type")?.includes("application/json") !== true
  ) {
    return errorResponse(
      "INVALID_INPUT",
      "Expected a JSON request body.",
      415,
      requestId,
    );
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return errorResponse(
      "INVALID_INPUT",
      "The request body is too large.",
      413,
      requestId,
    );
  }

  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(raw);
  } catch {
    return errorResponse(
      "INVALID_INPUT",
      "The request body is not valid JSON.",
      400,
      requestId,
    );
  }

  const validation = validateInvestigationRequest(parsedBody);
  if (!validation.ok) {
    // No paid call has been made at this point (acceptance case P-02).
    return errorResponse("INVALID_INPUT", validation.message, 400, requestId);
  }

  const bucket = hashIdentifier(
    request.headers.get("x-forwarded-for") ?? "local",
  );
  const decision = limiter.check(bucket, CORE_INVESTIGATION_RULE);
  if (!decision.allowed) {
    return errorResponse(
      "NANSEN_RATE_LIMIT",
      "Too many investigations from this client. Try again shortly.",
      429,
      requestId,
      decision.retryAfterSeconds,
    );
  }

  const result = await runInvestigation(validation.request, {
    cache,
    now: () => new Date(),
  });

  return NextResponse.json({ ...result, requestId });
}
