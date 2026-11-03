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

const mcpWebsiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");

export function createOffsideMcpServer() {
  const server = new McpServer({
    name: "offside",
    title: "Offside",
    version: "1.0.0",
    description: "Fantasy Premier League insights, player predictions, and fixture data.",
    ...(mcpWebsiteUrl ? {
      websiteUrl: mcpWebsiteUrl,
      icons: [{ src: `${mcpWebsiteUrl}/offside-mcp-icon.svg`, mimeType: "image/svg+xml", sizes: ["any"] }],
    } : {}),
  });
  const positiveId = z.number().int().positive();

  server.registerTool(
    "get_manager",
    {
      title: "Get complete FPL manager details",
      description: "Fetch public manager details, the gameweek squad, captaincy, transfer history, bank and team value from public FPL endpoints. Chip usage and remaining free transfers are not exposed by these public endpoints.",
      annotations: { readOnlyHint: true, openWorldHint: true, destructiveHint: false },
      inputSchema: { teamId: positiveId, gameweek: positiveId.optional() },
    },
    async ({ teamId, gameweek }) => {
      const bootstrap = await fetchFplJson("bootstrap-static/");
      const selectedGameweek = chooseGameweek(bootstrap.events, gameweek?.toString() ?? null);
      const [manager, picksResponse, transfersResponse, history] = await Promise.all([
        fetchFplJson(`entry/${teamId}/`),
        fetchFplJson(`entry/${teamId}/event/${selectedGameweek}/picks/`),
        fetchFplJson(`entry/${teamId}/transfers/`),
        fetchFplJson(`entry/${teamId}/history/`),
      ]);
      const picks = buildTeamRows(picksResponse.picks, bootstrap.elements, bootstrap.teams, bootstrap.element_types);
      const entryHistory = picksResponse.entry_history ?? null;
      return {
        content: [{ type: "text", text: JSON.stringify({
          teamId,
          manager,
          gameweek: selectedGameweek,
          account: entryHistory ? {
            bank: entryHistory.bank / 10,
            teamValue: entryHistory.value / 10,
            transfersMadeThisGameweek: entryHistory.event_transfers,
            transferCostThisGameweek: entryHistory.event_transfers_cost,
          } : null,
          freeTransfersLeft: null,
          freeTransfersNote: "Not available from the public FPL endpoints used here; no estimate is provided.",
          chips: {
            played: history.chips ?? [],
            remaining: null,
            remainingNote: "The public entry history lists chips already played, but does not provide an authoritative remaining-chip inventory.",
          },
          picks,
          transfers: transfersResponse.transfers ?? [],
        }) }],
      };
    }
  );

  server.registerTool(
    "search_player_market",
    {
      title: "Search and rank player market",
      description: "Search available or doubtful players by name, position, and maximum price, then rank by average predicted points or a specified gameweek's predicted points. Optionally require a minimum probability of scoring more than 5 points (gameweek required).",
      annotations: { readOnlyHint: true, openWorldHint: true, destructiveHint: false },
      inputSchema: {
        query: z.string().trim().max(100).optional(),
        gameweek: positiveId.optional(),
        position: z.enum(["GKP", "DEF", "MID", "FWD"]).optional(),
        maxPrice: z.number().positive().optional(),
        minProbGt5: z.number().min(0).max(1).optional(),
        limit: z.number().int().min(1).max(30).default(10),
      },
    },
    async ({ query, gameweek, position, maxPrice, minProbGt5, limit }) => {
      if (minProbGt5 != null && gameweek == null) {
        throw new Error("gameweek is required when filtering by minProbGt5.");
      }
      const [players, predictions] = await Promise.all([fetchPlayers(), fetchPredictions()]);
      const predictionById = new Map(predictions.map((prediction) => [prediction.player_id, prediction]));
      const normalizedQuery = query?.toLocaleLowerCase();
      const results = players
        .filter((player) => (player.status === "a" || player.status === "d") && (!position || player.position === position))
        .filter((player) => maxPrice == null || player.price <= maxPrice)
        .filter((player) => !normalizedQuery || `${player.web_name} ${player.first_name} ${player.second_name} ${player.team_name}`.toLocaleLowerCase().includes(normalizedQuery))
        .map((player) => {
          const prediction = predictionById.get(player.player_id) ?? null;
          const forecast = gameweek == null ? null : prediction?.gw_predictions.find((item) => item.gw === gameweek) ?? null;
          return {
            player,
            prediction,
            forecast,
            predictedPoints: gameweek == null ? prediction?.avg_pred_points ?? null : forecast?.pred_points ?? null,
            probabilityGt5: forecast?.prob_gt_5 ?? null,
          };
        })
        .filter((candidate) => candidate.predictedPoints != null)
        .filter((candidate) => minProbGt5 == null || (candidate.probabilityGt5 != null && candidate.probabilityGt5 >= minProbGt5))
        .sort((a, b) => (b.predictedPoints ?? -1) - (a.predictedPoints ?? -1))
        .slice(0, limit);
      return { content: [{ type: "text", text: JSON.stringify({ gameweek: gameweek ?? null, ranking: gameweek == null ? "average_predicted_points" : "gameweek_predicted_points", candidates: results }) }] };
    }
  );

  server.registerTool(
    "get_player_profile",
    {
      title: "Get player profile",
      description: "Look up a player by FPL player ID or name and return current stats, availability/news, and model predictions.",
      annotations: { readOnlyHint: true, openWorldHint: true, destructiveHint: false },
      inputSchema: { playerId: positiveId.optional(), query: z.string().trim().min(1).max(100).optional() },
    },
    async ({ playerId, query }) => {
      if (playerId == null && !query) throw new Error("Provide playerId or query.");
      const [players, predictions] = await Promise.all([fetchPlayers(), fetchPredictions()]);
      const normalizedQuery = query?.toLocaleLowerCase();
      const predictionById = new Map(predictions.map((prediction) => [prediction.player_id, prediction]));
      const results = players
        .filter((player) => playerId == null || player.player_id === playerId)
        .filter((player) => !normalizedQuery || `${player.web_name} ${player.first_name} ${player.second_name} ${player.team_name}`.toLocaleLowerCase().includes(normalizedQuery))
        .slice(0, 10)
        .map((player) => ({ ...player, prediction: predictionById.get(player.player_id) ?? null }));
      return { content: [{ type: "text", text: JSON.stringify({ players: results }) }] };
    }
  );

  server.registerTool(
    "compare_players",
    {
      title: "Compare players",
      description: "Compare two to five FPL players by ID across current stats and model predictions.",
      annotations: { readOnlyHint: true, openWorldHint: true, destructiveHint: false },
      inputSchema: { playerIds: z.array(positiveId).min(2).max(5) },
    },
    async ({ playerIds }) => {
      const uniquePlayerIds = [...new Set(playerIds)];
      if (uniquePlayerIds.length < 2) throw new Error("Provide at least two distinct player IDs.");
      const [players, predictions] = await Promise.all([fetchPlayers(), fetchPredictions()]);
      const playerById = new Map(players.map((player) => [player.player_id, player]));
      const predictionById = new Map(predictions.map((prediction) => [prediction.player_id, prediction]));
      const results = uniquePlayerIds.map((playerId) => {
        const player = playerById.get(playerId);
        return player ? { ...player, prediction: predictionById.get(playerId) ?? null } : { playerId, error: "Player not found" };
      });
      return { content: [{ type: "text", text: JSON.stringify({ players: results }) }] };
    }
  );

  server.registerTool(
    "get_player_fixtures",
    {
      title: "Get player fixtures",
      description: "Fetch all played matches and all remaining scheduled fixtures for an FPL player in the latest season, with fixture details and win probabilities.",
      annotations: { readOnlyHint: true, openWorldHint: true, destructiveHint: false },
      inputSchema: { playerId: positiveId },
    },
    async ({ playerId }) => {
      const { last4, next4 } = await fetchPlayerMatchDetails(playerId);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ playerId, playedMatches: last4, scheduledFixtures: next4 }),
        }],
      };
    }
  );

  return server;
}
