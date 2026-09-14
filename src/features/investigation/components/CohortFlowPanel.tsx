/**
 * Which participant groups accumulated or distributed this token?
 *
 * Zero-centred signed bars with a prominent baseline, a data table carrying
 * every plotted value, and no initial sweep animation (DESIGN-RULES 9).
 * A cohort with no returned value is listed as missing, not drawn as zero.
 */

import type { SegmentFlow } from "@/domain/investigation/investigation";
import { segmentLabel } from "@/domain/scoring/calculate-direction";
import { formatSignedUsd } from "@/domain/evidence/format-value";

function sign(value: number): "positive" | "negative" | "zero" {
  if (value > 0) return "positive";
  if (value < 0) return "negative";
  return "zero";
}

function barGeometry(
  value: number,
  scale: number,
): { readonly widthPercent: number; readonly offsetPercent: number } {
  const half = Math.min(50, (Math.abs(value) / scale) * 50);
  return {
    widthPercent: half,
    offsetPercent: value >= 0 ? 50 : 50 - half,
  };
}

export function CohortFlowPanel({ flows }: { flows: readonly SegmentFlow[] }) {
  const present = flows.filter((flow) => flow.netFlowUsd !== null);
  const missing = flows.filter((flow) => flow.netFlowUsd === null);
  const scale = Math.max(
    1,
    ...present.map((flow) => Math.abs(flow.netFlowUsd ?? 0)),
  );

  if (flows.length === 0) {
    return (
      <p className="card-question">
        No cohort flow records were returned for this scope.
      </p>
    );
  }

  return (
    <div className="stack">
      <div
        role="img"
        aria-label="Net flow by cohort. The same values appear in the table below."
      >
        {present.map((flow) => {
          const value = flow.netFlowUsd ?? 0;
          const geometry = barGeometry(value, scale);
          return (
            <div className="flow-row" key={flow.segment}>
              <span className="flow-name">{segmentLabel(flow.segment)}</span>
              <span className="flow-track">
                <span className="flow-baseline" />
                <span
                  className="flow-bar"
                  data-sign={sign(value)}
                  style={{
                    insetInlineStart: `${geometry.offsetPercent}%`,
                    width: `${geometry.widthPercent}%`,
                  }}
                />
              </span>
              <span className="flow-value numeric" data-sign={sign(value)}>
                {formatSignedUsd(value)}
              </span>
            </div>
          );
        })}
      </div>

      {missing.length === 0 ? null : (
        <p className="flow-missing">
          No value returned for:{" "}
          {missing.map((flow) => segmentLabel(flow.segment)).join(", ")}. These
          cohorts are missing, not zero.
        </p>
      )}

      <div className="table-scroll">
        <table className="data-table">
          <caption className="visually-hidden">
            Net flow, average flow, and wallet count by cohort.
          </caption>
          <thead>
            <tr>
              <th scope="col">Cohort</th>
              <th scope="col">Net flow (USD)</th>
              <th scope="col">Wallets</th>
            </tr>
          </thead>
          <tbody>
            {flows.map((flow) => (
              <tr key={flow.segment}>
                <th scope="row">{segmentLabel(flow.segment)}</th>
                <td data-numeric="true">
                  {flow.netFlowUsd === null
                    ? "Not returned"
                    : formatSignedUsd(flow.netFlowUsd)}
                </td>
                <td data-numeric="true">
                  {flow.walletCount === null
                    ? "Not tracked"
                    : String(flow.walletCount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
