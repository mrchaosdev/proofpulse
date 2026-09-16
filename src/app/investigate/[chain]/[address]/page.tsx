import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isChain, isTimeframe } from "@/domain/investigation/scope";
import { validateTokenAddress } from "@/domain/investigation/address";
import { runInvestigation } from "@/server/investigations/investigation-service";
import { sharedCache } from "@/server/cache/shared-cache";
import { getEffectiveMode } from "@/config/app-config";
import {
  describeFixture,
  fixtureCovers,
} from "@/server/fixtures/fixture-loader";
import { InvestigationView } from "@/features/investigation/components/InvestigationView";
import { buildBrief } from "@/server/investigations/brief-service";

export const metadata: Metadata = { title: "Investigation" };

// Evidence is collected per request; a cached page would misreport freshness.
export const dynamic = "force-dynamic";

type PageParams = { chain: string; address: string };
type PageSearch = {
  timeframe?: string;
  mode?: string;
  inspect?: string;
  refresh?: string;
};

const REFRESHABLE = [
  "token-context",
  "cohort-flows",
  "buyers",
  "sellers",
] as const;

type Refreshable = (typeof REFRESHABLE)[number];

function parseRefresh(value: string | undefined): readonly Refreshable[] {
  if (value === undefined) return [];
  // Unknown values are dropped rather than forwarded (URL rules, doc 04).
  return value
    .split(",")
    .filter((item): item is Refreshable =>
      REFRESHABLE.includes(item as Refreshable),
    );
}

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

  // An unparseable actor address is ignored rather than forwarded upstream.
  const inspectCandidate =
    search.inspect === undefined
      ? null
      : validateTokenAddress(chain, search.inspect);
  const inspectActorAddress =
    inspectCandidate !== null && inspectCandidate.ok
      ? inspectCandidate.canonicalAddress
      : undefined;

  const refreshCapabilities = parseRefresh(search.refresh);

  const result = await runInvestigation(
    {
      chain,
      tokenAddress: validation.canonicalAddress,
      timeframe,
      mode,
      ...(refreshCapabilities.length === 0 ? {} : { refreshCapabilities }),
      ...(inspectActorAddress === undefined ? {} : { inspectActorAddress }),
    },
    { cache: sharedCache, now: () => new Date() },
  );

  // The brief is generated after scoring and never blocks it.
  const briefOutcome = await buildBrief(result);

  const coversScope = fixtureCovers(
    chain,
    validation.canonicalAddress,
    timeframe,
  );

  return (
    <div className="page-region stack investigation-page">
      <InvestigationView
        result={result}
        briefOutcome={briefOutcome}
        fixtureCapturedAt={describeFixture().capturedAt}
        showsDifferentToken={mode === "fixture" && !coversScope}
      />
    </div>
  );
}
