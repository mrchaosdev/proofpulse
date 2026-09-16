/**
 * The signal lens (DESIGN-RULES 2): one circular figure carrying three arcs,
 * one per analytical dimension. It is not a speedometer and not a trading
 * gauge.
 *
 * Each ring is a full-circle track so the figure always reads as a complete
 * shape, and each fill starts at the top. Direction is bipolar: its ring is
 * marked at zero and fills clockwise for accumulation, anticlockwise for
 * distribution, so a value near zero honestly renders as a short tick beside
 * the marker rather than as a misleading near-empty ring.
 *
 * Caps are square, not round, because a rounded cap turns a one-point value
 * into a dot that reads as a rendering artefact.
 *
 * Every value is mirrored in the readout beneath, whose swatches tie each row
 * back to its ring, so nothing is carried by colour or by the drawing alone.
 */

import type { InvestigationScores } from "@/domain/investigation/investigation-result";

const CENTRE = 120;
const STROKE = 16;

type Ring = {
  readonly dimension: "direction" | "confidence" | "coordination";
  readonly name: string;
  readonly definition: string;
  readonly display: string;
  readonly category: string;
  readonly radius: number;
  /** Signed fraction of full scale, or null when the score is unavailable. */
  readonly fraction: number | null;
  readonly bipolar: boolean;
  readonly unavailable: string | null;
};

function readable(value: string): string {
  return value.replace(/-/g, " ");
}

function polar(degrees: number, radius: number): { x: number; y: number } {
  const radians = ((degrees - 90) * Math.PI) / 180;
  return {
    x: CENTRE + radius * Math.cos(radians),
    y: CENTRE + radius * Math.sin(radians),
  };
}

function arcPath(
  fromDegrees: number,
  toDegrees: number,
  radius: number,
): string {
  const sweepDegrees = toDegrees - fromDegrees;
  if (Math.abs(sweepDegrees) < 0.05) return "";
  const start = polar(fromDegrees, radius);
  const end = polar(toDegrees, radius);
  const largeArc = Math.abs(sweepDegrees) > 180 ? 1 : 0;
  const sweep = sweepDegrees > 0 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} ${sweep} ${end.x} ${end.y}`;
}

function buildRings(scores: InvestigationScores): readonly Ring[] {
  const direction = scores.direction;
  const coordination = scores.coordinationRisk;

  return [
    {
      dimension: "direction",
      name: "Direction",
      definition: "Observed flow balance, not a price forecast.",
      display:
        direction.state === "available"
          ? formatSigned(direction.value)
          : "Not available",
      category:
        direction.state === "available" ? readable(direction.label) : "",
      radius: 88,
      fraction: direction.state === "available" ? direction.value / 100 : null,
      bipolar: true,
      unavailable:
        direction.state === "available"
          ? null
          : "No cohort returned a usable net flow.",
    },
    {
      dimension: "confidence",
      name: "Confidence",
      definition: "Evidence quality, not the probability of a price move.",
      display: String(scores.confidence.value),
      category: readable(scores.confidence.label),
      radius: 63,
      fraction: scores.confidence.value / 100,
      bipolar: false,
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
      category:
        coordination.state === "not-assessed"
          ? ""
          : coordination.state === "preliminary"
            ? `${coordination.label}, preliminary`
            : coordination.label,
      radius: 38,
      fraction:
        coordination.state === "not-assessed" ? null : coordination.value / 100,
      bipolar: false,
      unavailable:
        coordination.state === "not-assessed"
          ? "No relationship evidence has been requested yet."
          : null,
    },
  ];
}

function formatSigned(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

/**
 * Bipolar scores use half the circle in each direction, so the right half of
 * the ring means accumulation and the left half means distribution.
 */
function fillPath(ring: Ring): string {
  if (ring.fraction === null) return "";
  const clamped = Math.min(1, Math.max(ring.bipolar ? -1 : 0, ring.fraction));
  const span = ring.bipolar ? 180 : 360;
  return arcPath(0, clamped * span, ring.radius);
}

export function SignalLens({ scores }: { scores: InvestigationScores }) {
  const rings = buildRings(scores);

  return (
    <div className="signal-lens">
      <svg
        className="signal-lens-figure"
        viewBox="0 0 240 240"
        role="img"
        aria-label="Signal lens. Three concentric arcs show direction, confidence, and coordination risk. The same values are listed below."
      >
        {rings.map((ring) => (
          <g key={ring.dimension}>
            <circle
              className="signal-lens-track"
              cx={CENTRE}
              cy={CENTRE}
              r={ring.radius}
            />
            {ring.fraction === null ? null : (
              <path
                className="signal-lens-arc"
                data-dimension={ring.dimension}
                d={fillPath(ring)}
              />
            )}
            {ring.bipolar ? (
              <line
                className="signal-lens-zero"
                x1={polar(0, ring.radius - STROKE / 2 - 3).x}
                y1={polar(0, ring.radius - STROKE / 2 - 3).y}
                x2={polar(0, ring.radius + STROKE / 2 + 3).x}
                y2={polar(0, ring.radius + STROKE / 2 + 3).y}
              />
            ) : null}
          </g>
        ))}
        <text className="signal-lens-zero-label" x={CENTRE} y="14">
          0
        </text>
      </svg>

      <dl className="signal-lens-readout">
        {rings.map((ring) => (
          <div className="lens-row" key={ring.dimension}>
            <dt className="lens-row-name">
              <span
                className="lens-swatch"
                data-dimension={ring.dimension}
                aria-hidden="true"
              />
              {ring.name}
            </dt>
            <dd className="lens-row-value numeric">{ring.display}</dd>
            {ring.category === "" ? null : (
              <dd className="lens-row-label">{ring.category}</dd>
            )}
            {ring.unavailable === null ? null : (
              <dd className="lens-row-unavailable">{ring.unavailable}</dd>
            )}
            <dd className="lens-row-definition">{ring.definition}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
