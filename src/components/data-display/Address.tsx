/**
 * A truncated address with its full value available to assistive technology
 * and to the clipboard (DESIGN-RULES 4).
 */

import { shortenAddress } from "@/domain/investigation/address";
import { CopyButton } from "@/components/actions/CopyButton";

export function Address({
  value,
  label,
}: {
  value: string;
  label?: string | null;
}) {
  return (
    <span className="cluster">
      <span className="identifier actor-address" title={value}>
        <span aria-hidden="true">{shortenAddress(value)}</span>
        <span className="visually-hidden">{value}</span>
      </span>
      {label === null || label === undefined ? null : (
        <span className="actor-label">{label}</span>
      )}
      <CopyButton value={value} description="address" />
    </span>
  );
}
