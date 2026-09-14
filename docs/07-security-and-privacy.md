# 07 — Security and privacy

## Security objectives

1. Keep Nansen and model-provider credentials out of the browser and repository.
2. Prevent untrusted token metadata from influencing model or interface behavior.
3. Bound API-credit consumption and infrastructure abuse.
4. Avoid overstating wallet attribution or financial conclusions.
5. Keep the public demo useful without collecting identity or wallet access.

## Threat model

| Threat | Example | Primary control |
| --- | --- | --- |
| Secret exposure | API key shipped in client bundle | server-only environment variables and bundle scan |
| Repository leak | `.env.local` committed | ignore rules, secret scanning, pre-release history check |
| Prompt injection | token name contains instructions | treat metadata as quoted data; schema-constrained prompt |
| Cross-site scripting | malicious token label rendered as HTML | React escaping; no untrusted `dangerouslySetInnerHTML` |
| Credit exhaustion | repeated uncached investigations | rate limit, cache, bounded endpoints, no polling |
| SSRF | user controls upstream URL | fixed upstream origin and allowlisted endpoint paths |
| Log leakage | raw response includes sensitive header | structured allowlist logging and redaction |
| Misattribution | related wallets called same owner | enforced copy and evidence semantics |
| Model fabrication | unsupported number in summary | evidence-ID and numeric validation with fallback |
| Fixture confusion | historical data shown as live | persistent fixture labeling and Confidence cap |
| Dependency compromise | malicious package or script | lockfile, minimal dependencies, audit, reviewed install scripts |

## Secrets

- `NANSEN_API_KEY`, model credentials, and cache tokens are server-only.
- Secrets are read only inside server adapters.
- No secret may use `NEXT_PUBLIC_*`.
- `.env`, `.env.*`, and provider export files remain ignored; `.env.example`
  contains names and safe descriptions only.
- Logs print whether a credential is configured, never its value, prefix,
  suffix, length, or hash.
- Error objects are reconstructed before crossing the server boundary.
- Before submission, scan current files and Git history for common key patterns.
- Rotate a credential immediately if it appears in a terminal capture, commit,
  issue, video, or deployed client bundle.

## Input validation

- Chain is selected from a fixed allowlist.
- Timeframe is selected from a capability-aware allowlist.
- EVM addresses must pass exact hexadecimal length/check rules supported by the
  chosen address library.
- Solana addresses must decode to the expected public-key length.
- Input is trimmed and canonicalized before cache keys are generated.
- Maximum request body size is small and enforced.
- Unknown fields are rejected.
- Pagination, result count, and graph expansion depth are server constants, not
  client-controlled arbitrary values.

## Upstream request controls

- Base URLs are constants.
- User input never becomes a hostname, protocol, or arbitrary path.
- Requests use TLS and bounded timeouts.
- Redirects to a different origin are rejected.
- Retries are capped and respect rate-limit guidance.
- Upstream content is runtime-validated before use.
- A malformed record creates a warning and cannot become score input.

## Abuse and credit controls

- Rate limit by privacy-preserving request bucket and endpoint category.
- Suggested initial limits: 10 core investigations per 10 minutes and 20
  relationship expansions per hour per bucket.
- Cache hits do not consume Nansen credits but still use a modest abuse limit.
- A refresh bypass is allowed at most once per cache TTL.
- Relationship expansion requires an actor from the current investigation.
- No automatic polling, background scanning, or unbounded symbol discovery.
- `402`/credit exhaustion disables paid actions without retrying.

## Model safety boundary

- System instructions and product rules are authored server-side.
- Token symbol, name, wallet label, relation text, and evidence statements are
  serialized as data fields, not concatenated into instructions.
- The provider receives no API key, raw headers, user IP, or unnecessary raw
  response fields.
- Model output is treated as untrusted until schema, evidence-ID, numeric, and
  prohibited-language checks pass.
- Render model text as plain content; Markdown support, if added, uses a strict
  allowlist with links disabled by default.
- A deterministic brief is always available.

## Web application controls

- Content Security Policy allows only required origins and forbids inline script
  where framework constraints permit.
- Set `X-Content-Type-Options: nosniff`, a strict referrer policy, permissions
  policy, and frame-ancestor restriction.
- External links use `rel="noreferrer noopener"`.
- Mutation routes require same-origin checks and appropriate CSRF protection for
  the chosen framework behavior.
- No user-provided HTML is rendered.
- Source maps and detailed server errors are not publicly exposed unless the
  host securely restricts them.

## Privacy and retention

The MVP has no login and does not connect a wallet.

Browser-local storage may contain:

- last five canonical token investigations;
- selected theme; and
- non-sensitive display preferences.

It must not contain:

- credentials;
- raw model-provider payloads;
- hidden identifiers; or
- claims linking a wallet to the person using the app.

Server cache retention follows technical TTLs. Infrastructure logs should retain
only operational metadata for the minimum practical period. Public analytics,
if introduced, must be opt-out capable and exclude full addresses and evidence
payloads.

## Financial and reputational safety

- Product language follows [02-product-rules.md](02-product-rules.md).
- Related-wallet evidence is described as a relationship, never ownership.
- Coordination Risk is not a fraud score.
- A token or wallet label from an upstream source is attributed to that source.
- Exported summaries preserve timestamp, method version, and limitation.
- No automated trade or wallet-signing capability is included.

## Security release checklist

- [ ] `.env*` files are ignored except `.env.example`.
- [ ] Client bundle contains no secret or private upstream URL.
- [ ] Git history secret scan passes.
- [ ] All request inputs use runtime schemas.
- [ ] Rate limiting works for live and relationship routes.
- [ ] Upstream redirects and timeouts are bounded.
- [ ] Model prompt injection fixtures fall back safely.
- [ ] Raw error bodies do not reach the client.
- [ ] Security headers are verified on production.
- [ ] Dependencies have no unresolved critical vulnerability.
- [ ] Fixture files are sanitized and manually reviewed.
- [ ] Copy avoids financial and ownership overclaims.

## Incident response

### Suspected credential leak

1. Disable or rotate the key at the provider.
2. Disable live mode if necessary.
3. Identify exposure in repository, deployment, logs, or media.
4. Remove the value from current state and rewrite history only with explicit
   coordination because history rewriting affects collaborators.
5. Verify the new key never enters the client bundle.
6. Record the incident and prevention change without recording the secret.

### Unexpected credit consumption

1. Disable relationship expansion and live refresh.
2. Inspect redacted source-call counts and cache hit rates.
3. Revoke the key if abuse is continuing.
4. Fix rate limit/cache behavior and add a regression test.
5. Restore live mode with a lower cap.

### Misleading analytical output

1. Preserve the investigation input, formula version, and sanitized evidence.
2. Hide or label the affected derivation.
3. Determine whether the cause is source semantics, normalization, formula, or
   generated prose.
4. Add a fixture and regression test before restoring the claim.
