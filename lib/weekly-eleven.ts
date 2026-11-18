import solver from "javascript-lp-solver";
import type { PredictionRow } from "./db";

// Same policy as offside-backend exp_039 select_best_xi:
// £85m XI, 1 GKP, 3-5 DEF, 2-5 MID, 1-3 FWD, max 3 per club.
// Optimize the raw XI sum, then double its highest-predicted captain.
export function selectWeeklyEleven(predictions: PredictionRow[], gameweek: number) {
  const candidates = predictions.flatMap((prediction) => {
    const points = prediction.gw_predictions.find((forecast) => forecast.gw === gameweek)?.pred_points;
    if (points == null || !Number.isFinite(points) || !Number.isFinite(prediction.price) || prediction.price <= 0 || !["GKP", "DEF", "MID", "FWD"].includes(prediction.position) || !prediction.team_name) return [];
    return [{ ...prediction, pred_points: points }];
  }).sort((a, b) => a.player_id - b.player_id);
  if (new Set(candidates.map((player) => player.player_id)).size !== candidates.length) throw new Error("Duplicate player IDs in predictions");
  if (candidates.length < 11) return null;
  const constraints: Record<string, { equal?: number; min?: number; max?: number }> = {
    xi: { equal: 11 }, price: { max: 850 }, GKP: { equal: 1 },
    DEF: { min: 3, max: 5 }, MID: { min: 2, max: 5 }, FWD: { min: 1, max: 3 },
  };
  const clubs = new Map([...new Set(candidates.map((p) => p.team_name))].map((club, i) => [club, `club${i}`]));
  for (const club of clubs.values()) constraints[club] = { max: 3 };
  const variables: Record<string, Record<string, number>> = {};
  candidates.forEach((player, i) => {
    constraints[`unique${i}`] = { max: 1 };
    variables[`p${i}`] = { score: player.pred_points, xi: 1, price: Math.round(player.price * 10), [player.position]: 1, [clubs.get(player.team_name)!]: 1, [`unique${i}`]: 1 };
  });
  const solution = solver.Solve({ optimize: "score", opType: "max", constraints, variables, ints: Object.fromEntries(Object.keys(variables).map((key) => [key, 1])) } as never) as Record<string, unknown>;
  if (!solution.feasible) return null;
  const selected = candidates.filter((_, i) => Number(solution[`p${i}`]) > 0.5);
  if (selected.length !== 11) return null;
  const captain = [...selected].sort((a, b) => b.pred_points - a.pred_points || a.player_id - b.player_id)[0];
  const positionOrder = ["GKP", "DEF", "MID", "FWD"];
  const squad = selected.sort((a, b) => positionOrder.indexOf(a.position) - positionOrder.indexOf(b.position) || b.pred_points - a.pred_points || a.player_id - b.player_id).map((player) => ({
    player_id: player.player_id, player_name: player.player_name, position: player.position,
    team_name: player.team_name, price: player.price, pred_points: player.pred_points,
    is_captain: player.player_id === captain.player_id, actual_points: null,
  }));
  return {
    gameweek, formation: ["DEF", "MID", "FWD"].map((position) => squad.filter((p) => p.position === position).length).join("-"),
    squad_cost: Number(squad.reduce((sum, p) => sum + p.price, 0).toFixed(1)),
    predicted_total: Number((squad.reduce((sum, p) => sum + p.pred_points, 0) + captain.pred_points).toFixed(2)),
    actual_total: null, average_total: null, vs_average: null, status: "upcoming", source: "predictions", model_source: "Live weekly predictions", squad,
  };
}

export function combineWeeklySelections(saved: Record<string, unknown>[], predictions: PredictionRow[], season: string, completedWeeks: number[] = []) {
  const rows = saved.filter((row) => row.season === season);
  const existing = new Set(rows.map((row) => Number(row.gameweek)));
  const completed = new Set(completedWeeks);
  const weeks = [...new Set(predictions.flatMap((prediction) => prediction.gw_predictions.map((forecast) => forecast.gw)))].filter((gw) => Number.isInteger(gw) && gw >= 1 && gw <= 38 && !existing.has(gw) && !completed.has(gw)).sort((a, b) => a - b);
  const unavailable: number[] = [];
  for (const gameweek of weeks) {
    const selection = selectWeeklyEleven(predictions, gameweek);
    if (selection) rows.push({ ...selection, season });
    else unavailable.push(gameweek);
  }
  return { rows: rows.sort((a, b) => Number(b.gameweek) - Number(a.gameweek)), unavailable_gameweeks: unavailable };
}