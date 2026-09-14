# 06 — Technical architecture

## Architecture goal

Ship one reliable, inspectable vertical slice in approximately two weeks. The
architecture favors explicit boundaries and deterministic fallbacks over a
distributed system.

## System context

```text
Browser
  │ HTTPS
  ▼
Next.js application
  ├── server routes/actions ──► Nansen API
  ├── scoring domain (pure)     LLM provider
  ├── evidence normalizer       optional cache
  └── fixture loader
```

The browser never communicates with Nansen or the model provider directly.

## Target stack

| Concern | Choice | Reason |
| --- | --- | --- |
| Web application | Next.js App Router + React + TypeScript | one deployable unit and strong server/client boundary |
| Styling | authored global CSS + semantic tokens | clean semantic classes and a strictly governed visual system |
| Runtime validation | Zod | external responses and model output are untrusted |
| Server cache | provider-neutral adapter; memory locally, Redis in deployment | credit control without coupling domain code |
| Client request state | TanStack Query | cancellation, explicit retries, and partial UI state |
| Charts | Recharts | accessible table pairing and compact charts |
| Relationship graph | React Flow | bounded interactive graph with custom nodes |
| Unit tests | Vitest or Node test runner, chosen at scaffold | pure scoring and adapters |
| Browser tests | Playwright | critical flows, responsive behavior, and demo path |

Exact versions must be pinned at scaffolding. Framework documentation shipped
with the installed version takes priority over remembered conventions.

## Module boundaries

```text
src/
  app/
    page.tsx
    investigate/
    methodology/
    api/
  components/
    ui/                  # generic primitives only
    evidence/            # ledger, source status, evidence row
    investigation/       # feature composition
    visualization/       # flow chart and relationship graph
  domain/
    investigation/       # normalized types and orchestration contracts
    scoring/             # pure formulas and explanation metadata
    brief/               # brief schema and deterministic fallback
  integrations/
    nansen/              # HTTP client, endpoint schemas, normalizers
    model/               # replaceable brief-provider adapter
  server/
    investigations/      # use-case orchestration
    cache/               # cache interface and implementations
    fixtures/            # sanitized production-demo fixture loader and data
    observability/       # structured events and redaction
    rate-limit/           # abuse and credit-consumption control
    security/             # server request guards and redaction
  config/                # validated environment and application configuration
  styles/
    components/           # generic component styles
    features/             # product-specific composition styles
    tokens.css
    reset.css
    typography.css
    layout.css
    utilities.css
tests/
  unit/
  contract/
  e2e/
  fixtures/
```

Rules:

- UI components do not import raw Nansen response types.
- Scoring functions are pure and cannot call network, cache, clock, or model.
- Model integration code cannot calculate scores.
- Nansen integration adapters cannot contain UI labels.
- Every clock read is injected or captured once per investigation for testability.
- Every authored class token follows
  [DESIGN-RULES.md](DESIGN-RULES.md#7-class-name-law).
- File placement and dependency direction follow
  [CODEBASE-RULES.md](CODEBASE-RULES.md).
- Tailwind, CSS Modules, and runtime CSS-in-JS are not used.

## Server API

### `POST /api/investigations`

Input:

```json
{
  "chain": "solana",
  "tokenAddress": "...",
  "timeframe": "1d",
  "mode": "live"
}
```

Behavior:

1. Validate and canonicalize input.
2. Enforce rate limit.
3. Fetch token context, cohort flows, buyers, and sellers in parallel through
   cache-aware adapters.
4. Normalize successful responses and collect per-source errors.
5. Create evidence and deterministic scores.
6. Return immediately with core result; generated brief may be returned in the
   same response only if it stays inside the response budget.

For the MVP, prefer one bounded request over SSE complexity. If observed latency
exceeds the 15-second target, split the model brief into a second endpoint.

### `POST /api/investigations/brief`

Optional split endpoint. Accepts the evidence hash and server-side investigation
identifier, never arbitrary client-authored evidence. Returns validated brief or
deterministic fallback.

### `POST /api/investigations/relationships`

Input includes the investigation identifier and selected actor address. The
server verifies that the actor exists in that investigation before calling
Nansen. P0 returns first-degree relationships only.

### Error envelope

```ts
type ApiError = {
  code:
    | "INVALID_INPUT"
    | "TOKEN_NOT_FOUND"
    | "UNSUPPORTED_SCOPE"
    | "NANSEN_AUTH"
    | "NANSEN_CREDITS"
    | "NANSEN_RATE_LIMIT"
    | "NANSEN_TIMEOUT"
    | "MODEL_UNAVAILABLE"
    | "INTERNAL";
  message: string;
  retryable: boolean;
  requestId: string;
  retryAfterSeconds?: number;
};
```

No upstream body, stack trace, or credential is returned to the browser.

## Nansen adapter

The adapter owns:

- base URL and authenticated headers;
- endpoint-specific request construction;
- timeouts and one bounded retry for safe transient failures;
- runtime response validation;
- normalization into domain types;
- upstream warning preservation;
- credit-aware cache metadata; and
- redacted structured logging.

Defaults:

- connect/request timeout: 8 seconds per endpoint;
- retry: at most once for network failure, `429`, or selected `5xx` responses;
- no retry for `400`, `401`, `402`, `403`, `404`, or schema failure;
- maximum result rows: 10 buyers, 10 sellers, 20 related wallets.

## Investigation orchestration

Use settled parallel work so one failure does not erase other evidence:

```text
validate
  └─► Promise.allSettled(
        token context,
        flow intelligence,
        buyers,
        sellers
      )
        └─► normalize ─► evidence ─► score ─► brief
```

The orchestration layer creates a content hash from normalized evidence. The
hash keys brief caching and proves which evidence generated the prose.

## Caching

Cache interface:

```ts
interface CacheStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
}
```

- Local development may use memory cache.
- Production should use a small managed Redis-compatible service if available.
- Cache response data after validation, never raw authenticated requests.
- The response exposes `cache: hit | miss` only for diagnostics; cache status
  does not change evidence semantics.
- Manual refresh may bypass a fresh cache only after explicit user confirmation.

## Fixture mode

Fixture mode uses the same normalizers, evidence builder, scoring, and UI as live
mode. Only the data-source adapter changes. This prevents a separate polished
demo path from drifting away from the real product.

Required fixture metadata:

- capture timestamp;
- endpoint and schema versions;
- token/chain/timeframe;
- source URLs without credentials; and
- SHA-256 hash of sanitized fixture content.

## Model boundary

The provider is replaceable through one server-side interface:

```ts
interface BriefGenerator {
  generate(input: GroundedBriefInput): Promise<InvestigationBrief>;
}
```

Input is compact normalized evidence plus scores, definitions, and forbidden
actions. Output is schema-validated and evidence-checked. Model failure never
blocks core analytics.

## Environment variables

```text
NANSEN_API_KEY=                 # server only, required for live mode
MODEL_API_KEY=                  # server only, optional
MODEL_NAME=                     # server only, pinned identifier
CACHE_URL=                      # server only, optional locally
CACHE_TOKEN=                    # server only, if required
APP_MODE=live|fixture           # server default; UI still labels mode
FIXTURE_SET=                    # server only, explicit fixture selection
```

Only explicitly harmless presentation values may use a public environment
prefix. Secrets must never use `NEXT_PUBLIC_*`.

## Performance budgets

- Landing largest-content paint: under 2.5 seconds on a mid-tier mobile profile.
- Initial JavaScript for landing: target under 170 KB compressed.
- Useful partial investigation: under 5 seconds at p75.
- Complete core investigation: under 15 seconds at p75.
- Interaction to next paint: under 200 ms for local UI actions.
- Relationship graph: maximum 21 visible nodes in P0.
- No continuous polling or hidden canvas render loop.

## Observability

Structured server events:

- `investigation.started`
- `source.completed`
- `source.failed`
- `investigation.scored`
- `brief.validated`
- `brief.fallback`
- `relationship.requested`

Allowed fields: request ID, chain, hashed token address, timeframe, duration,
source name, cache status, result count, error category, score version, and
fixture/live mode.

Forbidden fields: API keys, authorization headers, full upstream bodies, model
prompts, full wallet/token addresses in analytics, or user-identifying network
data beyond infrastructure defaults.

## Deployment

- One preview deployment per pull request when practical.
- Production deployment from `main` at a recorded commit SHA.
- Environment variables configured in the host, never `.env` in Git.
- Health check validates application availability but makes no paid Nansen call.
- A release records build time, commit SHA, score formula version, fixture hash,
  and dependency lockfile.

## Deferred architecture

Do not introduce these before P0 is accepted:

- database-backed user accounts;
- queues or workflow engines;
- event streaming/SSE;
- microservices;
- vector databases or RAG over general crypto content;
- blockchain wallet libraries; or
- autonomous agents with trading tools.
