import "server-only";

/**
 * Server-only Nansen HTTP client.
 *
 * Owns authenticated headers, bounded timeouts, one bounded retry for safe
 * transient failures, and mapping of upstream status codes to stable,
 * provider-independent error codes. No upstream body, header, or credential
 * crosses back out of this module (07-security-and-privacy).
 */

import { getAppConfig } from "@/config/app-config";
import type { SourceErrorCode } from "@/domain/investigation/investigation";
import { NANSEN_API_VERSION, NANSEN_AUTH_HEADER } from "./nansen-endpoints";

export const REQUEST_TIMEOUT_MS = 8_000;

export type NansenFailure = {
  readonly ok: false;
  readonly code: SourceErrorCode;
  readonly retryable: boolean;
  readonly message: string;
  /** Upstream correlation id when present; safe to surface. */
  readonly upstreamRequestId?: string;
};

export type NansenSuccess = {
  readonly ok: true;
  readonly body: unknown;
  readonly durationMs: number;
};

export type NansenResult = NansenSuccess | NansenFailure;

/** Status codes worth one retry; everything else fails immediately. */
function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 502 || status === 503 || status === 504;
}

function mapStatus(status: number): {
  code: SourceErrorCode;
  retryable: boolean;
  message: string;
} {
  switch (status) {
    case 401:
    case 403:
      return {
        code: "NANSEN_AUTH",
        retryable: false,
        message: "The Nansen credential was rejected.",
      };
    case 402:
      return {
        code: "NANSEN_CREDITS",
        retryable: false,
        message: "Nansen API credits are exhausted.",
      };
    case 404:
      return {
        code: "TOKEN_NOT_FOUND",
        retryable: false,
        message: "Nansen returned no record for this scope.",
      };
    case 422:
      return {
        code: "UNSUPPORTED_SCOPE",
        retryable: false,
        message:
          "Nansen rejected this chain, timeframe, or address combination.",
      };
    case 429:
      return {
        code: "NANSEN_RATE_LIMIT",
        retryable: true,
        message: "Nansen rate limit reached.",
      };
    default:
      return {
        code: "INTERNAL",
        retryable: isRetryableStatus(status),
        message: `Nansen returned an unexpected status ${status}.`,
      };
  }
}

/** Reads an upstream correlation id without trusting the rest of the body. */
function readRequestId(body: unknown): string | undefined {
  if (typeof body !== "object" || body === null) return undefined;
  const value = (body as Record<string, unknown>).request_id;
  return typeof value === "string" ? value : undefined;
}

export type NansenRequest = {
  readonly path: string;
  readonly body: unknown;
};

export async function callNansen(
  request: NansenRequest,
  attempt = 0,
): Promise<NansenResult> {
  const config = getAppConfig();
  if (config.nansenApiKey === undefined) {
    return {
      ok: false,
      code: "NANSEN_AUTH",
      retryable: false,
      message: "No Nansen credential is configured; live mode is unavailable.",
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const startedAt = Date.now();

  try {
    const response = await fetch(
      `${config.nansenBaseUrl}${NANSEN_API_VERSION}${request.path}`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          [NANSEN_AUTH_HEADER]: config.nansenApiKey,
        },
        body: JSON.stringify(request.body),
        signal: controller.signal,
        // A redirect to another origin is refused rather than followed.
        redirect: "error",
      },
    );

    const text = await response.text();
    let parsed: unknown = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }

    if (response.ok) {
      return { ok: true, body: parsed, durationMs: Date.now() - startedAt };
    }

    const mapped = mapStatus(response.status);
    if (mapped.retryable && attempt === 0) {
      return callNansen(request, attempt + 1);
    }
    const requestId = readRequestId(parsed);
    return {
      ok: false,
      ...mapped,
      ...(requestId === undefined ? {} : { upstreamRequestId: requestId }),
    };
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    if (!aborted && attempt === 0) {
      return callNansen(request, attempt + 1);
    }
    return {
      ok: false,
      code: aborted ? "NANSEN_TIMEOUT" : "INTERNAL",
      retryable: true,
      message: aborted
        ? `Nansen did not respond within ${REQUEST_TIMEOUT_MS / 1000} seconds.`
        : "The Nansen request could not be completed.",
    };
  } finally {
    clearTimeout(timer);
  }
}
