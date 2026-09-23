import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { BackToTop } from "@/components/actions/BackToTop";
import { CanvasFields } from "@/components/effects/CanvasFields";
import { RevealOnView } from "@/components/effects/RevealOnView";
import {
  DEFAULT_THEME,
  THEME_BOOTSTRAP,
} from "@/components/actions/theme-script";
import { ThemeToggle } from "@/components/actions/ThemeToggle";
import { ModeIndicator } from "@/components/feedback/ModeIndicator";
import { BrandSymbol } from "@/components/navigation/BrandSymbol";
import { CommandBarLinks } from "@/components/navigation/CommandBarLinks";
import { NavMenu } from "@/components/navigation/NavMenu";
import { NAV_LINKS } from "@/components/navigation/nav-links";
import "@/styles/index.css";

export const metadata: Metadata = {
  title: {
    default: "ProofPulse",
    template: "%s · ProofPulse",
  },
  description:
    "An evidence-first onchain investigation workspace built on Nansen data. " +
    "It separates observed flow direction, evidence confidence, and wallet " +
    "coordination risk. It is research software, not financial advice.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    /*
      suppressHydrationWarning is on the element the bootstrap edits, and only
      that element: the script below may change data-theme before React
      hydrates, which is exactly the mismatch the warning is for.
    */
    <html lang="en" data-theme={DEFAULT_THEME} suppressHydrationWarning>
      <head>
        <script
          id="proofpulse-theme-bootstrap"
          dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }}
        />
      </head>
      <body>
        <CanvasFields />
        <div className="app-shell">
          <header className="command-bar-wrap">
            <nav className="command-bar" aria-label="Primary">
              <Link className="brand-mark" href="/">
                <BrandSymbol id="bar" />
                <span className="brand-wordmark">ProofPulse</span>
              </Link>
              {/*
                Below the width where every destination no longer fits beside
                the tools, this list hides and NavMenu carries the same three
                destinations behind one trigger, rather than pushing the bar
                onto a second sticky row (D-023 superseded).
              */}
              <CommandBarLinks />
              {/*
                The mode badge and the theme control are not navigation
                destinations, so they sit outside the list of links.
              */}
              <div className="command-bar-tools">
                <ModeIndicator />
                <ThemeToggle />
                <NavMenu />
              </div>
            </nav>
          </header>
          <main className="app-main">{children}</main>
          <footer className="site-footer">
            <div className="footer-inner">
              <div className="footer-main">
                <section
                  className="footer-story"
                  aria-labelledby="footer-statement"
                >
                  <Link className="footer-brand" href="/">
                    <BrandSymbol id="footer" />
                    <span className="footer-brand-copy">
                      <strong>ProofPulse</strong>
                      <span>Evidence-first onchain intelligence</span>
                    </span>
                  </Link>
                  <h2 className="footer-statement" id="footer-statement">
                    Follow the flow. Keep the uncertainty visible.
                  </h2>
                  <p className="footer-description">
                    One research surface for cohort flows, dominant actors and
                    the evidence behind every conclusion.
                  </p>
                  <Link className="footer-action" href="/investigate">
                    Start an investigation
                    <svg viewBox="0 0 20 20" aria-hidden="true">
                      <path d="M4 10h11M11 6l4 4-4 4" />
                    </svg>
                  </Link>
                </section>

                <nav className="footer-nav" aria-label="Footer">
                  <h2 className="footer-label">Explore</h2>
                  <ul className="footer-links">
                    {NAV_LINKS.map((link) => (
                      <li key={link.href}>
                        {link.external ? (
                          <a href={link.href} rel="noreferrer noopener">
                            {link.label}
                            <svg viewBox="0 0 20 20" aria-hidden="true">
                              <path d="M7 5h8v8M15 5 5 15" />
                            </svg>
                          </a>
                        ) : (
                          <Link href={link.href}>{link.label}</Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </nav>

                <section
                  className="footer-posture"
                  aria-labelledby="footer-posture-heading"
                >
                  <h2 className="footer-label" id="footer-posture-heading">
                    Research posture
                  </h2>
                  <ul className="footer-principles">
                    <li>
                      <span className="footer-principle-mark" />
                      <span>
                        <strong>Traceable</strong>
                        Every claim resolves to evidence.
                      </span>
                    </li>
                    <li>
                      <span className="footer-principle-mark" />
                      <span>
                        <strong>Calibrated</strong>
                        Missing and conflicting data stay visible.
                      </span>
                    </li>
                    <li>
                      <span className="footer-principle-mark" />
                      <span>
                        <strong>Non-custodial</strong>
                        No wallet connection or trade execution.
                      </span>
                    </li>
                  </ul>
                </section>
              </div>

              <div className="footer-bottom">
                <p>Built on the Nansen API for the Meridian Buildathon.</p>
                <p>Research software, not financial advice.</p>
              </div>
            </div>
          </footer>
          <BackToTop />
          <RevealOnView />
        </div>
      </body>
    </html>
  );
}
