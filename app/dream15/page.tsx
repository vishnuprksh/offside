"use client";

import { useEffect, useMemo, useState } from "react";

type Row = Record<string, unknown>;
type Week = { label: string; rows: Row[] };

const WEEK_KEYS = ["gameweek", "gw", "week", "week_number", "round"];
const NAME_KEYS = ["player_name", "web_name", "name"];
const PREDICTED_KEYS = ["predicted_points", "pred_points", "prediction", "expected_points", "predicted"];
const ACTUAL_KEYS = ["actual_points", "points", "total_points", "fpl_points"];
const POSITION_KEYS = ["position", "pos"];
const TEAM_KEYS = ["team_name", "club", "team"];
const HIDDEN = new Set(["id", "created_at", "updated_at", ...WEEK_KEYS]);
const POSITION_ORDER = ["GKP", "GK", "DEF", "MID", "FWD", "FOR"];

function value(row: Row, keys: string[]) { const key = keys.find((candidate) => row[candidate] !== null && row[candidate] !== undefined && row[candidate] !== ""); return key ? row[key] : null; }
function text(item: unknown) { return item === null || item === undefined || item === "" ? "—" : String(item); }
function number(item: unknown) { const parsed = Number(item); return Number.isFinite(parsed) ? parsed : null; }
function label(key: string) { return key.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function weekOf(row: Row) { return text(value(row, WEEK_KEYS)) === "—" ? "Latest" : text(value(row, WEEK_KEYS)); }
function groupRows(rows: Row[]): Week[] { const grouped = new Map<string, Row[]>(); for (const row of rows) grouped.set(weekOf(row), [...(grouped.get(weekOf(row)) ?? []), row]); return [...grouped].sort((a, b) => Number(b[0]) - Number(a[0])).map(([label, rows]) => ({ label, rows })); }
function position(row: Row) { return text(value(row, POSITION_KEYS)).toUpperCase(); }

function PlayerCard({ row, index, fields }: { row: Row; index: number; fields: string[] }) {
  const predicted = number(value(row, PREDICTED_KEYS));
  const actual = number(value(row, ACTUAL_KEYS));
  const difference = predicted !== null && actual !== null ? actual - predicted : null;
  const name = text(value(row, NAME_KEYS));
  const details = fields.filter((field) => ![...WEEK_KEYS, ...PREDICTED_KEYS, ...ACTUAL_KEYS, ...NAME_KEYS, ...POSITION_KEYS, ...TEAM_KEYS].includes(field));
  return <article className="group relative flex min-h-[178px] w-full flex-col items-center rounded-2xl border border-white/10 bg-[#102039]/95 px-3 pb-3 pt-4 shadow-lg transition hover:-translate-y-1 hover:border-[var(--accent)]/70 hover:shadow-[0_12px_30px_rgba(0,0,0,.25)]">
    <span className="absolute left-2 top-2 rounded-md bg-white/10 px-1.5 py-0.5 text-[9px] font-bold text-[var(--muted)]">{position(row) || `#${index + 1}`}</span>
    <div className="mb-2 flex size-12 items-center justify-center rounded-full border-2 border-[var(--accent)]/50 bg-[var(--accent)]/10 text-lg font-black text-[var(--accent)]">{name.slice(0, 1).toUpperCase()}</div>
    <h3 className="w-full truncate text-center text-sm font-extrabold">{name}</h3>
    <p className="w-full truncate text-center text-[10px] text-[var(--muted)]">{text(value(row, TEAM_KEYS))}</p>
    <div className="mt-3 grid w-full grid-cols-2 gap-1.5 text-center"><div className="rounded-lg bg-[var(--accent)]/10 px-1 py-1.5"><span className="block text-[9px] uppercase tracking-wide text-[var(--muted)]">Pred</span><b className="text-sm text-[var(--accent)]">{predicted ?? "—"}</b></div><div className="rounded-lg bg-black/20 px-1 py-1.5"><span className="block text-[9px] uppercase tracking-wide text-[var(--muted)]">Actual</span><b className="text-sm">{actual ?? "—"}</b></div></div>
    <p className={`mt-1 text-[9px] font-bold ${difference === null ? "text-[var(--muted)]" : difference >= 0 ? "text-emerald-300" : "text-rose-300"}`}>{difference === null ? "Awaiting result" : `${difference >= 0 ? "+" : ""}${difference} vs predicted`}</p>
    {details.length > 0 && <dl className="sr-only">{details.map((field) => <div key={field}><dt>{label(field)}</dt><dd>{text(row[field])}</dd></div>)}</dl>}
  </article>;
}

function WeekCard({ week, index, fields }: { week: Week; index: number; fields: string[] }) {
  const predicted = week.rows.reduce((sum, row) => sum + (number(value(row, PREDICTED_KEYS)) ?? 0), 0);
  const actualValues = week.rows.map((row) => number(value(row, ACTUAL_KEYS))).filter((item): item is number => item !== null);
  const actual = actualValues.length ? actualValues.reduce((sum, item) => sum + item, 0) : null;
  const groups = POSITION_ORDER.map((slot) => week.rows.filter((row) => position(row) === slot)).filter((rows) => rows.length);
  const groupedRows = groups.length ? groups : [week.rows];
  return <section className="card overflow-hidden p-4 sm:p-6" aria-labelledby={`week-${index}`}>
    <div className="mb-6 flex flex-col gap-4 border-b border-[var(--border)] pb-5 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-2xl bg-[var(--accent)] text-lg font-black text-[#08111f]">{week.label}</span><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent2)]">Best XI selection</p><h2 id={`week-${index}`} className="text-2xl font-black">Gameweek {week.label}</h2></div></div><div className="grid grid-cols-3 gap-2 text-center text-xs"><div className="rounded-xl border border-[var(--border)] px-3 py-2"><b className="block text-base">{week.rows.length}</b><span className="text-[var(--muted)]">players</span></div><div className="rounded-xl border border-[var(--border)] px-3 py-2"><b className="block text-base text-[var(--accent)]">{predicted.toFixed(1)}</b><span className="text-[var(--muted)]">predicted</span></div><div className="rounded-xl border border-[var(--border)] px-3 py-2"><b className="block text-base">{actual === null ? "—" : actual.toFixed(1)}</b><span className="text-[var(--muted)]">actual</span></div></div></div>
    <div className="space-y-5">{groupedRows.map((rows, groupIndex) => <div key={`${week.label}-${groupIndex}`}><p className="mb-2 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">{position(rows[0]) === "GKP" || position(rows[0]) === "GK" ? "Goalkeeper" : position(rows[0]) === "DEF" ? "Defenders" : position(rows[0]) === "MID" ? "Midfielders" : position(rows[0]) === "FWD" || position(rows[0]) === "FOR" ? "Forwards" : "Squad"}</p><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{rows.map((row, playerIndex) => <PlayerCard key={`${week.label}-${playerIndex}-${text(value(row, NAME_KEYS))}`} row={row} index={playerIndex} fields={fields} />)}</div></div>)}</div>
  </section>;
}

export default function BestElevenPage() {
  const [rows, setRows] = useState<Row[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null);
  useEffect(() => { fetch("/api/best-eleven").then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "Unable to load Best 11"); setRows(data.rows ?? []); }).catch((reason: Error) => setError(reason.message)).finally(() => setLoading(false)); }, []);
  const { weeks, fields } = useMemo(() => { const available = [...new Set(rows.flatMap((row) => Object.keys(row)))].filter((field) => !HIDDEN.has(field)); return { weeks: groupRows(rows), fields: available }; }, [rows]);
  return <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12"><header className="relative mb-8 overflow-hidden rounded-3xl border border-[var(--border)] bg-gradient-to-br from-[#172b22] via-[#10233a] to-[#0b1425] p-6 shadow-2xl sm:mb-10 sm:p-10"><div className="absolute -right-12 -top-20 size-56 rounded-full bg-[var(--accent)]/10 blur-3xl" /><p className="relative mb-3 text-xs font-bold uppercase tracking-[0.24em] text-[var(--accent)]">Offside picks</p><div className="relative"><h1 className="text-4xl font-black tracking-tight sm:text-6xl">Best <span className="text-[var(--accent)]">11</span></h1><p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)] sm:text-base">Every gameweek, see the same player-card squad view as the manager page — with predictions and actual points side by side.</p></div></header>{loading && <div className="card p-8 text-center text-[var(--muted)]">Loading Best 11…</div>}{error && <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-5 text-rose-300">{error}</div>}{!loading && !error && rows.length === 0 && <div className="card p-8 text-center text-[var(--muted)]">No Best 11 data is available yet.</div>}{!loading && !error && weeks.length > 0 && <div className="space-y-5">{weeks.map((week, index) => <WeekCard key={week.label} week={week} index={index} fields={fields} />)}</div>}</main>;
}
