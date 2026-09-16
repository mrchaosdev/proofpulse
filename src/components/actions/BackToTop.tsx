"use client";

/**
 * Back to top.
 *
 * An investigation report runs past six thousand pixels on a desktop and
 * twelve thousand on a phone, where every card stacks into one column. Getting
 * back to the scope header — the only place that says which token and which
 * timeframe you are reading — meant a long scroll.
 *
 * Scroll position lives outside React, so it is read through
 * useSyncExternalStore rather than mirrored into component state.
 */

import { useCallback, useSyncExternalStore } from "react";

/**
 * Roughly one and a half phone viewports. Below this the header is still a
 * short flick away and a floating control is just something in the way.
 */
const REVEAL_AT_PX = 900;

function subscribe(onChange: () => void): () => void {
  window.addEventListener("scroll", onChange, { passive: true });
  window.addEventListener("resize", onChange);
  return () => {
    window.removeEventListener("scroll", onChange);
    window.removeEventListener("resize", onChange);
  };
}

function getSnapshot(): boolean {
  return window.scrollY > REVEAL_AT_PX;
}

function getServerSnapshot(): boolean {
  return false;
}

export function BackToTop() {
  const visible = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const handleClick = useCallback(() => {
    // The motion tokens collapse to zero under reduced motion, but a token
    // cannot reach a scripted scroll, so the preference is read directly.
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });

    // Scrolling moves the page, not the focus. Without this a keyboard reader
    // presses the button, watches the page return to the top, and then tabs
    // straight back into the footer it just left.
    const main = document.querySelector("main");
    if (main instanceof HTMLElement) {
      main.setAttribute("tabindex", "-1");
      main.focus({ preventScroll: true });
    }
  }, []);

  return (
    <button
      type="button"
      className="back-to-top"
      // Hidden state is carried by visibility in CSS, which takes the button
      // out of the tab order and the accessibility tree on its own. Nothing
      // here needs aria-hidden, which would be wrong on a focusable element.
      data-visible={visible}
      title="Back to top"
      onClick={handleClick}
    >
      <svg className="back-to-top-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
      <span className="visually-hidden">Back to top</span>
    </button>
  );
}
