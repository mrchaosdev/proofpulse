import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { BackToTop } from "@/components/actions/BackToTop";
import { CanvasFields } from "@/components/effects/CanvasFields";
import { RevealOnView } from "@/components/effects/RevealOnView";
import { THEME_BOOTSTRAP } from "@/components/actions/theme-script";
import { ThemeToggle } from "@/components/actions/ThemeToggle";
import { ModeIndicator } from "@/components/feedback/ModeIndicator";
import { BrandSymbol } from "@/components/navigation/BrandSymbol";
import { CommandBarLinks } from "@/components/navigation/CommandBarLinks";
import { NavMenu } from "@/components/navigation/NavMenu";
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
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body>
        {/*
          First thing in the body, and synchronous, so the chosen theme is
          applied while the document is still parsing rather than after an
          effect runs.
        */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
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
              <div className="footer-brand">
                <BrandSymbol id="footer" />
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
