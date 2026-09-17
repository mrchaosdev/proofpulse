/**
 * Turns a normalized investigation into the evidence ledger.
 *
 * Observations are recorded before any interpretation, contradicting items are
 * kept alongside supporting ones (02-product-rules 1.6), and a missing value
 * produces no evidence rather than a zero-valued one (rule 1.4).
 */

import type {
  Actor,
  LiquidityPeers,
  NormalizedInvestigation,
  Relationship,
  SegmentFlow,
  SmartMoneyHistory,
  SourceMeta,
  TokenContext,
} from "../investigation/investigation";
import { positionChange } from "../investigation/position-change";
import { segmentLabel } from "../scoring/calculate-direction";
import type { Evidence } from "./evidence";
import {
  actorEvidenceId,
  flowEvidenceId,
  historyEvidenceId,
  peerEvidenceId,
  relationshipEvidenceId,
  tokenContextEvidenceId,
  warningEvidenceId,
} from "./evidence";
import {
  formatCount,
  formatSignedUsd,
  formatTokenAmount,
  formatUsd,
} from "./format-value";

export function buildObservationEvidence(
  investigation: NormalizedInvestigation,
): readonly Evidence[] {
  return [
    ...tokenContextEvidence(investigation.tokenContext),
    ...investigation.segmentFlows.flatMap(segmentFlowEvidence),
    ...actorEvidence(investigation.buyers),
    ...actorEvidence(investigation.sellers),
    ...relationshipEvidence(investigation.relationships),
    ...historyEvidence(investigation.smartMoneyHistory),
    ...peerEvidence(investigation.liquidityPeers, investigation.tokenContext),
    ...warningEvidence(investigation),
  ];
}

function tokenContextEvidence(
  context: TokenContext | null,
): readonly Evidence[] {
  if (context === null) return [];
  const items: Evidence[] = [];
  if (context.liquidityUsd !== null) {
    items.push({
      id: tokenContextEvidenceId(0),
      kind: "observation",
      statement: `Reported liquidity was ${formatUsd(context.liquidityUsd)}.`,
      numericValue: context.liquidityUsd,
      unit: "usd",
      polarity: "neutral",
      sourceEvidenceIds: [],
      source: context.source,
    });
  }
  if (context.volumeUsd !== null) {
    items.push({
      id: tokenContextEvidenceId(1),
      kind: "observation",
      statement: `Reported trading volume was ${formatUsd(context.volumeUsd)}.`,
      numericValue: context.volumeUsd,
      unit: "usd",
      polarity: "neutral",
      sourceEvidenceIds: [],
      source: context.source,
    });
  }
  return items;
}

/**
 * The history contributes two observations, not seven.
 *
 * A ledger row per day would bury the finding under its own detail, and the
 * finding is the pair: what the position did, and what its value did over the
 * same week. Only complete days count — the day still filling is not a
 * reading. The daily figures remain in the panel's table.
 */
function historyEvidence(
  history: SmartMoneyHistory | null,
): readonly Evidence[] {
  if (history === null) return [];

  const change = positionChange(history);
  const items: Evidence[] = [];

  if (change !== null) {
    items.push({
      id: historyEvidenceId(0),
      kind: "observation",
      statement:
        `Smart money position moved from ${formatTokenAmount(change.fromAmount)} ` +
        `to ${formatTokenAmount(change.toAmount)} tokens across the complete ` +
        `days of the last seven, a change of ${formatTokenAmount(change.deltaAmount)}.`,
      numericValue: change.deltaAmount,
      unit: "count",
      // Units bought or sold are a direction, and this is the only place the
      // ledger learns it from a position rather than from a flow reading.
      polarity:
        change.deltaAmount > 0
          ? "supports_accumulation"
          : change.deltaAmount < 0
            ? "supports_distribution"
            : "neutral",
      sourceEvidenceIds: [],
      source: history.source,
    });
  }

  const values = history.points
    .map((point) => point.valueUsd)
    .filter((value): value is number => value !== null);

  if (values.length > 1) {
    const low = Math.min(...values);
    const high = Math.max(...values);
    items.push({
      id: historyEvidenceId(1),
      kind: "observation",
      statement:
        `The same position was valued between ${formatUsd(low)} and ` +
        `${formatUsd(high)} over the week. A value range is not a flow.`,
      numericValue: high - low,
      unit: "usd",
      polarity: "neutral",
      sourceEvidenceIds: [],
      source: history.source,
    });
  }

  return items;
}

/**
 * One observation placing the subject's pool depth on a scale, because a
 * liquidity figure on its own says nothing about whether it is deep or thin.
 * The peers themselves are context and are not each a claim about this token.
 */
function peerEvidence(
  peers: LiquidityPeers | null,
  context: TokenContext | null,
): readonly Evidence[] {
  if (peers === null || peers.peers.length === 0) return [];

  const rank = peers.peers.findIndex((peer) => peer.isSubject);
  const deepest = peers.peers[0];
  if (deepest === undefined) return [];

  // The subject's own depth, which is a measurement, rather than its rank,
  // which is only a position within whatever the screener happened to return.
  const subjectLiquidity =
    context?.liquidityUsd ?? peers.peers[rank]?.liquidityUsd ?? null;

  const statement =
    rank === -1
      ? `This token was not among the ${peers.peers.length} deepest ` +
        `non-stablecoin pools returned for the chain. The deepest returned ` +
        `was ${formatUsd(deepest.liquidityUsd ?? 0)}.`
      : `This token held the number ${rank + 1} deepest non-stablecoin pool ` +
        `of ${peers.peers.length} returned for the chain.`;

  return [
    {
      id: peerEvidenceId(0),
      kind: "observation",
      statement,
      // Omitted rather than zeroed when the screener returned no figure.
      ...(subjectLiquidity === null
        ? {}
        : { numericValue: subjectLiquidity, unit: "usd" as const }),
      polarity: "neutral",
      sourceEvidenceIds: [],
      source: peers.source,
    },
  ];
}

function segmentFlowEvidence(flow: SegmentFlow): readonly Evidence[] {
  const items: Evidence[] = [];
  if (flow.netFlowUsd !== null) {
    items.push({
      id: flowEvidenceId(flow.segment),
      kind: "observation",
      statement:
        `${segmentLabel(flow.segment)} net flow was ` +
        `${formatSignedUsd(flow.netFlowUsd)} over the selected timeframe.`,
      numericValue: flow.netFlowUsd,
      unit: "usd",
      polarity: flowPolarity(flow.netFlowUsd),
      sourceEvidenceIds: [],
      source: flow.source,
    });
  }
  if (flow.walletCount !== null) {
    items.push({
      id: flowEvidenceId(flow.segment, 1),
      kind: "observation",
      statement:
        `${segmentLabel(flow.segment)} activity covered ` +
        `${formatCount(flow.walletCount)} wallets.`,
      numericValue: flow.walletCount,
      unit: "count",
      polarity: "neutral",
      sourceEvidenceIds: [],
      source: flow.source,
    });
  }
  return items;
}

/**
 * Exchange flow sign semantics are unverified, so an exchange observation is
 * recorded as context and never assigned a directional polarity
 * (05-data-and-scoring, acceptance case D-03).
 */
function flowPolarity(netFlowUsd: number): Evidence["polarity"] {
  if (netFlowUsd > 0) return "supports_accumulation";
  if (netFlowUsd < 0) return "supports_distribution";
  return "neutral";
}

function actorEvidence(actors: readonly Actor[]): readonly Evidence[] {
  return actors.flatMap((actor, index) => {
    const netUsd = resolveNetUsd(actor);
    if (netUsd === null) return [];
    return [
      {
        id: actorEvidenceId(actor.side, index),
        kind: "observation",
        statement:
          `Actor ${actor.address} recorded ${formatSignedUsd(netUsd)} net ` +
          `${actor.side === "buyer" ? "buying" : "selling"} activity.`,
        numericValue: netUsd,
        unit: "usd",
        polarity:
          actor.side === "buyer"
            ? "supports_accumulation"
            : "supports_distribution",
        sourceEvidenceIds: [],
        source: actor.source,
      } satisfies Evidence,
    ];
  });
}

function resolveNetUsd(actor: Actor): number | null {
  if (actor.netUsd !== null) return actor.netUsd;
  if (actor.boughtUsd !== null && actor.soldUsd !== null) {
    return actor.boughtUsd - actor.soldUsd;
  }
  return null;
}

function relationshipEvidence(
  relationships: readonly Relationship[],
): readonly Evidence[] {
  const actorIndexes = new Map<string, number>();
  const perActorCounts = new Map<string, number>();
  return relationships.map((relationship) => {
    const actorIndex = resolveIndex(actorIndexes, relationship.sourceAddress);
    const targetIndex = perActorCounts.get(relationship.sourceAddress) ?? 0;
    perActorCounts.set(relationship.sourceAddress, targetIndex + 1);
    return {
      id: relationshipEvidenceId(actorIndex, targetIndex),
      kind: "observation",
      // Wording is fixed here so an observed link is never read as ownership
      // (02-product-rules 9.6).
      statement:
        `Nansen reports a "${relationship.relation}" relationship between ` +
        `${relationship.sourceAddress} and ${relationship.targetAddress}. ` +
        `Ownership is unknown.`,
      polarity: "neutral",
      sourceEvidenceIds: [],
      source: relationship.source,
    } satisfies Evidence;
  });
}

function resolveIndex(indexes: Map<string, number>, address: string): number {
  const existing = indexes.get(address);
  if (existing !== undefined) return existing;
  const next = indexes.size;
  indexes.set(address, next);
  return next;
}

function warningEvidence(
  investigation: NormalizedInvestigation,
): readonly Evidence[] {
  const items: Evidence[] = [];
  for (const status of investigation.sourceStatuses) {
    if (status.state === "ready" || status.state === "empty") {
      for (const warning of status.source.warnings) {
        items.push(warningItem(items.length, warning, status.source));
      }
      if (status.state === "empty") {
        items.push(
          warningItem(
            items.length,
            `${status.capability} returned no records for this scope. ` +
              `This is an absence of records, not evidence of no activity.`,
            status.source,
          ),
        );
      }
    }
    if (status.state === "error") {
      items.push(
        warningItem(
          items.length,
          `${status.capability} failed with ${status.code}. ` +
            `Other sources are unaffected.`,
          {
            provider: "nansen",
            capability: status.capability,
            collectedAt: investigation.evaluatedAt,
            live: investigation.input.mode === "live",
            warnings: [],
          },
        ),
      );
    }
  }
  return items;
}

function warningItem(
  index: number,
  statement: string,
  source: SourceMeta,
): Evidence {
  return {
    id: warningEvidenceId(index),
    kind: "warning",
    statement,
    polarity: "neutral",
    sourceEvidenceIds: [],
    source,
  };
}
