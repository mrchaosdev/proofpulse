/**
 * Refresh and per-source retry.
 *
 * Both state their credit-impact category before the request is made
 * (02-product-rules 4.4), and both are links, so the server recomputes the
 * whole investigation and the scores stay consistent with what is on screen.
 *
 * The bypass is bounded server-side: a second request within the same cache
 * window is served from cache rather than spending credits again
 * (rule 5.6, "Retry must be bounded and must not create an accidental
 * API-credit loop").
 */

import Link from "next/link";
import type {
  NormalizedInvestigation,
  SourceCapability,
} from "@/domain/investigation/investigation";
import { REQUIRED_CAPABILITIES } from "@/domain/investigation/investigation";
import { CREDITS_PER_CALL } from "@/domain/investigation/credits";

const CAPABILITY_NAMES: Readonly<Record<SourceCapability, string>> = {
  "token-context": "token context",
  "cohort-flows": "cohort flows",
  buyers: "top buyers",
  sellers: "top sellers",
  "related-wallets": "wallet relationships",
};

function buildHref(
  investigation: NormalizedInvestigation,
  refresh: readonly string[],
  inspect: string | null,
): string {
  const query = new URLSearchParams({
    timeframe: investigation.input.timeframe,
  });
  if (investigation.input.mode === "fixture") query.set("mode", "fixture");
  if (inspect !== null) query.set("inspect", inspect);
  if (refresh.length > 0) query.set("refresh", refresh.join(","));
  return `?${query.toString()}`;
}

export function ScopeActions({
  investigation,
}: {
  investigation: NormalizedInvestigation;
}) {
  const isFixture = investigation.input.mode === "fixture";
  const inspect = investigation.inspectedActorAddresses[0] ?? null;

  const failed = investigation.sourceStatuses.filter(
    (status) => status.state === "error",
  );

  if (isFixture) {
    return (
      <p className="scope-actions-note">
        Refresh is unavailable in fixture mode, because a historical capture
        never changes.
      </p>
    );
  }

  const refreshCost = REQUIRED_CAPABILITIES.length * CREDITS_PER_CALL;

  return (
    <div className="scope-actions">
      <Link
        className="button"
        data-variant="secondary"
        href={buildHref(investigation, [...REQUIRED_CAPABILITIES], inspect)}
      >
        Refresh all sources
      </Link>
      <span className="scope-actions-note">
        Medium credit impact: {refreshCost} Nansen credits. Refreshing again
        inside the cache window costs nothing.
      </span>

      {failed.map((status) => (
        <Link
          className="button"
          data-variant="quiet"
          key={status.capability}
          href={buildHref(investigation, [status.capability], inspect)}
        >
          Retry {CAPABILITY_NAMES[status.capability]} ({CREDITS_PER_CALL}{" "}
          credit)
        </Link>
      ))}
    </div>
  );
}
