# Graph Report - offside  (2026-10-09)

## Corpus Check
- 30 files · ~15,057 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: .example 1, (none) 1, .css 1)

## Summary
- 205 nodes · 296 edges · 16 communities (11 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `66ebafce`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- app/page.tsx
- package.json
- compilerOptions
- db.ts
- suggestions.ts
- fpl.ts
- fixtures/page.tsx
- connect_database.py
- offside — Vercel Frontend
- fpl_team_manager.py
- javascript-lp-solver.d.ts
- _dbtest.js
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
- `GET()` --calls--> `fetchFplJson()`  [EXTRACTED]
  app/api/data/route.ts → lib/fpl.ts
- `GET()` --calls--> `getPool()`  [EXTRACTED]
  app/api/fixture-matrix/route.ts → lib/db.ts
- `GET()` --calls--> `fetchPlayerMatchDetails()`  [EXTRACTED]
  app/api/fixtures/route.ts → lib/db.ts
- `GET()` --calls--> `fetchFplJson()`  [EXTRACTED]
  app/api/manager/route.ts → lib/fpl.ts
- `GET()` --calls--> `fetchFplJson()`  [EXTRACTED]
  app/api/picks/route.ts → lib/fpl.ts

## Import Cycles
- None detected.

## Communities (16 total, 5 thin omitted)

### Community 0 - "app/page.tsx"
Cohesion: 0.16
Nodes (19): Bootstrap, FixturesModal(), Home(), injuryCardClass(), isLegalFplSubstitution(), Manager, MINI_CARD_TONE, MiniPlayerCard() (+11 more)

### Community 1 - "package.json"
Cohesion: 0.06
Nodes (30): dependencies, javascript-lp-solver, next, pg, react, react-dom, devDependencies, autoprefixer (+22 more)

### Community 2 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 3 - "db.ts"
Cohesion: 0.13
Nodes (20): GET(), dynamic, FixtureMatrixRow, GET(), dynamic, GET(), PlayersPage(), POS_COLORS (+12 more)

### Community 4 - "suggestions.ts"
Cohesion: 0.12
Nodes (21): Dream15Page(), DreamPitch(), DreamPlayerCard(), DreamView(), POS_COLORS, ROW_BG, ROW_ORDER, Stat() (+13 more)

### Community 5 - "fpl.ts"
Cohesion: 0.15
Nodes (12): GET(), GET(), GET(), metadata, RootLayout(), SiteHeader(), BASE_URL, chooseGameweek() (+4 more)

### Community 6 - "fixtures/page.tsx"
Cohesion: 0.43
Nodes (6): FixtureRow, FixturesPage(), fmtKickoff(), grayColor(), probColor(), react

### Community 7 - "connect_database.py"
Cohesion: 0.20
Nodes (3): main(), redact_url(), main()

### Community 8 - "offside — Vercel Frontend"
Cohesion: 0.29
Nodes (6): API routes, Deploy to Vercel, Env vars, offside — Vercel Frontend, Pages, Setup (local dev)

### Community 9 - "fpl_team_manager.py"
Cohesion: 0.14
Nodes (4): build_team_rows(), choose_gameweek(), fetch_fpl_json(), find_replacements()

### Community 11 - "_dbtest.js"
Cohesion: 0.40
Nodes (3): fs, { Pool }, pg

## Knowledge Gaps
- **8 isolated node(s):** `react-dom`, `@types/node`, `@types/pg`, `@types/react`, `autoprefixer` (+3 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 105 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `fixtures/page.tsx` to `app/page.tsx`, `package.json`, `db.ts`, `suggestions.ts`?**
  _High betweenness centrality (0.101) - this node is a cross-community bridge._
- **What connects `react-dom`, `@types/node`, `@types/pg` to the rest of the system?**
  _8 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._
- **Why does `next` connect `fpl.ts` to `package.json`, `db.ts`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `db.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13 - nodes in this community are weakly interconnected._
- **Should `suggestions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11965811965811966 - nodes in this community are weakly interconnected._

## Objective
Keep Graphify current and record the team-connection form alignment decision.

## Changelog
| # | date       | details                                                        | reasoning                                                        | reference |
|---|------------|----------------------------------------------------------------|------------------------------------------------------------------|-----------|
| 1 | 2026-10-09 | Regenerated the graph and documented centered form controls.  | The recent-ID row makes the team-ID field taller than siblings.  | PR #18 |

## Results/Takeaways
The graph reflects the current workspace source, and the form aligns related controls to the center of the team-ID input.