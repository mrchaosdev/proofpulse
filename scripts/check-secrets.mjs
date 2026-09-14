#!/usr/bin/env node
/**
 * Scans tracked source for credentials and for secrets crossing the client
 * boundary (07-security-and-privacy "Secrets").
 *
 * This is a build gate, not a substitute for provider-side key rotation. It
 * prints locations only; it never prints a matched value.
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import process from "node:process";

const SECRET_PATTERNS = [
  {
    name: "generic API key assignment",
    pattern:
      /\b(?:api[_-]?key|apikey|secret|token)\s*[:=]\s*["'][A-Za-z0-9_-]{16,}["']/i,
  },
  { name: "bearer token literal", pattern: /\bBearer\s+[A-Za-z0-9_\-.]{20,}/ },
  { name: "AWS access key id", pattern: /\bAKIA[0-9A-Z]{16}\b/ },
  {
    name: "private key block",
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  },
  { name: "OpenAI-style key", pattern: /\bsk-[A-Za-z0-9]{20,}\b/ },
  { name: "Anthropic-style key", pattern: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/ },
];

const PUBLIC_SECRET = /NEXT_PUBLIC_[A-Z0-9_]*(?:KEY|SECRET|TOKEN|PASSWORD)/;

const SKIP_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".avif",
  ".ico",
  ".woff",
  ".woff2",
  ".ttf",
  ".otf",
  ".pdf",
  ".mp4",
  ".webm",
  ".zip",
]);

const SELF = "scripts/check-secrets.mjs";
const failures = [];

function trackedFiles() {
  const output = execFileSync("git", ["ls-files"], { encoding: "utf8" });
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function extensionOf(file) {
  const dot = file.lastIndexOf(".");
  return dot === -1 ? "" : file.slice(dot);
}

function scan(file) {
  if (file === SELF) return;
  if (SKIP_EXTENSIONS.has(extensionOf(file))) return;
  if (!existsSync(file) || statSync(file).size > 2_000_000) return;

  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, index) => {
    for (const { name, pattern } of SECRET_PATTERNS) {
      if (pattern.test(line)) {
        failures.push(`${file}:${index + 1} possible ${name}`);
      }
    }
    if (PUBLIC_SECRET.test(line)) {
      failures.push(
        `${file}:${index + 1} secret-shaped NEXT_PUBLIC_ variable; secrets are server-only (07-security-and-privacy).`,
      );
    }
  });
}

function checkEnvFilesAreIgnored() {
  const tracked = trackedFiles().filter(
    (file) => /(^|\/)\.env/.test(file) && !file.endsWith(".env.example"),
  );
  for (const file of tracked) {
    failures.push(`${file} is tracked; only .env.example may be committed.`);
  }
}

function checkEnvExampleHasNoValues() {
  if (!existsSync(".env.example")) return;
  const lines = readFileSync(".env.example", "utf8").split("\n");
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) return;
    const [name, ...rest] = trimmed.split("=");
    const value = rest.join("=");
    if (value !== "" && /KEY|SECRET|TOKEN|PASSWORD/i.test(name ?? "")) {
      failures.push(
        `.env.example:${index + 1} ${name} carries a value; the template holds names and safe defaults only.`,
      );
    }
  });
}

function run() {
  for (const file of trackedFiles()) scan(file);
  checkEnvFilesAreIgnored();
  checkEnvExampleHasNoValues();

  if (failures.length === 0) {
    console.log("check-secrets: pass");
    return;
  }
  for (const failure of failures) console.error(failure);
  console.error(`check-secrets: ${failures.length} finding(s)`);
  process.exit(1);
}

run();
