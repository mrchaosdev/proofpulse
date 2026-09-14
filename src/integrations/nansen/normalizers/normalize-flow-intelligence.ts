/**
 * Flow Intelligence response to domain segment flows.
 *
 * Normalization is deliberately separate from the HTTP request and the response
 * schema (CODEBASE-RULES 11), and no provider type escapes this layer.
 */

import type {
  Segment,
  SegmentFlow,
  SourceMeta,
} from "@/domain/investigation/investigation";
import type { FlowIntelligenceRecord } from "../schemas/flow-intelligence";

type SegmentFields = {
  readonly netFlow: keyof FlowIntelligenceRecord;
  readonly averageFlow: keyof FlowIntelligenceRecord;
  readonly walletCount: keyof FlowIntelligenceRecord;
  /**
   * True when the upstream wallet count is documented as never populated. Such
   * a field arrives as 0 but means "not tracked", so it is normalized to null
   * rather than presented as an observed zero (02-product-rules 1.4).
   */
  readonly walletCountUntracked: boolean;
};

const SEGMENT_FIELDS: Readonly<Record<Segment, SegmentFields>> = {
  smart_trader: {
    netFlow: "smart_trader_net_flow_usd",
    averageFlow: "smart_trader_avg_flow_usd",
    walletCount: "smart_trader_wallet_count",
    walletCountUntracked: false,
  },
  top_pnl: {
    netFlow: "top_pnl_net_flow_usd",
    averageFlow: "top_pnl_avg_flow_usd",
    walletCount: "top_pnl_wallet_count",
    walletCountUntracked: false,
  },
  whale: {
    netFlow: "whale_net_flow_usd",
    averageFlow: "whale_avg_flow_usd",
    walletCount: "whale_wallet_count",
    walletCountUntracked: false,
  },
  fresh_wallet: {
    netFlow: "fresh_wallets_net_flow_usd",
    averageFlow: "fresh_wallets_avg_flow_usd",
    walletCount: "fresh_wallets_wallet_count",
    walletCountUntracked: true,
  },
  public_figure: {
    netFlow: "public_figure_net_flow_usd",
    averageFlow: "public_figure_avg_flow_usd",
    walletCount: "public_figure_wallet_count",
    walletCountUntracked: false,
  },
  exchange: {
    netFlow: "exchange_net_flow_usd",
    averageFlow: "exchange_avg_flow_usd",
    walletCount: "exchange_wallet_count",
    walletCountUntracked: true,
  },
};

const SEGMENT_ORDER: readonly Segment[] = [
  "smart_trader",
  "top_pnl",
  "whale",
  "fresh_wallet",
  "public_figure",
  "exchange",
];

export function normalizeFlowIntelligence(
  record: FlowIntelligenceRecord,
  source: SourceMeta,
): readonly SegmentFlow[] {
  return SEGMENT_ORDER.map((segment) => {
    const fields = SEGMENT_FIELDS[segment];
    return {
      segment,
      netFlowUsd: record[fields.netFlow],
      averageFlowUsd: record[fields.averageFlow],
      walletCount: fields.walletCountUntracked
        ? null
        : record[fields.walletCount],
      source,
    };
  });
}
