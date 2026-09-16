/**
 * On-demand relationship expansion.
 *
 * The rules under test: nothing is fetched until an actor is chosen, the actor
 * must belong to the investigation, and an expansion is never repeated at full
 * price within its cache window.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryCacheStore } from "@/server/cache/cache-store";
import { expandRelationships } from "@/server/investigations/relationship-service";
import { runInvestigation } from "@/server/investigations/investigation-service";
import { validateRelationshipRequest } from "@/server/investigations/relationship-request";

import flowFixture from "../fixtures/nansen/flow-intelligence.json";
import screenerFixture from "../fixtures/nansen/token-screener.json";
import buyFixture from "../fixtures/nansen/who-bought-sold-buy.json";
import sellFixture from "../fixtures/nansen/who-bought-sold-sell.json";
import relatedFixture from "../fixtures/nansen/related-wallets.json";

const TOKEN_ADDRESS = "0x514910771af9ca656af840dff83e8264ecf986ca";
const TOP_BUYER = "0x19a99f5b363f2dbb7a35cb0b16f96b3f3ae2c280";
const STRANGER = "0x1111111111111111111111111111111111111111";
const NOW = new Date("2026-09-16T12:00:00.000Z");

let calls: string[] = [];

function jsonResponse(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const ROUTES: Record<string, unknown> = {
  "/token-screener": screenerFixture.body,
  "/tgm/flow-intelligence": flowFixture.body,
  "/tgm/who-bought-sold": buyFixture.body,
  "/profiler/address/related-wallets": relatedFixture.body,
};

beforeEach(() => {
  vi.stubEnv("NANSEN_API_KEY", "test-key-not-a-real-credential");
  calls = [];
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string, init?: RequestInit) => {
      const path = new URL(url).pathname.replace("/api/v1", "");
      calls.push(path);
      if (path === "/tgm/who-bought-sold") {
        const body: unknown =
          typeof init?.body === "string" ? JSON.parse(init.body) : {};
        const side = (body as { buy_or_sell?: string }).buy_or_sell;
        return Promise.resolve(
          jsonResponse(
            200,
            side === "SELL" ? sellFixture.body : buyFixture.body,
          ),
        );
      }
      return Promise.resolve(jsonResponse(200, ROUTES[path] ?? {}));
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

const liveScope = {
  chain: "ethereum",
  tokenAddress: TOKEN_ADDRESS,
  timeframe: "1d",
  mode: "live",
} as const;

describe("request validation", () => {
  it("rejects an actor address that is malformed for the chain", () => {
    const validation = validateRelationshipRequest({
      ...liveScope,
      actorAddress: "not-an-address",
    });

    expect(validation.ok).toBe(false);
    expect(calls).toHaveLength(0);
  });

  it("canonicalizes the actor address", () => {
    const validation = validateRelationshipRequest({
      ...liveScope,
      actorAddress: TOP_BUYER.toUpperCase().replace("0X", "0x"),
    });

    if (!validation.ok) throw new Error("expected a valid request");
    expect(validation.request.actorAddress).toBe(TOP_BUYER);
  });
});

describe("expandRelationships", () => {
  it("refuses when the investigation is not cached, without calling Nansen", async () => {
    const outcome = await expandRelationships(
      { ...liveScope, actorAddress: TOP_BUYER },
      dependencies(),
    );

    expect(outcome.ok).toBe(false);
    if (outcome.ok) throw new Error("expected a refusal");
    expect(outcome.code).toBe("INVESTIGATION_EXPIRED");
    expect(calls).toHaveLength(0);
  });

  it("refuses an address that is not an actor in the investigation", async () => {
    const shared = dependencies();
    await runInvestigation(liveScope, shared);
    calls = [];

    const outcome = await expandRelationships(
      { ...liveScope, actorAddress: STRANGER },
      shared,
    );

    expect(outcome.ok).toBe(false);
    if (outcome.ok) throw new Error("expected a refusal");
    expect(outcome.code).toBe("ACTOR_NOT_IN_INVESTIGATION");
    // The refusal must not have cost a credit.
    expect(calls).toHaveLength(0);
  });

  it("expands an actor that belongs to the investigation", async () => {
    const shared = dependencies();
    await runInvestigation(liveScope, shared);
    calls = [];

    const outcome = await expandRelationships(
      { ...liveScope, actorAddress: TOP_BUYER },
      shared,
    );

    if (!outcome.ok) throw new Error("expected an expansion");
    expect(outcome.relationships.length).toBeGreaterThan(0);
    expect(calls).toStrictEqual(["/profiler/address/related-wallets"]);
  });

  it("preserves the Nansen relation type verbatim", async () => {
    const shared = dependencies();
    await runInvestigation(liveScope, shared);

    const outcome = await expandRelationships(
      { ...liveScope, actorAddress: TOP_BUYER },
      shared,
    );

    if (!outcome.ok) throw new Error("expected an expansion");
    const relations = new Set(
      outcome.relationships.map((relationship) => relationship.relation),
    );
    expect(relations.has("First Funder")).toBe(true);
  });

  it("spends nothing on a repeated expansion of the same actor", async () => {
    const shared = dependencies();
    await runInvestigation(liveScope, shared);
    await expandRelationships(
      { ...liveScope, actorAddress: TOP_BUYER },
      shared,
    );
    calls = [];

    await expandRelationships(
      { ...liveScope, actorAddress: TOP_BUYER },
      shared,
    );

    expect(calls).toHaveLength(0);
  });

  it("serves the captured expansion in fixture mode without any request", async () => {
    const outcome = await expandRelationships(
      { ...liveScope, actorAddress: TOP_BUYER, mode: "fixture" },
      dependencies(),
    );

    if (!outcome.ok) throw new Error("expected an expansion");
    expect(outcome.relationships).toHaveLength(20);
    expect(calls).toHaveLength(0);
    // Fixture evidence must never claim to be live.
    expect(outcome.relationships.every((item) => !item.source.live)).toBe(true);
  });

  it("refuses an actor the fixture never captured", async () => {
    const outcome = await expandRelationships(
      { ...liveScope, actorAddress: STRANGER, mode: "fixture" },
      dependencies(),
    );

    expect(outcome.ok).toBe(false);
  });
});

describe("investigation with an inspected actor", () => {
  it("leaves coordination risk preliminary until an actor is inspected", async () => {
    const result = await runInvestigation(liveScope, dependencies());

    expect(result.scores.coordinationRisk.state).toBe("preliminary");
  });

  it("reaches the assessed state once relationships are fetched", async () => {
    const result = await runInvestigation(
      { ...liveScope, inspectActorAddress: TOP_BUYER },
      dependencies(),
    );

    expect(result.scores.coordinationRisk.state).toBe("assessed");
    expect(result.evidence.some((item) => item.id.startsWith("REL-"))).toBe(
      true,
    );
  });

  it("raises coordination risk when relationship density is added", async () => {
    const preliminary = await runInvestigation(liveScope, dependencies());
    const assessed = await runInvestigation(
      { ...liveScope, inspectActorAddress: TOP_BUYER },
      dependencies(),
    );

    if (
      preliminary.scores.coordinationRisk.state === "not-assessed" ||
      assessed.scores.coordinationRisk.state === "not-assessed"
    ) {
      throw new Error("expected scores");
    }
    expect(assessed.scores.coordinationRisk.value).toBeGreaterThan(
      preliminary.scores.coordinationRisk.value,
    );
  });

  it("ignores an inspect address that is not an actor, and spends nothing", async () => {
    const shared = dependencies();
    await runInvestigation(liveScope, shared);
    calls = [];

    const result = await runInvestigation(
      { ...liveScope, inspectActorAddress: STRANGER },
      shared,
    );

    expect(result.scores.coordinationRisk.state).toBe("preliminary");
    expect(calls).toHaveLength(0);
  });

  it("states that a relationship is observed, never owned", async () => {
    const result = await runInvestigation(
      { ...liveScope, inspectActorAddress: TOP_BUYER },
      dependencies(),
    );
    const relationship = result.evidence.find((item) =>
      item.id.startsWith("REL-"),
    );

    expect(relationship?.statement).toContain("Ownership is unknown.");
    expect(relationship?.polarity).toBe("neutral");
  });
});
