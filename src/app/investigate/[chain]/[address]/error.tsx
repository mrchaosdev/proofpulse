"use client";

/**
 * Error boundary for an investigation (DESIGN-RULES 10).
 *
 * It states a category and offers a bounded retry plus the deliberate fixture
 * route. No upstream body, stack trace, or credential is shown: the message
 * the server produced has already been reconstructed at the boundary
 * (07-security-and-privacy).
 */

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function InvestigationError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="page-region stack">
      <div className="banner" data-state="partial" role="alert">
        <span className="banner-title">
          This investigation could not be run
        </span>
        <span>
          The request failed before any evidence could be scored. Nothing shown
          here is live data.
        </span>
      </div>

      <div className="cluster">
        <Button type="button" onClick={reset}>
          Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/investigate">Open the demo capture instead</Link>
        </Button>
      </div>
    </div>
  );
}
