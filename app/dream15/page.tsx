"use client";

import { useEffect, useMemo, useState } from "react";

type Player = Record<string, any>;
type Prediction = Record<string, any>;
type Selection = Record<string, any> & { squad: Player[] };
type Residual = { player_id: number; player_name: string; gameweek: number; actual_points: number; predicted_points: number; residual: number };

const positionTone: Record<string, string> = {
  GKP: "bg-amber-500/20 text-amber-300",
  DEF: "bg-sky-500/20 text-sky-300",
  MID: "bg-emerald-500/20 text-emerald-300",
  FWD: "bg-rose-500/20 text-rose-300",
};

function numeric(value: unknown) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : null; }
function fixed(value: unknown, digits = 1) { const parsed = numeric(value); return parsed == null ? "—" : parsed.toFixed(digits); }
function signed(value: number) { return `${value >= 0 ? "+" : ""}${value.toFixed(1)}`; }

function SelectionStrip({ selection }: { selection: Selection }) {
  return <section className="border-t border-[var(--border)] px-4 py-5 sm:px-6" aria-label={`Gameweek ${selection.gameweek} selection`}>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-xl bg-[var(--accent)] text-sm font-black text-[#08111f]">{selection.gameweek}</span><div><h3 className="font-black">Gameweek {selection.gameweek}</h3><p className="text-xs text-[var(--muted)]">{selection.model_source} · {selection.formation}</p></div></div></div><div className="flex gap-4 text-right text-xs"><span><b className="block text-[var(--accent)]">{fixed(selection.predicted_total)}</b><span className="text-[var(--muted)]">predicted</span></span><span><b className="block">{fixed(selection.actual_total)}</b><span className="text-[var(--muted)]">actual</span></span><span><b className={numeric(selection.actual_total) != null && numeric(selection.predicted_total) != null && numeric(selection.actual_total)! >= numeric(selection.predicted_total)! ? "text-emerald-300" : "text-rose-300"}>{numeric(selection.actual_total) == null || numeric(selection.predicted_total) == null ? "—" : signed(numeric(selection.actual_total)! - numeric(selection.predicted_total)!)}</b><span className="block text-[var(--muted)]">error</span></span></div></div>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11">{selection.squad.map((player) => <div key={player.player_id} className="rounded-xl border border-white/10 bg-[#102039]/80 p-2"><div className="flex items-center justify-between gap-1"><span className={`badge ${positionTone[player.position] ?? "bg-white/10"} !px-1.5 !text-[9px]`}>{player.position}</span>{player.is_captain && <span className="rounded bg-amber-400 px-1 text-[9px] font-black text-[#08111f]">C</span>}</div><p className="mt-2 truncate text-xs font-bold">{player.player_name}</p><p className="truncate text-[10px] text-[var(--muted)]">{player.team_name}</p><div className="mt-2 flex justify-between text-[10px]"><span className="text-[var(--accent)]">P {fixed(player.pred_points, 1)}</span><span>A {fixed(player.actual_points, 0)}</span></div></div>)}</div>
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
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [residuals, setResiduals] = useState<Residual[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetch("/api/data"), fetch("/api/best-eleven"), fetch("/api/residuals")]).then(async ([dataResponse, historyResponse, residualResponse]) => {
      const data = await dataResponse.json();
      const history = await historyResponse.json();
      const residualData = await residualResponse.json();
      if (!dataResponse.ok) throw new Error(data.error ?? "Unable to load player data");
      if (!historyResponse.ok) throw new Error(history.error ?? "Unable to load model history");
      if (!residualResponse.ok) throw new Error(residualData.error ?? "Unable to load residual history");
      setPredictions(data.predictions ?? []);
      setResiduals(residualData.rows ?? []);
      setSelections((history.rows ?? []).map((row: Selection) => ({ ...row, squad: typeof row.squad === "string" ? JSON.parse(row.squad) : row.squad ?? [] })).sort((a: Selection, b: Selection) => Number(b.gameweek) - Number(a.gameweek)));
    }).catch((reason: Error) => setError(reason.message)).finally(() => setLoading(false));
  }, []);

  const recent = selections.filter((selection) => selection.status === "past" && numeric(selection.actual_total) != null).slice(0, 6);
  const metrics = useMemo(() => {
    const completed = recent.filter((selection) => numeric(selection.predicted_total) != null);
    const predicted = completed.reduce((total, selection) => total + Number(selection.predicted_total), 0);
    const actual = completed.reduce((total, selection) => total + Number(selection.actual_total), 0);
    const mae = completed.length ? completed.reduce((total, selection) => total + Math.abs(Number(selection.actual_total) - Number(selection.predicted_total)), 0) / completed.length : null;
    const wins = completed.filter((selection) => Number(selection.actual_total) >= Number(selection.predicted_total)).length;
    return { predicted, actual, mae, hitRate: completed.length ? wins / completed.length : null };
  }, [recent]);

  return <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
    <header className="relative mb-7 overflow-hidden rounded-3xl border border-[var(--border)] bg-gradient-to-br from-[#172b22] via-[#10233a] to-[#0b1425] p-6 shadow-2xl sm:p-9"><div className="absolute -right-12 -top-20 size-56 rounded-full bg-[var(--accent)]/10 blur-3xl" /><p className="relative mb-2 text-xs font-bold uppercase tracking-[0.24em] text-[var(--accent)]">Model room</p><h1 className="relative text-4xl font-black tracking-tight sm:text-6xl">Dream <span className="text-[var(--accent)]">15</span></h1><p className="relative mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)] sm:text-base">Follow every player forecast, the XI selected by the model, and what actually happened when the gameweek was played.</p></header>
    {loading && <div className="card p-8 text-center text-[var(--muted)]">Loading model history and diagnostics...</div>}
    {error && <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-5 text-rose-300">{error}</div>}
    {!loading && !error && <>
      <section className="mb-6 grid gap-3 sm:grid-cols-4"><div className="card p-4"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">Recent actual</p><b className="mt-2 block text-3xl">{fixed(metrics.actual)}</b><span className="text-xs text-[var(--muted)]">selected XI points</span></div><div className="card p-4"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">Recent predicted</p><b className="mt-2 block text-3xl text-[var(--accent)]">{fixed(metrics.predicted)}</b><span className="text-xs text-[var(--muted)]">model expectation</span></div><div className="card p-4"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">Mean absolute error</p><b className="mt-2 block text-3xl">{fixed(metrics.mae, 2)}</b><span className="text-xs text-[var(--muted)]">points per gameweek</span></div><div className="card p-4"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">Beat prediction</p><b className="mt-2 block text-3xl text-emerald-300">{metrics.hitRate == null ? "—" : `${Math.round(metrics.hitRate * 100)}%`}</b><span className="text-xs text-[var(--muted)]">of recent gameweeks</span></div></section>
      <section className="card mb-6 overflow-hidden"><div className="border-b border-[var(--border)] p-4 sm:p-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent2)]">The model in action</p><h2 className="mt-1 text-2xl font-black">Recent selections</h2><p className="mt-1 text-sm text-[var(--muted)]">Predicted points and actual points for every selected player.</p></div><span className="text-xs text-[var(--muted)]">{recent.length} completed gameweeks</span></div></div>{recent.length ? recent.map((selection) => <SelectionStrip key={`${selection.season}-${selection.gameweek}`} selection={selection} />) : <p className="p-8 text-center text-[var(--muted)]">No completed model selections found.</p>}</section>
      <ResidualDistribution rows={residuals} />
    </>}
  </main>;
}
