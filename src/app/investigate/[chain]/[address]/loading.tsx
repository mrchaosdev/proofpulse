/**
 * Loading state for an investigation (DESIGN-RULES 10).
 *
 * The skeleton matches the geometry of the real layout so the page does not
 * jump when evidence arrives, and it names the task in plain language instead
 * of showing a bare spinner. It contains no numbers: a skeleton must never
 * imply a value it does not have.
 */

export default function InvestigationLoading() {
  return (
    <div className="page-region stack investigation-page">
      <section className="scope-ribbon" aria-hidden="true">
        <span className="skeleton skeleton-title" />
        <span className="skeleton skeleton-meta" />
      </section>

      <p role="status" className="card-question">
        Requesting token context, cohort flows, top buyers, and top sellers from
        Nansen. Sections appear as each dataset returns.
      </p>

      <div className="investigation-grid" aria-hidden="true">
        <section className="card grid-overview">
          <span className="skeleton skeleton-title" />
          <span className="skeleton skeleton-block" />
        </section>
        <section className="card grid-lens">
          <span className="skeleton skeleton-title" />
          <span className="skeleton skeleton-lens" />
          <span className="skeleton skeleton-line" />
          <span className="skeleton skeleton-line" />
        </section>
        <section className="card grid-flows">
          <span className="skeleton skeleton-title" />
          <span className="skeleton skeleton-block" />
        </section>
      </div>
    </div>
  );
}
