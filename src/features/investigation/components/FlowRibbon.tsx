/**
 * The curved flow ribbon: the second signature form (DESIGN-RULES 1).
 *
 * It shows one thing the bars below cannot show at a glance — how the total
 * observed cohort flow splits between accumulation and distribution — as a
 * single band whose halves are proportional to real summed values.
 *
 * It invents nothing. The proportions come from the same normalized flows the
 * table lists, both sides are labelled in words and figures, and a cohort with
 * no returned value contributes nothing rather than zero.
 */

import type { SegmentFlow } from "@/domain/investigation/investigation";
import { formatUsd } from "@/domain/evidence/format-value";

export function FlowRibbon({ flows }: { flows: readonly SegmentFlow[] }) {
  const values = flows
    .map((flow) => flow.netFlowUsd)
    .filter((value): value is number => value !== null);

  const inflow = values
    .filter((value) => value > 0)
    .reduce((total, value) => total + value, 0);
  const outflow = values
    .filter((value) => value < 0)
    .reduce((total, value) => total + Math.abs(value), 0);
  const total = inflow + outflow;

  if (total === 0) return null;

  const inflowShare = inflow / total;
  // The ribbon spans a 720-unit curve; the split point is where the two
  // directions meet.
  const split = 60 + inflowShare * 600;

  return (
    <figure className="flow-ribbon">
      <svg
        className="flow-ribbon-figure"
        viewBox="0 0 720 96"
        role="img"
        aria-label={`Of all returned cohort flow, ${formatUsd(inflow)} moved toward accumulation and ${formatUsd(outflow)} toward distribution.`}
      >
        <path
          className="flow-ribbon-band"
          data-direction="accumulation"
          d={`M 60 68 C 200 68 220 28 ${split} 28 L ${split} 68 Z`}
        />
        <path
          className="flow-ribbon-band"
          data-direction="distribution"
          d={`M ${split} 28 C ${split + 90} 28 520 68 660 68 L ${split} 68 Z`}
        />
        <line
          className="flow-ribbon-split"
          x1={split}
          y1="18"
          x2={split}
          y2="78"
        />
      </svg>

      <figcaption className="flow-ribbon-caption">
        <span className="flow-ribbon-side" data-direction="accumulation">
          {formatUsd(inflow)} toward accumulation
        </span>
        <span className="flow-ribbon-side" data-direction="distribution">
          {formatUsd(outflow)} toward distribution
        </span>
      </figcaption>
    </figure>
  );
}
