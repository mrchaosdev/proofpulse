"use client";

/**
 * Smallest interactive boundary: only the copy control is a client component
 * (CODEBASE-RULES 9).
 */

import { useState } from "react";

export function CopyButton({
  value,
  description,
}: {
  value: string;
  description: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    void navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      type="button"
      className="copy-button"
      onClick={handleCopy}
      aria-label={`Copy full ${description}`}
    >
      <span aria-hidden="true">{copied ? "Copied" : "Copy"}</span>
      <span className="visually-hidden" role="status">
        {copied ? `${description} copied` : ""}
      </span>
    </button>
  );
}
