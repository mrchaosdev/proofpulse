"use client";

/**
 * Expanded evidence row (04-information-architecture section 8).
 *
 * The ledger is the audit surface, so a reader must be able to take the
 * normalized record away. Credentials and raw HTTP headers never reach this
 * object: it is built from the domain evidence item, which the adapters
 * produced after validation.
 */

import { useState } from "react";
import type { Evidence } from "@/domain/evidence/evidence";
import { CopyButton } from "@/components/actions/CopyButton";
import { Button } from "@/components/ui/button";

function toNormalizedJson(evidence: Evidence): string {
  return JSON.stringify(evidence, null, 2);
}

export function EvidenceRowDetail({ evidence }: { evidence: Evidence }) {
  const [open, setOpen] = useState(false);
  const json = toNormalizedJson(evidence);

  return (
    <div className="evidence-detail">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {open ? "Hide normalized record" : "Show normalized record"}
      </Button>
      <div hidden={!open}>
        <pre className="identifier evidence-json">{json}</pre>
        <CopyButton
          value={json}
          description={`normalized record for ${evidence.id}`}
        />
      </div>
    </div>
  );
}
