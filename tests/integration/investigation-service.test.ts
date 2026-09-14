/**
 * Investigation orchestration against a stubbed upstream.
 *
 * These cover the acceptance cases that are about behaviour under failure:
 * invalid input spends nothing, sources fetch independently, a partial result
 * keeps the evidence it has, and a repeated scope spends no extra credits.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryCacheStore } from "@/server/cache/cache-store";
import {
  CORE_INVESTIGATION_RULE,
  MemoryRateLimiter,
} from "@/server/rate-limit/rate-limiter";
import { validateInvestigationRequest } from "@/server/investigations/investigation-request";
import { runInvestigation } from "@/server/investigations/investigation-service";

import flowFixture from "../fixtures/nansen/flow-intelligence.json";
import screenerFixture from "../fixtures/nansen/token-screener.json";
import buyFixture from "../fixtures/nansen/who-bought-sold-buy.json";
import sellFixture from "../fixtures/nansen/who-bought-sold-sell.json";

const TOKEN_ADDRESS = "0x514910771af9ca656af840dff83e8264ecf986ca";
const NOW = new Date("2026-09-15T12:00:00.000Z");

type RouteHandler = (body: unknown) => {
  status: number;
  payload: unknown;
};

let calls: string[] = [];
let routes: Map<string, RouteHandler>;

/** The stub always sends a string body; anything else is a test bug. */
function readBody(init?: RequestInit): unknown {
  const body = init?.body;
  return typeof body === "string" ? JSON.parse(body) : {};
}

function jsonResponse(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function defaultRoutes(): Map<string, RouteHandler> {
  return new Map<string, RouteHandler>([
    ["/token-screener", () => ({ status: 200, payload: screenerFixture.body })],
    [
      "/tgm/flow-intelligence",
      () => ({ status: 200, payload: flowFixture.body }),
    ],
    [
      "/tgm/who-bought-sold",
      (body) => ({
        status: 200,
        payload:
          (body as { buy_or_sell?: string }).buy_or_sell === "SELL"
            ? sellFixture.body
            : buyFixture.body,
      }),
    ],
  ]);
}

beforeEach(() => {
  vi.stubEnv("NANSEN_API_KEY", "test-key-not-a-real-credential");
  vi.resetModules();
  calls = [];
  routes = defaultRoutes();

  vi.stubGlobal(
    "fetch",
    vi.fn((url: string, init?: RequestInit) => {
      const path = new URL(url).pathname.replace("/api/v1", "");
      calls.push(path);
      const handler = routes.get(path);
      if (handler === undefined) {
        return Promise.resolve(jsonResponse(404, { error: "no route" }));
      }
      const { status, payload } = handler(readBody(init));
      return Promise.resolve(jsonResponse(status, payload));
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

function dependencies() {
  return { cache: new MemoryCacheStore(), now: () => NOW };
}

describe("input validation", () => {
  it("rejects an invalid address before any paid call is made", () => {
    const validation = validateInvestigationRequest({
      chain: "ethereum",
      tokenAddress: "not-an-address",
      timeframe: "1d",
    });

    expect(validation.ok).toBe(false);
    expect(calls).toHaveLength(0);
  });

  it("rejects an unknown field rather than ignoring it", () => {
    const validation = validateInvestigationRequest({
      chain: "ethereum",
      tokenAddress: TOKEN_ADDRESS,
      timeframe: "1d",
      limit: 9999,
    });

    expect(validation.ok).toBe(false);
  });

  it("canonicalizes a checksummed address", () => {
    const validation = validateInvestigationRequest({
      chain: "ethereum",
      tokenAddress: TOKEN_ADDRESS.toUpperCase().replace("0X", "0x"),
      timeframe: "1d",
    });

    if (!validation.ok) throw new Error("expected a valid request");
    expect(validation.request.tokenAddress).toBe(TOKEN_ADDRESS);
  });
});

describe("runInvestigation", () => {
  it("spends exactly four calls for one core investigation", async () => {
    await runInvestigation(
      {
        chain: "ethereum",
        tokenAddress: TOKEN_ADDRESS,
        timeframe: "1d",
        mode: "live",
      },
      dependencies(),
    );

    expect(calls).toHaveLength(4);
  });

  it("translates the timeframe per endpoint", async () => {
    const bodies: Record<string, unknown> = {};
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string, init?: RequestInit) => {
        const path = new URL(url).pathname.replace("/api/v1", "");
        bodies[path] = readBody(init);
        const handler = defaultRoutes().get(path);
        const { status, payload } = handler?.(bodies[path]) ?? {
          status: 404,
          payload: {},
        };
        return Promise.resolve(jsonResponse(status, payload));
      }),
    );

    await runInvestigation(
      {
        chain: "ethereum",
        tokenAddress: TOKEN_ADDRESS,
        timeframe: "1d",
        mode: "live",
      },
      dependencies(),
    );

    expect(bodies["/tgm/flow-intelligence"]).toMatchObject({
      timeframe: "1d",
    });
    // The screener rejects "1d"; it needs "24h" for the same window.
    expect(bodies["/token-screener"]).toMatchObject({ timeframe: "24h" });
    // Who Bought/Sold has no timeframe at all.
    expect(bodies["/tgm/who-bought-sold"]).not.toHaveProperty("timeframe");
  });

  it("produces scores from a fully successful investigation", async () => {
    const result = await runInvestigation(
      {
        chain: "ethereum",
        tokenAddress: TOKEN_ADDRESS,
        timeframe: "1d",
        mode: "live",
      },
      dependencies(),
    );

    expect(result.scores.direction.state).toBe("available");
    expect(result.scores.confidence.value).toBeGreaterThan(0);
    expect(result.scores.coordinationRisk.state).toBe("preliminary");
  });

  it("keeps evidence from the sources that succeeded when one fails", async () => {
    routes.set("/tgm/who-bought-sold", () => ({
      status: 500,
      payload: { error: "upstream" },
    }));

    const result = await runInvestigation(
      {
        chain: "ethereum",
        tokenAddress: TOKEN_ADDRESS,
        timeframe: "1d",
        mode: "live",
      },
      dependencies(),
    );

    expect(result.scores.direction.state).toBe("available");
    expect(result.evidence.some((item) => item.id.startsWith("FLOW-"))).toBe(
      true,
    );
    expect(
      result.investigation.sourceStatuses.filter(
        (status) => status.state === "error",
      ),
    ).toHaveLength(2);
  });

  it("lowers confidence when a source fails", async () => {
    const complete = await runInvestigation(
      {
        chain: "ethereum",
        tokenAddress: TOKEN_ADDRESS,
        timeframe: "1d",
        mode: "live",
      },
      dependencies(),
    );

    routes.set("/tgm/flow-intelligence", () => ({
      status: 504,
      payload: { error: "timeout" },
    }));
    const degraded = await runInvestigation(
      {
        chain: "ethereum",
        tokenAddress: TOKEN_ADDRESS,
        timeframe: "1d",
        mode: "live",
      },
      dependencies(),
    );

    expect(degraded.scores.confidence.value).toBeLessThan(
      complete.scores.confidence.value,
    );
  });

  it("reports exhausted credits without retrying", async () => {
    routes.set("/tgm/flow-intelligence", () => ({
      status: 402,
      payload: { error: "no credits" },
    }));

    const result = await runInvestigation(
      {
        chain: "ethereum",
        tokenAddress: TOKEN_ADDRESS,
        timeframe: "1d",
        mode: "live",
      },
      dependencies(),
    );
    const flowStatus = result.investigation.sourceStatuses.find(
      (status) => status.capability === "cohort-flows",
    );

    if (flowStatus?.state !== "error") throw new Error("expected an error");
    expect(flowStatus.code).toBe("NANSEN_CREDITS");
    expect(flowStatus.retryable).toBe(false);
    // One attempt only: a 402 must never become a retry loop.
    expect(
      calls.filter((path) => path === "/tgm/flow-intelligence"),
    ).toHaveLength(1);
  });

  it("retries a rate limit exactly once", async () => {
    routes.set("/tgm/flow-intelligence", () => ({
      status: 429,
      payload: { error: "slow down" },
    }));

    await runInvestigation(
      {
        chain: "ethereum",
        tokenAddress: TOKEN_ADDRESS,
        timeframe: "1d",
        mode: "live",
      },
      dependencies(),
    );

    expect(
      calls.filter((path) => path === "/tgm/flow-intelligence"),
    ).toHaveLength(2);
  });

  it("spends no credits on a repeated scope within the cache window", async () => {
    const shared = dependencies();
    await runInvestigation(
      {
        chain: "ethereum",
        tokenAddress: TOKEN_ADDRESS,
        timeframe: "1d",
        mode: "live",
      },
      shared,
    );
    const firstCallCount = calls.length;

    await runInvestigation(
      {
        chain: "ethereum",
        tokenAddress: TOKEN_ADDRESS,
        timeframe: "1d",
        mode: "live",
      },
      shared,
    );

    expect(firstCallCount).toBe(4);
    expect(calls).toHaveLength(4);
  });

  it("does not reuse a cache entry across timeframes", async () => {
    const shared = dependencies();
    await runInvestigation(
      {
        chain: "ethereum",
        tokenAddress: TOKEN_ADDRESS,
        timeframe: "1d",
        mode: "live",
      },
      shared,
    );
    await runInvestigation(
      {
        chain: "ethereum",
        tokenAddress: TOKEN_ADDRESS,
        timeframe: "7d",
        mode: "live",
      },
      shared,
    );

    expect(calls).toHaveLength(8);
  });

  it("never caches a failed source", async () => {
    routes.set("/tgm/flow-intelligence", () => ({
      status: 500,
      payload: { error: "upstream" },
    }));
    const shared = dependencies();

    await runInvestigation(
      {
        chain: "ethereum",
        tokenAddress: TOKEN_ADDRESS,
        timeframe: "1d",
        mode: "live",
      },
      shared,
    );
    const afterFirst = calls.filter(
      (path) => path === "/tgm/flow-intelligence",
    ).length;

    await runInvestigation(
      {
        chain: "ethereum",
        tokenAddress: TOKEN_ADDRESS,
        timeframe: "1d",
        mode: "live",
      },
      shared,
    );
    const afterSecond = calls.filter(
      (path) => path === "/tgm/flow-intelligence",
    ).length;

    expect(afterSecond).toBeGreaterThan(afterFirst);
  });

  it("reports a schema mismatch as a schema error, not as empty data", async () => {
    routes.set("/tgm/flow-intelligence", () => ({
      status: 200,
      payload: { unexpected: true },
    }));

    const result = await runInvestigation(
      {
        chain: "ethereum",
        tokenAddress: TOKEN_ADDRESS,
        timeframe: "1d",
        mode: "live",
      },
      dependencies(),
    );
    const status = result.investigation.sourceStatuses.find(
      (item) => item.capability === "cohort-flows",
    );

    if (status?.state !== "error") throw new Error("expected an error");
    expect(status.code).toBe("NANSEN_SCHEMA");
  });
});

describe("rate limiting", () => {
  it("allows the configured number of investigations then refuses", () => {
    const limiter = new MemoryRateLimiter(() => NOW.getTime());

    for (let index = 0; index < CORE_INVESTIGATION_RULE.limit; index += 1) {
      expect(limiter.check("bucket", CORE_INVESTIGATION_RULE).allowed).toBe(
        true,
      );
    }
    const refused = limiter.check("bucket", CORE_INVESTIGATION_RULE);

    expect(refused.allowed).toBe(false);
    expect(refused.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("keeps buckets independent", () => {
    const limiter = new MemoryRateLimiter(() => NOW.getTime());

    for (let index = 0; index < CORE_INVESTIGATION_RULE.limit; index += 1) {
      limiter.check("first", CORE_INVESTIGATION_RULE);
    }

    expect(limiter.check("second", CORE_INVESTIGATION_RULE).allowed).toBe(true);
  });
});
