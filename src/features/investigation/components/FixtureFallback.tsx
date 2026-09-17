/**
 * Offered when live sources fail (04-information-architecture, "Nansen
 * unavailable during demo").
 *
 * Opening the fixture is a deliberate choice the reader makes, never a silent
 * substitution after a failed live call (02-product-rules 5.7). It appears only
 * when live evidence is actually missing, and it names what it would show.
 */

import Link from "next/link";
import type { NormalizedInvestigation } from "@/domain/investigation/investigation";
import { REQUIRED_CAPABILITIES } from "@/domain/investigation/investigation";
import { Button } from "@/components/ui/button";

export function FixtureFallback({
  investigation,
}: {
  investigation: NormalizedInvestigation;
}) {
  const failed = investigation.sourceStatuses.filter(
    (status) => status.state === "error",
  );
  if (failed.length === 0) return null;

  const everySourceFailed = failed.length >= REQUIRED_CAPABILITIES.length;
  const credits = failed.some(
    (status) => status.state === "error" && status.code === "NANSEN_CREDITS",
  );

  return (
    <div className="banner" data-state="partial" role="note">
      <span className="banner-title">
        {everySourceFailed
          ? "No live evidence was returned"
          : `${failed.length} of ${REQUIRED_CAPABILITIES.length} sources failed`}
      </span>
      <span>
        {credits
          ? "Nansen credits are exhausted, so paid requests are disabled. "
          : ""}
        {everySourceFailed
          ? "Nothing on this page is live. "
          : "The evidence that did return is still shown, and confidence is reduced accordingly. "}
        You can open the timestamped demo capture instead. It is a different
        token and is labelled as a fixture throughout.
      </span>
      <Button asChild variant="outline">
        <Link href="/investigate">Open the demo capture</Link>
      </Button>
    </div>
  );
}
