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
      </body>
    </html>
  );
}
