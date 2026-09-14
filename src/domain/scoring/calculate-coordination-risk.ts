/**
 * Coordination Risk: 0..100.
 *
 * Question: how concentrated or relationally connected is the observed actor
 * activity? This describes observable concentration and wallet relationships.
 * It is not manipulation, common ownership, or criminal conduct
 * (02-product-rules 2.4) and it is not a fraud score.
 *
 * Components: 05-data-and-scoring "3. Coordination Risk".
 */

import type { Actor, Relationship } from "../investigation/investigation";
import { actorEvidenceId } from "../evidence/evidence";
import type {
  CoordinationLabel,
  ScoreComponent,
  ScoreUnavailableReason,
} from "./score";
import { clamp, coordinationLabel, isUsableNumber, roundScore } from "./score";

export const CONCENTRATION_MAXIMUM = 40;
export const RELATIONSHIP_DENSITY_MAXIMUM = 30;
export const TIMING_MAXIMUM = 20;
export const DIVERSITY_MAXIMUM = 10;

/** Related first-degree edges at which the density component saturates. */
export const RELATIONSHIP_SATURATION_EDGES = 12;

/** A concentration-only result cannot exceed "moderate". */
export const PRELIMINARY_SCORE_CAP = 59;

export type CoordinationRiskScore =
  | {
      /** No relationship request has run; the answer is not zero. */
      readonly state: "not-assessed";
      readonly reason: ScoreUnavailableReason;
    }
  | {
      /** Concentration only: relationship evidence has not been fetched. */
      readonly state: "preliminary";
      readonly value: number;
      readonly label: CoordinationLabel;
      readonly components: readonly ScoreComponent[];
      readonly cappedByPreliminary: boolean;
    }
  | {
      readonly state: "assessed";
      readonly value: number;
      readonly label: CoordinationLabel;
      readonly components: readonly ScoreComponent[];
    };

export type CoordinationInput = {
  readonly buyers: readonly Actor[];
  readonly sellers: readonly Actor[];
  readonly relationships: readonly Relationship[];
  readonly inspectedActorAddresses: readonly string[];
};

export function calculateCoordinationRisk(
  input: CoordinationInput,
): CoordinationRiskScore {
  const weights = actorWeights([...input.buyers, ...input.sellers]);
  if (weights.length === 0) {
    return { state: "not-assessed", reason: "no-actor-evidence" };
  }

  const concentration = concentrationComponent(weights);
  const diversity = diversityComponent(weights);

  if (input.inspectedActorAddresses.length === 0) {
    const raw = concentration.value + diversity.value;
    const value = roundScore(
      clamp(Math.min(raw, PRELIMINARY_SCORE_CAP), 0, 100),
    );
    return {
      state: "preliminary",
      value,
      label: coordinationLabel(value),
      components: [concentration, diversity],
      cappedByPreliminary: raw > PRELIMINARY_SCORE_CAP,
    };
  }

  const density = densityComponent(input);
  // Timing concentration stays out of the total until source timestamps are
  // confirmed to be consistently available (open question P-04).
  const timing = timingComponent(input.relationships);
  const raw =
    concentration.value + density.value + timing.value + diversity.value;
  const value = roundScore(clamp(raw, 0, 100));
  return {
    state: "assessed",
    value,
    label: coordinationLabel(value),
    components: [concentration, density, timing, diversity],
  };
}

type ActorWeight = {
  readonly address: string;
  readonly side: "buyer" | "seller";
  readonly rank: number;
  readonly absoluteUsd: number;
};

/**
 * Absolute actor net volume. An actor without a usable signed value carries no
 * weight rather than a zero-valued one.
 */
function actorWeights(actors: readonly Actor[]): readonly ActorWeight[] {
  return actors
    .map((actor, index) => ({
      address: actor.address,
      side: actor.side,
      rank: index,
      absoluteUsd: Math.abs(resolveNetUsd(actor) ?? Number.NaN),
    }))
    .filter(
      (weight) => Number.isFinite(weight.absoluteUsd) && weight.absoluteUsd > 0,
    )
    .sort((left, right) => right.absoluteUsd - left.absoluteUsd);
}

function resolveNetUsd(actor: Actor): number | null {
  if (isUsableNumber(actor.netUsd)) return actor.netUsd;
  if (isUsableNumber(actor.boughtUsd) && isUsableNumber(actor.soldUsd)) {
    return actor.boughtUsd - actor.soldUsd;
  }
  return null;
}

function concentrationComponent(
  weights: readonly ActorWeight[],
): ScoreComponent {
  const total = weights.reduce((sum, weight) => sum + weight.absoluteUsd, 0);
  const topOne = weights[0]?.absoluteUsd ?? 0;
  const topThree = weights
    .slice(0, 3)
    .reduce((sum, weight) => sum + weight.absoluteUsd, 0);
  const shareOne = total > 0 ? topOne / total : 0;
  const shareThree = total > 0 ? topThree / total : 0;
  // Top-1 and top-3 shares contribute equally to the 40-point maximum.
  const score = CONCENTRATION_MAXIMUM * (shareOne * 0.5 + shareThree * 0.5);
  return {
    key: "concentration",
    label: "Top-actor concentration",
    value: score,
    maximum: CONCENTRATION_MAXIMUM,
    detail:
      `Top actor holds ${(shareOne * 100).toFixed(1)}% and the top three hold ` +
      `${(shareThree * 100).toFixed(1)}% of absolute actor net volume across ` +
      `${weights.length} actors.`,
    evidenceIds: weights
      .slice(0, 3)
      .map((weight) => actorEvidenceId(weight.side, weight.rank)),
  };
}

function densityComponent(input: CoordinationInput): ScoreComponent {
  const edges = uniqueEdges(input.relationships);
  const saturation = Math.min(1, edges / RELATIONSHIP_SATURATION_EDGES);
  return {
    key: "relationship-density",
    label: "Related-wallet density",
    value: RELATIONSHIP_DENSITY_MAXIMUM * saturation,
    maximum: RELATIONSHIP_DENSITY_MAXIMUM,
    detail:
      `${edges} distinct first-degree relationships observed across ` +
      `${input.inspectedActorAddresses.length} inspected actors. A relationship ` +
      `is an observed link, not shared ownership.`,
    evidenceIds: [],
  };
}

function uniqueEdges(relationships: readonly Relationship[]): number {
  const seen = new Set<string>();
  for (const relationship of relationships) {
    // Self edges carry no relational information.
    if (relationship.sourceAddress === relationship.targetAddress) continue;
    const pair = [relationship.sourceAddress, relationship.targetAddress]
      .map((address) => address.toLowerCase())
      .sort()
      .join("|");
    seen.add(`${pair}|${relationship.relation}`);
  }
  return seen.size;
}

function timingComponent(
  relationships: readonly Relationship[],
): ScoreComponent {
  const observed = relationships.filter(
    (relationship) => relationship.observedAt !== null,
  );
  return {
    key: "timing",
    label: "Timing concentration",
    value: 0,
    maximum: TIMING_MAXIMUM,
    detail:
      observed.length === 0
        ? "No source timestamps were returned, so no activity window is defined."
        : `${observed.length} relationships carry a timestamp, but consistent ` +
          `source-time coverage is unverified, so this component contributes 0.`,
    evidenceIds: [],
  };
}

function diversityComponent(weights: readonly ActorWeight[]): ScoreComponent {
  const total = weights.reduce((sum, weight) => sum + weight.absoluteUsd, 0);
  if (total <= 0 || weights.length === 0) {
    return {
      key: "diversity",
      label: "Effective actor diversity",
      value: 0,
      maximum: DIVERSITY_MAXIMUM,
      detail: "No signed actor volume returned.",
      evidenceIds: [],
    };
  }
  // Inverse participation ratio: effective number of contributing actors.
  const herfindahl = weights.reduce(
    (sum, weight) => sum + (weight.absoluteUsd / total) ** 2,
    0,
  );
  const effectiveActors = herfindahl > 0 ? 1 / herfindahl : weights.length;
  const normalized = clamp(effectiveActors / weights.length, 0, 1);
  return {
    key: "diversity",
    label: "Effective actor diversity",
    value: DIVERSITY_MAXIMUM * (1 - normalized),
    maximum: DIVERSITY_MAXIMUM,
    detail:
      `Effective actor count ${effectiveActors.toFixed(2)} of ` +
      `${weights.length} observed actors; lower diversity raises the score.`,
    evidenceIds: [],
  };
}
