/**
 * First-degree relationship map.
 *
 * The selected actor sits at the centre and its related wallets surround it.
 * Every node is the same size, because no per-node metric has been verified;
 * node size must map only to a documented metric (DESIGN-RULES 9), so it maps
 * to nothing here. The table beneath carries the same rows.
 */

import type { Relationship } from "@/domain/investigation/investigation";
import { shortenAddress } from "@/domain/investigation/address";

/** P0 shows at most 21 nodes: one selected actor plus 20 related wallets. */
export const MAX_VISIBLE_NODES = 21;

function relationSlug(relation: string): string {
  return relation
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function RelationshipMap({
  actorAddress,
  relationships,
}: {
  actorAddress: string;
  relationships: readonly Relationship[];
}) {
  const visible = relationships.slice(0, MAX_VISIBLE_NODES - 1);
  const centre = { x: 200, y: 150 };
  const radius = 110;

  const nodes = visible.map((relationship, index) => {
    const angle =
      (2 * Math.PI * index) / Math.max(1, visible.length) - Math.PI / 2;
    return {
      relationship,
      x: centre.x + radius * Math.cos(angle),
      y: centre.y + radius * Math.sin(angle),
    };
  });

  const relationTypes = [...new Set(visible.map((item) => item.relation))];

  return (
    <div className="stack">
      <svg
        className="relationship-figure"
        viewBox="0 0 400 300"
        role="img"
        aria-label={`First-degree relationship map for ${actorAddress}. The same relationships are listed in the table below.`}
      >
        {nodes.map((node) => (
          <line
            className="relationship-edge"
            data-relation={relationSlug(node.relationship.relation)}
            key={`edge-${node.relationship.targetAddress}-${node.relationship.relation}`}
            x1={centre.x}
            y1={centre.y}
            x2={node.x}
            y2={node.y}
          />
        ))}

        {nodes.map((node) => (
          <circle
            className="relationship-node"
            key={`node-${node.relationship.targetAddress}-${node.relationship.relation}`}
            cx={node.x}
            cy={node.y}
            r="8"
          />
        ))}

        <circle
          className="relationship-node"
          data-role="selected"
          cx={centre.x}
          cy={centre.y}
          r="12"
        />
        <text
          className="relationship-node-label"
          x={centre.x}
          y={centre.y + 26}
        >
          {shortenAddress(actorAddress)}
        </text>
      </svg>

      <p className="relationship-legend">
        {relationTypes.map((relation) => (
          <span className="relationship-legend-item" key={relation}>
            <span
              className="relationship-swatch"
              data-relation={relationSlug(relation)}
              aria-hidden="true"
            />
            {relation}
          </span>
        ))}
      </p>

      <p className="card-footer">
        First-degree only. Showing {visible.length} of {relationships.length}{" "}
        returned relationships, capped at {MAX_VISIBLE_NODES - 1}. All nodes are
        the same size; node size carries no meaning here. A relationship is an
        observed link, not shared ownership.
      </p>
    </div>
  );
}
