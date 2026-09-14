/**
 * Score contributions. No score renders without a component breakdown
 * (02-product-rules 2.7), and each component shows its derivation note.
 */

import type { ScoreComponent } from "@/domain/scoring/score";

export function ScoreBreakdown({
  heading,
  components,
  formulaVersion,
}: {
  heading: string;
  components: readonly ScoreComponent[];
  formulaVersion: string;
}) {
  return (
    <section className="stack">
      <h3 className="card-heading">{heading}</h3>
      <ul className="component-list">
        {components.map((component) => (
          <li className="component-row" key={component.key}>
            <span className="component-name">{component.label}</span>
            <span className="component-value numeric">
              {component.value.toFixed(1)}
              {component.maximum === undefined ? "" : ` / ${component.maximum}`}
            </span>
            <span className="component-detail identifier">
              {component.detail}
            </span>
          </li>
        ))}
      </ul>
      <p className="card-footer">
        Formula version <span className="identifier">{formulaVersion}</span>.
      </p>
    </section>
  );
}
