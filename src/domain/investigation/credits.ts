/**
 * Credit cost of one Nansen request.
 *
 * Verified against the live API and the published pricing on 2026-09-15: one
 * credit per call on both the Free and Pro plans (decision D-020). It lives in
 * the domain because the interface must state the cost of an action before the
 * user takes it (02-product-rules 4.4), and the interface may not reach into
 * the integration layer to find it.
 */

export const CREDITS_PER_CALL = 1;
