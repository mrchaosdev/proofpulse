/**
 * Deterministic value rendering for evidence statements.
 *
 * The brief validator compares numbers in generated prose against cited
 * evidence after this same normalization (02-product-rules 3.5), so evidence
 * statements and validation must share one implementation.
 */

const USD_TIERS = [
  { limit: 1_000_000_000, suffix: "B", divisor: 1_000_000_000 },
  { limit: 1_000_000, suffix: "M", divisor: 1_000_000 },
  { limit: 1_000, suffix: "K", divisor: 1_000 },
] as const;

/** Signed compact USD, for example "+$1.2M" or "-$48.0K". */
export function formatSignedUsd(value: number): string {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}$${formatAbsoluteUsd(Math.abs(value))}`;
}

/** Unsigned compact USD, for example "$1.2M". */
export function formatUsd(value: number): string {
  return `$${formatAbsoluteUsd(Math.abs(value))}`;
}

function formatAbsoluteUsd(absolute: number): string {
  for (const tier of USD_TIERS) {
    if (absolute >= tier.limit) {
      return `${(absolute / tier.divisor).toFixed(1)}${tier.suffix}`;
    }
  }
  return absolute.toFixed(0);
}

export function formatCount(value: number): string {
  return String(Math.round(value));
}

export function formatPercent(ratio: number): string {
  return `${(ratio * 100).toFixed(1)}%`;
}

export function formatScore(value: number): string {
  return String(Math.round(value));
}

/**
 * Extracts every number appearing in prose, normalized to plain digits, so a
 * generated sentence can be checked against the evidence it cites.
 */
export function extractNumbers(text: string): readonly string[] {
  // The boundaries matter: without them the digits inside a wallet address
  // ("0xaaa1") or an evidence ID ("FLOW-SM-01") are read as claimed values,
  // and any brief that mentions an address is rejected for citing a number it
  // never stated.
  // The second lookbehind covers a hyphen that joins an identifier, so the
  // "01" in "FLOW-SM-01" and the "09" in a date are not read as values, while
  // a genuine negative such as "-$600.0K" still matches.
  const matches = text.match(
    /(?<![\w$.])(?<!\w-)[+-]?\$?\d[\d,]*(?:\.\d+)?[KMB%]?(?!\w)/g,
  );
  return matches === null ? [] : matches.map(normalizeNumericToken);
}

export function normalizeNumericToken(token: string): string {
  return token.replace(/,/g, "").replace(/^\+/, "").toUpperCase();
}

/**
 * A readable age. Precision drops as the value grows, because "2553 minutes"
 * is a number a reader has to decode rather than an age they can feel.
 */
export function formatAge(seconds: number): string {
  if (seconds < 90) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = seconds / 3600;
  if (hours < 24) {
    const rounded = Math.round(hours);
    return rounded === 1 ? "1 hour ago" : `${rounded} hours ago`;
  }
  const days = seconds / 86400;
  const rounded = Math.round(days * 10) / 10;
  return rounded === 1 ? "1 day ago" : `${rounded} days ago`;
}
