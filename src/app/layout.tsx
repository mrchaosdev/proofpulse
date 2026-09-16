import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { BackToTop } from "@/components/actions/BackToTop";
import { RevealOnView } from "@/components/effects/RevealOnView";
import { ThemeToggle } from "@/components/actions/ThemeToggle";
import { ModeIndicator } from "@/components/feedback/ModeIndicator";
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
    <html lang="en" data-theme="light">
      <body>
        <div className="app-shell">
          <header className="command-bar-wrap">
            <nav className="command-bar" aria-label="Primary">
              <Link className="brand-mark" href="/">
                <span className="brand-symbol" aria-hidden="true">
                  <span className="brand-symbol-core" />
                </span>
                <span className="brand-wordmark">ProofPulse</span>
              </Link>
              <ul className="command-bar-links">
                <li>
                  <Link href="/investigate">Investigate</Link>
                </li>
                <li>
                  <Link href="/methodology">Methodology</Link>
                </li>
                <li>
                  <a
                    href="https://github.com/mrchaosdev/proofpulse"
                    rel="noreferrer noopener"
                  >
                    Source
                  </a>
                </li>
              </ul>
              {/*
                The mode badge and the theme control are not navigation
                destinations, so they sit outside the list of links. Keeping
                them in it also forced the bar onto three rows on a phone.
              */}
              <div className="command-bar-tools">
                <ModeIndicator />
                <ThemeToggle />
              </div>
            </nav>
          </header>
          <main className="app-main">{children}</main>
          <footer className="site-footer">
            <div className="footer-inner">
              <div className="footer-brand">
                <span className="brand-symbol" aria-hidden="true">
                  <span className="brand-symbol-core" />
                </span>
                <div>
                  <strong>ProofPulse</strong>
                  <p className="text-meta">
                    Research software, not financial advice.
                  </p>
                </div>
              </div>
              <p className="text-meta">
                Built on the Nansen API for the Meridian Buildathon.
              </p>
            </div>
          </footer>
          <BackToTop />
          <RevealOnView />
        </div>
      </body>
    </html>
  );
}
