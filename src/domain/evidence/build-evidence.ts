/**
 * Turns a normalized investigation into the evidence ledger.
 *
 * Observations are recorded before any interpretation, contradicting items are
 * kept alongside supporting ones (02-product-rules 1.6), and a missing value
 * produces no evidence rather than a zero-valued one (rule 1.4).
 */

import type {
  Actor,
  NormalizedInvestigation,
  Relationship,
  SegmentFlow,
  SourceMeta,
  TokenContext,
} from "../investigation/investigation";
import { segmentLabel } from "../scoring/calculate-direction";
import type { Evidence } from "./evidence";
import {
  actorEvidenceId,
  flowEvidenceId,
  relationshipEvidenceId,
  tokenContextEvidenceId,
  warningEvidenceId,
} from "./evidence";
import { formatCount, formatSignedUsd, formatUsd } from "./format-value";

export function buildObservationEvidence(
  investigation: NormalizedInvestigation,
): readonly Evidence[] {
  return [
    ...tokenContextEvidence(investigation.tokenContext),
    ...investigation.segmentFlows.flatMap(segmentFlowEvidence),
    ...actorEvidence(investigation.buyers),
    ...actorEvidence(investigation.sellers),
    ...relationshipEvidence(investigation.relationships),
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
