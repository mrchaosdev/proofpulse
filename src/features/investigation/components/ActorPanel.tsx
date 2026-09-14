/**
 * Who dominated recent net buying and selling?
 *
 * An upstream label is attributed to its source and never read as ownership
 * (02-product-rules 9.6). Results are capped by a documented server constant.
 */

import type { Actor } from "@/domain/investigation/investigation";
import { formatSignedUsd } from "@/domain/evidence/format-value";
import { Address } from "@/components/data-display/Address";

function sign(value: number | null): "positive" | "negative" | "zero" {
  if (value === null || value === 0) return "zero";
  return value > 0 ? "positive" : "negative";
}

export function ActorPanel({
  actors,
  emptyMessage,
}: {
  actors: readonly Actor[];
  emptyMessage: string;
}) {
  if (actors.length === 0) {
    return <p className="card-question">{emptyMessage}</p>;
  }

  return (
    <ul className="actor-list">
      {actors.map((actor) => (
        <li className="actor-row" key={`${actor.side}-${actor.address}`}>
          <Address value={actor.address} label={actor.displayLabel} />
          <span className="actor-value numeric" data-sign={sign(actor.netUsd)}>
            {actor.netUsd === null
              ? "Not derivable"
              : formatSignedUsd(actor.netUsd)}
          </span>
        </li>
      ))}
    </ul>
  );
}
