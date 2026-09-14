/**
 * The signal lens: three analytical dimensions shown together without merging
 * them (DESIGN-RULES 9, 02-product-rules 2.1).
 *
 * Every value in the figure is mirrored in the readout below it, so nothing is
 * carried by the graphic alone. An unavailable score renders as text, never as
 * a neutral-looking zero (04-information-architecture "Score rail").
 */

import type { InvestigationScores } from "@/domain/investigation/investigation-result";

const RADIUS = [46, 36, 26] as const;
const CIRCUMFERENCE = RADIUS.map((radius) => 2 * Math.PI * radius);

type Arc = {
  readonly dimension: "direction" | "confidence" | "coordination";
  readonly name: string;
  readonly definition: string;
  readonly display: string;
  readonly label: string;
  /** 0..1 of the ring, or null when the score is unavailable. */
  readonly fraction: number | null;
  readonly unavailable: string | null;
};

function readableLabel(value: string): string {
  return value.replace(/-/g, " ");
}

function buildArcs(scores: InvestigationScores): readonly Arc[] {
  const direction = scores.direction;
  const coordination = scores.coordinationRisk;

  return [
    {
      dimension: "direction",
      name: "Direction",
      definition: "Observed flow balance, not a price forecast.",
      display:
        direction.state === "available"
          ? String(direction.value)
          : "Not available",
      label:
        direction.state === "available" ? readableLabel(direction.label) : "",
      // Direction spans -100..+100, so it is mapped onto the ring from its
      // midpoint rather than from zero.
      fraction:
        direction.state === "available"
          ? Math.abs(direction.value) / 100
          : null,
      unavailable:
        direction.state === "available"
          ? null
          : "No cohort returned a usable net flow, so direction cannot be derived.",
    },
    {
      dimension: "confidence",
      name: "Confidence",
      definition: "Evidence quality, not the probability of a price move.",
      display: String(scores.confidence.value),
      label: readableLabel(scores.confidence.label),
      fraction: scores.confidence.value / 100,
      unavailable: null,
    },
    {
      dimension: "coordination",
      name: "Coordination risk",
      definition:
        "Observable concentration and wallet relationships. Not manipulation or shared ownership.",
      display:
        coordination.state === "not-assessed"
          ? "Not assessed"
          : String(coordination.value),
      label:
        coordination.state === "not-assessed"
          ? ""
          : `${coordination.label}${coordination.state === "preliminary" ? " (preliminary)" : ""}`,
      fraction:
        coordination.state === "not-assessed" ? null : coordination.value / 100,
      unavailable:
        coordination.state === "not-assessed"
          ? "No actor evidence has been returned, so coordination risk is not assessed."
          : null,
    },
  ];
}

export function SignalLens({ scores }: { scores: InvestigationScores }) {
  const arcs = buildArcs(scores);

  return (
    <div className="signal-lens">
      <svg
        className="signal-lens-figure"
        viewBox="0 0 120 120"
        role="img"
        aria-label="Signal lens showing direction, confidence, and coordination risk. The same values are listed below."
      >
        {arcs.map((arc, index) => {
          const radius = RADIUS[index] ?? 0;
          const circumference = CIRCUMFERENCE[index] ?? 0;
          return (
            <g key={arc.dimension}>
              <circle
                className="signal-lens-track"
                cx="60"
                cy="60"
                r={radius}
              />
              {arc.fraction === null ? null : (
                <circle
                  className="signal-lens-arc"
                  data-dimension={arc.dimension}
                  cx="60"
                  cy="60"
                  r={radius}
                  transform="rotate(-90 60 60)"
                  style={{
                    strokeDasharray: circumference,
                    strokeDashoffset: circumference * (1 - arc.fraction),
                  }}
                />
              )}
            </g>
          );
        })}
        <text className="signal-lens-centre" x="60" y="58">
          {arcs[0]?.display ?? ""}
        </text>
        <text className="signal-lens-caption" x="60" y="72">
          direction
        </text>
      </svg>

      <dl className="signal-lens-readout">
        {arcs.map((arc) => (
          <div className="lens-row" key={arc.dimension}>
            <dt className="lens-row-name">{arc.name}</dt>
            <dd className="lens-row-value numeric">{arc.display}</dd>
            {arc.label === "" ? null : (
              <dd className="lens-row-label">{arc.label}</dd>
            )}
            {arc.unavailable === null ? null : (
              <dd className="lens-row-unavailable">{arc.unavailable}</dd>
            )}
            <dd className="lens-row-label">{arc.definition}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
