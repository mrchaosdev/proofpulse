# ProofPulse codebase rules

Version: `1.0`  
Status: `normative`

The goal is a complete, clean solution where every source file has an obvious
home, dependencies move in one direction, and no route or component becomes a
dumping ground.

## 1. Repository layout

```text
proofpulse/
  .github/
    workflows/
      quality.yml
    pull-request-template.md
  docs/
    README.md
    DESIGN-RULES.md
    CODEBASE-RULES.md
    01-product-brief.md
    02-product-rules.md
    04-information-architecture.md
    05-data-and-scoring.md
    06-technical-architecture.md
    07-security-and-privacy.md
    08-testing-and-acceptance.md
    09-delivery-plan.md
    10-demo-and-submission.md
    11-decisions-and-open-questions.md
  public/
    brand/
    demo/
    icons/
  scripts/
    check-class-names.mjs
    check-secrets.mjs
    capture-fixture.mjs
  src/
    app/
      api/
      investigate/
      methodology/
      layout.tsx
      page.tsx
    components/
      actions/
      data-display/
      feedback/
      forms/
      layout/
      navigation/
    config/
    domain/
      brief/
      evidence/
      investigation/
      scoring/
    features/
      landing/
      investigation/
      relationships/
    integrations/
      nansen/
      model/
    server/
      cache/
      fixtures/
        data/
      investigations/
      observability/
      rate-limit/
      security/
    styles/
      components/
      features/
      tokens.css
      reset.css
      typography.css
      layout.css
      utilities.css
    types/
  tests/
    contract/
    e2e/
    fixtures/
    integration/
    unit/
  .env.example
  .gitignore
  eslint.config.mjs
  next.config.ts
  package.json
  package-lock.json
  playwright.config.ts
  tsconfig.json
  README.md
```

Directories are created only when they contain a real file. Empty placeholder
trees are forbidden.

## 2. Root-directory law

The repository root contains configuration, manifests, license, contributor
guidance, and the README only.

Forbidden at root:

- React components;
- API clients;
- domain logic;
- CSS feature files;
- test fixtures;
- scripts not placed in `scripts`;
- screenshots not placed in `public` or `docs`; and
- scratch files, exported JSON, logs, and personal notes.

All executable product source belongs under `src`. All automated tests belong
under `tests`, except a narrowly justified colocated test if tooling requires it.

## 3. Folder ownership

### `src/app`

Owns routing, route metadata, server endpoints, layouts, and feature composition.
Route files must stay thin. They may select and compose features but must not
contain Nansen normalization, scoring formulas, model prompts, or complex charts.

### `src/components`

Owns reusable product-neutral UI primitives grouped by purpose. A component that
knows what Smart Money means belongs in a feature, not here.

### `src/features`

Owns user-facing product capability and feature composition. Each feature folder
may contain `components`, `hooks`, `state`, and `helpers` only when needed.
Features consume domain contracts and application APIs; they do not call Nansen.

### `src/domain`

Owns pure business meaning: normalized types, evidence, scoring, and validated
brief contracts. It imports no framework, browser, network, filesystem, cache,
or provider SDK.

### `src/integrations`

Owns external-provider code. `nansen` contains request/response schemas and
normalizers. `model` contains the replaceable brief generator and provider
adapter. Provider types do not escape this layer.

### `src/server`

Owns server infrastructure shared across integrations: cache, rate limiting,
redacted logging, request IDs, and security helpers. It contains no React code.

### `src/styles`

Owns all authored application styling according to
[DESIGN-RULES.md](DESIGN-RULES.md). JSX/TSX contains semantic class names only.

### `src/config`

Owns parsed, validated configuration. Product code does not read environment
variables directly outside this folder.

### `src/types`

Owns narrowly shared ambient or utility types only. Domain types remain in their
domain folders; this is not a miscellaneous folder.

### `tests`

Mirrors behavior rather than implementation details:

- `unit`: pure domain and helper tests;
- `contract`: Nansen/model fixture schema compatibility;
- `integration`: route, cache, rate-limit, and adapter orchestration;
- `e2e`: browser journeys;
- `fixtures`: sanitized immutable test inputs.

## 4. Dependency direction

```text
app ──► features ──► components
 │         │
 │         └──────► domain
 │
 ├──────► domain
 ├──────► integrations ──► domain
 └──────► server

integrations ──► server
server ──► config
domain ──► nothing outside domain
```

Forbidden dependencies:

- domain importing React, Next.js, provider SDKs, cache, or environment values;
- components importing features;
- feature code importing raw Nansen response types;
- client components importing any server module;
- one feature importing another feature's internal file;
- circular imports; and
- imports through filesystem aliases that bypass a public module boundary.

## 5. File placement examples

| File responsibility | Correct location |
| --- | --- |
| Score formula | `src/domain/scoring/calculate-direction.ts` |
| Evidence contract | `src/domain/evidence/evidence.ts` |
| Nansen Flow Intelligence schema | `src/integrations/nansen/schemas/flow-intelligence.ts` |
| Nansen HTTP client | `src/integrations/nansen/nansen-client.ts` |
| Investigation route | `src/app/api/investigations/route.ts` |
| Investigation orchestrator | `src/server/investigations/investigation-service.ts` |
| Signal lens component | `src/features/investigation/components/SignalLens.tsx` |
| Generic button | `src/components/actions/Button.tsx` |
| Investigation styles | `src/styles/features/investigation.css` |
| Class-name checker | `scripts/check-class-names.mjs` |
| Sanitized API fixture | `tests/fixtures/nansen/flow-intelligence.json` |
| Sanitized production demo fixture | `src/server/fixtures/data/demo-investigation.json` |
| Playwright journey | `tests/e2e/investigation.spec.ts` |

A file that does not fit an existing folder triggers a structure decision. Do not
create `misc`, `common`, `shared`, `helpers`, or `utils` dumping folders at the
root of a layer.

## 6. Naming rules

### Files

- React component files: `PascalCase.tsx` and one primary exported component.
- Hooks: `useSomething.ts`.
- Domain, server, integration, and script modules: lowercase kebab-case.
- Tests: subject plus `.test.ts` or `.spec.ts` according to the test layer.
- Stylesheets: lowercase kebab-case.
- No spaces, underscores, copy suffixes, dates, `final`, `new`, or version numbers
  in source filenames.

### Symbols

- Components and types: `PascalCase`.
- Functions, variables, and hooks: `camelCase`.
- True module constants: `UPPER_SNAKE_CASE` only when immutable and global in
  meaning.
- Booleans begin with `is`, `has`, `can`, `should`, or `did`.
- Event handlers begin with `handle`; callback props begin with `on`.
- Avoid abbreviations except established domain terms such as API, URL, USD, PnL,
  and ID.

### CSS classes

Class naming is governed exclusively by
[DESIGN-RULES.md](DESIGN-RULES.md#7-class-name-law). Every authored class must
match:

```text
^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$
```

That is the rule for classes this project writes. Tailwind utilities are a
separate vocabulary and are permitted under DESIGN-RULES 7a, provided each one
resolves through a token. No `_`, `__`, `--`, CSS Module output, or dynamic
class construction is allowed in either vocabulary.

## 7. File-size and responsibility rules

- A React component should stay under 250 lines.
- A non-generated source module should stay under 300 lines.
- A function should normally stay under 50 lines and one abstraction level.
- Route files should stay under 120 lines.
- Exceeding a guideline requires extracting a coherent responsibility, not
  splitting arbitrarily to satisfy a number.
- One file has one primary reason to change.
- Generated files are clearly marked and never manually edited.
- Barrel files are limited to stable public boundaries and must not create cycles.

## 8. TypeScript rules

- Strict TypeScript is mandatory.
- `any`, non-null assertions, and unchecked type casts are forbidden in product
  code unless a documented boundary test proves the exception.
- External data enters through runtime schemas.
- Domain states use discriminated unions rather than optional-field soup.
- Money and scores remain numbers plus explicit units; formatting happens at the
  presentation boundary.
- Dates cross boundaries as ISO 8601 UTC strings and become `Date` only near use.
- Provider response types never double as domain types.
- Functions that can fail return typed results or throw only documented error
  types at controlled boundaries.

## 9. React and route rules

- Server Components are the default; add `use client` only at the smallest
  interactive boundary.
- Client components never access secret configuration or provider adapters.
- Effects synchronize external systems only; derived state stays pure.
- Avoid global client state until a concrete cross-route requirement exists.
- Every async panel owns explicit loading, empty, ready, partial, stale, and
  error presentation.
- Route handlers validate method, content type, body size, origin where needed,
  input schema, and rate limit before external work.
- No business logic lives inside JSX expressions.

## 10. Styling implementation rules

- Tailwind is a dependency, as the base of shadcn/ui (decision D-072). Its
  utilities must resolve through the tokens in `src/styles/tokens.css`.
- No CSS Modules.
- No CSS-in-JS runtime.
- No inline style for static presentation.
- Semantic global class tokens only.
- State and variants use data/ARIA attributes.
- CSS import order is tokens, reset, typography, layout, components, features.
- Custom properties represent tokens and must not encode feature business state.
- A class-name validation script runs in local checks and CI.

## 11. API and domain cleanliness

- One Nansen endpoint adapter per module.
- HTTP request, response schema, normalization, and domain interpretation remain
  distinct functions even if colocated initially.
- No raw provider payload reaches React.
- No model-generated value enters scoring.
- Every score formula is pure, versioned, and unit tested.
- Cache keys are constructed centrally.
- Error codes are stable and provider-independent at the app boundary.
- Secrets and raw authorization failures never reach client code.

## 12. Tests and fixtures

- Tests use public behavior, not private implementation details.
- Each bug fix adds a failing regression test first when practical.
- Fixtures are immutable and sanitized.
- Live external calls are excluded from normal test commands.
- Contract tests state which provider schema/version the fixture represents.
- E2E tests use a fixture adapter and separately documented live smoke test.
- Snapshots are reserved for stable schemas or small UI contracts; large page
  snapshots that hide intent are forbidden.

## 13. Dependency rules

- Add a package only when platform code or a small local module cannot reasonably
  solve the requirement.
- Record purpose, bundle/server impact, license, and alternatives in the pull
  request.
- Pin a lockfile and use clean installs in CI.
- Avoid two libraries serving the same concern.
- Heavy visualization libraries must be dynamically loaded only on routes that
  need them.
- Provider SDKs remain server-only when possible.

## 14. Git cleanliness

- `main` is deployable.
- One commit has one coherent purpose.
- No generated build output, `.env`, log, coverage, editor, or operating-system
  files are committed.
- No commented-out implementation, dead feature flag, or unused dependency.
- Do not commit local test recordings unless intentionally placed in a documented
  demo asset folder.
- Documentation and tests change with product semantics.
- Before push: format, lint, typecheck, unit, contract, and relevant browser tests.

## 15. Quality scripts

The finished scaffold must expose:

```text
npm run format-check
npm run lint
npm run typecheck
npm run test
npm run test-contract
npm run test-e2e
npm run check-classes
npm run check-secrets
npm run build
npm run quality
```

`quality` runs all non-live mandatory checks in a deterministic order.

## 16. Clean-source acceptance gate

- [ ] Every executable product file is under `src`.
- [ ] Every automated test is under `tests` or a documented tooling exception.
- [ ] Every script is under `scripts`.
- [ ] Every static asset is under `public` or intentionally embedded.
- [ ] No root-level scratch/source file exists.
- [ ] Layer dependencies match the allowed direction.
- [ ] No circular dependency exists.
- [ ] No file is a miscellaneous dumping ground.
- [ ] No authored class violates the class-name law.
- [ ] No CSS Module or CSS-in-JS styling exists, and no Tailwind utility
      carries an arbitrary colour value.
- [ ] External data is runtime validated.
- [ ] Scores remain pure and model-independent.
- [ ] Secrets, dead code, debug logs, and unused dependencies are absent.
- [ ] `npm run quality` and production build pass from a clean clone.
