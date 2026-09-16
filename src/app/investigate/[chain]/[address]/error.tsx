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
        <button
          type="button"
          className="button"
          data-variant="primary"
          onClick={reset}
        >
          Try again
        </button>
        <Link className="button" data-variant="secondary" href="/investigate">
          Open the demo capture instead
        </Link>
      </div>
    </div>
  );
}
