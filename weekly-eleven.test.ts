import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { combineWeeklySelections, selectWeeklyEleven } from "./lib/weekly-eleven";
import type { PredictionRow } from "./lib/db";

let id = 1;
function candidate(position: string, points = 5, club?: string): PredictionRow {
  const player_id = id++;
  return { player_id, player_name: `Player ${player_id}`, position, price: 5, team_name: club ?? `Club ${player_id}`, gw_predictions: [{ gw: 11, pred_points: points, prob_gt_5: null }], avg_pred_points: 999, avg_prob_gt_6: null, unofficial_injury_status: null, unofficial_injury_type: null };
}
function pool() { return [candidate("GKP"), ...Array.from({ length: 7 }, () => candidate("DEF")), ...Array.from({ length: 7 }, () => candidate("MID")), ...Array.from({ length: 5 }, () => candidate("FWD"))]; }

test("exact backend formations including 5-2-3 are feasible", () => {
  for (const [d, m, f] of [[3,4,3],[3,5,2],[4,4,2],[4,3,3],[5,4,1],[5,3,2],[4,5,1],[5,2,3]]) {
    const players = [candidate("GKP"), ...Array.from({ length: d }, () => candidate("DEF")), ...Array.from({ length: m }, () => candidate("MID")), ...Array.from({ length: f }, () => candidate("FWD"))];
    assert.equal(selectWeeklyEleven(players, 11)?.formation, `${d}-${m}-${f}`);
  }
});
test("weekly forecast not average drives picks; captain doubled only in total", () => {
  const players = pool(); const star = candidate("FWD", 20); players.push(star);
  const result = selectWeeklyEleven(players, 11)!;
  assert(result.squad.some((p) => p.player_id === star.player_id));
  assert.equal(result.predicted_total, 90);
  assert.equal(result.squad.filter((p) => p.is_captain).length, 1);
  assert.equal(result.squad.find((p) => p.is_captain)?.pred_points, 20);
  assert.equal(result.actual_total, null);
});
test("budget, club cap, unique identities and invalid/missing values", () => {
  const players = pool();
  for (const p of players) p.team_name = `Club ${p.player_id % 4}`;
  const result = selectWeeklyEleven(players, 11)!;
  assert.equal(new Set(result.squad.map((p) => p.player_id)).size, 11);
  for (const p of result.squad) assert(result.squad.filter((q) => q.team_name === p.team_name).length <= 3);
  assert(result.squad_cost <= 85);
  for (const p of players) p.price = 10;
  assert.equal(selectWeeklyEleven(players, 11), null);
  assert.equal(selectWeeklyEleven(pool(), 12), null);
  assert.equal(selectWeeklyEleven([], 11), null);
  const missing = pool(); for (const p of missing) p.gw_predictions[0].pred_points = null;
  assert.equal(selectWeeklyEleven(missing, 11), null);
});
test("saved history wins; no cross-season collisions or completed-week reconstruction", () => {
  const saved = [{ season: "2026/27", gameweek: 11, squad: "saved", status: "past" }, { season: "2025/26", gameweek: 12 }];
  assert.equal(combineWeeklySelections(saved, pool(), "2026/27").rows[0].squad, "saved");
  assert.equal(combineWeeklySelections([], pool(), "2026/27", [11]).rows.length, 0);
  assert.equal(combineWeeklySelections(saved, [], "2026/27").rows.length, 1);
  assert.deepEqual(combineWeeklySelections([], [candidate("GKP")], "2026/27").unavailable_gameweeks, [11]);
});

if (process.env.OFFSIDE_TEST_DATA) test("current production dataset: all GW11-38 plus unchanged saved weeks", () => {
  const data = JSON.parse(readFileSync("/tmp/offside-data.json", "utf8"));
  const saved = JSON.parse(readFileSync("/tmp/offside-history.json", "utf8")).rows;
  const start = Date.now();
  const result = combineWeeklySelections(saved, data.predictions, "2026/27", Array.from({ length: 10 }, (_, i) => i + 1));
  assert.equal(result.rows.length, 38); assert.equal(result.unavailable_gameweeks.length, 0);
  for (const row of result.rows.filter((r) => r.source === "predictions")) {
    const squad = row.squad as { team_name: string; player_id: number }[];
    assert.equal(squad.length, 11); assert(Number(row.squad_cost) <= 85);
    for (const player of squad) assert(squad.filter((p) => p.team_name === player.team_name).length <= 3);
  }
  for (const row of saved) assert.deepEqual(result.rows.find((r) => r.gameweek === row.gameweek), row);
  console.log(`Computed 28 live weeks in ${Date.now() - start}ms`);
});