# 🏆 FPL Team Manager — Offside

> **Fantasy Premier League team management with ML-powered transfer suggestions**

A full-stack application that helps you manage your Fantasy Premier League (FPL) team. Fetch your squad from the official FPL API, view gameweek stats, and get intelligent transfer recommendations powered by machine learning predictions.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue?logo=postgresql)
![Python](https://img.shields.io/badge/Python-3.10-green?logo=python)

---

## ✨ Features

### 📊 Squad Dashboard
- Enter your **FPL Team ID** → instantly fetch your squad from the official FPL API
- View manager info, gameweek points, and full squad breakdown
- Visual pitch display showing **Starting XI vs Bench**
- Gameweek performance analysis with injury cards

### 🤖 ML-Powered Transfer Suggestions
- Intelligent transfer recommendations from `fpl.predictions` table
- **Budget tracking** using real sell prices from FPL transfer history
- Enforces **3-per-club rule** automatically
- Suggests optimal alternatives when first choice isn't available
- Uses linear programming optimization (`javascript-lp-solver`)

### 🔍 Player Market Explorer
- Searchable player database with live stats
- ML predictions for upcoming fixtures
- Fixture difficulty matrix

### 🧠 Dream15 Optimizer
- Build your optimal 15-player squad within budget constraints
- Algorithm-driven team selection

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js 14)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Home Page   │  │ Players Page │  │ Fixtures API │      │
│  │  (Pitch UI)  │  │ (Search/Filter)│ │ (Matrix)     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│           │                 │                  │             │
│           └─────────────────┴──────────────────┘             │
│                              │                               │
│                    ┌─────────▼─────────┐                    │
│                    │   API Routes      │                    │
│                    │  /api/* endpoints │                    │
│                    └─────────┬─────────┘                    │
└──────────────────────────────┼──────────────────────────────┘
                               │
                               ▼
              ┌────────────────────────────────┐
              │   Databricks PostgreSQL        │
              │   ┌──────────────────────────┐ │
              │   │ fpl.players              │ │
              │   │ fpl.predictions          │ │
              │   │ fpl.fixtures             │ │
              │   └──────────────────────────┘ │
              └────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│          Research & Analysis (Python/Databricks)            │
│  ┌────────────────────┐  ┌────────────────────┐            │
│  │ fpl_team_manager.py│  │ connect_database.py│            │
│  │ (Notebook logic)   │  │ (DB connectivity)  │            │
│  └────────────────────┘  └────────────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** and npm
- **PostgreSQL** database (Databricks Postgres recommended)
- **Python 3.10+** (optional, for research notebooks)

### Frontend Setup

```bash
cd frontend
npm install

# Create .env.local
cp .env.example .env.local
# Edit .env.local with your DATABASE_URL

npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection URL | `postgresql://user:pass@host/db?sslmode=require` |

> ⚠️ **Important:** Include `sslmode=require` in your connection URL. The older OAuth JWT method expires every ~1 hour and is not used.

---

## 📁 Project Structure

```
.
├── frontend/                 # Next.js application
│   ├── app/                  # App router pages & API routes
│   │   ├── api/              # Backend endpoints
│   │   │   ├── bootstrap/    # FPL bootstrap-static
│   │   │   ├── manager/      # Team manager info
│   │   │   ├── picks/        # Squad picks + transfers
│   │   │   ├── data/         # Player predictions from DB
│   │   │   └── fixtures/     # Fixture difficulty matrix
│   │   ├── page.tsx          # Home page (pitch view)
│   │   ├── players/          # Player market explorer
│   │   └── dream15/          # Dream15 optimizer
│   ├── components/           # React components
│   ├── lib/                  # Utilities & helpers
│   │   ├── db.ts             # Database queries
│   │   ├── fpl.ts            # FPL API client
│   │   └── suggestions.ts    # Transfer suggestion logic
│   └── types/                # TypeScript definitions
│
├── research/                 # Python notebooks & scripts
│   ├── fpl_team_manager.py   # Main notebook logic
│   ├── connect_database.py   # DB connectivity utilities
│   ├── create_table.py       # Table creation scripts
│   └── test_static_creds.py  # Credential testing
│
├── graphify-out/             # Code graph analysis output
│   ├── GRAPH_REPORT.md       # Dependency analysis
│   ├── graph.html            # Interactive graph visualization
│   └── manifest.json         # Graph metadata
│
└── .github/
    └── copilot-instructions.md  # AI assistant guidelines
```

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **React** 18

### Backend & Data
- **PostgreSQL** (Databricks)
- **pg** node.js client
- **FPL Official API** integration

### ML & Optimization
- **javascript-lp-solver** for linear programming
- Custom prediction models (stored in `fpl.predictions`)

### Development
- **Graphify** for codebase visualization
- **Vercel** for deployment

---

## 🌐 Deployment

### Deploy to Vercel

```bash
npm i -g vercel
cd frontend
vercel
vercel env add DATABASE_URL
vercel --prod
```

### Production Checklist
- [ ] Set `DATABASE_URL` environment variable in Vercel
- [ ] Ensure database allows connections from Vercel IPs
- [ ] Verify SSL mode is enabled (`sslmode=require`)

---

## 📊 API Reference

### Frontend API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/bootstrap?gw=` | GET | Fetch FPL bootstrap-static, resolve gameweek |
| `/api/manager?teamId=` | GET | Get manager and team information |
| `/api/picks?teamId=&gw=` | GET | Squad picks with transfer history |
| `/api/data` | GET | Player data + predictions from PostgreSQL |
| `/api/fixtures` | GET | Fixture difficulty matrix |
| `/api/fixture-matrix` | GET | Detailed fixture analysis |

### FPL External APIs

This project consumes the official [Fantasy Premier League API](https://fantasy.premierleague.com/api):
- `bootstrap-static` — All players, teams, positions, events
- `entry/{id}` — Manager/team details
- `entry/{id}/picks` — Squad selections per gameweek
- `entry/{id}/transfers` — Transfer history

---

## 🧪 Testing

```bash
# Run the test suite
npm test

# Test database connectivity (Python)
python research/test_static_creds.py
```

---

## 📈 Code Quality

This project uses **Graphify** for codebase visualization and dependency tracking:

```bash
# Update graph after significant changes
graphify update .
```

See [`graphify-out/GRAPH_REPORT.md`](./graphify-out/GRAPH_REPORT.md) for:
- Community structure analysis
- Import cycle detection
- Node connectivity metrics
- Suggested refactoring opportunities

---

## 🤝 Contributing

1. **Understand the codebase** — Run `graphify update .` and review the graph
2. **Make changes** — Follow existing patterns in `frontend/lib/`
3. **Update graph** — Run `graphify update .` after significant changes
4. **Test locally** — Verify at `http://127.0.0.1:3000/`

### Development Guidelines
- Use TypeScript for all new code
- Keep API routes focused and single-purpose
- Validate all user inputs (team IDs, gameweeks)
- Handle FPL API errors gracefully

---

## 📝 License

MIT

---

## 🙏 Acknowledgments

- **Fantasy Premier League** for the official API
- **Next.js** team for the excellent framework
- **Databricks** for PostgreSQL hosting

---

<div align="center">

**Built with ❤️ for FPL managers everywhere**

[Report Bug](../../issues) · [Request Feature](../../issues)

</div>