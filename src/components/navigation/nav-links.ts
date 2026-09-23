/**
 * The bar's destinations, in order. One list, so the inline row and the
 * overflow menu cannot drift apart.
 */
export const NAV_LINKS: readonly {
  href: string;
  label: string;
  external?: boolean;
}[] = [
  { href: "/investigate", label: "Investigate" },
  { href: "/methodology", label: "Methodology" },
  {
    href: "https://github.com/mrchaosdev/proofpulse",
    label: "Source",
    external: true,
  },
];
