import type { Metadata } from "next";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "offside — Smarter Fantasy Premier League management",
  description: "A professional FPL command centre for squad analysis, lineup optimization and data-led transfer decisions.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <SiteHeader />
        <div className="min-w-0 flex-1">{children}</div>
        <footer className="border-t border-[var(--border)] px-4 py-6">
          <nav aria-label="Footer navigation" className="mx-auto flex max-w-7xl flex-wrap gap-x-6 gap-y-2 text-sm text-[var(--muted)]">
            <a href="/support" className="hover:text-[var(--accent)]">Support</a>
            <a href="/privacy" className="hover:text-[var(--accent)]">Privacy Policy</a>
            <a href="/terms" className="hover:text-[var(--accent)]">Terms</a>
          </nav>
        </footer>
      </body>
    </html>
  );
}
