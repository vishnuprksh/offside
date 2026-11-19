import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { combineWeeklySelections, selectWeeklySquad15 } from "./lib/weekly-eleven";
import type { PredictionRow } from "./lib/db";

let id = 1;
function candidate(position: string, points = 5, club?: string): PredictionRow {
  const player_id = id++;
  return { player_id, player_name: `Player ${player_id}`, position, price: 5, team_name: club ?? `Club ${player_id}`, gw_predictions: [{ gw: 11, pred_points: points, prob_gt_5: null }], avg_pred_points: 999, avg_prob_gt_6: null, unofficial_injury_status: null, unofficial_injury_type: null };
}
function pool() { return [...Array.from({ length: 3 }, () => candidate("GKP")), ...Array.from({ length: 8 }, () => candidate("DEF")), ...Array.from({ length: 9 }, () => candidate("MID")), ...Array.from({ length: 5 }, () => candidate("FWD"))]; }

test("squad-15 contract: exact composition, XI shape, bench ranks, captain", () => {
  const result = selectWeeklySquad15(pool(), 11)!;
  assert.equal(result.squad.length, 15);
  for (const [position, count] of Object.entries({ GKP: 2, DEF: 5, MID: 5, FWD: 3 })) {
    assert.equal(result.squad.filter((p: any) => p.position === position).length, count);
  }
  const starters = result.squad.filter((p: any) => p.is_starting);
  const bench = result.squad.filter((p: any) => !p.is_starting);
  assert.equal(starters.length, 11);
  assert.equal(starters.filter((p: any) => p.position === "GKP").length, 1);
  const [d, m, f] = result.formation.split("-").map(Number);
  assert.equal(starters.filter((p: any) => p.position === "DEF").length, d);
  assert.equal(starters.filter((p: any) => p.position === "MID").length, m);
  assert.equal(starters.filter((p: any) => p.position === "FWD").length, f);
  assert.equal(bench.length, 4);
  assert.equal(bench.filter((p: any) => p.position === "GKP").length, 1);
  assert.equal(bench.find((p: any) => p.position === "GKP").bench_rank, 0);
  assert.deepEqual(bench.filter((p: any) => p.position !== "GKP").map((p: any) => p.bench_rank).sort(), [1, 2, 3]);
  for (const p of starters) assert.equal(p.bench_rank, null);
  assert.equal(result.squad.filter((p: any) => p.is_captain).length, 1);
  assert.equal(result.squad.find((p: any) => p.is_captain).is_starting, true);
  assert(result.squad_cost <= 85);
});

test("every legal XI formation is reachable within a forced 15", () => {
  for (const [d, m, f] of [[3,4,3],[3,5,2],[4,4,2],[4,3,3],[5,4,1],[5,3,2],[4,5,1],[5,2,3]]) {
    // Exactly 15 players at composition 2/5/5/3: the squad is forced, and the
    // XI falls to the formation matching where the points are.
    const players = [candidate("GKP"), candidate("GKP"),
      ...Array.from({ length: 5 }, (_, i) => candidate("DEF", i < d ? 10 : 1)),
      ...Array.from({ length: 5 }, (_, i) => candidate("MID", i < m ? 10 : 1)),
      ...Array.from({ length: 3 }, (_, i) => candidate("FWD", i < f ? 10 : 1))];
    assert.equal(selectWeeklySquad15(players, 11)?.formation, `${d}-${m}-${f}`);
  }
});

test("captain doubled only in the total, not the optimization", () => {
  const players = pool(); const star = candidate("FWD", 20); players.push(star);
  const result = selectWeeklySquad15(players, 11)!;
  const xi = result.squad.filter((p: any) => p.is_starting);
  assert.equal(result.squad.find((p: any) => p.is_captain)?.player_id, star.player_id);
  assert.equal(result.predicted_total, xi.reduce((s: number, p: any) => s + p.pred_points, 0) + 20);
  assert.equal(result.actual_total, null);
});

test("budget infeasible, missing values and thin pools return null", () => {
  const players = pool();
  for (const p of players) p.price = 10;
  assert.equal(selectWeeklySquad15(players, 11), null);
  assert.equal(selectWeeklySquad15(pool(), 12), null);
  assert.equal(selectWeeklySquad15([], 11), null);
  const missing = pool(); for (const p of missing) p.gw_predictions[0].pred_points = null;
  assert.equal(selectWeeklySquad15(missing, 11), null);
  const oneGk = pool().slice(1); for (const p of oneGk) if (p.position === "GKP") p.position = "DEF";
  assert.equal(selectWeeklySquad15(oneGk.filter((p) => p.position === "DEF"), 11), null);
});

test("saved history wins; completed weeks without saved rows are reported missing", () => {
  const saved = [{ season: "2026/27", gameweek: 11, squad: "saved", status: "past" }, { season: "2025/26", gameweek: 12 }];
  assert.equal(combineWeeklySelections(saved, pool(), "2026/27").rows[0].squad, "saved");
  assert.equal(combineWeeklySelections([], pool(), "2026/27", [11]).rows.length, 0);
  assert.deepEqual(combineWeeklySelections([], pool(), "2026/27", [11]).missing_saved_gameweeks, [11]);
  assert.equal(combineWeeklySelections(saved, [], "2026/27").rows.length, 1);
  assert.deepEqual(combineWeeklySelections([], [candidate("GKP")], "2026/27").unavailable_gameweeks, [11]);
});

test("golden parity with the Python selector (02b changelog #81)", () => {
  const fixture = JSON.parse(readFileSync(new URL("./lib/__fixtures__/squad15-parity.json", import.meta.url), "utf8"));
  const actual = selectWeeklySquad15(fixture.pool, fixture.gameweek)!;
  const expected = fixture.expected;
  assert.equal(actual.formation, expected.formation);
  assert.equal(actual.squad_cost, expected.squad_cost);
  assert.equal(actual.predicted_total, expected.predicted_total);
  assert.equal(actual.squad.length, expected.squad.length);
  for (let i = 0; i < expected.squad.length; i++) {
    for (const key of ["player_id", "position", "team_name", "price", "pred_points", "is_captain", "is_starting", "bench_rank"] as const) {
      assert.equal(actual.squad[i][key], expected.squad[i][key], `squad[${i}].${key}`);
    }
  }
});

if (process.env.OFFSIDE_TEST_DATA) test("current production dataset: all GW11-38 plus unchanged saved weeks", () => {
  const data = JSON.parse(readFileSync("/tmp/offside-data.json", "utf8"));
  const saved = JSON.parse(readFileSync("/tmp/offside-history.json", "utf8")).rows;
  const start = Date.now();
  const result = combineWeeklySelections(saved, data.predictions, "2026/27", Array.from({ length: 10 }, (_, i) => i + 1));
  assert.equal(result.rows.length, 38); assert.equal(result.unavailable_gameweeks.length, 0);
  for (const row of result.rows.filter((r) => r.source === "predictions")) {
    const squad = row.squad as { team_name: string; player_id: number }[];
    assert.equal(squad.length, 15); assert(Number(row.squad_cost) <= 85);
    for (const player of squad) assert(squad.filter((p) => p.team_name === player.team_name).length <= 3);
  }
  for (const row of saved) assert.deepEqual(result.rows.find((r) => r.gameweek === row.gameweek), row);
  console.log(`Computed 28 live weeks in ${Date.now() - start}ms`);
});
