/**
 * Token Screener response to domain token context.
 *
 * The screener returns a list, so the record for the requested address is
 * selected explicitly rather than taking the first row. A response that
 * contains no matching record resolves to null, which the caller reports as
 * "token not found" rather than as an empty context.
 */

import type {
  SourceMeta,
  TokenContext,
} from "@/domain/investigation/investigation";
import type { TokenScreenerRecord } from "../schemas/token-screener";

export function normalizeTokenScreener(
  records: readonly TokenScreenerRecord[],
  requestedAddress: string,
  source: SourceMeta,
): TokenContext | null {
  const wanted = requestedAddress.toLowerCase();
  const record =
    records.find(
      (candidate) => candidate.token_address?.toLowerCase() === wanted,
    ) ?? null;

  if (record === null) return null;

  return {
    // The screener carries no token name field, only a symbol. A missing name
    // stays missing rather than being filled from the symbol.
    name: null,
    symbol: record.token_symbol,
    liquidityUsd: record.liquidity,
    marketCapUsd: record.market_cap_usd,
    volumeUsd: record.volume,
    priceChangePercent: record.price_change,
    source,
  };
}
