"use client";

import Link from "next/link";
import { useState } from "react";
import SidebarAgent from "@/components/agent/SidebarAgent";

export default function SiteHeader() {
  const [isAgentOpen, setIsAgentOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] bg-[var(--bg)]/90 px-4 py-3 backdrop-blur">
        <Link href="/" aria-label="offside home" className="font-extrabold tracking-tight hover:text-[var(--accent)]">
          <span className="text-[var(--accent)]">offside</span>
        </Link>
        <nav aria-label="Main navigation" className="flex items-center gap-1">
          <Link href="/" title="Team Manager" className="rounded-md px-3 py-1.5 text-sm hover:bg-white/5 hover:text-[var(--accent)]">
            Team Manager
          </Link>
          <Link href="/players" title="Players" className="rounded-md px-3 py-1.5 text-sm hover:bg-white/5 hover:text-[var(--accent)]">
            Players
          </Link>
          <Link href="/fixtures" title="Fixtures" className="rounded-md px-3 py-1.5 text-sm hover:bg-white/5 hover:text-[var(--accent)]">
            Fixtures
          </Link>
          <Link href="/dream15" title="Dream 15" className="rounded-md px-3 py-1.5 text-sm hover:bg-white/5 hover:text-[var(--accent)]">
            Dream 15
          </Link>
          <Link href="/about" title="About" className="rounded-md px-3 py-1.5 text-sm hover:bg-white/5 hover:text-[var(--accent)]">
            About
          </Link>
          <button
            onClick={() => setIsAgentOpen(true)}
            className="ml-2 flex items-center gap-2 rounded-md px-3 py-1.5 text-sm bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors"
            title="Open FPL Analyst Agent"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span className="hidden sm:inline">Ask Agent</span>
          </button>
        </nav>
      </header>
      <SidebarAgent isOpen={isAgentOpen} onClose={() => setIsAgentOpen(false)} />
    </>
  );
}
