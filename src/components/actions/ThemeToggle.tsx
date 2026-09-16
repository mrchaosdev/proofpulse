"use client";

/**
 * Theme control (04-information-architecture "Global navigation").
 *
 * Light is the product default. The system preference is honoured until the
 * visitor chooses, and the choice is stored per browser and applied by setting
 * `data-theme` on the document element, which is the same hook the token
 * stylesheet uses. Dark changes appearance, never semantics (DESIGN-RULES 3).
 *
 * The chosen theme lives on the document and in storage, not in React, so it
 * is read with `useSyncExternalStore` rather than copied into state inside an
 * effect. That keeps the server render and the first client render agreeing on
 * "system" and avoids a cascading re-render.
 */

import { useCallback, useEffect, useSyncExternalStore } from "react";

type Choice = "system" | "light" | "dark";

const STORAGE_KEY = "proofpulse-theme";
const CHANGE_EVENT = "proofpulse-theme-change";

const OPTIONS: readonly { value: Choice; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

function readStored(): Choice {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    // Private windows and blocked site data throw here; the system default is
    // a correct answer, not an error.
    return "system";
  }
}

function applyToDocument(choice: Choice): void {
  const root = document.documentElement;
  if (choice === "system") {
    root.removeAttribute("data-theme");
    return;
  }
  root.setAttribute("data-theme", choice);
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
  return attribute === "light" || attribute === "dark" ? attribute : "system";
}

/** The server cannot know the visitor's stored choice, so it renders "system". */
function getServerSnapshot(): Choice {
  return "system";
}

export function ThemeToggle() {
  const choice = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  // Restores the stored choice once, on the client, after hydration.
  useEffect(() => {
    const stored = readStored();
    if (stored !== getSnapshot()) {
      applyToDocument(stored);
      window.dispatchEvent(new Event(CHANGE_EVENT));
    }
  }, []);

  const handleChange = useCallback((next: Choice) => {
    applyToDocument(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // A stored preference is a convenience; losing it is not a failure.
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return (
    <fieldset className="theme-toggle">
      <legend className="visually-hidden">Colour theme</legend>
      {OPTIONS.map((option) => (
        <button
          type="button"
          className="theme-option"
          key={option.value}
          aria-current={option.value === choice}
          onClick={() => handleChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </fieldset>
  );
}
