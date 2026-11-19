import { NextResponse } from "next/server";
import { fetchBestEleven, fetchPredictions, getPool } from "@/lib/db";
import { combineWeeklySelections } from "@/lib/weekly-eleven";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [saved, predictions, fixtures] = await Promise.all([
      fetchBestEleven(), fetchPredictions(),
      getPool().query(`SELECT season, event, bool_and(finished) AS finished
        FROM fpl.fixture_difficulties
        WHERE season = (SELECT max(season) FROM fpl.fixture_difficulties)
        GROUP BY season, event`),
    ]);
    const season = fixtures.rows[0]?.season;
    if (!season) throw new Error("Current season is unavailable");
    const completed = fixtures.rows.filter((row) => row.finished === true).map((row) => Number(row.event));
    const result = combineWeeklySelections(saved, predictions, season, completed);
    for (const row of result.rows) row.finished = completed.includes(Number(row.gameweek));
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Weekly selection failed", error);
    return NextResponse.json({ error: "Unable to load weekly selections. Please try again." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
