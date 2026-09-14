/**
 * The audit surface. Every normalized item used by a score or by prose is
 * listed, including items that contradict the dominant direction
 * (04-information-architecture "Evidence ledger").
 *
 * Credentials and raw HTTP headers never appear here.
 */

import type { Evidence } from "@/domain/evidence/evidence";

const POLARITY_WORDS: Readonly<Record<Evidence["polarity"], string>> = {
  supports_accumulation: "Supports accumulation",
  supports_distribution: "Supports distribution",
  neutral: "Neutral",
};

export function EvidenceLedger({
  evidence,
  evaluatedAt,
}: {
  evidence: readonly Evidence[];
  evaluatedAt: string;
}) {
  return (
    <div className="table-scroll">
      <table className="evidence-table">
        <caption className="visually-hidden">
          Every evidence item used in this investigation, with its source and
          collection time.
        </caption>
        <thead>
          <tr>
            <th scope="col">Evidence ID</th>
            <th scope="col">Observation</th>
            <th scope="col">Source</th>
            <th scope="col">Collected</th>
            <th scope="col">Effect</th>
          </tr>
        </thead>
        <tbody>
          {evidence.map((item) => (
            <tr key={item.id}>
              <th scope="row" className="evidence-id identifier">
                {item.id}
              </th>
              <td className="evidence-statement">
                {item.statement}
                {item.derivation === undefined ? null : (
                  <span className="evidence-derivation identifier">
                    {" "}
                    {item.derivation}
                  </span>
                )}
              </td>
              <td className="evidence-derivation">
                {item.source.capability}
                {item.source.live ? " (live)" : " (fixture)"}
              </td>
              <td className="evidence-derivation identifier">
                {item.source.collectedAt}
              </td>
              <td className="evidence-polarity" data-polarity={item.polarity}>
                {POLARITY_WORDS[item.polarity]}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="card-footer">
        Evaluated at <span className="identifier">{evaluatedAt}</span> UTC.
      </p>
    </div>
  );
}
