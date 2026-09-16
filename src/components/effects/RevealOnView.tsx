"use client";

/**
 * Reveal on view (DESIGN-RULES 11).
 *
 * A block settles into place as it enters the viewport, which states where it
 * came from — the spatial relationship the rule permits motion for. Nothing
 * loops and nothing moves on its own: each element is revealed once and then
 * unobserved.
 *
 * This replaced a CSS `animation-timeline: view()` version, which only ran in
 * Chromium. Every other engine fell through the `@supports` guard and showed
 * nothing at all.
 *
 * Two properties matter more than the effect:
 *
 * 1. The hidden state is set here, in script. Markup ships visible, so a
 *    failure to hydrate leaves the page readable rather than blank.
 * 2. Only elements below the fold are hidden. Hiding what has already painted
 *    would flash it away and bring it back. The first screen of each route is
 *    therefore animated by the load-in in motion.css, not from here.
 *
 * The bookkeeping lives in reveal-state.ts, which is where its tests are.
 */

import { useEffect } from "react";
import { canHide, createRevealState, REVEAL_MARGIN_PX } from "./reveal-state";

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

export function RevealOnView() {
  useEffect(() => {
    // Respected here rather than in CSS: with no attribute written, there is
    // no hidden state to undo.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const state = createRevealState();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          state.reveal(entry.target);
          // Once revealed, never again. A block that re-hides on scroll is a
          // loop, which DESIGN-RULES 11 does not allow.
          observer.unobserve(entry.target);
        }
      },
      {
        /*
         * The top margin extends the root far above the window so anything
         * already scrolled past counts as intersecting and is revealed.
         * Without it, a jump — the End key, an anchor deep in the document, a
         * restored scroll position — carries elements from below the window to
         * above it between two frames, and they stay hidden forever having
         * never once intersected.
         *
         * The bottom margin is the opposite: elements below must come
         * REVEAL_MARGIN_PX into the window before they arrive.
         */
        rootMargin: `100000px 0px -${REVEAL_MARGIN_PX}px 0px`,
        threshold: 0.05,
      },
    );

    const arm = () => {
      const maxScroll = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight,
      );

      for (const element of document.querySelectorAll(TARGETS)) {
        const hideable = canHide({
          top: element.getBoundingClientRect().top,
          innerHeight: window.innerHeight,
          scrollY: window.scrollY,
          maxScroll,
          revealMargin: REVEAL_MARGIN_PX,
        });
        if (!hideable) continue;
        if (state.arm(element)) observer.observe(element);
      }
    };

    arm();

    // A navigation that only changes search params — the timeframe switch on a
    // report — swaps the content without remounting this component. Watching
    // the document catches the replacements; a render frame coalesces bursts.
    let frame = 0;
    const mutations = new MutationObserver(() => {
      if (frame !== 0) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        arm();
      });
    });
    mutations.observe(document.body, { childList: true, subtree: true });

    return () => {
      if (frame !== 0) window.cancelAnimationFrame(frame);
      mutations.disconnect();
      observer.disconnect();
      // Cleanup owes the document a way back. Without this, a remount in
      // development left every block below the fold hidden for good.
      state.release();
    };
  }, []);

  return null;
}
