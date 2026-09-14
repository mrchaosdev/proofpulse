/**
 * Status presentation. The state word is always rendered as text, so status is
 * never carried by colour alone (DESIGN-RULES colour law 4).
 */

export type StatusTone =
  "ready" | "empty" | "stale" | "error" | "partial" | "fixture" | "neutral";

export function StatusPill({
  tone,
  children,
}: {
  tone: StatusTone;
  children: React.ReactNode;
}) {
  return (
    <span className="status-pill" data-state={tone}>
      {children}
    </span>
  );
}
