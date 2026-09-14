/**
 * Token address format validation and canonicalization.
 *
 * Validation runs before any paid Nansen call (02-product-rules 6.1) and its
 * output is the canonical form used for cache keys and URLs.
 *
 * Scope limit: this module verifies format only. EIP-55 mixed-case checksum
 * verification requires keccak256 and is handled outside the domain layer; a
 * mixed-case EVM address is therefore accepted and lowercased here.
 */

import type { Chain } from "./scope";
import { getChainProfile } from "./scope";

export type AddressValidation =
  | { readonly ok: true; readonly canonicalAddress: string }
  | { readonly ok: false; readonly reason: AddressRejectionReason };

export type AddressRejectionReason =
  | "empty"
  | "evm-bad-prefix"
  | "evm-bad-length"
  | "evm-bad-characters"
  | "solana-bad-characters"
  | "solana-bad-length";

const EVM_BODY = /^[0-9a-fA-F]{40}$/;
const BASE58_ALPHABET =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const SOLANA_KEY_BYTES = 32;

export function validateTokenAddress(
  chain: Chain,
  rawAddress: string,
): AddressValidation {
  const trimmed = rawAddress.trim();
  if (trimmed.length === 0) {
    return { ok: false, reason: "empty" };
  }
  return getChainProfile(chain).addressFormat === "evm"
    ? validateEvmAddress(trimmed)
    : validateSolanaAddress(trimmed);
}

function validateEvmAddress(address: string): AddressValidation {
  if (!address.startsWith("0x")) {
    return { ok: false, reason: "evm-bad-prefix" };
  }
  const body = address.slice(2);
  if (body.length !== 40) {
    return { ok: false, reason: "evm-bad-length" };
  }
  if (!EVM_BODY.test(body)) {
    return { ok: false, reason: "evm-bad-characters" };
  }
  return { ok: true, canonicalAddress: `0x${body.toLowerCase()}` };
}

function validateSolanaAddress(address: string): AddressValidation {
  const decoded = decodeBase58(address);
  if (decoded === null) {
    return { ok: false, reason: "solana-bad-characters" };
  }
  if (decoded !== SOLANA_KEY_BYTES) {
    return { ok: false, reason: "solana-bad-length" };
  }
  return { ok: true, canonicalAddress: address };
}

/**
 * Returns the decoded byte length of a base58 string, or null when the string
 * contains a character outside the base58 alphabet. Only the length matters
 * here, so the decoded bytes themselves are not materialized.
 */
function decodeBase58(value: string): number | null {
  const bytes: number[] = [];
  for (const character of value) {
    const digit = BASE58_ALPHABET.indexOf(character);
    if (digit === -1) {
      return null;
    }
    let carry = digit;
    for (let index = 0; index < bytes.length; index += 1) {
      carry += (bytes[index] ?? 0) * 58;
      bytes[index] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  let leadingZeros = 0;
  for (const character of value) {
    if (character !== "1") break;
    leadingZeros += 1;
  }
  return bytes.length + leadingZeros;
}

/** Human-readable explanation shown next to the address field on rejection. */
export function describeAddressRejection(
  chain: Chain,
  reason: AddressRejectionReason,
): string {
  const chainName = getChainProfile(chain).displayName;
  switch (reason) {
    case "empty":
      return "Enter a token contract address.";
    case "evm-bad-prefix":
      return `${chainName} addresses start with 0x.`;
    case "evm-bad-length":
      return `${chainName} addresses are 0x followed by 40 hexadecimal characters.`;
    case "evm-bad-characters":
      return `${chainName} addresses use hexadecimal characters 0-9 and a-f only.`;
    case "solana-bad-characters":
      return `${chainName} addresses use base58 characters; 0, O, I, and l are excluded.`;
    case "solana-bad-length":
      return `${chainName} addresses decode to 32 bytes; this value does not.`;
  }
}

/** Shortens an address for display. The full value stays in the accessible name. */
export function shortenAddress(address: string): string {
  if (address.length <= 13) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
