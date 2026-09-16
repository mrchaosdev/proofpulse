"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";

/**
 * Pointer spotlight adapted from React Bits' Spotlight Card.
 *
 * ProofPulse owns the visual treatment: colour, radius and surface all come
 * from local design tokens. The component only reports pointer coordinates,
 * so it remains cheap, pauses when idle and degrades to a normal surface.
 */
export function SpotlightCard({
  children,
  layout = "plain",
}: {
  children: ReactNode;
  layout?: "plain" | "form" | "step";
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const card = cardRef.current;
    if (card === null || event.pointerType === "touch") return;

    const bounds = card.getBoundingClientRect();
    card.style.setProperty("--spotlight-x", `${event.clientX - bounds.left}px`);
    card.style.setProperty("--spotlight-y", `${event.clientY - bounds.top}px`);
  }

  function handlePointerLeave() {
    const card = cardRef.current;
    if (card === null) return;
    card.style.removeProperty("--spotlight-x");
    card.style.removeProperty("--spotlight-y");
  }

  return (
    <div
      className="spotlight-card"
      data-layout={layout}
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {children}
    </div>
  );
}
