/**
 * Brief validation (05-data-and-scoring "Validation pipeline").
 *
 * Model output is untrusted until every check passes (02-product-rules 3).
 * The checks are pure so they can be exercised without a provider:
 *
 * 1. every cited evidence ID exists in this investigation;
 * 2. every claim cites at least one evidence ID;
 * 3. every number in the prose matches a cited evidence value after the same
 *    normalization the evidence itself uses;
 * 4. no prohibited certainty or recommendation language appears; and
 * 5. the observation stays within its word limit.
 *
 * A failure is never repaired. The caller renders the deterministic brief
 * instead (rule 3.6).
 */

import type { Evidence } from "../evidence/evidence";
import {
  extractNumbers,
  formatCount,
  formatScore,
  formatSignedUsd,
  formatUsd,
  normalizeNumericToken,
} from "../evidence/format-value";
import type { BriefClaim, InvestigationBrief } from "./brief";
import { OBSERVATION_WORD_LIMIT, countWords } from "./brief";
import { findProhibitedLanguage } from "./prohibited-language";

export type BriefRejection = {
  readonly code:
    | "UNKNOWN_EVIDENCE_ID"
    | "MISSING_CITATION"
    | "UNSUPPORTED_NUMBER"
    | "PROHIBITED_LANGUAGE"
    | "OBSERVATION_TOO_LONG";
  readonly detail: string;
};

export type BriefValidation =
  | { readonly ok: true; readonly brief: InvestigationBrief }
  | { readonly ok: false; readonly rejections: readonly BriefRejection[] };

/**
 * Every rendering of an evidence value that the prose is allowed to use. A
 * model may legitimately write "+$3.4M" or "3400000" for the same value.
 */
function allowedNumbers(evidence: Evidence): readonly string[] {
  const value = evidence.numericValue;
  if (value === undefined) return [];
  const renderings = [String(value), String(Math.round(value))];
  switch (evidence.unit) {
    case "usd":
      renderings.push(formatSignedUsd(value), formatUsd(value));
      break;
    case "count":
      renderings.push(formatCount(value));
      break;
    case "score":
      renderings.push(formatScore(value));
      break;
    default:
      break;
  }
  return renderings.map(normalizeNumericToken);
}

function claimsOf(brief: InvestigationBrief): readonly BriefClaim[] {
  return [
    ...brief.support,
    ...brief.contradiction,
    ...brief.invalidationConditions,
  ];
}

export function validateBrief(
  brief: InvestigationBrief,
  evidence: readonly Evidence[],
): BriefValidation {
  const rejections: BriefRejection[] = [];
  const byId = new Map(evidence.map((item) => [item.id, item]));
  const claims = claimsOf(brief);

  for (const claim of claims) {
    if (claim.evidenceIds.length === 0) {
      rejections.push({
        code: "MISSING_CITATION",
        detail: `A claim cites no evidence: "${claim.text}"`,
      });
      continue;
    }
    for (const id of claim.evidenceIds) {
      if (!byId.has(id)) {
        rejections.push({
          code: "UNKNOWN_EVIDENCE_ID",
          detail: `Evidence ${id} does not exist in this investigation.`,
        });
      }
    }
  }

  // Numbers are checked per claim against that claim's own citations, so a
  // brief cannot borrow an unrelated figure from elsewhere in the ledger.
  for (const claim of claims) {
    const permitted = new Set(
      claim.evidenceIds.flatMap((id) => {
        const item = byId.get(id);
        return item === undefined ? [] : allowedNumbers(item);
      }),
    );
    for (const token of extractNumbers(claim.text)) {
      if (!permitted.has(token)) {
        rejections.push({
          code: "UNSUPPORTED_NUMBER",
          detail: `The value ${token} is not supported by the evidence this claim cites.`,
        });
      }
    }
  }

  // The observation carries no citations of its own in the documented
  // contract, so its numbers are checked against every value in the ledger.
  // That is weaker than the per-claim check but still blocks a fabricated
  // figure (02-product-rules 3.5).
  const ledgerNumbers = new Set(evidence.flatMap(allowedNumbers));
  for (const token of extractNumbers(brief.observation)) {
    if (!ledgerNumbers.has(token)) {
      rejections.push({
        code: "UNSUPPORTED_NUMBER",
        detail: `The value ${token} in the observation appears nowhere in the evidence.`,
      });
    }
  }

  const prose = [
    brief.observation,
    ...claims.map((claim) => claim.text),
    ...brief.limitations,
  ].join(" ");

  for (const match of findProhibitedLanguage(prose)) {
    rejections.push({
      code: "PROHIBITED_LANGUAGE",
      detail: `The brief uses "${match.term}", which is ${
        match.reason === "certainty"
          ? "certainty language"
          : "a trade recommendation"
      }.`,
    });
  }

  if (countWords(brief.observation) > OBSERVATION_WORD_LIMIT) {
    rejections.push({
      code: "OBSERVATION_TOO_LONG",
      detail: `The observation is longer than ${OBSERVATION_WORD_LIMIT} words.`,
    });
  }

  return rejections.length === 0
    ? { ok: true, brief }
    : { ok: false, rejections };
}
