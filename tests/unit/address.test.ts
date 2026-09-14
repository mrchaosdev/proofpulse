import { describe, expect, it } from "vitest";
import {
  describeAddressRejection,
  shortenAddress,
  validateTokenAddress,
} from "@/domain/investigation/address";

const EVM_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const SOLANA_ADDRESS = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

describe("validateTokenAddress", () => {
  it("canonicalizes a checksummed EVM address to lowercase", () => {
    const result = validateTokenAddress("ethereum", EVM_ADDRESS);

    expect(result).toStrictEqual({
      ok: true,
      canonicalAddress: EVM_ADDRESS.toLowerCase(),
    });
  });

  it("trims surrounding whitespace before validating", () => {
    const result = validateTokenAddress("base", `  ${EVM_ADDRESS}  `);

    expect(result.ok).toBe(true);
  });

  it("rejects an empty address", () => {
    const result = validateTokenAddress("ethereum", "   ");

    expect(result).toStrictEqual({ ok: false, reason: "empty" });
  });

  it("rejects an EVM address without the 0x prefix", () => {
    const result = validateTokenAddress("ethereum", EVM_ADDRESS.slice(2));

    expect(result).toStrictEqual({ ok: false, reason: "evm-bad-prefix" });
  });

  it("rejects an EVM address of the wrong length", () => {
    const result = validateTokenAddress("ethereum", `${EVM_ADDRESS}00`);

    expect(result).toStrictEqual({ ok: false, reason: "evm-bad-length" });
  });

  it("rejects non-hexadecimal characters in an EVM address", () => {
    const result = validateTokenAddress("ethereum", `0x${"z".repeat(40)}`);

    expect(result).toStrictEqual({ ok: false, reason: "evm-bad-characters" });
  });

  it("accepts a valid Solana mint address", () => {
    const result = validateTokenAddress("solana", SOLANA_ADDRESS);

    expect(result).toStrictEqual({
      ok: true,
      canonicalAddress: SOLANA_ADDRESS,
    });
  });

  it("preserves Solana address casing, which is significant", () => {
    const result = validateTokenAddress("solana", SOLANA_ADDRESS);

    if (!result.ok) throw new Error("expected a valid address");
    expect(result.canonicalAddress).not.toBe(SOLANA_ADDRESS.toLowerCase());
  });

  it("rejects characters outside the base58 alphabet", () => {
    const result = validateTokenAddress(
      "solana",
      SOLANA_ADDRESS.replace("E", "0"),
    );

    expect(result).toStrictEqual({
      ok: false,
      reason: "solana-bad-characters",
    });
  });

  it("rejects a base58 string that does not decode to 32 bytes", () => {
    const result = validateTokenAddress("solana", "abcdef");

    expect(result).toStrictEqual({ ok: false, reason: "solana-bad-length" });
  });

  it("rejects an EVM address submitted against a Solana scope", () => {
    const result = validateTokenAddress("solana", EVM_ADDRESS);

    expect(result.ok).toBe(false);
  });
});

describe("describeAddressRejection", () => {
  it("names the chain so the expected format is unambiguous", () => {
    expect(describeAddressRejection("base", "evm-bad-prefix")).toContain(
      "Base",
    );
    expect(describeAddressRejection("solana", "solana-bad-length")).toContain(
      "Solana",
    );
  });
});

describe("shortenAddress", () => {
  it("keeps the leading and trailing characters", () => {
    expect(shortenAddress(EVM_ADDRESS.toLowerCase())).toBe("0xa0b8…eb48");
  });

  it("leaves a short value untouched", () => {
    expect(shortenAddress("0xabc")).toBe("0xabc");
  });
});
