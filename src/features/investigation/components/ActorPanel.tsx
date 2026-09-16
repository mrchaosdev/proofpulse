/**
 * Who dominated recent net buying and selling?
 *
 * An upstream label is attributed to its source and never read as ownership
 * (02-product-rules 9.6). The result count and sort order are stated, because
 * a truncated leaderboard that does not say it is truncated invites the reader
 * to treat ten rows as the whole market (04-information-architecture 5).
 *
 * Each row carries its own expansion control, so relationship evidence is
 * requested for a chosen actor rather than for all of them (rule 4.3).
 */

import Link from "next/link";
import type { Actor } from "@/domain/investigation/investigation";
import type { Timeframe } from "@/domain/investigation/scope";
import { formatSignedUsd } from "@/domain/evidence/format-value";
import { Address } from "@/components/data-display/Address";
import { LinkPending } from "@/components/actions/LinkPending";

function sign(value: number | null): "positive" | "negative" | "zero" {
  if (value === null || value === 0) return "zero";
  return value > 0 ? "positive" : "negative";
}

function inspectHref(
  timeframe: Timeframe,
  isFixture: boolean,
  actorAddress: string,
): string {
  const query = new URLSearchParams({ timeframe });
  if (isFixture) query.set("mode", "fixture");
  query.set("inspect", actorAddress);
  return `?${query.toString()}`;
}

export function ActorPanel({
  actors,
  emptyMessage,
  timeframe,
  isFixture,
  inspectedActorAddress,
}: {
  actors: readonly Actor[];
  emptyMessage: string;
  timeframe: Timeframe;
  isFixture: boolean;
  inspectedActorAddress: string | null;
}) {
  if (actors.length === 0) {
    return <p className="card-question">{emptyMessage}</p>;
  }

  return (
    <div className="stack">
      <p className="text-meta">
        {actors.length} actors, ordered as Nansen returned them, by traded
        volume. This is not the whole market.
      </p>
      <ul className="actor-list">
        {actors.map((actor) => {
          const isSelected =
            inspectedActorAddress?.toLowerCase() ===
            actor.address.toLowerCase();
          return (
            <li className="actor-row" key={`${actor.side}-${actor.address}`}>
              <Address value={actor.address} label={actor.displayLabel} />
              <span
                className="actor-value numeric"
                data-sign={sign(actor.netUsd)}
              >
                {actor.netUsd === null
                  ? "Not derivable"
                  : formatSignedUsd(actor.netUsd)}
              </span>
              <Link
                className="actor-inspect"
                href={inspectHref(timeframe, isFixture, actor.address)}
                aria-current={isSelected}
                scroll={false}
              >
                <LinkPending
                  label={isSelected ? "Inspecting" : "Inspect relationships"}
                  pendingLabel="Requesting relationships…"
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
