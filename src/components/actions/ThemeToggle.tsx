"use client";

/**
 * Theme control (04-information-architecture "Global navigation").
 *
 * Light is the product default. A stored explicit choice wins; System follows
 * the operating system. Icons keep the command bar compact while each control
 * retains a full accessible name and native tooltip.
 */

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { THEME_STORAGE_KEY as STORAGE_KEY } from "./theme-script";

type Choice = "system" | "light" | "dark";

const CHANGE_EVENT = "proofpulse-theme-change";

const OPTIONS: readonly { value: Choice; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

function ThemeIcon({ choice }: { choice: Choice }) {
  if (choice === "light") {
    return (
      <svg className="theme-icon" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="3.5" />
        <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4" />
      </svg>
    );
  }

  if (choice === "dark") {
    return (
      <svg className="theme-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20.2 15.1A8.2 8.2 0 0 1 8.9 3.8 8.5 8.5 0 1 0 20.2 15.1Z" />
      </svg>
    );
  }

  return (
    <svg className="theme-icon" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}

function readStored(): Choice {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" || stored === "system"
      ? stored
      : "light";
  } catch {
    return "light";
  }
}

function applyToDocument(choice: Choice): void {
  document.documentElement.setAttribute("data-theme", choice);
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
  if (attribute === "light" || attribute === "dark" || attribute === "system") {
    return attribute;
  }
  return "light";
}

function getServerSnapshot(): Choice {
  return "light";
}

export function ThemeToggle() {
  const choice = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

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
      // Storage is a convenience; the active document theme still changes.
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
          aria-label={option.label}
          aria-current={option.value === choice}
          title={option.label}
          onClick={() => handleChange(option.value)}
        >
          <ThemeIcon choice={option.value} />
        </button>
      ))}
    </fieldset>
  );
}
