/**
 * Direction: -100..+100.
 *
 * Question: do observed participant flows lean toward distribution or
 * accumulation? This measures flow direction only. It is not a bullish or
 * bearish price probability (02-product-rules 2.2).
 *
 * Formula: 05-data-and-scoring "1. Direction".
 */

import type { Segment, SegmentFlow } from "../investigation/investigation";
import { SEGMENTS } from "../investigation/investigation";
import { flowEvidenceId } from "../evidence/evidence";
import type {
  DirectionLabel,
  ScoreComponent,
  ScoreUnavailableReason,
} from "./score";
import { clamp, directionLabel, isUsableNumber, roundScore } from "./score";

/** Minimum flow scale in USD, so a thin token cannot saturate the score. */
export const MINIMUM_SCALE_USD = 50_000;

/** Fraction of token liquidity used as the flow scale. */
export const LIQUIDITY_SCALE_FRACTION = 0.01;

export const SEGMENT_WEIGHTS: Readonly<Record<Segment, number>> = {
  smart_trader: 0.35,
  top_pnl: 0.25,
  whale: 0.15,
  fresh_wallet: 0.1,
  public_figure: 0.05,
  // Exchange sign semantics are unverified against the live API, so the
  // segment carries zero weight and stays visible as context only
  // (05-data-and-scoring, acceptance case D-03).
  exchange: 0,
};

export type DirectionScore =
  | {
      readonly state: "available";
      readonly value: number;
      readonly label: DirectionLabel;
      readonly scaleUsd: number;
      readonly scaleBasis: "liquidity" | "median-flow" | "minimum";
      readonly components: readonly ScoreComponent[];
      readonly excludedSegments: readonly Segment[];
    }
  | {
      readonly state: "unavailable";
      readonly reason: ScoreUnavailableReason;
      readonly excludedSegments: readonly Segment[];
    };

export type DirectionInput = {
  readonly segmentFlows: readonly SegmentFlow[];
  readonly tokenLiquidityUsd: number | null;
};

export function calculateDirection(input: DirectionInput): DirectionScore {
  // Segment order is fixed so an identical evidence set always produces an
  // identical score regardless of response ordering.
  const ordered = [...input.segmentFlows].sort(
    (left, right) =>
      SEGMENTS.indexOf(left.segment) - SEGMENTS.indexOf(right.segment),
  );
  const isWeighted = (flow: SegmentFlow): boolean =>
    isUsableNumber(flow.netFlowUsd) && SEGMENT_WEIGHTS[flow.segment] > 0;
  const weighted = ordered.filter(isWeighted);
  const excludedSegments = ordered
    .filter((flow) => !isWeighted(flow))
    .map((flow) => flow.segment);

  if (weighted.length === 0) {
    return {
      state: "unavailable",
      reason: "no-valid-segment-flows",
      excludedSegments,
    };
  }

  const { scaleUsd, scaleBasis } = resolveScale(
    input.tokenLiquidityUsd,
    weighted,
  );
  const totalWeight = weighted.reduce(
    (sum, flow) => sum + SEGMENT_WEIGHTS[flow.segment],
    0,
  );

  const components = weighted.map((flow) =>
    buildComponent(flow, scaleUsd, totalWeight),
  );
  const weightedMean = components.reduce(
    (sum, component) => sum + component.value,
    0,
  );

  const value = roundScore(clamp(100 * weightedMean, -100, 100));

  return {
    state: "available",
    value,
    label: directionLabel(value),
    scaleUsd,
    scaleBasis,
    components,
    excludedSegments,
  };
}

function buildComponent(
  flow: SegmentFlow,
  scaleUsd: number,
  totalWeight: number,
): ScoreComponent {
  const netFlowUsd = flow.netFlowUsd ?? 0;
  const normalized = Math.tanh(netFlowUsd / scaleUsd);
  // Weights of missing segments are removed and the remainder renormalized.
  const renormalizedWeight = SEGMENT_WEIGHTS[flow.segment] / totalWeight;
  return {
    key: flow.segment,
    label: segmentLabel(flow.segment),
    value: normalized * renormalizedWeight,
    detail:
      `tanh(${netFlowUsd} / ${scaleUsd}) = ${normalized.toFixed(4)}, ` +
      `weight ${SEGMENT_WEIGHTS[flow.segment]} renormalized to ` +
      `${renormalizedWeight.toFixed(4)}`,
    evidenceIds: [flowEvidenceId(flow.segment)],
  };
}

function resolveScale(
  tokenLiquidityUsd: number | null,
  flows: readonly SegmentFlow[],
): { scaleUsd: number; scaleBasis: "liquidity" | "median-flow" | "minimum" } {
  if (isUsableNumber(tokenLiquidityUsd) && tokenLiquidityUsd > 0) {
    const fromLiquidity = tokenLiquidityUsd * LIQUIDITY_SCALE_FRACTION;
    return fromLiquidity > MINIMUM_SCALE_USD
      ? { scaleUsd: fromLiquidity, scaleBasis: "liquidity" }
      : { scaleUsd: MINIMUM_SCALE_USD, scaleBasis: "minimum" };
  }
  const medianFlow = medianAbsoluteFlow(flows);
  return medianFlow > MINIMUM_SCALE_USD
    ? { scaleUsd: medianFlow, scaleBasis: "median-flow" }
    : { scaleUsd: MINIMUM_SCALE_USD, scaleBasis: "minimum" };
}

function medianAbsoluteFlow(flows: readonly SegmentFlow[]): number {
  const values = flows
    .map((flow) => Math.abs(flow.netFlowUsd ?? 0))
    .sort((left, right) => left - right);
  if (values.length === 0) return 0;
  const middle = Math.floor(values.length / 2);
  if (values.length % 2 === 1) return values[middle] ?? 0;
  return ((values[middle - 1] ?? 0) + (values[middle] ?? 0)) / 2;
}

export function segmentLabel(segment: Segment): string {
  switch (segment) {
    case "smart_trader":
      return "Smart Traders";
    case "top_pnl":
      return "Top PnL";
    case "whale":
      return "Whales";
    case "fresh_wallet":
      return "Fresh wallets";
    case "public_figure":
      return "Public figures";
    case "exchange":
      return "Exchanges";
  }
}
