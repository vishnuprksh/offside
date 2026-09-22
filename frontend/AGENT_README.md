# FPL Analyst Agent

A lightweight, intelligent sidebar agent for querying FPL data using natural language. Powered by OpenRouter free models and custom ReAct-style reasoning.

## Features

- **Natural Language Queries**: Ask questions about players, fixtures, and predictions in plain English
- **SQL Tool Integration**: Agent automatically generates and executes safe SQL queries against your FPL database
- **ReAct Reasoning**: Multi-step reasoning loop (Think → Act → Observe) for complex analysis
- **Transparent Process**: View the agent's reasoning steps, SQL queries, and results
- **OpenRouter Free Models**: Works with free tier models like Ling-3.0-Flash-VL, Gemma-2-9B, Llama-3-8B, Qwen-2-7B
- **Lightweight**: No heavy frameworks like LangChain - minimal bundle size with full control

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  SidebarAgent   │────▶│  /api/agent      │────▶│  agent-client   │
│  (React UI)     │◀────│  (Next.js API)   │◀────│  (Vercel AI SDK)│
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
                                                          ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  PostgreSQL DB  │◀────│  agent-db        │◀────│  agent-core     │
│  (FPL Data)     │     │  (Safe Queries)  │     │  (ReAct Loop)   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

## Setup

### 1. Install Dependencies

Already installed:
- `ai` - Vercel AI SDK
- `@ai-sdk/openai-compatible` - OpenAI-compatible provider for OpenRouter
- `zod` - Schema validation

### 2. Configure Environment Variables

Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

Then edit `.env.local` with your credentials:

```env
# Get a free API key at https://openrouter.ai/keys
OPENROUTER_API_KEY=sk-or-...

# Your FPL database connection
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Optional
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run the Development Server

```bash
npm run dev
```

Click the "Ask Agent" button in the header to open the sidebar.

## Usage Examples

### Simple Questions
```
User: Who are the top 5 midfielders by form?
Agent: [Queries database, returns formatted answer with player names, teams, form scores]
```

### Complex Analysis
```
User: Which defenders have the best fixtures in the next 3 gameweeks?
Agent: 
  Step 1: Query upcoming fixtures to find teams with favorable matchups
  Step 2: Join with players table to get defenders from those teams
  Step 3: Analyze and rank by fixture difficulty + player stats
  Final: Returns ranked list with reasoning
```

### Statistical Queries
```
User: Show me players under £7.0M with high ownership and good form
Agent: [Executes filtered query, returns actionable transfer targets]
```

## Available Free Models

The agent supports these OpenRouter free models:

| Model | ID | Best For |
|-------|-----|----------|
| Ling-3.0-Flash-VL | `inclusionai/ling-3.0-flash-vl:free` | **Default** - Fast, agent-capable, excellent for SQL & analysis |
| Gemma-2-9B | `google/gemma-2-9b-it:free` | Balanced performance, good reasoning |
| Llama-3-8B | `meta-llama/llama-3-8b-instruct:free` | Fast responses, reliable tool calls |
| Qwen-2-7B | `qwen/qwen-2-7b-instruct:free` | Compact, efficient for simple queries |

Default: Ling-3.0-Flash-VL (optimized for agent tasks and SQL operations)

## Customization

### Change Model

In `SidebarAgent.tsx`, modify the model option:

```typescript
options: {
  model: "ling" as const, // or "gemma", "llama", or "qwen"
  maxIterations: 5,
}
```

### Adjust Max Iterations

Control how many reasoning steps the agent can take:

```typescript
options: {
  maxIterations: 3, // Default is 5
}
```

### Add More Tools

Edit `lib/agent-core.ts` to add new tools:

```typescript
export const TOOLS = [
  {
    name: "your_new_tool",
    description: "What this tool does",
    parameters: { ... },
  },
  // ...existing tools
];
```

Then implement the handler in `executeTool()`.

### Customize Database Schema

Edit `lib/agent-db.ts` to add/remove tables:

```typescript
export const DB_SCHEMA = {
  tables: {
    "fpl.your_table": {
      description: "...",
      columns: [...],
    },
  },
  rules: [...],
};
```

## Security

- **Read-Only Queries**: Only SELECT statements are allowed
- **Pattern Blocking**: INSERT, UPDATE, DELETE, DROP, etc. are blocked
- **Connection Limits**: Database pool limited to 3 connections
- **Query Timeout**: 5-second timeout prevents long-running queries
- **Server-Side Execution**: All SQL runs on the backend, never exposed to client

## File Structure

```
frontend/
├── app/api/agent/
│   └── route.ts              # API endpoint
├── components/agent/
│   └── SidebarAgent.tsx      # Sidebar UI component
├── lib/
│   ├── agent-client.ts       # Vercel AI SDK integration
│   ├── agent-core.ts         # ReAct loop & tool execution
│   └── agent-db.ts           # Database schema & safe queries
└── .env.local.example        # Environment template
```

## Troubleshooting

### "OPENROUTER_API_KEY is not configured"
- Make sure you've created `.env.local` with a valid API key
- Restart the dev server after adding the key

### "DATABASE_URL is not set"
- The agent needs database access to run SQL queries
- Add your PostgreSQL connection string to `.env.local`

### Agent returns errors on SQL queries
- Check that your database has the expected tables (fpl.players, fpl.predictions, fpl.fixture_difficulties)
- Verify column names match the schema in `agent-db.ts`

### Slow responses
- Free models may have rate limits during peak times
- Try switching to a different model (Llama-3-8B is often faster)
- Reduce maxIterations for simpler queries

## License

MIT
