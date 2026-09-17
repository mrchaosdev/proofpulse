/**
 * Token God Mode Flows response to a daily smart money history.
 *
 * The endpoint returns hourly buckets for a seven-day window. Each bucket
 * carries a *position* — what the label held at the end of it — not a flow
 * through it. Positions are therefore collapsed to one point per UTC day by
 * taking the day's last bucket, never by summing: adding two snapshots of the
 * same holdings would invent a quantity nobody holds.
 *
 * A day inherits the completeness of the bucket that represents it, so the
 * day in progress stays marked incomplete rather than being presented as a
 * finished reading.
 */

import type {
  HoldingPoint,
  SmartMoneyHistory,
  SourceMeta,
} from "@/domain/investigation/investigation";
import type { SmartMoneyFlowRecord } from "../schemas/smart-money-flows";

/** Days shown. The window requested upstream is the same length. */
export const HISTORY_DAYS = 7;

export function normalizeSmartMoneyHistory(
  records: readonly SmartMoneyFlowRecord[],
  warnings: readonly string[],
  source: SourceMeta,
): SmartMoneyHistory {
  const latestPerDay = new Map<string, SmartMoneyFlowRecord>();

  for (const record of records) {
    const bucketEnd = record.bucket_end ?? record.date;
    const parsed = Date.parse(bucketEnd);
    // A bucket whose timestamp cannot be read is dropped rather than placed on
    // a guessed day.
    if (Number.isNaN(parsed)) continue;

    const day = bucketEnd.slice(0, 10);
    const held = latestPerDay.get(day);
    const heldEnd = held === undefined ? null : (held.bucket_end ?? held.date);
    if (held === undefined || parsed > Date.parse(heldEnd ?? "")) {
      latestPerDay.set(day, record);
    }
  }

  const points: HoldingPoint[] = [...latestPerDay.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-HISTORY_DAYS)
    .map(([, record]) => ({
      date: record.bucket_end ?? record.date,
      tokenAmount: record.token_amount,
      valueUsd: record.value_usd,
      holderCount: record.holders_count,
      priceUsd: record.price_usd,
      // Absent completeness is treated as incomplete: the cautious reading.
      complete: record.is_complete === true,
    }));

  return { points, warnings, source };
}
