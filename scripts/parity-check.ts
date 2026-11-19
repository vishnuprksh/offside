// Golden parity check (02b changelog #81): the TypeScript squad-15 picker must
// reproduce the Python selector's exact output on the fixture pool generated
// by the production Python functions (lib/__fixtures__/squad15-parity.json).
// Run: npx tsx scripts/parity-check.ts
import { readFileSync } from "node:fs";
import { selectWeeklySquad15 } from "../lib/weekly-eleven";

const fixture = JSON.parse(readFileSync(new URL("../lib/__fixtures__/squad15-parity.json", import.meta.url), "utf8"));
const actual = selectWeeklySquad15(fixture.pool, fixture.gameweek);
if (!actual) { console.error("FAIL: TS selector returned null"); process.exit(1); }
const expected = fixture.expected;

const problems: string[] = [];
if (actual.formation !== expected.formation) problems.push(`formation ${actual.formation} != ${expected.formation}`);
if (actual.squad_cost !== expected.squad_cost) problems.push(`squad_cost ${actual.squad_cost} != ${expected.squad_cost}`);
if (actual.predicted_total !== expected.predicted_total) problems.push(`predicted_total ${actual.predicted_total} != ${expected.predicted_total}`);
const a = actual.squad, e = expected.squad;
if (a.length !== e.length) problems.push(`squad length ${a.length} != ${e.length}`);
for (let i = 0; i < Math.min(a.length, e.length); i++) {
  for (const key of ["player_id", "position", "team_name", "price", "pred_points", "is_captain", "is_starting", "bench_rank"] as const) {
    if (a[i][key] !== e[i][key]) problems.push(`squad[${i}].${key}: ${a[i][key]} != ${e[i][key]}`);
  }
}
if (problems.length) { console.error("FAIL:\n" + problems.join("\n")); process.exit(1); }
console.log(`PARITY OK: ${a.length} players, formation ${actual.formation}, cost ${actual.squad_cost}m, predicted_total ${actual.predicted_total}`);
