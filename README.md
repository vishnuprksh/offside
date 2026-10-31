# offside — Vercel Frontend

## Objective
Document the Offside web application and its local, read-only MCP interface.

## Changelog
| # | date | details | reasoning | reference |
|---|---|---|---|---|
| 1 | 2026-10-31 | Documented the stdio MCP server, available tools, client configuration, and added SDK/runtime dependencies. | Help MCP clients launch the server locally while keeping database credentials in client-provided environment variables. | MCP MVP |

## Results/Takeaways
The website remains deployable as before; the MCP server is a separate local process launched with `npm run mcp`.

## MCP (local MVP)

Offside provides a read-only MCP server over stdio. It reuses the existing FPL API and database helpers and exposes:

- `get_manager`: public manager details for a team ID.
- `get_team_picks`: squad and transfers for a gameweek (current gameweek by default).
- `search_player_market`: filter available players by name or position, including model predictions.
- `get_player_fixtures`: the last four played and next four scheduled matches for a player.

Run `npm run mcp` from this repository to start it. Configure the MCP client to launch the command from the repository root and pass `DATABASE_URL` in the process environment. `get_manager` and `get_team_picks` use the public FPL API; the market and fixture tools require the database connection. For example, a client configuration can use:

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

Keep the database URL in a secret/environment store; do not commit it to the client configuration. This MVP is local-only and does not expose a remotely accessible MCP endpoint.

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

## Pages

| Route | Purpose |
|---|---|
| `/` | Team manager, squad stats and transfer suggestions |
| `/players` | Searchable player market with stats and predictions |

Transfer suggestion logic lives in `lib/suggestions.ts` (port of the notebook's algorithm).
