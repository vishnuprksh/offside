# offside — Vercel Frontend

## Objective
Document the Offside web application and its local and Vercel-hosted MCP interfaces.

## Changelog
| # | date | details | reasoning | reference |
|---|---|---|---|---|
| 1 | 2026-10-31 | Documented the stdio MCP server, available tools, client configuration, and added SDK/runtime dependencies. | Help MCP clients launch the server locally while keeping database credentials in client-provided environment variables. | MCP MVP |
| 2 | 2026-10-31 | Added stateless Streamable HTTP endpoint at `/api/mcp` with Bearer authentication. | Support remote MCP clients such as ChatGPT while keeping credentials and database access on the server. | Vercel MCP endpoint |
| 3 | 2026-10-31 | Added Vercel deployment and ChatGPT testing steps. | Make the hosted MCP connection testable without exposing server-side database credentials. | MCP guide |
| 4 | 2026-10-31 | Clarified ChatGPT custom MCP plan and workspace availability. | Prevent setup instructions from implying that every account can add custom MCP servers. | OpenAI Help Center |

## Results/Takeaways
The MCP tools can run locally over stdio or remotely through the authenticated `/api/mcp` route on Vercel.

## MCP

Offside provides a read-only MCP server over stdio. It reuses the existing FPL API and database helpers and exposes:

- `get_manager`: public manager details for a team ID.
- `get_team_picks`: squad and transfers for a gameweek (current gameweek by default).
- `search_player_market`: filter available players by name or position, including model predictions.
- `get_player_fixtures`: the last four played and next four scheduled matches for a player.

For local development, run `npm run mcp` and configure the client to launch it from the repository root. The local process needs `DATABASE_URL` for database-backed tools.

For Vercel hosting, configure `DATABASE_URL` and a strong random `MCP_AUTH_TOKEN` in the Vercel project's environment variables, for the Preview and/or Production environment, then deploy. ChatGPT custom MCP access depends on plan and workspace permissions; check the current OpenAI Help Center guidance and ask your workspace admin if the option is unavailable. When permitted, open ChatGPT on the web, go to **Plugins → Add custom MCP server**, enter `https://<deployment-domain>/api/mcp`, configure Bearer authentication with the value of `MCP_AUTH_TOKEN`, review the risk warning, create the plugin, and review the discovered tools. Then select the Offside plugin in a new chat and test a manager lookup or market search. These Offside tools are read-only. Do not put either secret in the MCP URL or commit them to client configuration. The endpoint is stateless Streamable HTTP; requests without a valid token are rejected. `get_manager` and `get_team_picks` use the public FPL API; market and fixture tools require `DATABASE_URL`.

The remote MCP route can also be tested with MCP Inspector against `https://<deployment-domain>/api/mcp`, supplying the Bearer token in its authentication settings. The local stdio client configuration remains:

```json
{
	"mcpServers": {
		"offside": {
			"command": "npm",
			"args": ["run", "mcp"],
			"cwd": "/absolute/path/to/offside",
			"env": {
				"DATABASE_URL": "${DATABASE_URL}"
			}
		}
	}
}
```

Keep both values in Vercel's secret environment settings. The shared tool implementations are in `mcp/tools.ts` and are used by both transports.

Next.js frontend replicating `fpl_team_manager(1).py`:

- Enter your FPL Team ID (+ optional gameweek) → fetches your squad from the official FPL API
- Shows manager info, gameweek stats, squad table, starting XI vs bench
- ML-powered transfer suggestions from the `fpl.predictions` table (Databricks Postgres), with budget tracking (sell prices from FPL transfer history), 3-per-club limits and alternatives

## Setup (local dev)

```bash
cd fpl-frontend
npm install
# create .env.local (never commit):
#   DATABASE_URL=postgresql://user:password@host/databricks_postgres?sslmode=require
npm run dev
```

## Deploy to Vercel

```bash
npm i -g vercel
vercel
vercel env add DATABASE_URL
vercel --prod
```

## Env vars

| Name | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection URL for Databricks Postgres |

> Note: include `sslmode=require` in the URL. The older `DATABASE_PASSWORD` OAuth JWT from `.env` expires every ~1h and is NOT used here.

## API routes

| Route | Purpose |
|---|---|
| `GET /api/bootstrap?gw=` | FPL bootstrap-static, resolves gameweek |
| `GET /api/manager?teamId=` | Manager/team info |
| `GET /api/picks?teamId=&gw=` | Squad picks + transfer history |
| `GET /api/data` | `fpl.players` + `fpl.predictions` from Postgres |
| `POST /api/mcp` | Bearer-authenticated Streamable HTTP MCP endpoint (also handles MCP GET/DELETE) |

## Pages

| Route | Purpose |
|---|---|
| `/` | Team manager, squad stats and transfer suggestions |
| `/players` | Searchable player market with stats and predictions |

Transfer suggestion logic lives in `lib/suggestions.ts` (port of the notebook's algorithm).
