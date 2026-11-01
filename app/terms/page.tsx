import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use | Offside",
  description: "Informational terms for using Offside’s FPL tools and MCP integration.",
};

const sections = [
  {
    title: "Using Offside",
    paragraphs: [
      "Offside provides tools for viewing Fantasy Premier League information, comparing player data, and exploring model-generated suggestions. You may use the service only in a lawful manner and in accordance with the rules of services you access through it.",
      "You are responsible for the identifiers and requests you submit. Only look up team or player information you are authorized to access, and do not attempt to disrupt, overload, or gain unauthorized access to the site, its APIs, or its data sources.",
    ],
  },
  {
    title: "Data, predictions, and decisions",
    paragraphs: [
      "Information can be incomplete, delayed, or changed by its source. Predictions and transfer suggestions are estimates for informational purposes only; they are not guarantees, professional advice, or a promise of a particular result. You make your own FPL decisions and are responsible for them.",
      "Offside is an independent tool and is not affiliated with or endorsed by the Fantasy Premier League or the Premier League. Names and data relating to third-party services belong to their respective owners.",
    ],
  },
  {
    title: "MCP integration",
    paragraphs: [
      "The hosted MCP endpoint is publicly accessible and unauthenticated. Its tools are read-only, but requests can trigger upstream FPL or database lookups. Do not send confidential information, credentials, or data you do not have permission to access. You are responsible for the MCP client you configure and its handling of tool inputs and outputs.",
    ],
  },
  {
    title: "Availability and changes",
    paragraphs: [
      "Features and data sources may change, become unavailable, or be discontinued. Offside is provided without a promise of uninterrupted availability or error-free data. These terms may be revised as the service changes.",
    ],
  },
  {
    title: "Publisher and contact",
    paragraphs: [
      "Offside is published by Vishnu Prakash. Questions about these Terms or the service can be sent to vishnucheppanam@gmail.com.",
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 md:py-14">
      <header className="max-w-3xl border-b border-[var(--border)] pb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--accent)]">Terms of service</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Terms of Use</h1>
        <p className="mt-4 text-lg leading-7 text-[var(--muted)]">
          These Terms apply when you access or use the Offside website, FPL tools, or MCP endpoint. By using the service, you agree to follow them.
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