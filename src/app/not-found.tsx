import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Not found. A mistyped address or an unsupported chain lands here rather than
 * on a page that invents a result (02-product-rules 9.5).
 */
export default function NotFound() {
  return (
    <div className="page-region stack">
      <h1>That page does not exist</h1>
      <p>
        An investigation URL needs a supported chain and a token address that is
        valid for it. Nothing was requested from Nansen.
      </p>
      <p>
        <Button asChild variant="default">
          <Link href="/investigate">Start an investigation</Link>
        </Button>
      </p>
    </div>
  );
}
