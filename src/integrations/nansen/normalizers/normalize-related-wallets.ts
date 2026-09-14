/**
 * Related Wallets response to domain relationships.
 *
 * The Nansen relation type is preserved verbatim. A relationship describes an
 * observed link; ownership is unknown unless Nansen explicitly supplies an
 * attribution (02-product-rules 9.6).
 */

import type {
  Relationship,
  SourceMeta,
} from "@/domain/investigation/investigation";
import type { RelatedWalletRecord } from "../schemas/related-wallets";

export function normalizeRelatedWallets(
  records: readonly RelatedWalletRecord[],
  sourceAddress: string,
  source: SourceMeta,
): readonly Relationship[] {
  return (
    records
      // A wallet related to itself carries no relational information.
      .filter(
        (record) =>
          record.address.toLowerCase() !== sourceAddress.toLowerCase(),
      )
      .map((record) => ({
        sourceAddress,
        targetAddress: record.address,
        targetLabel: record.address_label,
        relation: record.relation ?? "unspecified",
        transactionHash: record.transaction_hash,
        observedAt: record.block_timestamp,
        source,
      }))
  );
}
