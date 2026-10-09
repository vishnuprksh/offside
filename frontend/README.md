# offside — Vercel Frontend

Next.js frontend replicating `fpl_team_manager(1).py`:

- Enter your FPL Team ID (+ optional gameweek) → fetches your squad from the official FPL API
- Shows manager info, gameweek stats, squad table, starting XI vs bench
- ML-powered transfer suggestions from the `fpl.predictions` table (Databricks Postgres), with budget tracking (sell prices from FPL transfer history), 3-per-club limits and alternatives

## Setup (local dev)

```bash
cd frontend
npm install
# Create .env.local (never commit) with:
# DATABASE_URL=postgresql://user:password@host/databricks_postgres?sslmode=require
npm run dev
```

Next.js loads `.env.local` automatically when the dev server starts. Restart the server after changing the file.

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

## Objective
Document the correct local database URL setup and make the missing-variable error actionable.

## changelog table
| # | Date | Details | Reasoning | Reference |
|---|---|---|---|---|
| 1 | 2026-10-09 | Corrected local directory and clarified `.env.local` loading/restart behavior. | Align setup instructions with the actual Next.js workspace and environment loading. | `frontend/lib/db.ts` |

## Results/Takeaways
Set `DATABASE_URL` in `frontend/.env.local`; Next.js loads it at startup. Do not commit credentials.
