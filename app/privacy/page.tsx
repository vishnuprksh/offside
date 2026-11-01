import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Offside",
  description: "How Offside handles information when you use the FPL tools and MCP endpoint.",
};

const sections = [
  {
    title: "Publisher and information processed",
    paragraphs: [
      "Offside is published by Vishnu Prakash. For privacy questions, contact vishnucheppanam@gmail.com.",
      "Offside has no accounts or authentication. When you enter an FPL team ID or select a player, the app uses the ID you provide only to fetch the data needed to deliver the requested service, such as public manager, team-picks, player, or fixture information. The ID is sent to Offside’s API routes and, as needed, used for requests to the public Fantasy Premier League API or Offside’s player database.",
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
    title: "Retention, deletion, and browser storage",
    paragraphs: [
      "Offside does not retain personal data or the team/player IDs you submit in an Offside user account or application database. IDs are used to fetch the requested service data and are not used to build user profiles. The service has no account-based data to delete; you can stop using the service at any time.",
      "For convenience, the Manager page stores up to five recently used team IDs in your browser’s local storage. This browser-local data is not stored in Offside’s application database. Delete it by clearing this site’s local storage/site data in your browser. In-memory page data is cleared when you leave or reload the page.",
      "Requests necessarily pass through the website’s hosting and network infrastructure. This application does not control or specify the retention period for infrastructure/security logs; consult the hosting provider’s policies for those logs. The app has no account system, and no separate analytics or advertising service is configured in the application.",
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
      "This policy applies to the Offside website and its FPL and MCP features and may be updated when those services or their data practices change. For questions or privacy requests, contact Vishnu Prakash at vishnucheppanam@gmail.com.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 md:py-14">
      <header className="max-w-3xl border-b border-[var(--border)] pb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--accent)]">Privacy</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Privacy Policy</h1>
        <p className="mt-4 text-lg leading-7 text-[var(--muted)]">
          This policy explains how Offside handles information when you use the website, FPL tools, or MCP endpoint.
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