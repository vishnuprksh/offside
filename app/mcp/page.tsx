/*
## Objective
Explain how to connect to the Vercel-hosted MCP endpoint and the optional local server.

## Changelog
| # | date | details | reasoning | reference |
|---|---|---|---|---|
| 1 | 2026-10-31 | Added a user-facing guide for setup, supported tools, and data requirements. | Help users configure MCP clients without exposing database credentials or implying a hosted endpoint exists. | MCP MVP |
| 2 | 2026-10-31 | Reframed the guide around the intended Vercel-hosted deployment while distinguishing the working local transport from the endpoint still to be implemented. | Avoid giving users a nonfunctional hosted URL or asking them to place database credentials in their client. | Vercel hosting plan |
| 3 | 2026-10-31 | Added hosted Streamable HTTP endpoint setup and bearer-token guidance. | Provide an actionable ChatGPT connection path while retaining server-side database credentials. | Vercel MCP endpoint |
| 4 | 2026-10-31 | Clarified ChatGPT custom MCP availability and read-only tool permissions. | Set expectations for account/workspace access and the capabilities exposed by this server. | OpenAI Help Center |

## Results/Takeaways
The hosted endpoint is `/api/mcp`; it requires a Bearer token configured as `MCP_AUTH_TOKEN` in Vercel. The database URL remains server-side.
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
          Connect ChatGPT or another compatible client to Offside&apos;s read-only tools over HTTPS. The hosted MCP endpoint runs on Vercel and keeps database access on the server.
        </p>
      </header>

      <section className="grid gap-10 border-b border-[var(--border)] py-8 md:grid-cols-[minmax(0,1fr)_minmax(260px,0.7fr)]">
        <div>
          <h2 className="text-2xl font-bold">Connect ChatGPT</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            After deploying this branch to Vercel and setting the required environment variables, add <code className="text-[var(--text)]">https://YOUR-DOMAIN/api/mcp</code> as a custom MCP server in ChatGPT. Replace <code className="text-[var(--text)]">YOUR-DOMAIN</code> with the production domain assigned to this Offside deployment. A hosted connection does not require cloning this repository or running a local process. Custom MCP availability depends on your ChatGPT plan and workspace permissions; check OpenAI&apos;s current help guidance or ask your workspace admin if you do not see the option.
          </p>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Set <code className="text-[var(--text)]">MCP_AUTH_TOKEN</code> and <code className="text-[var(--text)]">DATABASE_URL</code> in Vercel Project Settings → Environment Variables, then redeploy. In ChatGPT&apos;s authentication settings, configure a Bearer token whose value matches <code className="text-[var(--text)]">MCP_AUTH_TOKEN</code>. Never put <code className="text-[var(--text)]">DATABASE_URL</code> in ChatGPT.
          </p>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Generate a strong token locally, for example with <code className="text-[var(--text)]">openssl rand -hex 32</code>. Add the result as a Vercel secret; do not paste it into source code or terminal commands that are saved in shell history.
          </p>
          <ol className="mt-5 list-inside list-decimal space-y-2 text-sm leading-6 text-[var(--muted)]">
            <li>Deploy the branch to a Vercel Preview or Production environment after setting both environment variables for that environment.</li>
            <li>In ChatGPT on the web, go to Plugins → Add custom MCP server (if this option is available for your plan and workspace).</li>
            <li>Enter a name such as Offside, the HTTPS endpoint above, and configure the matching Bearer token.</li>
            <li>Review the connection warning, create the plugin, and inspect the available read-only tools.</li>
            <li>Start a new chat, select Offside, and try: <span className="text-[var(--text)]">&quot;Look up FPL manager team 123456 and summarize their current team.&quot;</span></li>
          </ol>
          <h2 className="mt-8 text-xl font-bold">Optional: run locally</h2>
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
          <h2 className="text-lg font-bold">Server configuration</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            The endpoint is stateless Streamable HTTP at <code className="text-[var(--text)]">/api/mcp</code>. Every request must include <code className="text-[var(--text)]">Authorization: Bearer YOUR_MCP_AUTH_TOKEN</code>. Requests return 503 until <code className="text-[var(--text)]">MCP_AUTH_TOKEN</code> is configured.
          </p>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Keep the token private and rotate it if exposed. Team IDs are supplied by the client; only use IDs whose information you are authorized to access. Set both secrets for the Vercel environments where you intend to test (Preview and/or Production).
          </p>
        </aside>
      </section>

      <section className="border-b border-[var(--border)] py-8">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-2xl font-bold">Available tools</h2>
          <p className="text-sm text-[var(--muted)]">Read-only · bearer authenticated</p>
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
            The website and MCP route can deploy together on Vercel. The route uses stateless Streamable HTTP so requests do not depend on in-memory session affinity. The local stdio command remains available for development. Market and fixture tools need PostgreSQL; manager and picks tools use the public FPL API.
          </p>
        </div>
      </section>
    </main>
  );
}
