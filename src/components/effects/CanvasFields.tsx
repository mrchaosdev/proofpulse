"use client";

/**
 * The ground the page sits on.
 *
 * Light: three soft light fields, moved by the reader's own scrolling
 * (DESIGN-RULES 11, D-081). Rule 11 prohibits a background that animates on
 * its own; it permits scroll-linked movement, so these layers are tied to
 * scroll position with `scrub` and stop exactly when the reader does.
 *
 * Dark: a live WebGL terrain field, `TopographicBackground` (D-083), painted
 * over these same three layers. It is a real, continuously running
 * animation — the one exception DESIGN-RULES 11 now names — kept honest by
 * code rather than by discipline: reduced motion freezes it, and it pauses
 * off-screen or on a hidden tab. See that file for the full account.
 *
 * Three properties matter for the CSS layers regardless of theme:
 *
 * 1. The canvas ships complete. The layers are painted by CSS at their resting
 *    position, so a page that never hydrates still has its ground.
 * 2. Reduced motion never creates the tween, through `gsap.matchMedia`, which
 *    leaves the layers exactly where CSS put them.
 * 3. Only transforms move, so scrolling never triggers layout or repaint of
 *    anything behind.
 */

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { TopographicBackground } from "./TopographicBackground";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * How far each field travels over the whole document, as a share of its own
 * height. Different distances are what separate them into depths.
 */
const FIELD_TRAVEL = [-22, 14, -34];

export function CanvasFields() {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const media = gsap.matchMedia();

      media.add("(prefers-reduced-motion: no-preference)", () => {
        const fields = gsap.utils.toArray<HTMLElement>(".canvas-field");
        fields.forEach((field, index) => {
          gsap.to(field, {
            yPercent: FIELD_TRAVEL[index] ?? 0,
            ease: "none",
            scrollTrigger: {
              trigger: document.body,
              start: "top top",
              end: "bottom bottom",
              // Tied to scroll position, so it finishes when scrolling does.
              scrub: true,
            },
          });
        });
      });

      return () => media.revert();
    },
    { scope },
  );

  return (
    <div className="canvas-fields" ref={scope} aria-hidden="true">
      <span className="canvas-field canvas-field-primary" />
      <span className="canvas-field canvas-field-cyan" />
      <span className="canvas-field canvas-field-deep" />
      <TopographicBackground />
    </div>
  );
}
