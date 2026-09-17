/**
 * Pure derivations over a smart money history.
 *
 * No network, cache or clock reaches this file: it reads the normalized points
 * and nothing else (06-technical-architecture "Module boundaries").
 */

import type { SmartMoneyHistory } from "./investigation";

/**
 * Change in position between the first and last complete day, in token units.
 *
 * Units, not dollars, because a dollar change also contains the price move.
 * Null when fewer than two complete days carry an amount, which is the honest
 * answer rather than a zero.
 */
export function positionChange(history: SmartMoneyHistory): {
  readonly fromAmount: number;
  readonly toAmount: number;
  readonly deltaAmount: number;
  readonly percent: number | null;
} | null {
  const usable = history.points.filter(
    (point) => point.complete && point.tokenAmount !== null,
  );
  if (usable.length < 2) return null;

  const first = usable[0];
  const last = usable[usable.length - 1];
  if (first === undefined || last === undefined) return null;

  const fromAmount = first.tokenAmount ?? 0;
  const toAmount = last.tokenAmount ?? 0;
  const deltaAmount = toAmount - fromAmount;

  return {
    fromAmount,
    toAmount,
    deltaAmount,
    // A percentage of nothing is not zero, it is undefined.
    percent: fromAmount === 0 ? null : (deltaAmount / fromAmount) * 100,
  };
}
