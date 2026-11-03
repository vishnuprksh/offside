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
| 5 | 2026-10-31 | Removed hosted MCP Bearer authentication and documented public access. | Simplify remote client setup while making the unauthenticated endpoint exposure explicit. | User request |

## Results/Takeaways
The MCP tools can run locally over stdio or remotely through the public `/api/mcp` route on Vercel.

## MCP

Offside provides a read-only MCP server over stdio. It reuses the existing FPL API and database helpers and exposes:

- `get_manager`: requires numeric `teamId`; optional positive-integer `gameweek` defaults to the current gameweek selected by the server. Returns public manager details, squad/captaincy, bank, team value, transfer history, transfers made/cost for that gameweek, and chips already played. Remaining free transfers and authoritative remaining chips are unavailable from public endpoints.
- `search_player_market`: optional `query` (case-insensitive player/team-name substring), `gameweek` (uses that game's forecast instead of average prediction), `position` (`GKP`, `DEF`, `MID`, `FWD`), `maxPrice`, `minProbGt5` (0–1; requires gameweek), and `limit` (1–30, default 10). Searches available or doubtful players and ranks by predicted points.
- `get_player_profile`: provide `playerId` and/or `query` (1–100 character case-insensitive substring); at least one is required, and both filters combine if supplied. Returns up to 10 matching player records with current stats, availability/news, and model predictions.
- `compare_players`: `playerIds` must contain 2–5 positive player IDs and at least two distinct IDs. Returns current stats and model predictions; unknown IDs receive an error entry.
- `get_player_fixtures`: requires positive integer `playerId`. Returns that player's played match history and remaining scheduled fixtures for the latest season, including opponent/team details, stats where available, and fixture probabilities.
- `get_fixture_difficulty`: optional positive-integer `teamId` and `gameweek` filters; both apply together when supplied. Returns latest-season matchups, kickoff, win probabilities, expected goals, scores, and finished status.
- `get_training_data`: optional `playerId`, `gameweek`, `season` (for example `2026/27`), and `isFuture` filters; filters combine with AND. Returns training features and outcome data from `fpl.training_data` in pages of 100 by default (maximum 500), with non-negative `offset` for pagination. Includes historical/future player-gameweek rows, rolling/all-time averages, expected goals, position flags, and team/kickoff metadata.

For local development, run `npm run mcp` and configure the client to launch it from the repository root. The local process needs `DATABASE_URL` for database-backed tools.

For Vercel hosting, configure `DATABASE_URL` in the Vercel project's environment variables if you want database-backed tools, then deploy. ChatGPT custom MCP access depends on plan and workspace permissions; check the current OpenAI Help Center guidance and ask your workspace admin if the option is unavailable. When permitted, open ChatGPT on the web, go to **Plugins → Add custom MCP server**, enter `https://<deployment-domain>/api/mcp`. No authentication is required. Review the risk warning, create the plugin, and review the discovered tools. Then select the Offside plugin in a new chat and test a manager lookup or market search. These Offside tools are read-only. Do not expose or commit `DATABASE_URL`. The endpoint is public and stateless Streamable HTTP; anyone who knows its URL can call the read-only tools and trigger FPL/database requests. `get_manager` uses public FPL endpoints; market and fixture tools require `DATABASE_URL`.

The remote MCP route can also be tested with MCP Inspector against `https://<deployment-domain>/api/mcp`, without configuring authentication. The local stdio client configuration remains:

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

Keep `DATABASE_URL` in Vercel's secret environment settings. The shared tool implementations are in `mcp/tools.ts` and are used by both transports.

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
| `POST /api/mcp` | public, unauthenticated Streamable HTTP MCP endpoint (also handles MCP GET/DELETE) |

## Pages

| Route | Purpose |
|---|---|
| `/` | Team manager, squad stats and transfer suggestions |
| `/players` | Searchable player market with stats and predictions |

Transfer suggestion logic lives in `lib/suggestions.ts` (port of the notebook's algorithm).
