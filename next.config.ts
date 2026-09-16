import type { NextConfig } from "next";

/**
 * Content Security Policy (07-security-and-privacy "Web application controls").
 *
 * Everything the product needs is served from this origin: fonts are
 * self-hosted and the browser never calls Nansen or a model provider, so
 * `connect-src 'self'` also enforces the rule that upstream requests happen
 * only on the server.
 *
 * `'unsafe-inline'` is present for script and style because the App Router
 * emits inline bootstrap script and inline style tags. The rule requires
 * forbidding inline script "where framework constraints permit", and this
 * framework does not; tightening it needs nonce plumbing through the document
 * response, which is recorded as follow-up work rather than claimed as done.
 *
 * `'unsafe-eval'` is added in development only. React's development build
 * uses eval to reconstruct call stacks across environments, so without it the
 * dev server reports "eval() is not supported in this environment" and loses
 * its debugging features. Production never gets it: React does not use eval
 * there, and allowing it would weaken the policy for every visitor.
 */
const isDevelopment = process.env.NODE_ENV === "development";

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
