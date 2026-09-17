"use client";

/**
 * Entrance motion, driven by GSAP ScrollTrigger (DESIGN-RULES 11).
 *
 * A block settles into place as it enters the viewport. Each element is
 * revealed once — `once: true` — because a block that re-animates on every
 * pass is the perpetual loop rule 11 still prohibits.
 *
 * Three properties carry over from the hand-written version this replaces, and
 * they matter more than the effect:
 *
 * 1. Markup ships visible. The hidden state is applied here, in script, so a
 *    page that fails to hydrate is readable rather than blank.
 * 2. Reduced motion is honoured through `gsap.matchMedia`, which never creates
 *    the tween, so there is no hidden state to undo.
 * 3. Nothing can be stranded. ScrollTrigger evaluates its start on creation
 *    and on refresh, so an element the page can never scroll far enough to
 *    reach is revealed immediately rather than waiting forever — the failure
 *    the previous version needed an explicit reachability guard to avoid.
 */

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * The main block of each route. Kept here rather than in the markup so a
 * presentational concern does not spread across every page; a test asserts
 * each route still matches something, because a renamed class would otherwise
 * silence the reveal without failing anything.
 */
const TARGETS = [
  // Landing.
  ".section-heading",
  ".step-list > li",
  ".example-stage",
  ".guardrail-block",
  // Report.
  ".investigation-grid > *",
  // Methodology.
  ".doc-body > section",
  ".doc-actions",
].join(", ");

/**
 * The first screen of each route. Nobody scrolls into what is already on
 * screen, so these arrive on load as one orchestrated sequence rather than
 * waiting for a trigger that has already passed.
 */
const FIRST_SCREEN = [
  ".hero-copy",
  ".hero > .spotlight-card",
  ".investigate-header",
  ".investigate-split > *",
  ".investigation-page > .stack > .banner",
  ".scope-ribbon",
  ".doc-body > h1",
  ".doc-body > section:first-of-type",
].join(", ");

/** Well within rule 11's 900ms ceiling for an orchestrated entrance. */
const DURATION_SECONDS = 0.5;
const TRAVEL_PX = 20;
/** 0.5s duration plus three 0.09s steps stays under the ceiling. */
const STAGGER_SECONDS = 0.09;

export function RevealOnView() {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const media = gsap.matchMedia();

    media.add("(prefers-reduced-motion: no-preference)", () => {
      // One sequence, so the first screen reads as a single arrival rather
      // than as several elements each appearing on their own.
      const firstScreen = gsap.utils.toArray<HTMLElement>(FIRST_SCREEN);
      if (firstScreen.length > 0) {
        gsap.from(firstScreen, {
          opacity: 0,
          y: TRAVEL_PX,
          duration: DURATION_SECONDS,
          ease: "power2.out",
          stagger: STAGGER_SECONDS,
        });
      }

      for (const element of gsap.utils.toArray<HTMLElement>(TARGETS)) {
        gsap.from(element, {
          opacity: 0,
          y: TRAVEL_PX,
          duration: DURATION_SECONDS,
          ease: "power2.out",
          scrollTrigger: {
            trigger: element,
            // Far enough in that a block has settled before it is read.
            start: "top 88%",
            once: true,
          },
        });
      }
    });

    /*
     * Any trigger the page cannot scroll far enough to reach is completed.
     *
     * On a window taller than the document there is barely any scroll to
     * spend: an element sitting below the start line would wait for a
     * position the reader can never reach and stay at opacity zero for good.
     * The same failure appeared in the hand-written version this replaced.
     */
    const settleUnreachable = () => {
      const furthest = ScrollTrigger.maxScroll(window);
      for (const trigger of ScrollTrigger.getAll()) {
        if (trigger.start > furthest) trigger.animation?.progress(1);
      }
    };

    // Fonts change the page height after the triggers are placed, which would
    // leave every start measured against a shorter document than the reader
    // actually scrolls.
    void document.fonts.ready.then(() => {
      ScrollTrigger.refresh();
      settleUnreachable();
    });

    ScrollTrigger.addEventListener("refresh", settleUnreachable);
    settleUnreachable();

    return () => {
      ScrollTrigger.removeEventListener("refresh", settleUnreachable);
      media.revert();
    };
  });

  return <div ref={scope} hidden />;
}
