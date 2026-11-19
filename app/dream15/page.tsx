"use client";

import { useEffect, useMemo, useState } from "react";

type Player = Record<string, any>;
type Selection = Record<string, any> & { squad: Player[] };
type Residual = { player_id: number; player_name: string; gameweek: number; actual_points: number; predicted_points: number; residual: number };

const positionTone: Record<string, string> = {
  GKP: "bg-amber-500/20 text-amber-300",
  DEF: "bg-sky-500/20 text-sky-300",
  MID: "bg-emerald-500/20 text-emerald-300",
  FWD: "bg-rose-500/20 text-rose-300",
};

function numeric(value: unknown) { if (value == null || value === "") return null; const parsed = Number(value); return Number.isFinite(parsed) ? parsed : null; }
function fixed(value: unknown, digits = 1) { const parsed = numeric(value); return parsed == null ? "—" : parsed.toFixed(digits); }
function signed(value: number) { return `${value >= 0 ? "+" : ""}${value.toFixed(1)}`; }

function truthy(value: unknown) { return value === true || value === "t" || value === "true" || value === 1; }

function provenanceLabel(selection: Selection): string {
  if (selection.source === "predictions") return "Live weekly predictions";
  const parts: string[] = [];
  if (selection.status === "past") parts.push("Saved model selection");
  else if (selection.status === "locked") parts.push(selection.finished ? "Finished, awaiting actuals" : "Locked at the deadline - gameweek in play");
  else parts.push("Saved draft - refreshed until the deadline");
  if (truthy(selection.saved_after_deadline)) parts.push("saved after the deadline");
  return parts.join(" \u00b7 ");
}

function PlayerCard({ player, benchLabel }: { player: Player; benchLabel?: string }) {
  return <div className="rounded-xl border border-white/10 bg-[#102039]/80 p-2"><div className="flex items-center justify-between gap-1"><span className={`badge ${positionTone[player.position] ?? "bg-white/10"} !px-1.5 !text-[9px]`}>{player.position}</span><span className="flex items-center gap-1">{player.is_captain && <span className="rounded bg-amber-400 px-1 text-[9px] font-black text-[#08111f]">C</span>}{benchLabel && <span className="rounded bg-white/10 px-1 text-[9px] font-black text-[var(--muted)]">{benchLabel}</span>}</span></div><p className="mt-2 break-words text-xs font-bold">{player.player_name}</p><p className="truncate text-[10px] text-[var(--muted)]">{player.team_name}</p><div className="mt-2 flex justify-between text-[10px]"><span className="text-[var(--accent)]">P {fixed(player.pred_points, 1)}</span><span>A {fixed(player.actual_points, 0)}</span></div></div>;
}

function SelectionStrip({ selection }: { selection: Selection }) {
  const starters = selection.squad.filter((player) => player.is_starting !== false);
  const bench = selection.squad.filter((player) => player.is_starting === false).sort((a, b) => (a.position === "GKP" ? -1 : 0) - (b.position === "GKP" ? -1 : 0) || (a.bench_rank ?? 99) - (b.bench_rank ?? 99));
  const sourceUpdated = typeof selection.selection_source_updated_at === "string" && selection.selection_source_updated_at ? selection.selection_source_updated_at.slice(0, 16).replace("T", " ") : null;
  return <section className="border-t border-[var(--border)] px-4 py-5 sm:px-6" aria-label={`Gameweek ${selection.gameweek} selection`}>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-xl bg-[var(--accent)] text-sm font-black text-[#08111f]">{selection.gameweek}</span><div><h3 className="font-black">Gameweek {selection.gameweek}</h3><p className="text-xs text-[var(--muted)]">{provenanceLabel(selection)} · {selection.formation}{sourceUpdated ? ` \u00b7 model data ${sourceUpdated}` : ""}</p></div></div></div><div className="flex gap-4 text-right text-xs"><span><b className="block text-[var(--accent)]">{fixed(selection.predicted_total)}</b><span className="text-[var(--muted)]">predicted</span></span><span><b className="block">{fixed(selection.actual_total)}</b><span className="text-[var(--muted)]">actual</span></span><span><b className={numeric(selection.actual_total) != null && numeric(selection.predicted_total) != null && numeric(selection.actual_total)! >= numeric(selection.predicted_total)! ? "text-emerald-300" : "text-rose-300"}>{numeric(selection.actual_total) == null || numeric(selection.predicted_total) == null ? "—" : signed(numeric(selection.actual_total)! - numeric(selection.predicted_total)!)}</b><span className="block text-[var(--muted)]">error</span></span></div></div>
    <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">Starting XI</p>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">{starters.map((player) => <PlayerCard key={player.player_id} player={player} />)}</div>
    {bench.length > 0 && <><p className="mb-2 mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">Bench</p>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{bench.map((player) => <PlayerCard key={player.player_id} player={player} benchLabel={player.position === "GKP" ? "GK" : String(player.bench_rank ?? "")} />)}</div></>}
  </section>;
}

function ResidualDistribution({ rows }: { rows: Residual[] }) {
  const buckets = [-10, -8, -6, -4, -2, 0, 2, 4, 6, 8, 10];
  const counts = buckets.map((start, index) => ({ start, count: rows.filter((row) => row.residual >= start && (index === buckets.length - 1 ? row.residual <= start : row.residual < start + 2)).length }));
  const maxCount = Math.max(...counts.map((bucket) => bucket.count), 1);
  const mean = rows.length ? rows.reduce((sum, row) => sum + row.residual, 0) / rows.length : null;
  return <section className="card mb-6 overflow-hidden"><div className="border-b border-[var(--border)] p-4 sm:p-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent2)]">Model diagnostics</p><h2 className="mt-1 text-2xl font-black">Residual distribution</h2><p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">Actual player points minus model-predicted points, using available player/gameweek observations.</p></div><div className="text-right text-xs text-[var(--muted)]"><b className="block text-lg text-[var(--text)]">{rows.length.toLocaleString()}</b> observations</div></div></div>{rows.length ? <div className="p-4 sm:p-6"><div className="flex h-56 items-end gap-1 sm:gap-2" aria-label="Residual histogram">{counts.map((bucket) => <div key={bucket.start} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"><span className="text-[10px] text-[var(--muted)]">{bucket.count || ""}</span><div className="w-full rounded-t bg-[var(--accent)]" style={{ height: `${Math.max((bucket.count / maxCount) * 100, bucket.count ? 4 : 0)}%` }} title={`${bucket.count} observations from ${bucket.start} to ${bucket.start + 2} points`} /><span className="text-[10px] text-[var(--muted)]">{bucket.start === 10 ? "10+" : bucket.start}</span></div>)}</div><div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-[var(--border)] pt-4 text-xs text-[var(--muted)]"><span>Negative = over-prediction</span><span>Positive = under-prediction</span><span>Mean residual: <b className={mean != null && mean >= 0 ? "text-emerald-300" : "text-rose-300"}>{mean == null ? "—" : signed(mean)}</b></span></div></div> : <p className="p-8 text-center text-[var(--muted)]">No model observations are available yet.</p>}</section>;
}

export default function Dream15Page() {
  const [selectedWeek, setSelectedWeek] = useState("");
  const [unavailableWeeks, setUnavailableWeeks] = useState<number[]>([]);
  const [missingSavedWeeks, setMissingSavedWeeks] = useState<number[]>([]);
  const [diagnosticError, setDiagnosticError] = useState<string | null>(null);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [residuals, setResiduals] = useState<Residual[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadSelections() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/best-eleven", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to load weekly selections");
      setUnavailableWeeks(data.unavailable_gameweeks ?? []);
      setMissingSavedWeeks(data.missing_saved_gameweeks ?? []);
      setSelections((data.rows ?? []).map((row: Selection) => ({ ...row, squad: typeof row.squad === "string" ? JSON.parse(row.squad) : row.squad ?? [] })).sort((a: Selection, b: Selection) => Number(b.gameweek) - Number(a.gameweek)));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load weekly selections");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSelections();
    fetch("/api/residuals", { cache: "no-store" }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error("Model diagnostics are temporarily unavailable.");
      setResiduals(data.rows ?? []);
    }).catch(() => setDiagnosticError("Model diagnostics are temporarily unavailable. Weekly selections are shown independently."));
  }, []);

  const forecasts = selections.filter((selection) => selection.status !== "past").sort((a, b) => Number(a.gameweek) - Number(b.gameweek));
  const activeForecast = forecasts.find((selection) => String(selection.gameweek) === selectedWeek) ?? forecasts.find((selection) => selection.source === "predictions") ?? forecasts[0];

  const completedSelections = selections.filter((selection) => selection.status === "past" && numeric(selection.actual_total) != null);
  const recent = completedSelections.slice(0, 6);
  const metrics = useMemo(() => {
    const completed = recent.filter((selection) => numeric(selection.predicted_total) != null);
    const predicted = completed.reduce((total, selection) => total + Number(selection.predicted_total), 0);
    const actual = completed.reduce((total, selection) => total + Number(selection.actual_total), 0);
    const mae = completed.length ? completed.reduce((total, selection) => total + Math.abs(Number(selection.actual_total) - Number(selection.predicted_total)), 0) / completed.length : null;
    const wins = completed.filter((selection) => Number(selection.actual_total) >= Number(selection.predicted_total)).length;
    return { predicted: completed.length ? predicted : null, actual: completed.length ? actual : null, mae, hitRate: completed.length ? wins / completed.length : null };
  }, [recent]);

  return <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
    <header className="relative mb-7 overflow-hidden rounded-3xl border border-[var(--border)] bg-gradient-to-br from-[#172b22] via-[#10233a] to-[#0b1425] p-6 shadow-2xl sm:p-9"><div className="absolute -right-12 -top-20 size-56 rounded-full bg-[var(--accent)]/10 blur-3xl" /><p className="relative mb-2 text-xs font-bold uppercase tracking-[0.24em] text-[var(--accent)]">Model room</p><h1 className="relative text-4xl font-black tracking-tight sm:text-6xl">Offside<span className="text-[var(--accent)]">11</span></h1><p className="relative mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)] sm:text-base">Follow every player forecast, the 15-player squad selected by the model, and what actually happened when the gameweek was played.</p></header>
    <div className="mb-5 flex justify-end"><button type="button" onClick={() => void loadSelections()} disabled={loading} className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-bold disabled:opacity-50">{loading ? "Refreshing..." : "Refresh selections"}</button></div>
    {loading && <div className="card p-8 text-center text-[var(--muted)]">Loading model history and diagnostics...</div>}
    {error && <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-5 text-rose-300">{error}</div>}
    {!loading && !error && <>
      <section className="card mb-6 overflow-hidden" aria-label="Weekly forecasts">
        <div className="border-b border-[var(--border)] p-4 sm:p-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent2)]">Weekly forecasts</p><h2 className="mt-1 text-2xl font-black">Best 11 by gameweek</h2><p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">A 15-player model squad every gameweek: 2 keepers, 5 defenders, 5 midfielders and 3 forwards under the £100m budget and a maximum of three per club. The starting XI and captain are chosen from the 15; totals include double captain points. Saved selections lock at the deadline and stay unchanged.</p></div>{forecasts.length > 0 && <label className="text-sm">Gameweek <select aria-label="Forecast gameweek" value={activeForecast?.gameweek ?? ""} onChange={(event) => setSelectedWeek(event.target.value)} className="ml-2 rounded-lg border border-[var(--border)] bg-[#102039] p-2">{forecasts.map((selection) => <option key={`${selection.season}-${selection.gameweek}`} value={selection.gameweek}>GW {selection.gameweek}{selection.source === "predictions" ? "" : " (saved)"}</option>)}</select></label>}</div></div>
        {unavailableWeeks.length > 0 && <p role="status" className="px-4 pt-4 text-sm text-amber-300">No valid squad can be formed from available forecasts for GW {unavailableWeeks.join(", ")}.</p>}
        {missingSavedWeeks.length > 0 && <p role="status" className="px-4 pt-4 text-sm text-amber-300">No saved model selection is stored for completed GW {missingSavedWeeks.join(", ")}.</p>}
        {activeForecast ? <SelectionStrip selection={activeForecast} /> : <p className="p-8 text-center text-[var(--muted)]">No weekly forecasts are available yet. New gameweeks appear when predictions are available.</p>}
      </section>
      <section className="mb-6 grid gap-3 sm:grid-cols-4"><div className="card p-4"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">Recent actual</p><b className="mt-2 block text-3xl">{fixed(metrics.actual)}</b><span className="text-xs text-[var(--muted)]">selected XI points</span></div><div className="card p-4"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">Recent predicted</p><b className="mt-2 block text-3xl text-[var(--accent)]">{fixed(metrics.predicted)}</b><span className="text-xs text-[var(--muted)]">model expectation</span></div><div className="card p-4"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">Mean absolute error</p><b className="mt-2 block text-3xl">{fixed(metrics.mae, 2)}</b><span className="text-xs text-[var(--muted)]">points per gameweek</span></div><div className="card p-4"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">Beat prediction</p><b className="mt-2 block text-3xl text-emerald-300">{metrics.hitRate == null ? "—" : `${Math.round(metrics.hitRate * 100)}%`}</b><span className="text-xs text-[var(--muted)]">of recent gameweeks</span></div></section>
      <section className="card mb-6 overflow-hidden"><div className="border-b border-[var(--border)] p-4 sm:p-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent2)]">The model in action</p><h2 className="mt-1 text-2xl font-black">Completed selections</h2><p className="mt-1 text-sm text-[var(--muted)]">Predicted points and actual points for every selected player.</p></div><span className="text-xs text-[var(--muted)]">{completedSelections.length} completed gameweeks</span></div></div>{completedSelections.length ? completedSelections.map((selection) => <SelectionStrip key={`${selection.season}-${selection.gameweek}`} selection={selection} />) : <p className="p-8 text-center text-[var(--muted)]">No completed model selections found.</p>}</section>
      {diagnosticError ? <p role="status" className="mb-6 text-sm text-[var(--muted)]">{diagnosticError}</p> : <ResidualDistribution rows={residuals} />}
    </>}
  </main>;
}
