"use client";

/**
 * Inline pending feedback for a link that refines the current page.
 *
 * A route-level loading shell is the wrong feedback for a refinement: it tears
 * down the investigation the reader is already looking at. This gives the
 * clicked control itself a pending state instead, so the page stays put and
 * the reader still knows the click registered.
 *
 * It must be rendered inside the Link it describes.
 */

import { useLinkStatus } from "next/link";

export function LinkPending({
  label,
  pendingLabel,
}: {
  label: string;
  pendingLabel: string;
}) {
  const { pending } = useLinkStatus();

  return (
    <span className="link-pending" data-pending={pending}>
      {pending ? pendingLabel : label}
      <span className="visually-hidden" role="status">
        {pending ? pendingLabel : ""}
      </span>
    </span>
  );
}
