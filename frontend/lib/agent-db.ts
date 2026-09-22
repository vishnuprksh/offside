import { Pool } from "pg";

// Read-only pool for agent SQL queries
let _agentPool: Pool | undefined;

export function getAgentPool(): Pool {
  if (!_agentPool) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error("DATABASE_URL is not set");
    _agentPool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
      max: 3, // Limit connections for agent
      statement_timeout: 5000, // 5s timeout for safety
    });
  }
  return _agentPool;
}

// Schema information for the agent
export const DB_SCHEMA = {
  tables: {
    "fpl.players": {
      description: "FPL player master data with current stats",
      columns: [
        { name: "player_id", type: "integer", description: "Unique player ID" },
        { name: "web_name", type: "text", description: "Short player name (e.g., 'Haaland')" },
        { name: "first_name", type: "text", description: "First name" },
        { name: "second_name", type: "text", description: "Last name" },
        { name: "element_type", type: "integer", description: "Position: 1=GKP, 2=DEF, 3=MID, 4=FWD" },
        { name: "position", type: "text", description: "Position abbreviation (GKP/DEF/MID/FWD)" },
        { name: "price", type: "numeric", description: "Current price in £M" },
        { name: "team_id", type: "integer", description: "Team ID" },
        { name: "team_name", type: "text", description: "Full team name" },
        { name: "team_short_name", type: "text", description: "Short team name (e.g., 'MCI')" },
        { name: "status", type: "text", description: "Availability status" },
        { name: "news", type: "text", description: "Injury/news updates" },
        { name: "total_points", type: "integer", description: "Total FPL points this season" },
        { name: "form", type: "numeric", description: "Recent form score" },
        { name: "points_per_game", type: "numeric", description: "Average points per game" },
        { name: "selected_by_percent", type: "numeric", description: "Percentage of FPL managers who own this player" },
      ],
    },
    "fpl.predictions": {
      description: "ML-powered gameweek predictions for players",
      columns: [
        { name: "player_id", type: "integer", description: "Player ID (join with players.player_id)" },
        { name: "player_name", type: "text", description: "Player name" },
        { name: "position", type: "text", description: "Position (GKP/DEF/MID/FWD)" },
        { name: "price", type: "numeric", description: "Price in £M" },
        { name: "team_name", type: "text", description: "Team name" },
        { name: "gw_predictions", type: "jsonb", description: "Array of {gw: number, prob_gt_5: number} for upcoming gameweeks" },
        { name: "agg_pred_prob", type: "numeric", description: "Aggregated probability of scoring >5 points" },
      ],
    },
    "fpl.fixture_difficulties": {
      description: "Fixture difficulty ratings and match predictions",
      columns: [
        { name: "fixture_id", type: "integer", description: "Unique fixture ID" },
        { name: "event", type: "integer", description: "Gameweek number" },
        { name: "kickoff_time", type: "timestamp", description: "Match kickoff time" },
        { name: "team_h", type: "integer", description: "Home team ID" },
        { name: "team_a", type: "integer", description: "Away team ID" },
        { name: "team_h_name", type: "text", description: "Home team name" },
        { name: "team_a_name", type: "text", description: "Away team name" },
        { name: "prob_home_win", type: "numeric", description: "Probability of home win" },
        { name: "prob_draw", type: "numeric", description: "Probability of draw" },
        { name: "prob_away_win", type: "numeric", description: "Probability of away win" },
        { name: "prob_home_clean", type: "numeric", description: "Probability of home clean sheet" },
        { name: "prob_away_clean", type: "numeric", description: "Probability of away clean sheet" },
        { name: "lambda_home", type: "numeric", description: "Expected goals for home team" },
        { name: "lambda_away", type: "numeric", description: "Expected goals for away team" },
        { name: "finished", type: "boolean", description: "Whether the match is finished" },
        { name: "home_score", type: "integer", description: "Home team score (if finished)" },
        { name: "away_score", type: "integer", description: "Away team score (if finished)" },
      ],
    },
  },
  rules: [
    "ALWAYS use read-only SELECT queries - no INSERT, UPDATE, DELETE, or DROP",
    "Always limit results to reasonable numbers (use LIMIT 10-50 unless aggregating)",
    "Join fpl.players with fpl.predictions on player_id for combined analysis",
    "Position codes: 1=GKP, 2=DEF, 3=MID, 4=FWD",
    "Prices are in £M (e.g., 14.0 = £14.0M)",
    "prob_gt_5 represents probability (0-100) of scoring more than 5 points in a gameweek",
  ],
};

// Safe query execution with validation
export async function executeSafeQuery(sql: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
  const normalizedSql = sql.trim().toUpperCase();
  
  // Block dangerous operations
  const blockedPatterns = ["INSERT", "UPDATE", "DELETE", "DROP", "TRUNCATE", "ALTER", "CREATE", "GRANT", "REVOKE"];
  for (const pattern of blockedPatterns) {
    if (normalizedSql.includes(pattern)) {
      return { success: false, error: `Blocked: ${pattern} operations are not allowed` };
    }
  }
  
  // Must be SELECT only
  if (!normalizedSql.startsWith("SELECT")) {
    return { success: false, error: "Only SELECT queries are allowed" };
  }
  
  try {
    const pool = getAgentPool();
    const result = await pool.query(sql);
    return { success: true, data: result.rows };
  } catch (err: any) {
    return { success: false, error: err.message || "Query execution failed" };
  }
}

// Get schema as a string for prompting
export function getSchemaPrompt(): string {
  let prompt = "Database Schema:\n\n";
  for (const [tableName, tableInfo] of Object.entries(DB_SCHEMA.tables)) {
    prompt += `Table: ${tableName}\n`;
    prompt += `Description: ${tableInfo.description}\n`;
    prompt += "Columns:\n";
    for (const col of tableInfo.columns) {
      prompt += `  - ${col.name} (${col.type}): ${col.description}\n`;
    }
    prompt += "\n";
  }
  prompt += "Rules:\n";
  for (const rule of DB_SCHEMA.rules) {
    prompt += `- ${rule}\n`;
  }
  return prompt;
}
