/**
 * Seven days of what smart money held in this token.
 *
 * The chart plots the position in token units, not its dollar value, and the
 * reason is the whole point of the panel. Value moves when the price moves; a
 * holder who does nothing all week still shows a dollar line that rises and
 * falls. Plotting value would let a price drop read as selling. Units only
 * change when somebody buys or sells.
 *
 * The dollar range is still reported, in words, beside the chart — so the two
 * readings sit next to each other and the difference between them is the
 * thing the reader takes away.
 *
 * The figure carries an accessible summary, and the table below it lists every
 * value the line is drawn from (DESIGN-RULES 12).
 */

import type { SmartMoneyHistory as History } from "@/domain/investigation/investigation";
import { positionChange } from "@/domain/investigation/position-change";
import {
  formatCount,
  formatTokenAmount,
  formatUsd,
} from "@/domain/evidence/format-value";

const VIEW_WIDTH = 720;
const VIEW_HEIGHT = 200;
const PAD_X = 16;
const PAD_Y = 24;

function day(iso: string): string {
  return iso.slice(0, 10);
}

export function SmartMoneyHistory({
  history,
  symbol,
}: {
  history: History;
  symbol: string | null;
}) {
  const points = history.points;
  const amounts = points
    .map((point) => point.tokenAmount)
    .filter((value): value is number => value !== null);

  if (amounts.length < 2) {
    return (
      <p className="text-meta">
        The history returned fewer than two days carrying a position, so no
        trend can be drawn from it.
      </p>
    );
  }

  const unit = symbol ?? "tokens";
  const lowest = Math.min(...amounts);
  const highest = Math.max(...amounts);
  /*
   * The axis starts at zero. Anchored at the lowest value instead, a position
   * that fell by 2.9% filled the entire frame and read as a collapse — the
   * exact misreading this panel exists to prevent. A quantity has a real zero,
   * so a small change is drawn small and the figures below carry the detail.
   */
  const ceiling = highest > 0 ? highest * 1.08 : 1;
  const plotHeight = VIEW_HEIGHT - PAD_Y * 2;
  const step =
    points.length > 1 ? (VIEW_WIDTH - PAD_X * 2) / (points.length - 1) : 0;

  const coordinates = points.map((point, index) => {
    const value = point.tokenAmount;
    const ratio = (value ?? 0) / ceiling;
    return {
      point,
      x: PAD_X + index * step,
      y: PAD_Y + (1 - ratio) * plotHeight,
      plotted: value !== null,
    };
  });

  const drawn = coordinates.filter((entry) => entry.plotted);
  const line = drawn
    .map((entry, index) => `${index === 0 ? "M" : "L"} ${entry.x} ${entry.y}`)
    .join(" ");

  const change = positionChange(history);
  const values = points
    .map((point) => point.valueUsd)
    .filter((value): value is number => value !== null);
  const valueLow = values.length > 0 ? Math.min(...values) : null;
  const valueHigh = values.length > 0 ? Math.max(...values) : null;

  const summary =
    change === null
      ? `Smart money held between ${formatTokenAmount(lowest)} and ${formatTokenAmount(highest)} ${unit} over the last seven days.`
      : `Over seven days the smart money position moved from ${formatTokenAmount(change.fromAmount)} to ${formatTokenAmount(change.toAmount)} ${unit}, a change of ${formatTokenAmount(change.deltaAmount)}.`;

  return (
    <div className="history-panel">
      <figure className="history-figure">
        <svg
          className="history-chart"
          viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
          role="img"
          aria-label={`${summary} The same values are listed in the table below.`}
        >
          <line
            className="history-axis"
            x1={PAD_X}
            y1={VIEW_HEIGHT - PAD_Y}
            x2={VIEW_WIDTH - PAD_X}
            y2={VIEW_HEIGHT - PAD_Y}
          />
          <text className="history-axis-label" x={PAD_X} y={PAD_Y - 8}>
            {formatTokenAmount(ceiling)}
          </text>
          <text
            className="history-axis-label"
            x={PAD_X}
            y={VIEW_HEIGHT - PAD_Y + 16}
          >
            0
          </text>
          <path className="history-line" d={line} />
          {coordinates.map((entry) =>
            entry.plotted ? (
              <circle
                className="history-dot"
                key={entry.point.date}
                cx={entry.x}
                cy={entry.y}
                r={4}
                // The day in progress is drawn hollow: it is not a finished
                // reading and must not look like one.
                data-complete={entry.point.complete}
              />
            ) : null,
          )}
        </svg>
        <figcaption className="text-meta">
          Position in {unit}. A flat line means nobody bought or sold, whatever
          the price did.
        </figcaption>
      </figure>

      <p className="history-summary">{summary}</p>

      {valueLow === null || valueHigh === null ? null : (
        <p className="text-meta">
          The same position was worth between {formatUsd(valueLow)} and{" "}
          {formatUsd(valueHigh)} across the week. That range is the price
          moving, not wallets trading.
        </p>
      )}

      <table className="data-table history-table">
        <caption className="visually-hidden">
          Smart money position by day, with the value and holder count behind
          each point on the chart.
        </caption>
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col">Position</th>
            <th scope="col">Value</th>
            <th scope="col">Holders</th>
          </tr>
        </thead>
        <tbody>
          {points.map((point) => (
            <tr key={point.date}>
              <th scope="row" className="identifier">
                {day(point.date)}
                {point.complete ? null : (
                  <span className="history-partial"> still filling</span>
                )}
              </th>
              <td data-numeric="true">
                {point.tokenAmount === null
                  ? "Not returned"
                  : formatTokenAmount(point.tokenAmount)}
              </td>
              <td data-numeric="true">
                {point.valueUsd === null
                  ? "Not returned"
                  : formatUsd(point.valueUsd)}
              </td>
              <td data-numeric="true">
                {point.holderCount === null
                  ? "Not returned"
                  : formatCount(point.holderCount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {history.warnings.length === 0 ? null : (
        <ul className="history-warnings">
          {history.warnings.map((warning) => (
            <li className="text-meta" key={warning}>
              {warning}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
