/**
 * Parsed, validated configuration.
 *
 * Product code does not read environment variables outside this folder
 * (CODEBASE-RULES 3). Every value here is server-only: importing this module
 * from a client component is a build-time error by design, because no value is
 * exposed through a public prefix (07-security-and-privacy "Secrets").
 */

import "server-only";
import { z } from "zod";

const configSchema = z.object({
  nansenApiKey: z.string().min(1).optional(),
  nansenBaseUrl: z.url().default("https://api.nansen.ai"),
  modelApiKey: z.string().min(1).optional(),
  modelName: z.string().min(1).optional(),
  cacheUrl: z.url().optional(),
  cacheToken: z.string().min(1).optional(),
  appMode: z.enum(["live", "fixture"]).default("fixture"),
  fixtureSet: z.string().min(1).default("demo-investigation"),
});

export type AppConfig = z.infer<typeof configSchema>;

function optional(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed === undefined || trimmed === "" ? undefined : trimmed;
}

let cached: AppConfig | null = null;

export function getAppConfig(): AppConfig {
  if (cached !== null) return cached;

  const parsed = configSchema.safeParse({
    nansenApiKey: optional(process.env.NANSEN_API_KEY),
    nansenBaseUrl: optional(process.env.NANSEN_BASE_URL),
    modelApiKey: optional(process.env.MODEL_API_KEY),
    modelName: optional(process.env.MODEL_NAME),
    cacheUrl: optional(process.env.CACHE_URL),
    cacheToken: optional(process.env.CACHE_TOKEN),
    appMode: optional(process.env.APP_MODE),
    fixtureSet: optional(process.env.FIXTURE_SET),
  });

  if (!parsed.success) {
    // Field names only. A rejected value is never echoed, because it may be a
    // credential (07-security-and-privacy "Secrets").
    const fields = parsed.error.issues
      .map((issue) => issue.path.join("."))
      .join(", ");
    throw new Error(`Invalid application configuration: ${fields}`);
  }

  cached = parsed.data;
  return cached;
}

/**
 * Whether live mode can run at all. Reported as a boolean; the credential
 * itself, its length, and its prefix never appear in logs or responses.
 */
export function isLiveModeAvailable(): boolean {
  return getAppConfig().nansenApiKey !== undefined;
}

/** Effective data source, accounting for a missing credential. */
export function getEffectiveMode(): "live" | "fixture" {
  const config = getAppConfig();
  return config.appMode === "live" && config.nansenApiKey !== undefined
    ? "live"
    : "fixture";
}
