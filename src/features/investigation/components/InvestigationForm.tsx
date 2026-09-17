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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

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
        <Label htmlFor={`${addressFieldId}-chain`}>Chain</Label>
        <Select
          value={chain}
          onValueChange={(value) => setChain(value as Chain)}
        >
          <SelectTrigger
            className="w-full"
            id={`${addressFieldId}-chain`}
            aria-label="Chain"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {listChainProfiles().map((profile) => (
              <SelectItem key={profile.chain} value={profile.chain}>
                {profile.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="field">
        <Label htmlFor={addressFieldId}>Token contract address</Label>
        <Input
          className="font-mono"
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
        {/*
          A single-selection toggle group: the timeframe is one choice among
          four, and the group gives it roving focus and arrow-key movement
          that four separate buttons did not have.
        */}
        <ToggleGroup
          type="single"
          value={timeframe}
          onValueChange={(value) => {
            if (value !== "") setTimeframe(value as Timeframe);
          }}
          variant="outline"
          className="w-full"
        >
          {TIMEFRAMES.map((option) => (
            <ToggleGroupItem key={option} value={option} aria-label={option}>
              {option}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </fieldset>

      <div className="cluster">
        <Button type="submit">Run investigation</Button>
        <span className="field-hint">Costs four Nansen credits.</span>
      </div>
    </form>
  );
}
