# Graph Report - offside  (2026-10-09)

## Corpus Check
- 30 files · ~15,875 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: .example 1, (none) 1, .css 1)

## Summary
- 206 nodes · 297 edges · 15 communities (10 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b1fd6922`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- app/page.tsx
- package.json
- compilerOptions
- db.ts
- devDependencies
- fpl.ts
- fixtures/page.tsx
- connect_database.py
- offside — Vercel Frontend
- fpl_team_manager.py
- javascript-lp-solver.d.ts
- next.config.js

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `Home()` - 10 edges
3. `next` - 10 edges
4. `fetchFplJson()` - 9 edges
5. `getPool()` - 6 edges
6. `optimizeStartingEleven()` - 6 edges
7. `offside — Vercel Frontend` - 6 edges
8. `DreamView()` - 5 edges
9. `PredictionRow` - 5 edges
10. `fetchPlayerMatchDetails()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --calls--> `getPool()`  [EXTRACTED]
  app/api/fixture-matrix/route.ts → lib/db.ts
- `GET()` --calls--> `fetchPlayerMatchDetails()`  [EXTRACTED]
  app/api/fixtures/route.ts → lib/db.ts
- `GET()` --calls--> `fetchFplJson()`  [EXTRACTED]
  app/api/manager/route.ts → lib/fpl.ts
- `GET()` --calls--> `fetchFplJson()`  [EXTRACTED]
  app/api/picks/route.ts → lib/fpl.ts
- `GET()` --calls--> `chooseGameweek()`  [EXTRACTED]
  app/api/bootstrap/route.ts → lib/fpl.ts

## Import Cycles
- None detected.

## Communities (15 total, 5 thin omitted)

### Community 0 - "app/page.tsx"
Cohesion: 0.08
Nodes (35): Dream15Page(), Bootstrap, FixturesModal(), Home(), injuryCardClass(), isLegalFplSubstitution(), Manager, ManagerTeamRow (+27 more)

### Community 1 - "package.json"
Cohesion: 0.07
Nodes (25): fs, { Pool }, dependencies, javascript-lp-solver, next, pg, react, react-dom (+17 more)

### Community 2 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 3 - "db.ts"
Cohesion: 0.11
Nodes (24): dynamic, FixtureMatrixRow, GET(), dynamic, GET(), DreamPitch(), DreamPlayerCard(), DreamView() (+16 more)

### Community 4 - "devDependencies"
Cohesion: 0.25
Nodes (8): devDependencies, autoprefixer, postcss, tailwindcss, @types/node, @types/pg, @types/react, typescript

### Community 5 - "fpl.ts"
Cohesion: 0.13
Nodes (15): GET(), GET(), GET(), GET(), metadata, RootLayout(), SiteHeader(), fetchPlayers() (+7 more)

### Community 6 - "fixtures/page.tsx"
Cohesion: 0.53
Nodes (5): FixtureRow, FixturesPage(), fmtKickoff(), grayColor(), probColor()

### Community 7 - "connect_database.py"
Cohesion: 0.20
Nodes (3): main(), redact_url(), main()

### Community 8 - "offside — Vercel Frontend"
Cohesion: 0.29
Nodes (6): API routes, Deploy to Vercel, Env vars, offside — Vercel Frontend, Pages, Setup (local dev)

### Community 9 - "fpl_team_manager.py"
Cohesion: 0.14
Nodes (4): build_team_rows(), choose_gameweek(), fetch_fpl_json(), find_replacements()

## Knowledge Gaps
- **8 isolated node(s):** `react-dom`, `@types/node`, `@types/pg`, `@types/react`, `autoprefixer` (+3 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 106 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `db.ts` to `app/page.tsx`, `package.json`, `fixtures/page.tsx`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._
- **What connects `react-dom`, `@types/node`, `@types/pg` to the rest of the system?**
  _8 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `app/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08292682926829269 - nodes in this community are weakly interconnected._
- **Why does `next` connect `fpl.ts` to `package.json`, `db.ts`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.07142857142857142 - nodes in this community are weakly interconnected._
- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._