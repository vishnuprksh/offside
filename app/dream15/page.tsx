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

function value(row: Row, keys: string[]) {
  const key = keys.find((candidate) => row[candidate] !== null && row[candidate] !== undefined && row[candidate] !== "");
  return key ? row[key] : null;
}
function text(item: unknown) { return item === null || item === undefined || item === "" ? "—" : String(item); }
function number(item: unknown) { const parsed = Number(item); return Number.isFinite(parsed) ? parsed : null; }
function label(key: string) { return key.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function weekOf(row: Row) { return text(value(row, WEEK_KEYS)) === "—" ? "Latest" : text(value(row, WEEK_KEYS)); }
function groupRows(rows: Row[]): Week[] {
  const grouped = new Map<string, Row[]>();
  for (const row of rows) grouped.set(weekOf(row), [...(grouped.get(weekOf(row)) ?? []), row]);
  return [...grouped].sort((a, b) => Number(b[0]) - Number(a[0])).map(([label, rows]) => ({ label, rows }));
}

function PlayerCard({ row, index, fields }: { row: Row; index: number; fields: string[] }) {
  const predicted = number(value(row, PREDICTED_KEYS));
  const actual = number(value(row, ACTUAL_KEYS));
  const difference = predicted !== null && actual !== null ? actual - predicted : null;
  const name = text(value(row, NAME_KEYS));
  const details = fields.filter((field) => ![...WEEK_KEYS, ...PREDICTED_KEYS, ...ACTUAL_KEYS, ...NAME_KEYS].includes(field));

  return <article className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[#102039]/90 p-4 transition hover:-translate-y-1 hover:border-[var(--accent)]/60 hover:shadow-xl sm:p-5">
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">Pick {index + 1}</p><h3 className="mt-1 truncate text-lg font-extrabold">{name}</h3><p className="mt-1 text-xs text-[var(--muted)]">{text(value(row, POSITION_KEYS))} · {text(value(row, TEAM_KEYS))}</p></div>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)]/15 font-black text-[var(--accent)]">{index + 1}</span>
    </div>
    <div className="mb-4 grid grid-cols-2 gap-2">
      <div className="rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/10 p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">Predicted</p><p className="mt-1 text-2xl font-black text-[var(--accent)]">{predicted ?? "—"}</p><p className="text-[10px] text-[var(--muted)]">points</p></div>
      <div className="rounded-xl border border-white/10 bg-black/15 p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">Actual</p><p className="mt-1 text-2xl font-black">{actual ?? "—"}</p><p className={`text-[10px] font-bold ${difference === null ? "text-[var(--muted)]" : difference >= 0 ? "text-emerald-300" : "text-rose-300"}`}>{difference === null ? "Not available" : `${difference >= 0 ? "+" : ""}${difference} vs prediction`}</p></div>
    </div>
    {details.length > 0 && <dl className="grid grid-cols-2 gap-x-3 gap-y-3 border-t border-[var(--border)] pt-4">{details.map((field) => <div key={field} className="min-w-0"><dt className="truncate text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">{label(field)}</dt><dd className="mt-0.5 truncate text-sm font-semibold">{text(row[field])}</dd></div>)}</dl>}
  </article>;
}

function WeekCard({ week, index, fields }: { week: Week; index: number; fields: string[] }) {
  const predicted = week.rows.reduce((sum, row) => sum + (number(value(row, PREDICTED_KEYS)) ?? 0), 0);
  const actualValues = week.rows.map((row) => number(value(row, ACTUAL_KEYS))).filter((item): item is number => item !== null);
  const actual = actualValues.length ? actualValues.reduce((sum, item) => sum + item, 0) : null;
  return <section className="card overflow-hidden p-4 sm:p-6" aria-labelledby={`week-${index}`}>
    <div className="mb-5 flex flex-col gap-4 border-b border-[var(--border)] pb-5 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-2xl bg-[var(--accent)] text-lg font-black text-[#08111f]">{week.label}</span><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent2)]">Gameweek squad</p><h2 id={`week-${index}`} className="text-2xl font-black">Gameweek {week.label}</h2></div></div><div className="grid grid-cols-3 gap-2 text-center text-xs"><div className="rounded-xl border border-[var(--border)] px-3 py-2"><b className="block text-base">{week.rows.length}</b><span className="text-[var(--muted)]">players</span></div><div className="rounded-xl border border-[var(--border)] px-3 py-2"><b className="block text-base text-[var(--accent)]">{predicted.toFixed(1)}</b><span className="text-[var(--muted)]">predicted</span></div><div className="rounded-xl border border-[var(--border)] px-3 py-2"><b className="block text-base">{actual === null ? "—" : actual.toFixed(1)}</b><span className="text-[var(--muted)]">actual</span></div></div></div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{week.rows.map((row, playerIndex) => <PlayerCard key={`${week.label}-${playerIndex}`} row={row} index={playerIndex} fields={fields} />)}</div>
  </section>;
}

export default function BestElevenPage() {
  const [rows, setRows] = useState<Row[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null);
  useEffect(() => { fetch("/api/best-eleven").then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "Unable to load Best 11"); setRows(data.rows ?? []); }).catch((reason: Error) => setError(reason.message)).finally(() => setLoading(false)); }, []);
  const { weeks, fields } = useMemo(() => { const available = [...new Set(rows.flatMap((row) => Object.keys(row)))].filter((field) => !HIDDEN.has(field)); return { weeks: groupRows(rows), fields: available }; }, [rows]);
  return <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12"><header className="relative mb-8 overflow-hidden rounded-3xl border border-[var(--border)] bg-gradient-to-br from-[#172b22] via-[#10233a] to-[#0b1425] p-6 shadow-2xl sm:mb-10 sm:p-10"><div className="absolute -right-12 -top-20 size-56 rounded-full bg-[var(--accent)]/10 blur-3xl" /><p className="relative mb-3 text-xs font-bold uppercase tracking-[0.24em] text-[var(--accent)]">Offside picks</p><div className="relative"><h1 className="text-4xl font-black tracking-tight sm:text-6xl">Best <span className="text-[var(--accent)]">11</span></h1><p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)] sm:text-base">Every player, every gameweek: compare predicted points with the actual result.</p></div></header>{loading && <div className="card p-8 text-center text-[var(--muted)]">Loading Best 11…</div>}{error && <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-5 text-rose-300">{error}</div>}{!loading && !error && rows.length === 0 && <div className="card p-8 text-center text-[var(--muted)]">No Best 11 data is available yet.</div>}{!loading && !error && weeks.length > 0 && <div className="space-y-5">{weeks.map((week, index) => <WeekCard key={week.label} week={week} index={index} fields={fields} />)}</div>}</main>;
}
