import "server-only";

/**
 * Live or fixture, shown in the global navigation
 * (04-information-architecture "Global navigation").
 *
 * The mode is read from validated configuration, so the badge reports whether
 * live investigations are actually possible rather than what was intended.
 */

import { getEffectiveMode, isLiveModeAvailable } from "@/config/app-config";
import { StatusPill } from "./StatusPill";

export function ModeIndicator() {
  const mode = getEffectiveMode();
  const live = mode === "live";

  return (
    <span
      className="mode-indicator"
      title={
        live
          ? "A Nansen credential is configured; investigations use live data."
          : isLiveModeAvailable()
            ? "A credential is configured but the server is set to fixture mode."
            : "No Nansen credential is configured, so investigations replay a historical capture."
      }
    >
      <StatusPill tone={live ? "ready" : "fixture"}>
        {/*
          Two labels, one shown at a time by CSS. On a phone the sticky bar
          costs viewport permanently, and "data" adds width without adding
          meaning next to a badge that already sits in the chrome.
        */}
        <span className="mode-indicator-full">
          {live ? "Live data" : "Fixture data"}
        </span>
        <span className="mode-indicator-short">
          {live ? "Live" : "Fixture"}
        </span>
      </StatusPill>
    </span>
  );
}
