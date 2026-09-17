/**
 * Token Screener response to a liquidity peer list.
 *
 * The same endpoint that resolves one token also screens many, so this reads
 * the list form: the most liquid tokens on a chain, for placing the token
 * under investigation among them.
 *
 * These are observations about other tokens and never a comparison in anyone's
 * favour. Nothing here ranks tokens as better or worse, and no row implies a
 * reason to hold one instead of another (02-product-rules: no trading advice).
 */

import type {
  LiquidityPeer,
  LiquidityPeers,
  SourceMeta,
} from "@/domain/investigation/investigation";
import type { TokenScreenerRecord } from "../schemas/token-screener";

/** Rows shown. Enough for a sense of scale without becoming a market table. */
export const MAX_PEER_ROWS = 10;

export function normalizeLiquidityPeers(
  records: readonly TokenScreenerRecord[],
  subjectAddress: string,
  source: SourceMeta,
): LiquidityPeers {
  const subject = subjectAddress.toLowerCase();

  const peers: LiquidityPeer[] = records
    .filter((record) => record.token_address !== null)
    // A row with no liquidity figure cannot sit on a liquidity scale. It is
    // dropped from the comparison rather than plotted at zero.
    .filter((record) => record.liquidity !== null)
    .map((record) => ({
      tokenAddress: record.token_address ?? "",
      symbol: record.token_symbol,
      liquidityUsd: record.liquidity,
      volumeUsd: record.volume,
      netFlowUsd: record.netflow,
      isSubject: (record.token_address ?? "").toLowerCase() === subject,
    }))
    .sort((left, right) => (right.liquidityUsd ?? 0) - (left.liquidityUsd ?? 0))
    .slice(0, MAX_PEER_ROWS);

  return { peers, source };
}
