/**
 * Who Bought/Sold response to domain actors.
 *
 * The endpoint returns bought and sold USD volume but no net field, so net is
 * derived here and the derivation is recorded in the evidence ledger. A record
 * with neither side available yields a null net rather than a zero.
 */

import type {
  Actor,
  ActorSide,
  SourceMeta,
} from "@/domain/investigation/investigation";
import type { WhoBoughtSoldRecord } from "../schemas/who-bought-sold";

export function normalizeWhoBoughtSold(
  records: readonly WhoBoughtSoldRecord[],
  side: ActorSide,
  source: SourceMeta,
): readonly Actor[] {
  return records.map((record) => ({
    address: record.address,
    displayLabel: record.address_label,
    boughtUsd: record.bought_volume_usd,
    soldUsd: record.sold_volume_usd,
    netUsd: deriveNetUsd(record),
    side,
    source,
  }));
}

function deriveNetUsd(record: WhoBoughtSoldRecord): number | null {
  const { bought_volume_usd: bought, sold_volume_usd: sold } = record;
  if (bought === null && sold === null) return null;
  return (bought ?? 0) - (sold ?? 0);
}
