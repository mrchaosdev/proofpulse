/**
 * The reveal hides content, so the question these tests answer is not whether
 * it animates but whether it can ever leave something hidden.
 *
 * The regression they exist for: cleanup used to disconnect the observer and
 * leave `data-revealed="false"` on the document, while the next mount skipped
 * anything already carrying the attribute. React remounts effects in
 * development, so every block below the fold on the landing page stayed at
 * opacity 0 — a hero above an empty screen. The whole browser suite runs
 * against a production build, where effects mount once, so nothing caught it.
 */

import { describe, expect, it } from "vitest";
import {
  canHide,
  createRevealState,
  REVEAL_ATTRIBUTE,
  REVEAL_MARGIN_PX,
} from "@/components/effects/reveal-state";
import type { RevealTarget } from "@/components/effects/reveal-state";

function fakeTarget(): RevealTarget & { attributes: Map<string, string> } {
  const attributes = new Map<string, string>();
  return {
    attributes,
    getAttribute: (name) => attributes.get(name) ?? null,
    setAttribute: (name, value) => void attributes.set(name, value),
    removeAttribute: (name) => void attributes.delete(name),
  };
}

describe("reveal state", () => {
  it("hides a target and settles it into place", () => {
    const state = createRevealState();
    const target = fakeTarget();

    expect(state.arm(target)).toBe(true);
    expect(target.getAttribute(REVEAL_ATTRIBUTE)).toBe("false");

    state.reveal(target);
    expect(target.getAttribute(REVEAL_ATTRIBUTE)).toBe("true");
  });

  it("leaves the document as it found it when released", () => {
    const state = createRevealState();
    const targets = [fakeTarget(), fakeTarget(), fakeTarget()];
    for (const target of targets) state.arm(target);

    state.release();

    for (const target of targets) {
      expect(target.getAttribute(REVEAL_ATTRIBUTE)).toBeNull();
    }
  });

  it("re-hides after a release, so a remount still animates", () => {
    // Mount, unmount, mount — what React does in development.
    const target = fakeTarget();

    const first = createRevealState();
    first.arm(target);
    first.release();

    const second = createRevealState();
    expect(second.arm(target)).toBe(true);
    expect(target.getAttribute(REVEAL_ATTRIBUTE)).toBe("false");
  });

  it("re-arms a target a previous state hid but never revealed", () => {
    // Belt and braces: even if a release is missed, an element left at
    // "false" must be picked up again rather than skipped forever.
    const target = fakeTarget();
    createRevealState().arm(target);

    expect(createRevealState().arm(target)).toBe(true);
  });

  it("never hides a target that has already been revealed", () => {
    const state = createRevealState();
    const target = fakeTarget();
    state.arm(target);
    state.reveal(target);

    expect(state.arm(target)).toBe(false);
    expect(target.getAttribute(REVEAL_ATTRIBUTE)).toBe("true");
  });

  it("releases nothing it did not hide", () => {
    const state = createRevealState();
    const target = fakeTarget();
    state.arm(target);
    state.reveal(target);

    state.release();

    // A revealed target is finished; release must not strip it back to plain.
    expect(target.getAttribute(REVEAL_ATTRIBUTE)).toBe("true");
  });
});

describe("what may be hidden", () => {
  const base = {
    innerHeight: 900,
    scrollY: 0,
    maxScroll: 5000,
    revealMargin: REVEAL_MARGIN_PX,
  };

  it("leaves anything already on screen alone", () => {
    expect(canHide({ ...base, top: 400 })).toBe(false);
    expect(canHide({ ...base, top: 809 })).toBe(false);
  });

  it("hides what is below the fold and reachable", () => {
    expect(canHide({ ...base, top: 1200 })).toBe(true);
  });

  it("refuses to hide what the page can never scroll far enough to reveal", () => {
    // A 6000px window over a 6129px document: 129px of travel to spend.
    const cramped = {
      innerHeight: 6000,
      scrollY: 0,
      maxScroll: 129,
      revealMargin: REVEAL_MARGIN_PX,
    };
    // Past the window bottom by more than the page can scroll: after
    // spending all 129px it would still sit below the reveal margin.
    expect(canHide({ ...cramped, top: 6100 })).toBe(false);
    // Below the fold but still within reach once those 129px are spent.
    expect(canHide({ ...cramped, top: 5600 })).toBe(true);
  });
});
