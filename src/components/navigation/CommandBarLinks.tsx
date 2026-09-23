"use client";

/**
 * The bar's destinations, with the current one marked.
 *
 * The bar had no active state at all: every route looked the same, so the
 * chrome never said where you were. `aria-current` carries that for a reader
 * and the pill behind it carries it visually.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_LINKS } from "./nav-links";

export function CommandBarLinks() {
  const pathname = usePathname();

  return (
    <ul className="command-bar-links">
      {NAV_LINKS.map((link) => {
        if (link.external) {
          return (
            <li key={link.href}>
              <a href={link.href} rel="noreferrer noopener">
                {link.label}
              </a>
            </li>
          );
        }

        /*
         * An investigation lives under /investigate/<chain>/<address>, so the
         * destination stays marked while you are reading one.
         */
        const current =
          pathname === link.href || pathname.startsWith(`${link.href}/`);

        return (
          <li key={link.href}>
            <Link href={link.href} aria-current={current ? "page" : undefined}>
              {link.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
