/**
 * The bookkeeping behind the reveal, kept apart from the browser so it can be
 * tested directly (CODEBASE-RULES 9: the smallest piece that carries the risk).
 *
 * The risk is not the animation. It is that hiding an element is a change to
 * the document, and whatever hides it owes the document a way back. React
 * mounts, unmounts and remounts effects in development, and the first version
 * of this left `data-revealed="false"` behind on unmount while the next mount
 * skipped anything already carrying the attribute. Every block below the fold
 * stayed at opacity 0: the landing page was a hero above an empty screen, in
 * development only, where no test ran.
 */

/** The part of an element this module touches. */
export type RevealTarget = {
  getAttribute(name: string): string | null;
  setAttribute(name: string, value: string): void;
  removeAttribute(name: string): void;
};

export const REVEAL_ATTRIBUTE = "data-revealed";

export type RevealState = {
  /** Hides the target. Returns false when it has already finished revealing. */
  arm(target: RevealTarget): boolean;
  /** Settles the target into place for good. */
  reveal(target: RevealTarget): void;
  /** Undoes every hide this state applied, leaving the document as it was. */
  release(): void;
};

export function createRevealState(): RevealState {
  const armed = new Set<RevealTarget>();

  return {
    arm(target) {
      // Only a finished element is skipped. Skipping anything that merely
      // carries the attribute would strand an element that a previous mount
      // hid and never got to reveal.
      if (target.getAttribute(REVEAL_ATTRIBUTE) === "true") return false;
      target.setAttribute(REVEAL_ATTRIBUTE, "false");
      armed.add(target);
      return true;
    },

    reveal(target) {
      target.setAttribute(REVEAL_ATTRIBUTE, "true");
      armed.delete(target);
    },

    release() {
      for (const target of armed) target.removeAttribute(REVEAL_ATTRIBUTE);
      armed.clear();
    },
  };
}

/**
 * Whether an element may be hidden at all.
 *
 * Two things disqualify it. It is already on screen, where hiding it would
 * flash away something the reader can see. Or the page has too little scroll
 * left to ever bring it far enough in — a report 6129px tall in a 6000px
 * window leaves 129px of travel, and an element hidden beyond that could never
 * come back.
 */
export function canHide(measurements: {
  top: number;
  innerHeight: number;
  scrollY: number;
  maxScroll: number;
  revealMargin: number;
}): boolean {
  const { top, innerHeight, scrollY, maxScroll, revealMargin } = measurements;
  if (top <= innerHeight * FOLD_FRACTION) return false;
  const topAtFullScroll = top + scrollY - maxScroll;
  return topAtFullScroll <= innerHeight - revealMargin;
}

/** Far enough down that hiding the element cannot flash already-read content. */
export const FOLD_FRACTION = 0.9;

/**
 * How far inside the window an element must come before it is revealed. A
 * pixel margin, not a percentage: on a very tall window a percentage becomes
 * larger than the scroll distance the page has left to give.
 */
export const REVEAL_MARGIN_PX = 80;
