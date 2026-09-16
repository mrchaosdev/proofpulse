import { NextResponse } from "next/server";
import { MAX_BODY_BYTES } from "@/server/investigations/investigation-request";
import { validateRelationshipRequest } from "@/server/investigations/relationship-request";
import { expandRelationships } from "@/server/investigations/relationship-service";
import { sharedCache } from "@/server/cache/shared-cache";
import {
  MemoryRateLimiter,
  RELATIONSHIP_RULE,
} from "@/server/rate-limit/rate-limiter";
import {
  hashIdentifier,
  newRequestId,
} from "@/server/observability/request-id";

/**
 * POST /api/investigations/relationships
 *
 * On-demand first-degree expansion for one actor already present in the
 * investigation (02-product-rules 4.3).
 */

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
      retryable: status === 429,
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

  const validation = validateRelationshipRequest(parsedBody);
  if (!validation.ok) {
    return errorResponse("INVALID_INPUT", validation.message, 400, requestId);
  }

  const bucket = hashIdentifier(
    request.headers.get("x-forwarded-for") ?? "local",
  );
  const decision = limiter.check(bucket, RELATIONSHIP_RULE);
  if (!decision.allowed) {
    return errorResponse(
      "NANSEN_RATE_LIMIT",
      "Too many relationship expansions from this client.",
      429,
      requestId,
      decision.retryAfterSeconds,
    );
  }

  const outcome = await expandRelationships(validation.request, {
    cache: sharedCache,
    now: () => new Date(),
  });

  if (!outcome.ok) {
    return errorResponse(outcome.code, outcome.message, 409, requestId);
  }

  return NextResponse.json({
    relationships: outcome.relationships,
    status: outcome.status,
    requestId,
  });
}
