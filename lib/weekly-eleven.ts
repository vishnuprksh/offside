import solver from "javascript-lp-solver";
import type { PredictionRow } from "./db";

// Same policy as offside-backend 02b squad-15 selection (notebook changelog #81):
// pick a 15-player squad - exactly 2 GKP / 5 DEF / 5 MID / 3 FWD, total price
// <= 100.0, at most 3 per club - maximizing the SUM of predicted points over
// all 15. The starting XI is chosen afterward, within the 15: the legal
// formation maximizing the RAW XI sum (no captain doubling in the
// optimization). Captain = highest-predicted starter, picked last; displayed
// totals = starting XI points + the captain's points again. Bench: the reserve
// goalkeeper held separately (bench_rank 0), then the 3 remaining outfield
// players ordered by predicted points (bench_rank 1-3).
// A tiny player_id-ordered objective perturbation makes both MILP optima
// unique, so this picker and the Python selector choose identical squads on
// the same candidate pool. Budget corrected to 100.0 (full 15) on 2026-11-19
// per the user's explicit correction; the saved production squads cost 95-100.
const FORMATIONS: Array<[number, number, number]> = [
  [3, 4, 3], [3, 5, 2], [4, 4, 2], [4, 3, 3],
  [5, 4, 1], [5, 3, 2], [4, 5, 1], [5, 2, 3],
];
const COMPOSITION: Record<string, number> = { GKP: 2, DEF: 5, MID: 5, FWD: 3 };
const MAX_PER_CLUB = 3;
const POSITION_ORDER = ["GKP", "DEF", "MID", "FWD"];

type Candidate = PredictionRow & { pred_points: number };

function solveMilp(candidates: Candidate[], positionCounts: Record<string, number>) {
  // Mirrors scipy.optimize.milp: exact position equalities, price and club
  // upper bounds, binary variables, maximize pred_points + tie-break.
  const n = candidates.length;
  const constraints: Record<string, { equal?: number; max?: number }> = { price: { max: 1000 } };
  for (const [position, count] of Object.entries(positionCounts)) constraints[position] = { equal: count };
  const clubs = new Map([...new Set(candidates.map((p) => p.team_name))].map((club, i) => [club, `club${i}`]));
  for (const club of clubs.values()) constraints[club] = { max: MAX_PER_CLUB };
  const variables: Record<string, Record<string, number>> = {};
  candidates.forEach((player, i) => {
    constraints[`unique${i}`] = { max: 1 };
    variables[`p${i}`] = {
      score: player.pred_points + (n - i) * 1e-6,
      price: Math.round(player.price * 10),
      [player.position]: 1,
      [clubs.get(player.team_name)!]: 1,
      [`unique${i}`]: 1,
    };
  });
  const solution = solver.Solve({ optimize: "score", opType: "max", constraints, variables, ints: Object.fromEntries(Object.keys(variables).map((key) => [key, 1])) } as never) as Record<string, unknown>;
  if (!solution.feasible) return null;
  const selected = candidates.filter((_, i) => Number(solution[`p${i}`]) > 0.5);
  return selected;
}

export function selectWeeklySquad15(predictions: PredictionRow[], gameweek: number) {
  const candidates = predictions.flatMap((prediction) => {
    const points = prediction.gw_predictions.find((forecast) => forecast.gw === gameweek)?.pred_points;
    if (points == null || !Number.isFinite(points) || !Number.isFinite(prediction.price) || prediction.price <= 0 || !["GKP", "DEF", "MID", "FWD"].includes(prediction.position) || !prediction.team_name) return [];
    return [{ ...prediction, pred_points: points }];
  }).sort((a, b) => a.player_id - b.player_id);
  if (new Set(candidates.map((player) => player.player_id)).size !== candidates.length) throw new Error("Duplicate player IDs in predictions");
  if (candidates.length < 15) return null;
  for (const [position, count] of Object.entries(COMPOSITION)) {
    if (candidates.filter((player) => player.position === position).length < count) return null;
  }

  // 1) The 15: maximize the total predicted points of the whole squad.
  const squadPool = solveMilp(candidates, COMPOSITION);
  if (!squadPool || squadPool.length !== 15) return null;
  const squad = [...squadPool].sort((a, b) => a.player_id - b.player_id);

  // 2) The XI: best legal formation within the 15 by RAW predicted sum.
  let bestXi: Candidate[] | null = null;
  let bestTotal: number | null = null;
  let bestFormation = "";
  for (const [d, m, f] of FORMATIONS) {
    const xi = solveMilp(squad, { GKP: 1, DEF: d, MID: m, FWD: f });
    if (!xi || xi.length !== 11) continue;
    const total = xi.reduce((sum, player) => sum + player.pred_points, 0);
    if (bestTotal === null || total > bestTotal) {
      bestTotal = total;
      bestXi = xi;
      bestFormation = `${d}-${m}-${f}`;
    }
  }
  if (!bestXi || bestTotal === null) return null;

  // 3) Captain after the XI: highest-predicted starter.
  const captain = [...bestXi].sort((a, b) => b.pred_points - a.pred_points || a.player_id - b.player_id)[0];

  // 4) Bench: reserve goalkeeper separate (rank 0), outfield ordered (ranks 1-3).
  const xiIds = new Set(bestXi.map((player) => player.player_id));
  const bench = squad.filter((player) => !xiIds.has(player.player_id));
  const reserveGk = bench.filter((player) => player.position === "GKP");
  const outfieldBench = bench.filter((player) => player.position !== "GKP").sort((a, b) => b.pred_points - a.pred_points || a.player_id - b.player_id);
  if (reserveGk.length !== 1 || outfieldBench.length !== 3) return null;
  const benchRank = new Map<number, number>([[reserveGk[0].player_id, 0], ...outfieldBench.map((player, i) => [player.player_id, i + 1] as [number, number])]);

  const ordered = [
    ...[...bestXi].sort((a, b) => POSITION_ORDER.indexOf(a.position) - POSITION_ORDER.indexOf(b.position) || b.pred_points - a.pred_points || a.player_id - b.player_id),
    ...bench.sort((a, b) => benchRank.get(a.player_id)! - benchRank.get(b.player_id)!),
  ];
  const squadJson = ordered.map((player) => ({
    player_id: player.player_id, player_name: player.player_name, position: player.position,
    team_name: player.team_name, price: Number(player.price.toFixed(1)), pred_points: Number(player.pred_points.toFixed(2)),
    is_captain: player.player_id === captain.player_id, is_starting: xiIds.has(player.player_id),
    bench_rank: benchRank.get(player.player_id) ?? null, actual_points: null,
  }));
  return {
    gameweek, formation: bestFormation,
    squad_cost: Number(squad.reduce((sum, player) => sum + player.price, 0).toFixed(1)),
    predicted_total: Number((bestTotal + captain.pred_points).toFixed(2)),
    actual_total: null, average_total: null, vs_average: null, status: "upcoming", source: "predictions", model_source: "Live weekly predictions", squad: squadJson,
  };
}

export function combineWeeklySelections(saved: Record<string, unknown>[], predictions: PredictionRow[], season: string, completedWeeks: number[] = []) {
  const rows = saved.filter((row) => row.season === season);
  const existing = new Set(rows.map((row) => Number(row.gameweek)));
  const completed = new Set(completedWeeks);
  const missingSaved = [...completed].filter((gw) => !existing.has(gw)).sort((a, b) => a - b);
  const weeks = [...new Set(predictions.flatMap((prediction) => prediction.gw_predictions.map((forecast) => forecast.gw)))].filter((gw) => Number.isInteger(gw) && gw >= 1 && gw <= 38 && !existing.has(gw) && !completed.has(gw)).sort((a, b) => a - b);
  const unavailable: number[] = [];
  for (const gameweek of weeks) {
    const selection = selectWeeklySquad15(predictions, gameweek);
    if (selection) rows.push({ ...selection, season });
    else unavailable.push(gameweek);
  }
  return { rows: rows.sort((a, b) => Number(b.gameweek) - Number(a.gameweek)), unavailable_gameweeks: unavailable, missing_saved_gameweeks: missingSaved };
}
