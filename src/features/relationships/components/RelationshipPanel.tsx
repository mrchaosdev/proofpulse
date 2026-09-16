/**
 * On-demand relationship expansion.
 *
 * No request is made until the user selects an actor (02-product-rules 4.3),
 * and the credit-impact category is stated before the call (rule 4.4).
 *
 * Selection travels in the URL, so the server recomputes the whole
 * investigation with the new evidence. That keeps one Coordination Risk value
 * on screen instead of a preliminary score in the lens disagreeing with an
 * assessed score in this panel. The expansion is cached, so returning to an
 * already-inspected actor costs nothing.
 *
 * Selection needs no client JavaScript: each control is a link.
 */

import Link from "next/link";
import type {
  Actor,
  Relationship,
  SourceStatus,
} from "@/domain/investigation/investigation";
import { shortenAddress } from "@/domain/investigation/address";
import type { Timeframe } from "@/domain/investigation/scope";
import { RelationshipMap } from "./RelationshipMap";

/** Actors offered for expansion, so the list can never be unbounded. */
const MAX_OFFERED_ACTORS = 5;

function buildHref(
  timeframe: Timeframe,
  isFixture: boolean,
  actorAddress: string | null,
): string {
  const query = new URLSearchParams({ timeframe });
  if (isFixture) query.set("mode", "fixture");
  if (actorAddress !== null) query.set("inspect", actorAddress);
  return `?${query.toString()}`;
}

export function RelationshipPanel({
  timeframe,
  isFixture,
  actors,
  relationships,
  inspectedActorAddress,
  status,
}: {
  timeframe: Timeframe;
  isFixture: boolean;
  actors: readonly Actor[];
  relationships: readonly Relationship[];
  inspectedActorAddress: string | null;
  status: SourceStatus;
}) {
  const offered = actors.slice(0, MAX_OFFERED_ACTORS);

  return (
    <div className="stack">
      <p className="card-question">
        Nothing is requested until you choose an actor. One expansion costs one
        Nansen credit and returns first-degree relationships only.
      </p>

      <div className="relationship-actions">
        {offered.map((actor) => {
          const isSelected =
            inspectedActorAddress?.toLowerCase() ===
            actor.address.toLowerCase();
          return (
            <Link
              className="button"
              data-variant={isSelected ? "primary" : "secondary"}
              aria-current={isSelected}
              key={`${actor.side}-${actor.address}`}
              href={buildHref(timeframe, isFixture, actor.address)}
            >
              Inspect {shortenAddress(actor.address)}
            </Link>
          );
        })}
        {inspectedActorAddress === null ? null : (
          <Link
            className="button"
            data-variant="quiet"
            href={buildHref(timeframe, isFixture, null)}
          >
            Clear selection
          </Link>
        )}
      </div>

      {status.state === "error" ? (
        <div className="banner" data-state="partial" role="note">
          <span className="banner-title">Expansion unavailable</span>
          <span>{status.message}</span>
        </div>
      ) : null}

      {inspectedActorAddress !== null && relationships.length === 0 ? (
        <p className="card-question">
          No related wallets were returned for this actor. That is an absence of
          records, not evidence that none exist.
        </p>
      ) : null}

      {inspectedActorAddress !== null && relationships.length > 0 ? (
        <div className="stack">
          <RelationshipMap
            actorAddress={inspectedActorAddress}
            relationships={relationships}
          />

          <div className="table-scroll">
            <table className="data-table relationship-table">
              <caption className="visually-hidden">
                Related wallets, relation type, and when the observed link was
                recorded.
              </caption>
              <thead>
                <tr>
                  <th scope="col">Related wallet</th>
                  <th scope="col">Relation</th>
                  <th scope="col">Observed at</th>
                </tr>
              </thead>
              <tbody>
                {relationships.map((relationship) => (
                  <tr
                    key={`${relationship.targetAddress}-${relationship.relation}`}
                  >
                    <th scope="row" className="identifier">
                      <span aria-hidden="true">
                        {shortenAddress(relationship.targetAddress)}
                      </span>
                      <span className="visually-hidden">
                        {relationship.targetAddress}
                      </span>
                    </th>
                    <td>{relationship.relation}</td>
                    <td className="identifier">
                      {relationship.observedAt ?? "Not returned"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
