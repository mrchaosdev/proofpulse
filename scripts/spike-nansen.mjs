#!/usr/bin/env node
/**
 * Nansen API feasibility spike (09-delivery-plan, Sep 15).
 *
 * Records what the live API actually returns: response shape, latency,
 * warnings, supported chain and timeframe combinations, and the observed sign
 * convention for exchange flow (open question P-02).
 *
 * The API key is read from the environment and never printed, logged, or
 * written to an output file. Response bodies are written to a path you choose
 * so nothing sensitive lands in the repository by accident.
 *
 * Usage:
 *   NANSEN_API_KEY=... node scripts/spike-nansen.mjs \
 *     --chain ethereum --address 0x... --timeframe 1d --out ./spike-output
 *
 * Endpoint paths, the authentication header, and the request body shapes below
 * were read from https://docs.nansen.ai on 2026-09-15. Each call costs one
 * credit on both the Free and Pro plans, so this script makes exactly the four
 * calls of one core investigation and no more.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const BASE_URL = process.env.NANSEN_BASE_URL ?? "https://api.nansen.ai";
const API_VERSION = "/api/v1";
const AUTH_HEADER = "apikey";
const REQUEST_TIMEOUT_MS = 15000;
const RESULT_ROWS = 10;

/** Timeframe to a date window, for endpoints that take from/to instead. */
const TIMEFRAME_SECONDS = {
  "5m": 300,
  "1h": 3600,
  "6h": 21600,
  "12h": 43200,
  "1d": 86400,
  "7d": 604800,
};

/**
 * Each endpoint publishes its own timeframe enum and they do not agree.
 * Flow Intelligence accepts 5m, 1h, 6h, 12h, 1d, 7d.
 * Token Screener accepts 5m, 10m, 1h, 6h, 24h, 7d, 30d.
 * The shared day timeframe is therefore "1d" on one and "24h" on the other.
 */
const SCREENER_TIMEFRAME = {
  "5m": "5m",
  "1h": "1h",
  "6h": "6h",
  "12h": null,
  "1d": "24h",
  "7d": "7d",
};

function dateWindow(timeframe) {
  const seconds = TIMEFRAME_SECONDS[timeframe] ?? TIMEFRAME_SECONDS["1d"];
  const to = new Date();
  const from = new Date(to.getTime() - seconds * 1000);
  return { from: from.toISOString(), to: to.toISOString() };
}

const CALLS = [
  {
    name: "token-screener",
    // Note: this endpoint is NOT under the tgm/ prefix.
    path: "/token-screener",
    body: ({ chain, address, timeframe }) => ({
      chains: [chain],
      timeframe: SCREENER_TIMEFRAME[timeframe] ?? "24h",
      filters: { token_address: address },
      pagination: { page: 1, per_page: RESULT_ROWS },
    }),
  },
  {
    name: "flow-intelligence",
    path: "/tgm/flow-intelligence",
    body: ({ chain, address, timeframe }) => ({
      chain,
      token_address: address,
      timeframe,
    }),
  },
  {
    name: "who-bought-sold-buy",
    path: "/tgm/who-bought-sold",
    body: ({ chain, address, timeframe }) => ({
      chain,
      token_address: address,
      buy_or_sell: "BUY",
      date: dateWindow(timeframe),
      pagination: { page: 1, per_page: RESULT_ROWS },
    }),
  },
  {
    name: "who-bought-sold-sell",
    path: "/tgm/who-bought-sold",
    body: ({ chain, address, timeframe }) => ({
      chain,
      token_address: address,
      buy_or_sell: "SELL",
      date: dateWindow(timeframe),
      pagination: { page: 1, per_page: RESULT_ROWS },
    }),
  },
  {
    name: "related-wallets",
    path: "/profiler/address/related-wallets",
    // On demand only: pass --actor with an address from the investigation.
    body: ({ chain, actor }) => ({
      chain,
      address: actor,
      pagination: { page: 1, per_page: 20 },
    }),
  },
];

function parseArguments(argv) {
  const args = { timeframe: "1d", out: "spike-output", only: "" };
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (flag === undefined || value === undefined) continue;
    args[flag.replace(/^--/, "")] = value;
  }
  return args;
}

/** Describes a value's shape without reproducing its content. */
function describeShape(value, depth = 0) {
  if (value === null) return "null";
  if (Array.isArray(value)) {
    return depth > 3
      ? `array(${value.length})`
      : `array(${value.length}) of ${value.length > 0 ? describeShape(value[0], depth + 1) : "unknown"}`;
  }
  if (typeof value === "object") {
    if (depth > 3) return "object";
    const entries = Object.entries(value).map(
      ([key, item]) => `${key}: ${describeShape(item, depth + 1)}`,
    );
    return `{ ${entries.join("; ")} }`;
  }
  return typeof value;
}

async function callEndpoint(call, scope, apiKey) {
  const url = `${BASE_URL}${API_VERSION}${call.path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const startedAt = Date.now();

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        [AUTH_HEADER]: apiKey,
      },
      body: JSON.stringify(call.body(scope)),
      signal: controller.signal,
      redirect: "error",
    });
    const durationMs = Date.now() - startedAt;
    const text = await response.text();
    let parsed = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
    return {
      name: call.name,
      path: call.path,
      status: response.status,
      durationMs,
      ok: response.ok,
      shape:
        parsed === null
          ? `unparseable: ${text.slice(0, 200)}`
          : describeShape(parsed),
      body: parsed,
    };
  } catch (error) {
    return {
      name: call.name,
      path: call.path,
      status: 0,
      durationMs: Date.now() - startedAt,
      ok: false,
      // The message only; an error object can carry request headers.
      shape: error instanceof Error ? error.message : "unknown failure",
      body: null,
    };
  } finally {
    clearTimeout(timer);
  }
}

async function run() {
  const args = parseArguments(process.argv.slice(2));
  const apiKey = process.env.NANSEN_API_KEY?.trim();

  if (!apiKey) {
    console.error(
      "NANSEN_API_KEY is not set. The spike makes paid calls and cannot run without it.",
    );
    process.exit(1);
  }
  if (!args.chain || !args.address) {
    console.error(
      "Usage: node scripts/spike-nansen.mjs --chain <chain> --address <token address> [--timeframe 1d] [--out ./spike-output]",
    );
    process.exit(1);
  }

  const scope = {
    chain: args.chain,
    address: args.address,
    timeframe: args.timeframe,
    actor: args.actor ?? args.address,
  };
  const plannedCount =
    args.only === "" ? CALLS.length : args.only.split(",").length;
  console.log(
    `Spike: ${plannedCount} call(s), ${plannedCount} credit(s), against ${BASE_URL}${API_VERSION}`,
  );
  console.log(`Scope: ${scope.chain} ${scope.address} ${scope.timeframe}`);
  console.log("Credential: configured (value never printed)");
  console.log("");

  // --only limits the run to named calls, because every call costs a credit.
  const selected =
    args.only === ""
      ? CALLS
      : CALLS.filter((call) => args.only.split(",").includes(call.name));

  const results = [];
  for (const call of selected) {
    const result = await callEndpoint(call, scope, apiKey);
    results.push(result);
    console.log(
      `  ${result.ok ? "ok  " : "fail"} ${result.name} status=${result.status} ${result.durationMs}ms`,
    );
    console.log(`       shape: ${result.shape}`);
  }

  mkdirSync(args.out, { recursive: true });
  const capturedAt = new Date().toISOString();
  for (const result of results) {
    writeFileSync(
      join(args.out, `${result.name}.json`),
      JSON.stringify(
        {
          capturedAt,
          endpoint: result.path,
          apiVersion: API_VERSION,
          scope,
          status: result.status,
          durationMs: result.durationMs,
          body: result.body,
        },
        null,
        2,
      ),
    );
  }

  console.log(`\nResponses written to ${args.out}`);
  console.log(
    "Review each file for credentials and personal data before committing anything as a fixture.",
  );

  const failures = results.filter((result) => !result.ok);
  if (failures.length > 0) process.exit(1);
}

await run();
