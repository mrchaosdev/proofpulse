import type { Metadata, Viewport } from "next";
import Link from "next/link";
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
    <html lang="en">
      <body>
        <div className="app-shell">
          <header>
            <nav className="command-bar" aria-label="Primary">
              <Link className="brand-mark" href="/">
                ProofPulse
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
                <li>
                  <ModeIndicator />
                </li>
                <li>
                  <ThemeToggle />
                </li>
              </ul>
            </nav>
          </header>
          <main className="app-main">{children}</main>
          <footer className="site-footer">
            <div className="footer-inner">
              <p className="text-meta">
                ProofPulse is research software. It does not give financial
                advice, predict price, or claim wallet ownership.
              </p>
              <p className="text-meta">
                Built on the Nansen API for the Meridian Buildathon.
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
