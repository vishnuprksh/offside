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
import { fetchPlayers, fetchPlayerMatchDetails, fetchPredictions, fetchFixtureDifficultyDetails, fetchFeatureImportance, fetchTrainingData } from "../lib/db";
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
  }, {
    instructions: `You are an FPL analysis assistant using Offside's read-only data tools. Help users make reasoned decisions about squads, captaincy, transfers, and player choices, but do not claim outcomes are guaranteed.

Use the tools in combination when relevant: get_manager for a team's current squad, captaincy, bank, and transfer history; get_player_profile or search_player_market for player status, statistics, and predictions; compare_players to evaluate named alternatives; get_player_fixtures or get_fixture_difficulty for upcoming opponents and fixture context; and get_training_data for detailed historical/future model features. Ask for missing identifiers or constraints (such as FPL team ID, gameweek, budget, free transfers, or risk preference) rather than inventing them. Public manager data does not authoritatively expose free transfers remaining or remaining chips; state that limitation.

Treat Offside predictions and training features as model estimates, not facts or guarantees. For timely decisions, supplement Offside results with current public information and reputable news—especially injury updates, suspensions, press conferences, likely lineups, and schedule changes. Verify that such information is current and distinguish confirmed facts from reports or uncertainty. If live public information or news cannot be checked, say so and avoid presenting stale data as current.

When recommending a move, explain the relevant evidence, assumptions, trade-offs, and uncertainty. Consider the user's stated squad, budget, transfer/chip constraints, and horizon; do not assert that a transfer is affordable or legal unless the required constraints are known. Prefer concise, actionable reasoning and say when available data is insufficient.`,
  });
  const positiveId = z.number().int().positive();

  server.registerTool(
    "get_manager",
    {
      title: "Get complete FPL manager details",
      description: "Fetch a public FPL manager entry, squad picks and captaincy for the selected gameweek, all available transfer history, bank, team value, transfers made/cost this gameweek, and chips already played. Input teamId is the numeric FPL entry/team ID (required); gameweek is an optional positive integer and defaults to the current gameweek selected by the server. Free transfers remaining and authoritative remaining-chip inventory are unavailable from the public endpoints and are returned as null with explanatory notes.",
      annotations: { readOnlyHint: true, openWorldHint: true, destructiveHint: false },
      inputSchema: {
        teamId: positiveId.describe("Required numeric FPL entry/team ID."),
        gameweek: positiveId.optional().describe("Optional gameweek number; defaults to the current gameweek selected by the server."),
      },
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
      description: "Search available or doubtful players and rank matching results by predicted points. Optional query is a case-insensitive substring of player or team name; gameweek (positive integer) switches ranking from average predicted points to that game's forecast; position is GKP, DEF, MID, or FWD; maxPrice is the maximum player price; minProbGt5 is a 0–1 probability threshold and requires gameweek; limit is 1–30 (default 10). Results without a prediction are omitted. Prices use the FPL price units returned by the database.",
      annotations: { readOnlyHint: true, openWorldHint: true, destructiveHint: false },
      inputSchema: {
        query: z.string().trim().max(100).optional().describe("Case-insensitive substring to match against player and team names."),
        gameweek: positiveId.optional().describe("Gameweek to rank by; when omitted, rank by average predicted points."),
        position: z.enum(["GKP", "DEF", "MID", "FWD"]).optional().describe("Filter by FPL position."),
        maxPrice: z.number().positive().optional().describe("Maximum FPL player price."),
        minProbGt5: z.number().min(0).max(1).optional().describe("Minimum predicted probability (0–1) of scoring more than 5 points; requires gameweek."),
        limit: z.number().int().min(1).max(30).default(10).describe("Maximum candidates to return (1–30, default 10)."),
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
      description: "Look up player records with current stats, availability/news, and model predictions. Provide playerId (positive integer) and/or query (1–100 characters, case-insensitive substring across player and team names); at least one is required. If both are supplied, both filters apply. Returns at most 10 matching players.",
      annotations: { readOnlyHint: true, openWorldHint: true, destructiveHint: false },
      inputSchema: {
        playerId: positiveId.optional().describe("Optional positive FPL player ID."),
        query: z.string().trim().min(1).max(100).optional().describe("Optional 1–100 character, case-insensitive substring of a player or team name."),
      },
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
      description: "Compare 2–5 FPL players by numeric player ID, returning each player's current stats and model predictions. IDs must be positive integers and at least two must be distinct; duplicate IDs are removed. Unknown IDs are returned with a player-not-found error entry.",
      annotations: { readOnlyHint: true, openWorldHint: true, destructiveHint: false },
      inputSchema: { playerIds: z.array(positiveId).min(2).max(5).describe("Array of 2–5 positive FPL player IDs; at least two must be distinct.") },
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
    "get_fixture_difficulty",
    {
      title: "Get fixture difficulty details",
      description: "Fetch latest-season fixture matchups with kickoff, home/draw/away win probabilities, clean sheet probabilities, expected goals, scores, and finished status. Optional teamId and gameweek are positive integers; when both are supplied, both filters apply. With neither filter, returns all fixtures in the latest season.",
      annotations: { readOnlyHint: true, openWorldHint: true, destructiveHint: false },
      inputSchema: {
        teamId: positiveId.optional().describe("Optional positive FPL team ID; matches fixtures where the team is home or away."),
        gameweek: positiveId.optional().describe("Optional positive gameweek number."),
      },
    },
    async ({ teamId, gameweek }) => {
      const { rows } = await fetchFixtureDifficultyDetails({ teamId, gameweek });
      return { content: [{ type: "text", text: JSON.stringify({ fixtures: rows }) }] };
    }
  );

  server.registerTool(
    "get_feature_importance",
    {
      title: "Fetch feature importance",
      description: "Fetch rows from the fpl.feature_importance model feature-importance table. The raw table columns are returned unchanged. limit is 1–500 (default 100); offset is a non-negative row offset (default 0) for pagination.",
      annotations: { readOnlyHint: true, openWorldHint: false, destructiveHint: false },
      inputSchema: {
        limit: z.number().int().min(1).max(500).default(100).describe("Rows per page, from 1 to 500; defaults to 100."),
        offset: z.number().int().min(0).default(0).describe("Non-negative number of matching rows to skip; defaults to 0."),
      },
    },
    async ({ limit, offset }) => {
      const rows = await fetchFeatureImportance({ limit, offset });
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ table: "fpl.feature_importance", limit, offset, returned: rows.length, rows }),
        }],
      };
    }
  );

  server.registerTool(
    "get_training_data",
    {
      title: "Fetch FPL training data",
      description: "Fetch rows from the fpl.training_data model-training dataset. Rows include player, season and gameweek identifiers; historical match outcome/stat columns; rolling and all-time feature averages; expected goals; position indicator columns; and player/team/kickoff metadata. Optional playerId and gameweek are positive integers; season is a string such as 2026/27; isFuture=true selects future fixture rows and false selects played rows. Filters combine with AND. limit is 1–500 (default 100); offset is a non-negative row offset (default 0) for pagination. Without filters, returns the first page. Results are deterministically ordered by season descending, then gameweek and player ID ascending.",
      annotations: { readOnlyHint: true, openWorldHint: false, destructiveHint: false },
      inputSchema: {
        playerId: positiveId.optional().describe("Filter by positive FPL player ID."),
        gameweek: positiveId.optional().describe("Filter by positive gameweek number."),
        season: z.string().trim().min(1).max(20).optional().describe("Filter by season label, for example 2026/27."),
        isFuture: z.boolean().optional().describe("true for future fixture rows; false for played/historical rows."),
        limit: z.number().int().min(1).max(500).default(100).describe("Rows per page, from 1 to 500; defaults to 100."),
        offset: z.number().int().min(0).default(0).describe("Non-negative number of matching rows to skip; defaults to 0."),
      },
    },
    async ({ playerId, gameweek, season, isFuture, limit, offset }) => {
      const rows = await fetchTrainingData({ playerId, gameweek, season, isFuture, limit, offset });
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ table: "fpl.training_data", filters: { playerId: playerId ?? null, gameweek: gameweek ?? null, season: season ?? null, isFuture: isFuture ?? null }, limit, offset, returned: rows.length, rows }),
        }],
      };
    }
  );

  server.registerTool(
    "get_player_fixtures",
    {
      title: "Get player fixtures",
      description: "Fetch played match history and remaining scheduled fixtures for one FPL player in the latest season, enriched with opponent/team names, fixture details, player-team win probability, expected goals, scores, and finished status. playerId is the required positive integer FPL player ID. Played-match rows include actual appearance/stat data; scheduled rows have not-yet-known player stats.",
      annotations: { readOnlyHint: true, openWorldHint: true, destructiveHint: false },
      inputSchema: { playerId: positiveId.describe("Required positive FPL player ID.") },
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
