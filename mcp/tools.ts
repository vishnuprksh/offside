/*
## Objective
Register Offside's shared read-only FPL and database tools for MCP transports.

## Changelog
| # | date | details | reasoning | reference |
|---|---|---|---|---|
| 1 | 2026-10-31 | Extracted the four MCP tools into a reusable server factory. | Keep stdio and hosted HTTP transports on one implementation of each tool. | Vercel MCP endpoint |

## Results/Takeaways
Call `createOffsideMcpServer()` to create an MCP server with the shared Offside tools.
*/

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { fetchPlayers, fetchPlayerMatchDetails, fetchPredictions } from "../lib/db";
import { buildTeamRows, chooseGameweek, fetchFplJson } from "../lib/fpl";

export function createOffsideMcpServer() {
  const server = new McpServer({ name: "offside", version: "1.0.0" });
  const positiveId = z.number().int().positive();

  server.registerTool(
    "get_manager",
    {
      title: "Get FPL manager",
      description: "Fetch public Fantasy Premier League manager and team summary by team ID.",
      inputSchema: { teamId: positiveId },
    },
    async ({ teamId }) => {
      const manager = await fetchFplJson(`entry/${teamId}/`);
      return { content: [{ type: "text", text: JSON.stringify(manager) }] };
    }
  );

  server.registerTool(
    "get_team_picks",
    {
      title: "Get team picks",
      description: "Fetch a manager's squad, captaincy, and transfers for a gameweek. Defaults to the current gameweek.",
      inputSchema: { teamId: positiveId, gameweek: positiveId.optional() },
    },
    async ({ teamId, gameweek }) => {
      const bootstrap = await fetchFplJson("bootstrap-static/");
      const selectedGameweek = chooseGameweek(bootstrap.events, gameweek?.toString() ?? null);
      const [picksResponse, transfersResponse] = await Promise.all([
        fetchFplJson(`entry/${teamId}/event/${selectedGameweek}/picks/`),
        fetchFplJson(`entry/${teamId}/transfers/`),
      ]);
      const picks = buildTeamRows(picksResponse.picks, bootstrap.elements, bootstrap.teams, bootstrap.element_types);
      return {
        content: [{ type: "text", text: JSON.stringify({
          teamId,
          gameweek: selectedGameweek,
          picks,
          transfers: transfersResponse.transfers ?? [],
        }) }],
      };
    }
  );

  server.registerTool(
    "search_player_market",
    {
      title: "Search player market",
      description: "Search available players by name and optional position, returning current stats and model predictions.",
      inputSchema: {
        query: z.string().trim().max(100).optional(),
        position: z.enum(["GKP", "DEF", "MID", "FWD"]).optional(),
        limit: z.number().int().min(1).max(30).default(10),
      },
    },
    async ({ query, position, limit }) => {
      const [players, predictions] = await Promise.all([fetchPlayers(), fetchPredictions()]);
      const predictionById = new Map(predictions.map((prediction) => [prediction.player_id, prediction]));
      const normalizedQuery = query?.toLocaleLowerCase();
      const results = players
        .filter((player) => (player.status === "a" || player.status === "d") && (!position || player.position === position))
        .filter((player) => !normalizedQuery || `${player.web_name} ${player.first_name} ${player.second_name} ${player.team_name}`.toLocaleLowerCase().includes(normalizedQuery))
        .map((player) => ({ ...player, prediction: predictionById.get(player.player_id) ?? null }))
        .sort((a, b) => (b.prediction?.avg_pred_points ?? -1) - (a.prediction?.avg_pred_points ?? -1))
        .slice(0, limit);
      return { content: [{ type: "text", text: JSON.stringify({ players: results }) }] };
    }
  );

  server.registerTool(
    "get_player_fixtures",
    {
      title: "Get player fixtures",
      description: "Fetch the last four played matches and next four scheduled fixtures for an FPL player.",
      inputSchema: { playerId: positiveId },
    },
    async ({ playerId }) => {
      const fixtures = await fetchPlayerMatchDetails(playerId);
      return { content: [{ type: "text", text: JSON.stringify({ playerId, ...fixtures }) }] };
    }
  );

  return server;
}
