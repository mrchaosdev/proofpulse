"use client";

/**
 * Scope selection.
 *
 * The user chooses chain, token address, and timeframe (02-product-rules 4.1).
 * The address is validated in the browser before navigation, so an invalid
 * address never reaches the server and never triggers a paid call
 * (rule 6.1). The same validator runs again on the server.
 */

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import type { Chain, Timeframe } from "@/domain/investigation/scope";
import { TIMEFRAMES, listChainProfiles } from "@/domain/investigation/scope";
import {
  describeAddressRejection,
  validateTokenAddress,
} from "@/domain/investigation/address";

export function InvestigationForm({
  initialChain = "ethereum",
  initialAddress = "",
  initialTimeframe = "1d",
}: {
  initialChain?: Chain;
  initialAddress?: string;
  initialTimeframe?: Timeframe;
}) {
  const router = useRouter();
  const addressFieldId = useId();
  const errorId = useId();

  const [chain, setChain] = useState<Chain>(initialChain);
  const [address, setAddress] = useState(initialAddress);
  const [timeframe, setTimeframe] = useState<Timeframe>(initialTimeframe);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateTokenAddress(chain, address);
    if (!validation.ok) {
      setError(describeAddressRejection(chain, validation.reason));
      return;
    }
    setError(null);
    router.push(
      `/investigate/${chain}/${validation.canonicalAddress}?timeframe=${timeframe}`,
    );
  };

  return (
    <form className="stack" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label className="field-label" htmlFor={`${addressFieldId}-chain`}>
          Chain
        </label>
        <select
          className="field-select"
          id={`${addressFieldId}-chain`}
          value={chain}
          onChange={(event) => setChain(event.target.value as Chain)}
        >
          {listChainProfiles().map((profile) => (
            <option key={profile.chain} value={profile.chain}>
              {profile.displayName}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label className="field-label" htmlFor={addressFieldId}>
          Token contract address
        </label>
        <input
          className="field-input identifier"
          id={addressFieldId}
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          data-state={error === null ? "valid" : "invalid"}
          aria-describedby={error === null ? undefined : errorId}
          aria-invalid={error !== null}
          autoComplete="off"
          spellCheck={false}
          placeholder="0x…"
        />
        <span className="field-hint">
          Address-first. A symbol can match several tokens, so ProofPulse never
          resolves one for you.
        </span>
        {error === null ? null : (
          <span className="field-error" id={errorId} role="alert">
            {error}
          </span>
        )}
      </div>

      <fieldset className="field-group">
        <legend>Timeframe</legend>
        <div className="choice-group">
          {TIMEFRAMES.map((option) => (
            <button
              type="button"
              className="choice"
              key={option}
              aria-current={option === timeframe}
              onClick={() => setTimeframe(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="cluster">
        <button className="button" data-variant="primary" type="submit">
          Run investigation
        </button>
        <span className="field-hint">Costs four Nansen credits.</span>
      </div>
    </form>
  );
}
