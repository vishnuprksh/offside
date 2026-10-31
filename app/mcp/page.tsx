/*
## Objective
Explain the planned Vercel-hosted MCP connection and the currently available local server.

## Changelog
| # | date | details | reasoning | reference |
|---|---|---|---|---|
| 1 | 2026-10-31 | Added a user-facing guide for setup, supported tools, and data requirements. | Help users configure MCP clients without exposing database credentials or implying a hosted endpoint exists. | MCP MVP |
| 2 | 2026-10-31 | Reframed the guide around the intended Vercel-hosted deployment while distinguishing the working local transport from the endpoint still to be implemented. | Avoid giving users a nonfunctional hosted URL or asking them to place database credentials in their client. | Vercel hosting plan |

## Results/Takeaways
The guide explains the planned remote Vercel connection and makes clear that the current implementation remains local stdio until an HTTP endpoint is deployed.
*/

const tools = [
  {
    name: "get_manager",
    detail: "Look up public manager and team summary information using an FPL team ID.",
    source: "Fantasy Premier League API",
  },
  {
    name: "get_team_picks",
    detail: "Retrieve a squad, captaincy choices, and transfer history for a gameweek. If omitted, Offside resolves the current gameweek.",
    source: "Fantasy Premier League API",
  },
  {
    name: "search_player_market",
    detail: "Search available players by name and position, with current stats and Offside model predictions.",
    source: "Offside PostgreSQL database",
  },
  {
    name: "get_player_fixtures",
    detail: "Review the last four played matches and next four scheduled fixtures for a player ID.",
    source: "Offside PostgreSQL database",
  },
];

export default function McpPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 md:py-14">
      <header className="max-w-3xl border-b border-[var(--border)] pb-8">
        <p className="text-sm font-semibold uppercase text-[var(--accent)]">Vercel-hosted integration</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Connect Offside with MCP</h1>
        <p className="mt-4 max-w-2xl text-lg leading-7 text-[var(--muted)]">
          Offside is intended to provide a remotely accessible MCP service from its Vercel deployment. The hosted endpoint is not available yet; the current server runs locally over stdio.
        </p>
      </header>

      <section className="grid gap-10 border-b border-[var(--border)] py-8 md:grid-cols-[minmax(0,1fr)_minmax(260px,0.7fr)]">
        <div>
          <h2 className="text-2xl font-bold">Planned hosted connection</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Once the Streamable HTTP endpoint is deployed, add its HTTPS address to an MCP-compatible client. The address will use the Offside deployment domain and MCP route; it will be published here when the endpoint is live. A hosted connection will not require cloning this repository or running a local process.
          </p>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            The Vercel deployment will keep <code className="text-[var(--text)]">DATABASE_URL</code> in its server-side environment. Do not add database credentials to the MCP client; the client will connect to Offside&apos;s endpoint, and the server will access its configured data sources.
          </p>
          <h2 className="mt-8 text-xl font-bold">Try the current local server</h2>
          <ol className="mt-5 space-y-5 text-sm leading-6 text-[var(--muted)]">
            <li>
              <span className="font-semibold text-[var(--text)]">1. Install the project dependencies.</span>
              <pre className="mt-2 overflow-x-auto rounded-md border border-[var(--border)] bg-black/20 p-3 text-[var(--text)]"><code>npm install</code></pre>
            </li>
            <li>
              <span className="font-semibold text-[var(--text)]">2. Configure your MCP client to start the server.</span>
              <p className="mt-1">Set the working directory to this repository and use the following command:</p>
              <pre className="mt-2 overflow-x-auto rounded-md border border-[var(--border)] bg-black/20 p-3 text-[var(--text)]"><code>npm run mcp</code></pre>
              <p className="mt-2">The client launches the process over stdio and discovers its tools automatically. The exact configuration file depends on your MCP client.</p>
            </li>
            <li>
              <span className="font-semibold text-[var(--text)]">3. Provide the database connection when using database tools.</span>
              <p className="mt-1">For this local server only, set <code className="text-[var(--text)]">DATABASE_URL</code> in the MCP server process environment. Use a secret/environment setting, not a committed config file.</p>
            </li>
          </ol>
        </div>

        <aside className="self-start border-l-2 border-[var(--accent2)] pl-5">
          <h2 className="text-lg font-bold">Deployment status</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Vercel hosting is the target. The current app has not yet added the remote MCP transport or endpoint, so a URL cannot be configured in a remote MCP client yet.
          </p>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            When the hosted endpoint is released, it should use authentication and rate limits before being made publicly available. Team IDs are supplied by the client; only use IDs whose information you are authorized to access.
          </p>
        </aside>
      </section>

      <section className="border-b border-[var(--border)] py-8">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-2xl font-bold">Available tools</h2>
          <p className="text-sm text-[var(--muted)]">Read-only tools · availability depends on transport</p>
        </div>
        <dl className="mt-5 divide-y divide-[var(--border)]">
          {tools.map((tool) => (
            <div key={tool.name} className="grid gap-1 py-4 sm:grid-cols-[220px_minmax(0,1fr)] sm:gap-6">
              <dt className="font-mono text-sm font-semibold text-[var(--accent)]">{tool.name}</dt>
              <dd>
                <p className="text-sm leading-6">{tool.detail}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">Data source: {tool.source}</p>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="grid gap-6 py-8 md:grid-cols-2">
        <div>
          <h2 className="text-xl font-bold">What MCP does</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            MCP is a connection standard. Your AI client starts the Offside server, sees the available tools, and can call them to retrieve structured FPL data. The AI uses those results to form its response; MCP does not provide an AI model itself.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-bold">Hosting model</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            The website is deployed on Vercel, but that does not automatically host an MCP server. A Vercel-compatible Streamable HTTP handler still needs to be implemented and deployed. The local stdio server is available now; market and fixture tools need PostgreSQL, while manager and picks tools use the public FPL API.
          </p>
        </div>
      </section>
    </main>
  );
}
