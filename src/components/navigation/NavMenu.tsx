"use client";

/**
 * Overflow menu for the command bar's destinations
 * (D-023 superseded: see 11-decisions-and-open-questions.md).
 *
 * The bar is one row at every width. Below the width where the inline link
 * list no longer fits beside the mode badge and the theme control, CSS hides
 * the list and shows this trigger instead, which carries the same three
 * destinations in the same order.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Popover as PopoverPrimitive } from "radix-ui";
import { NAV_LINKS } from "./nav-links";

export function NavMenu() {
  const pathname = usePathname();

  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger className="nav-menu-trigger" aria-label="More">
        <svg className="nav-menu-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          className="nav-menu-panel"
          align="end"
          sideOffset={8}
          /* Keeps the panel off the screen edge at 320px, where the trigger
             sits inside a tighter gutter than the page below it. */
          collisionPadding={12}
        >
          <nav aria-label="More">
            <ul className="nav-menu-list">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <PopoverPrimitive.Close asChild>
                    {link.external ? (
                      <a href={link.href} rel="noreferrer noopener">
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        aria-current={
                          pathname === link.href ||
                          pathname.startsWith(`${link.href}/`)
                            ? "page"
                            : undefined
                        }
                      >
                        {link.label}
                      </Link>
                    )}
                  </PopoverPrimitive.Close>
                </li>
              ))}
            </ul>
          </nav>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
