import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Offside",
  description: "How Offside handles information when you use the FPL tools and MCP endpoint.",
};

const sections = [
  {
    title: "Information processed",
    paragraphs: [
      "Offside does not ask you to create an account. When you enter an FPL team ID or player ID, the app uses that identifier to request the related public Fantasy Premier League information or player data you selected.",
      "The website makes requests to its own API routes. Depending on the feature, those routes retrieve data from the public Fantasy Premier League API and/or the Offside PostgreSQL database, which contains player and prediction data. The MCP tools provide similar read-only lookups.",
    ],
  },
  {
    title: "MCP endpoint",
    paragraphs: [
      "The hosted MCP endpoint is public and does not require authentication. Anyone who knows its URL can invoke its read-only tools. Manager and team-picks tools request public FPL data; player-market and player-fixture tools may access the Offside database. Requests are handled without MCP session persistence.",
      "Do not submit information you are not authorized to access. If you connect an AI client, that client may process tool inputs and results under its own privacy terms.",
    ],
  },
  {
    title: "Storage, cookies, and analytics",
    paragraphs: [
      "Offside has no account system. The app may keep recently used team IDs in your browser’s local storage to provide a convenience feature; this information remains in that browser unless you clear its site data. The site does not intentionally use that feature to identify you.",
      "This policy does not make claims about infrastructure or hosting-provider logs, which may be governed by the relevant providers’ own policies. No separate analytics or advertising service is described by this application.",
    ],
  },
  {
    title: "Third-party data and services",
    paragraphs: [
      "When a feature requests FPL information, the request may be made to the official Fantasy Premier League service. That service and any AI/MCP client you choose to use operate under their own terms and privacy practices.",
    ],
  },
  {
    title: "Changes and questions",
    paragraphs: [
      "This draft may be updated as the service changes. Offside does not currently publish a dedicated privacy contact address; see the Support page for the available support guidance.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 md:py-14">
      <header className="max-w-3xl border-b border-[var(--border)] pb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--accent)]">Privacy · Informational draft</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Privacy Policy</h1>
        <p className="mt-4 text-lg leading-7 text-[var(--muted)]">
          This page describes the application’s apparent data flows. It is not legal advice or a substitute for a policy reviewed for your organization and deployment.
        </p>
        <p className="mt-3 text-sm text-[var(--muted)]">Last updated: November 1, 2026</p>
      </header>

      <div className="divide-y divide-[var(--border)]">
        {sections.map((section) => (
          <section key={section.title} className="py-6">
            <h2 className="text-xl font-bold">{section.title}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">{paragraph}</p>
            ))}
          </section>
        ))}
      </div>
    </main>
  );
}