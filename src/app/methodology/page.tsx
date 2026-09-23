import type { Metadata } from "next";
import Link from "next/link";
import { describeFixture } from "@/server/fixtures/fixture-loader";
import {
  LIQUIDITY_SCALE_FRACTION,
  MINIMUM_SCALE_USD,
  SEGMENT_WEIGHTS,
  segmentLabel,
} from "@/domain/scoring/calculate-direction";
import {
  BREADTH_MAXIMUM,
  CONSISTENCY_MAXIMUM,
  COVERAGE_MAXIMUM,
  FIXTURE_CONFIDENCE_CAP,
  FRESHNESS_MAXIMUM,
  QUALITY_MAXIMUM,
} from "@/domain/scoring/calculate-confidence";
import {
  CONCENTRATION_MAXIMUM,
  DIVERSITY_MAXIMUM,
  PRELIMINARY_SCORE_CAP,
  RELATIONSHIP_DENSITY_MAXIMUM,
  TIMING_MAXIMUM,
} from "@/domain/scoring/calculate-coordination-risk";
import { SCORE_FORMULA_VERSION } from "@/domain/scoring/score";
import { SEGMENTS } from "@/domain/investigation/investigation";
import { CREDITS_PER_CALL } from "@/domain/investigation/credits";
import { Button } from "@/components/ui/button";
import { MethodologyIndex } from "@/components/methodology/MethodologyIndex";

export const metadata: Metadata = {
  title: "Methodology",
  description:
    "How ProofPulse derives Direction, Confidence, and Coordination Risk from Nansen evidence.",
};

/**
 * Rendered from the same constants the scoring code uses, so the published
 * method cannot drift away from the implemented formulas
 * (09-delivery-plan, acceptance case D-08).
 */
const SECTIONS = [
  { id: "meaning", label: "What the scores mean" },
  { id: "direction", label: "Direction" },
  { id: "confidence", label: "Confidence" },
  { id: "coordination", label: "Coordination risk" },
  { id: "data", label: "Data handling" },
] as const;

export default function MethodologyPage() {
  const fixture = describeFixture();

  return (
    <div className="page-region doc-layout">
      <MethodologyIndex sections={SECTIONS} />

      <div className="doc-body">
        <h1>Methodology</h1>
        <p>
          Formula version{" "}
          <span className="identifier">{SCORE_FORMULA_VERSION}</span>. These
          thresholds are hypotheses for a Buildathon MVP. They have not been
          calibrated across a wide token sample and should not be treated as
          validated research.
        </p>

        <section className="stack">
          <h2 id="meaning">What the three scores mean</h2>
          <ul className="boundary-list">
            <li>
              <strong>Direction</strong> describes the balance of observed
              participant flows, from −100 to +100. It is not a price forecast
              and not a probability.
            </li>
            <li>
              <strong>Confidence</strong> describes how complete, fresh, broad,
              and internally consistent the evidence is, from 0 to 100. It says
              nothing about whether price will rise.
            </li>
            <li>
              <strong>Coordination risk</strong> describes observable
              concentration and wallet relationships, from 0 to 100. It is not a
              fraud score and never asserts that wallets share an owner.
            </li>
          </ul>
        </section>

        <section className="stack">
          <h2 id="direction">Direction</h2>
          <p>
            Each cohort net flow is normalized with{" "}
            <span className="identifier">tanh(net flow / scale)</span>,
            weighted, and averaged. The scale is{" "}
            <span className="identifier">
              max(liquidity × {LIQUIDITY_SCALE_FRACTION}, {MINIMUM_SCALE_USD})
            </span>
            . When liquidity is unavailable, the median absolute cohort flow
            replaces it. Weights of missing cohorts are removed and the
            remainder renormalized, so a missing cohort is never counted as
            zero.
          </p>
          <div className="table-scroll">
            <table className="data-table">
              <caption className="visually-hidden">Cohort weights.</caption>
              <thead>
                <tr>
                  <th scope="col">Cohort</th>
                  <th scope="col">Weight</th>
                  <th scope="col">Note</th>
                </tr>
              </thead>
              <tbody>
                {SEGMENTS.map((segment) => (
                  <tr key={segment}>
                    <th scope="row">{segmentLabel(segment)}</th>
                    <td data-numeric="true">{SEGMENT_WEIGHTS[segment]}</td>
                    <td>
                      {SEGMENT_WEIGHTS[segment] === 0
                        ? "Excluded from the score. The sign convention of exchange net flow is not yet verified against the live API, so this cohort is shown as context only."
                        : "Positive flow supports accumulation."}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="stack">
          <h2 id="confidence">Confidence</h2>
          <div className="table-scroll">
            <table className="data-table">
              <caption className="visually-hidden">
                Confidence components and their maxima.
              </caption>
              <thead>
                <tr>
                  <th scope="col">Component</th>
                  <th scope="col">Maximum</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Required-source coverage</th>
                  <td data-numeric="true">{COVERAGE_MAXIMUM}</td>
                </tr>
                <tr>
                  <th scope="row">Freshness</th>
                  <td data-numeric="true">{FRESHNESS_MAXIMUM}</td>
                </tr>
                <tr>
                  <th scope="row">Participant breadth</th>
                  <td data-numeric="true">{BREADTH_MAXIMUM}</td>
                </tr>
                <tr>
                  <th scope="row">Cross-segment consistency</th>
                  <td data-numeric="true">{CONSISTENCY_MAXIMUM}</td>
                </tr>
                <tr>
                  <th scope="row">Warning and schema quality</th>
                  <td data-numeric="true">{QUALITY_MAXIMUM}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            A historical fixture caps Confidence at {FIXTURE_CONFIDENCE_CAP}, so
            a deterministic demo can never present itself as a live result. When
            no required dataset returns usable records, the quality component
            contributes nothing rather than a residual.
          </p>
        </section>

        <section className="stack">
          <h2 id="coordination">Coordination risk</h2>
          <div className="table-scroll">
            <table className="data-table">
              <caption className="visually-hidden">
                Coordination risk components and their maxima.
              </caption>
              <thead>
                <tr>
                  <th scope="col">Component</th>
                  <th scope="col">Maximum</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Top-actor concentration</th>
                  <td data-numeric="true">{CONCENTRATION_MAXIMUM}</td>
                </tr>
                <tr>
                  <th scope="row">Related-wallet density</th>
                  <td data-numeric="true">{RELATIONSHIP_DENSITY_MAXIMUM}</td>
                </tr>
                <tr>
                  <th scope="row">Timing concentration</th>
                  <td data-numeric="true">{TIMING_MAXIMUM}</td>
                </tr>
                <tr>
                  <th scope="row">Effective actor diversity</th>
                  <td data-numeric="true">{DIVERSITY_MAXIMUM}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            Before any relationship request has run, the result is{" "}
            <strong>not assessed</strong>, never zero. A concentration-only
            result is marked preliminary and capped at {PRELIMINARY_SCORE_CAP}.
            Timing concentration currently contributes nothing, because
            consistent source-time coverage has not been verified.
          </p>
        </section>

        <section className="stack">
          <h2 id="data">Data handling</h2>
          <ul className="boundary-list">
            <li>
              Missing values stay missing. A field that Nansen documents as “not
              tracked” is normalized to absent, never to zero.
            </li>
            <li>
              Stale data stays visible with its age and lowers Confidence rather
              than being hidden or silently refreshed.
            </li>
            <li>
              One failing endpoint never discards evidence from the others. The
              score recomputes from what is available and Confidence falls.
            </li>
            <li>
              Each Nansen call costs {CREDITS_PER_CALL} credit. A core
              investigation makes four calls before any optional wallet
              expansion.
            </li>
          </ul>
        </section>

        <div className="doc-actions">
          <Button asChild variant="default">
            <Link href="/investigate">Run an investigation</Link>
          </Button>
          <Button asChild variant="outline">
            <Link
              href={`/investigate/${fixture.chain}/${fixture.tokenAddress}?timeframe=${fixture.timeframe}&mode=fixture`}
            >
              See these formulas on real data
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
