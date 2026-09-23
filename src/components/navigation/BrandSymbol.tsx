/**
 * The ProofPulse mark: three pulse bars on a gradient tile.
 *
 * The whole mark is drawn here, tile included, so the element is a complete
 * logo rather than bars that only read as one while a CSS background sits
 * behind them. The gradient stops are tokens, so the mark follows the theme:
 * rose to green in light, violet to cyan in dark.
 *
 * `id` distinguishes the gradient wherever the mark appears more than once on
 * a page — the header and the footer both use it — because a duplicated SVG
 * id is invalid and the second definition is ignored.
 */
export function BrandSymbol({ id }: { id: string }) {
  const gradient = `brand-tile-${id}`;

  return (
    <span className="brand-symbol" aria-hidden="true">
      <svg className="brand-symbol-mark" viewBox="0 0 32 32">
        <defs>
          <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--primary)" />
            <stop offset="1" stopColor="var(--cyan)" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="10" fill={`url(#${gradient})`} />
        <g fill="var(--on-primary)">
          <rect x="7" y="11.5" width="4.5" height="9" rx="2.25" />
          <rect x="13.75" y="7.5" width="4.5" height="17" rx="2.25" />
          <rect x="20.5" y="10" width="4.5" height="12" rx="2.25" />
        </g>
      </svg>
    </span>
  );
}
