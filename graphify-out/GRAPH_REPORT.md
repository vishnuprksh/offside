# Graph Report - databricks  (2026-09-20)

## Corpus Check
- 33 files · ~14,729 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 2, .example 1, .css 1)

## Summary
- 202 nodes · 253 edges · 24 communities (14 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `67f8790d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- frontend/package.json
- dream15/page.tsx
- TypeScript Config
- app/page.tsx
- db.ts
- fpl.ts
- fpl_team_manager.py
- devDependencies
- layout.tsx
- connect_database.py
- javascript-lp-solver.d.ts
- create_table.py
- next.config.js
- next-env.d.ts
- test_static_creds.py
- fixtures/page.tsx
- offside — Vercel Frontend
- Copilot Instructions — databricks (FPL Team Manager)
- package.json
- README.md

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `fetchFplJson()` - 9 edges
3. `getPool()` - 6 edges
4. `optimizeStartingEleven()` - 6 edges
5. `offside — Vercel Frontend` - 6 edges
6. `PredictionRow` - 5 edges
7. `fetchPlayerMatchDetails()` - 5 edges
8. `optimizeDream15()` - 5 edges
9. `findBestTransferPlan()` - 5 edges
10. `react` - 5 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --calls--> `fetchFplJson()`  [EXTRACTED]
  frontend/app/api/data/route.ts → frontend/lib/fpl.ts
- `GET()` --calls--> `getPool()`  [EXTRACTED]
  frontend/app/api/fixture-matrix/route.ts → frontend/lib/db.ts
- `GET()` --calls--> `fetchPlayerMatchDetails()`  [EXTRACTED]
  frontend/app/api/fixtures/route.ts → frontend/lib/db.ts
- `GET()` --calls--> `fetchFplJson()`  [EXTRACTED]
  frontend/app/api/manager/route.ts → frontend/lib/fpl.ts
- `GET()` --calls--> `fetchFplJson()`  [EXTRACTED]
  frontend/app/api/picks/route.ts → frontend/lib/fpl.ts

## Import Cycles
- None detected.

## Communities (24 total, 6 thin omitted)

### Community 0 - "frontend/package.json"
Cohesion: 0.07
Nodes (25): fs, { Pool }, dependencies, javascript-lp-solver, next, pg, react, react-dom (+17 more)

### Community 1 - "dream15/page.tsx"
Cohesion: 0.17
Nodes (8): Dream15Page(), POS_COLORS, ROW_BG, ROW_ORDER, Dream15Result, dreamPlayers(), optimizeDream15(), SquadPlayer

### Community 2 - "TypeScript Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 3 - "app/page.tsx"
Cohesion: 0.09
Nodes (24): Bootstrap, Home(), injuryCardClass(), isLegalFplSubstitution(), Manager, MINI_CARD_TONE, Pitch(), PlayerCard() (+16 more)

### Community 4 - "db.ts"
Cohesion: 0.13
Nodes (18): GET(), dynamic, FixtureMatrixRow, GET(), dynamic, GET(), POS_COLORS, SortKey (+10 more)

### Community 5 - "fpl.ts"
Cohesion: 0.29
Nodes (7): GET(), GET(), GET(), BASE_URL, chooseGameweek(), fetchFplJson(), HEADERS

### Community 6 - "fpl_team_manager.py"
Cohesion: 0.22
Nodes (8): build_team_rows(), choose_gameweek(), fetch_fpl_json(), find_replacements(), Fetch and decode one FPL API endpoint., Find replacement candidates, optionally preferring ones that reinvest budget., Use the requested GW, otherwise current GW, then most recently finished GW., Join pick records to readable player, club, and position information.

### Community 7 - "devDependencies"
Cohesion: 0.25
Nodes (8): devDependencies, autoprefixer, postcss, tailwindcss, @types/node, @types/pg, @types/react, typescript

### Community 8 - "layout.tsx"
Cohesion: 0.40
Nodes (3): metadata, SiteHeader(), next

### Community 9 - "connect_database.py"
Cohesion: 0.50
Nodes (4): main(), Check connectivity to a PostgreSQL-compatible database., Return a connection URL with credentials and sensitive query values hidden., redact_url()

### Community 19 - "fixtures/page.tsx"
Cohesion: 0.43
Nodes (6): FixtureRow, FixturesPage(), fmtKickoff(), grayColor(), probColor(), react

### Community 20 - "offside — Vercel Frontend"
Cohesion: 0.29
Nodes (6): API routes, Deploy to Vercel, Env vars, offside — Vercel Frontend, Pages, Setup (local dev)

### Community 21 - "Copilot Instructions — databricks (FPL Team Manager)"
Cohesion: 0.50
Nodes (3): Copilot Instructions — databricks (FPL Team Manager), What This Project Is, Workflow Expectations

### Community 22 - "package.json"
Cohesion: 0.50
Nodes (3): dependencies, javascript-lp-solver, javascript-lp-solver

## Knowledge Gaps
- **81 isolated node(s):** `fs`, `{ Pool }`, `dynamic`, `FixtureMatrixRow`, `dynamic` (+76 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 120 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `fixtures/page.tsx` to `frontend/package.json`, `dream15/page.tsx`, `app/page.tsx`, `db.ts`?**
  _High betweenness centrality (0.156) - this node is a cross-community bridge._
- **Why does `pg` connect `frontend/package.json` to `db.ts`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `frontend/package.json`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **What connects `fs`, `{ Pool }`, `dynamic` to the rest of the system?**
  _81 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `frontend/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._
- **Should `TypeScript Config` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `app/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08739495798319327 - nodes in this community are weakly interconnected._