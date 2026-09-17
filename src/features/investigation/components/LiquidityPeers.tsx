/**
 * Where this token's pool depth sits among the deepest on its chain.
 *
 * Liquidity has no meaning on its own. Thirty million dollars is thin for one
 * token and enormous for another, and a reader with one number and no scale
 * cannot tell which. The comparison supplies the scale and nothing more.
 *
 * Stablecoins and the chain's native token are excluded upstream. A pool that
 * exists to hold a peg is not a comparison for a token that floats, and with
 * them included the subject token did not appear in the list at all.
 *
 * Nothing here ranks tokens as better or worse and no row is a reason to hold
 * one instead of another (02-product-rules: no trading advice). The bar is a
 * proportion of the largest returned pool, and every figure is written out.
 */

import type { LiquidityPeers as Peers } from "@/domain/investigation/investigation";
import { formatUsd } from "@/domain/evidence/format-value";

export function LiquidityPeers({
  peers,
  symbol,
}: {
  peers: Peers;
  symbol: string | null;
}) {
  const rows = peers.peers;
  const deepest = Math.max(...rows.map((row) => row.liquidityUsd ?? 0));
  const subjectIndex = rows.findIndex((row) => row.isSubject);
  const subject = rows.find((row) => row.isSubject) ?? null;

  return (
    <div className="peers-panel">
      {subject === null ? (
        <p className="history-summary">
          {symbol ?? "This token"} is not among the {rows.length} deepest
          non-stablecoin pools returned for this chain, so its depth sits below
          every figure listed here.
        </p>
      ) : (
        <p className="history-summary">
          {symbol ?? "This token"} holds the {ordinal(subjectIndex + 1)} deepest
          non-stablecoin pool returned for this chain, at{" "}
          {subject.liquidityUsd === null
            ? "an amount the screener did not return"
            : formatUsd(subject.liquidityUsd)}
          .
        </p>
      )}

      <table className="data-table peers-table">
        <caption className="visually-hidden">
          On-chain liquidity of the deepest non-stablecoin pools on this chain,
          with the token under investigation marked.
        </caption>
        <thead>
          <tr>
            <th scope="col">Token</th>
            <th scope="col">Liquidity</th>
            <th scope="col">
              <span aria-hidden="true">Relative depth</span>
              <span className="visually-hidden">
                Liquidity as a share of the deepest pool listed
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.tokenAddress}
              className="peers-row"
              data-subject={row.isSubject}
            >
              <th scope="row">
                {row.symbol ?? "Unnamed token"}
                {row.isSubject ? (
                  <span className="peers-badge">This token</span>
                ) : null}
              </th>
              <td data-numeric="true">
                {row.liquidityUsd === null
                  ? "Not returned"
                  : formatUsd(row.liquidityUsd)}
              </td>
              <td>
                {/*
                  A proportion of the deepest pool listed, not of the market.
                  The figure beside it carries the value; the bar only gives
                  the eye a scale to compare along.
                */}
                <span className="peers-bar" aria-hidden="true">
                  <span
                    className="peers-bar-fill"
                    data-subject={row.isSubject}
                    style={barWidth(row.liquidityUsd, deepest)}
                  />
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * The only inline style in the feature: a proportion computed from data
 * cannot be a class, and DESIGN-RULES 7.6 bans building class names from
 * values. A custom property keeps the rule in the stylesheet.
 */
function barWidth(
  value: number | null,
  deepest: number,
): React.CSSProperties | undefined {
  if (value === null || deepest <= 0) return undefined;
  const share = Math.max(0, Math.min(1, value / deepest));
  return {
    "--peer-share": `${(share * 100).toFixed(2)}%`,
  } as React.CSSProperties;
}

function ordinal(position: number): string {
  const tens = position % 100;
  if (tens >= 11 && tens <= 13) return `${position}th`;
  switch (position % 10) {
    case 1:
      return `${position}st`;
    case 2:
      return `${position}nd`;
    case 3:
      return `${position}rd`;
    default:
      return `${position}th`;
  }
}
