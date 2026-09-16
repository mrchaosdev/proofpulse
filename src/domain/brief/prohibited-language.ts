/**
 * Language a brief may never contain.
 *
 * Two families: certainty words that the interface must not present as a
 * computed verdict (02-product-rules 2.6), and trade recommendations of any
 * kind (rule 3.7).
 *
 * Patterns use word boundaries so ordinary analytical vocabulary survives:
 * "sellers distributed" and "net selling activity" are legitimate observations,
 * while a bare "sell" is an instruction.
 */

export type ProhibitedMatch = {
  readonly term: string;
  readonly reason: "certainty" | "recommendation";
};

const CERTAINTY = [
  "safe",
  "scam",
  "guaranteed",
  "guarantee",
  "alpha",
  "100x",
  "moon",
  "rug",
  "pump",
  "surefire",
  "risk-free",
];

const RECOMMENDATION = [
  "buy",
  "sell",
  "hold",
  "ape",
  "entry",
  "exit",
  "price target",
  "stop loss",
  "take profit",
  "position size",
  "leverage",
  "leveraged",
  "leverages",
  "allocate",
  "allocation",
  "should invest",
  "recommend",
  "recommends",
  "recommended",
  "recommendation",
];

function toPattern(term: string): RegExp {
  // Terms are authored constants in this file, never user input, and none
  // contains a regular-expression metacharacter, so no escaping is needed.
  return new RegExp(String.raw`\b` + term + String.raw`\b`, "i");
}

export function findProhibitedLanguage(
  text: string,
): readonly ProhibitedMatch[] {
  const matches: ProhibitedMatch[] = [];
  for (const term of CERTAINTY) {
    if (toPattern(term).test(text)) matches.push({ term, reason: "certainty" });
  }
  for (const term of RECOMMENDATION) {
    if (toPattern(term).test(text)) {
      matches.push({ term, reason: "recommendation" });
    }
  }
  return matches;
}
