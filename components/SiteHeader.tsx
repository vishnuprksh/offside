"use client";

import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[#08111f]/85 px-4 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[68px] max-w-7xl flex-wrap items-center justify-between gap-3">
        <Link href="/" aria-label="offside home" className="group flex items-center gap-2 font-extrabold tracking-tight">
          <span className="flex size-8 items-center justify-center rounded-lg bg-[var(--accent)] text-sm font-black text-[#08111f] shadow-[0_0_24px_rgba(184,243,74,0.2)]">o</span>
          <span className="text-lg group-hover:text-[var(--accent)]">offside<span className="text-[var(--accent)]">.</span></span>
        </Link>
        <nav aria-label="Main navigation" className="flex items-center gap-1 overflow-x-auto text-sm">
        <Link href="/" title="Manager" className="rounded-md px-3 py-1.5 text-sm hover:bg-white/5 hover:text-[var(--accent)]">
          Manager
        </Link>
        <Link href="/players" title="Players" className="rounded-md px-3 py-1.5 text-sm hover:bg-white/5 hover:text-[var(--accent)]">
          Players
        </Link>
        <Link href="/fixtures" title="Fixtures" className="rounded-md px-3 py-1.5 text-sm hover:bg-white/5 hover:text-[var(--accent)]">
          Fixtures
        </Link>
        <Link href="/dream15" title="Dream15" className="rounded-md px-3 py-1.5 text-sm hover:bg-white/5 hover:text-[var(--accent)]">
          Dream15
        </Link>
        <Link href="/about" title="About" className="rounded-md px-3 py-1.5 text-sm hover:bg-white/5 hover:text-[var(--accent)]">
          About
        </Link>
        </nav>
      </div>
    </header>
  );
}
