# Graph Report - frontend  (2026-09-20)

## Corpus Check
- 25 files · ~12,087 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: .example 1, (none) 1, .css 1)

## Summary
- 172 nodes · 231 edges · 17 communities (11 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `67f8790d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- app/page.tsx
- package.json
- compilerOptions
- db.ts
- dream15/page.tsx
- fpl.ts
- fixtures/page.tsx
- devDependencies
- offside — Vercel Frontend
- layout.tsx
- javascript-lp-solver.d.ts
- next.config.js
- next-env.d.ts
- dependencies

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

## Communities (17 total, 3 thin omitted)

### Community 0 - "app/page.tsx"
Cohesion: 0.09
Nodes (23): Bootstrap, Home(), injuryCardClass(), isLegalFplSubstitution(), Manager, MINI_CARD_TONE, Pitch(), PlayerCard() (+15 more)

### Community 1 - "package.json"
Cohesion: 0.10
Nodes (19): fs, { Pool }, name, private, scripts, build, dev, start (+11 more)

### Community 2 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 3 - "db.ts"
Cohesion: 0.13
Nodes (18): GET(), dynamic, FixtureMatrixRow, GET(), dynamic, GET(), POS_COLORS, SortKey (+10 more)

### Community 4 - "dream15/page.tsx"
Cohesion: 0.17
Nodes (8): Dream15Page(), POS_COLORS, ROW_BG, ROW_ORDER, Dream15Result, dreamPlayers(), optimizeDream15(), SquadPlayer

### Community 5 - "fpl.ts"
Cohesion: 0.26
Nodes (8): GET(), GET(), GET(), BASE_URL, chooseGameweek(), fetchFplJson(), HEADERS, TeamRow

### Community 6 - "fixtures/page.tsx"
Cohesion: 0.43
Nodes (6): FixtureRow, FixturesPage(), fmtKickoff(), grayColor(), probColor(), react

### Community 7 - "devDependencies"
Cohesion: 0.25
Nodes (8): devDependencies, autoprefixer, postcss, tailwindcss, @types/node, @types/pg, @types/react, typescript

### Community 8 - "offside — Vercel Frontend"
Cohesion: 0.29
Nodes (6): API routes, Deploy to Vercel, Env vars, offside — Vercel Frontend, Pages, Setup (local dev)

### Community 9 - "layout.tsx"
Cohesion: 0.40
Nodes (3): metadata, SiteHeader(), next

### Community 16 - "dependencies"
Cohesion: 0.33
Nodes (6): dependencies, javascript-lp-solver, next, pg, react, react-dom

## Knowledge Gaps
- **75 isolated node(s):** `fs`, `{ Pool }`, `dynamic`, `FixtureMatrixRow`, `dynamic` (+70 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 101 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `fixtures/page.tsx` to `app/page.tsx`, `package.json`, `db.ts`, `dream15/page.tsx`?**
  _High betweenness centrality (0.166) - this node is a cross-community bridge._
- **Why does `pg` connect `package.json` to `db.ts`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **What connects `fs`, `{ Pool }`, `dynamic` to the rest of the system?**
  _75 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `app/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08912655971479501 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._