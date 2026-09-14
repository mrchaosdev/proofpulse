import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isChain, isTimeframe } from "@/domain/investigation/scope";
import { validateTokenAddress } from "@/domain/investigation/address";
import { runInvestigation } from "@/server/investigations/investigation-service";
import { MemoryCacheStore } from "@/server/cache/cache-store";
import { getEffectiveMode } from "@/config/app-config";
import {
  describeFixture,
  fixtureCovers,
} from "@/server/fixtures/fixture-loader";
import { InvestigationView } from "@/features/investigation/components/InvestigationView";

export const metadata: Metadata = { title: "Investigation" };

// Evidence is collected per request; a cached page would misreport freshness.
export const dynamic = "force-dynamic";

const cache = new MemoryCacheStore();

type PageParams = { chain: string; address: string };
type PageSearch = { timeframe?: string; mode?: string };

export default async function InvestigationPage({
  params,
  searchParams,
}: {
  params: Promise<PageParams>;
  searchParams: Promise<PageSearch>;
}) {
  const { chain, address } = await params;
  const search = await searchParams;

  if (!isChain(chain)) notFound();
  const validation = validateTokenAddress(chain, decodeURIComponent(address));
  if (!validation.ok) notFound();

  // An unknown query value falls back visibly rather than being forwarded
  // unvalidated (04-information-architecture "URL rules").
  const timeframe = isTimeframe(search.timeframe) ? search.timeframe : "1d";

  // Fixture mode is a deliberate choice: the explicit query, or the absence of
  // a configured credential. It is never a silent fallback after a live call
  // has failed (02-product-rules 5.7).
  const requestedFixture = search.mode === "fixture";
  const mode =
    requestedFixture || getEffectiveMode() === "fixture" ? "fixture" : "live";

  const result = await runInvestigation(
    {
      chain,
      tokenAddress: validation.canonicalAddress,
      timeframe,
      mode,
    },
    { cache, now: () => new Date() },
  );

  const coversScope = fixtureCovers(
    chain,
    validation.canonicalAddress,
    timeframe,
  );

  return (
    <div className="page-region stack">
      {mode === "fixture" && !coversScope ? (
        <div className="banner" data-state="partial" role="note">
          <span className="banner-title">Showing a different token</span>
          <span>
            No live credential is configured, so the demo fixture is shown
            instead of the token you requested. The fixture covers a single
            captured scope.
          </span>
        </div>
      ) : null}
      <InvestigationView
        result={result}
        fixtureCapturedAt={describeFixture().capturedAt}
      />
    </div>
  );
}
