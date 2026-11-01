import Link from "next/link";

const supportTopics = [
  {
    title: "Finding your FPL team ID",
    text: "Use the numeric entry ID from your Fantasy Premier League team URL. Offside uses it to request the public manager, picks, and transfer information for that team.",
  },
  {
    title: "Player data or predictions look wrong",
    text: "Player availability and performance data can change as the official FPL data is updated. Predictions are estimates from Offside’s model, not guarantees of future points.",
  },
  {
    title: "MCP connection or database issue",
    text: "The hosted MCP endpoint is public and unauthenticated. Manager and picks lookups use the public FPL API; player market and fixture tools require the Offside database to be configured.",
  },
];

export default function SupportPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 md:py-14">
      <header className="max-w-2xl border-b border-[var(--border)] pb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--accent)]">We’re here to help</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Offside support</h1>
        <p className="mt-4 text-lg leading-7 text-[var(--muted)]">
          Find answers to common questions about the FPL tools, data, and MCP integration.
        </p>
      </header>

      <section aria-label="Common support topics" className="divide-y divide-[var(--border)]">
        {supportTopics.map((topic) => (
          <article key={topic.title} className="py-6">
            <h2 className="text-xl font-bold">{topic.title}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">{topic.text}</p>
          </article>
        ))}
      </section>

      <aside className="card mt-4 p-6 md:p-8">
        <h2 className="text-xl font-bold">Need more help?</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          This site does not currently publish a dedicated support email or contact form. For site issues, include the page you were using, what you expected to happen, and any error message when contacting the project maintainer through the channel where you found Offside.
        </p>
        <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
          You can also review the <Link href="/mcp" className="text-[var(--accent)] hover:underline">MCP setup guide</Link>, <Link href="/privacy" className="text-[var(--accent)] hover:underline">Privacy Policy</Link>, and <Link href="/terms" className="text-[var(--accent)] hover:underline">Terms</Link>.
        </p>
      </aside>
    </main>
  );
}