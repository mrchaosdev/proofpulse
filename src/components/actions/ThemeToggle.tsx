"use client";

/**
 * Theme control (04-information-architecture "Global navigation").
 *
 * Light and dark only (D-085) — System was removed, so one button now covers
 * both the wide command bar and the narrow one; there is no longer a segmented
 * control to fit or a third icon to disambiguate.
 */

import { useCallback, useEffect, useSyncExternalStore } from "react";
import {
  DEFAULT_THEME,
  THEME_STORAGE_KEY as STORAGE_KEY,
} from "./theme-script";

type Choice = "light" | "dark";

const CHANGE_EVENT = "proofpulse-theme-change";

const LABELS: Record<Choice, string> = {
  light: "Light",
  dark: "Dark",
};

const OTHER: Record<Choice, Choice> = {
  light: "dark",
  dark: "light",
};

function ThemeIcon({ choice }: { choice: Choice }) {
  if (choice === "light") {
    return (
      <svg className="theme-icon" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="3.5" />
        <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4" />
      </svg>
    );
  }

  return (
    <svg className="theme-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.2 15.1A8.2 8.2 0 0 1 8.9 3.8 8.5 8.5 0 1 0 20.2 15.1Z" />
    </svg>
  );
}

function readStored(): Choice {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

function applyToDocument(choice: Choice): void {
  document.documentElement.setAttribute("data-theme", choice);
}

/**
 * Sets the attribute, persists it, and only then tells React. The three must
 * stay in that order: `startViewTransition`'s update callback runs as a
 * microtask rather than synchronously, so a caller that set the attribute and
 * dispatched the event as two separate steps could dispatch before the
 * attribute actually changed. `useSyncExternalStore` compares snapshots and
 * sees no difference, skips the re-render, and the control's label falls one
 * click behind — which is what happened before this was one function.
 */
function commitTheme(choice: Choice): void {
  applyToDocument(choice);
  try {
    window.localStorage.setItem(STORAGE_KEY, choice);
  } catch {
    // Storage is a convenience; the active document theme still changes.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getSnapshot(): Choice {
  const attribute = document.documentElement.getAttribute("data-theme");
  return attribute === "light" || attribute === "dark"
    ? attribute
    : DEFAULT_THEME;
}

function getServerSnapshot(): Choice {
  return DEFAULT_THEME;
}

/**
 * Expanding circle from the point the reader pressed, using the View
 * Transitions API. This is state change (DESIGN-RULES 11 permits it) applied
 * to the whole document rather than one element, so it is kept inside a
 * single routine-transition-length animation and skipped entirely rather than
 * slowed under reduced motion — there is no partial version of "the page
 * repaints" that reduced motion would accept.
 *
 * Progressive enhancement: browsers without `startViewTransition` apply the
 * theme immediately, the same as before this existed.
 */
function applyWithTransition(next: Choice, origin: { x: number; y: number }) {
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (reducedMotion || typeof document.startViewTransition !== "function") {
    commitTheme(next);
    return;
  }

  const radius = Math.hypot(
    Math.max(origin.x, window.innerWidth - origin.x),
    Math.max(origin.y, window.innerHeight - origin.y),
  );

  const transition = document.startViewTransition(() => {
    commitTheme(next);
  });

  void transition.ready.then(() => {
    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${origin.x}px ${origin.y}px)`,
          `circle(${radius}px at ${origin.x}px ${origin.y}px)`,
        ],
      },
      {
        duration: 520,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)",
      },
    );
  });
}

function useThemeChoice(): [
  Choice,
  (next: Choice, origin: { x: number; y: number }) => void,
] {
  const choice = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    const stored = readStored();
    if (stored !== getSnapshot()) commitTheme(stored);
  }, []);

  const change = useCallback(
    (next: Choice, origin: { x: number; y: number }) => {
      applyWithTransition(next, origin);
    },
    [],
  );

  return [choice, change];
}

/** One 44px button, light or dark, used at every command bar width. */
export function ThemeToggle() {
  const [choice, change] = useThemeChoice();
  const next = OTHER[choice];

  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={`Colour theme: ${LABELS[choice]}. Switch to ${LABELS[next]}.`}
      title={`Theme: ${LABELS[choice]}`}
      onClick={(event) => change(next, { x: event.clientX, y: event.clientY })}
    >
      <ThemeIcon choice={choice} />
    </button>
  );
}
