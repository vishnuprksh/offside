"use client";

import { useEffect, useMemo, useState } from "react";

type BestElevenRow = Record<string, unknown>;
type WeekGroup = { label: string; rows: BestElevenRow[] };

const PRIORITY_FIELDS = ["player_name", "web_name", "name", "position", "club", "team_name", "prediction", "pred_points", "points", "price", "cost"];
const WEEK_FIELDS = ["gameweek", "gw", "week", "week_number", "round"];
const HIDDEN_FIELDS = new Set(["id", "created_at", "updated_at", ...WEEK_FIELDS]);

function labelFor(key: string) {
  return key.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function displayValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function getWeek(row: BestElevenRow) {
  const field = WEEK_FIELDS.find((candidate) => row[candidate] !== null && row[candidate] !== undefined && row[candidate] !== "");
  return field ? displayValue(row[field]) : "Latest selection";
}

function groupByWeek(rows: BestElevenRow[]): WeekGroup[] {
  const groups = new Map<string, BestElevenRow[]>();
  rows.forEach((row) => {
    const week = getWeek(row);
    groups.set(week, [...(groups.get(week) ?? []), row]);
  });
  return [...groups.entries()].map(([label, groupedRows]) => ({ label, rows: groupedRows }));
}

function PlayerCard({ row, index, fields }: { row: BestElevenRow; index: number; fields: string[] }) {
  const titleField = PRIORITY_FIELDS.find((field) => row[field] != null) ?? fields[0];
  const title = displayValue(row[titleField]);
  const detailFields = fields.filter((field) => field !== titleField);

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[#102039]/80 p-4 transition duration-200 hover:-translate-y-1 hover:border-[var(--accent)]/60 hover:shadow-[0_16px_35px_rgba(0,0,0,0.25)] sm:p-5">
      <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-[var(--accent)]/5 blur-2xl transition group-hover:bg-[var(--accent)]/15" />
      <div className="relative mb-4 flex items-start justify-between gap-3 border-b border-[var(--border)] pb-4">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">Pick {index + 1}</p>
          <h3 className="mt-1 truncate text-lg font-extrabold tracking-tight sm:text-xl">{title}</h3>
        </div>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)]/15 text-sm font-black text-[var(--accent)]">{index + 1}</span>
      </div>
      <dl className="relative grid grid-cols-2 gap-x-3 gap-y-3">
        {detailFields.map((field) => (
          <div key={field} className="min-w-0">
            <dt className="truncate text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">{labelFor(field)}</dt>
            <dd className="mt-0.5 truncate text-sm font-semibold">{displayValue(row[field])}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

function WeekCard({ week, fields, weekIndex }: { week: WeekGroup; fields: string[]; weekIndex: number }) {
  return (
    <section className="card overflow-hidden p-4 sm:p-6" aria-labelledby={`week-${weekIndex}`}>
      <div className="mb-5 flex flex-col gap-3 border-b border-[var(--border)] pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-[var(--accent)] text-lg font-black text-[#08111f]">{weekIndex + 1}</span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent2)]">Weekly selection</p>
            <h2 id={`week-${weekIndex}`} className="text-2xl font-black tracking-tight">Week {week.label}</h2>
          </div>
        </div>
        <span className="w-fit rounded-full border border-[var(--border)] bg-black/15 px-3 py-1.5 text-xs font-semibold text-[var(--muted)]">{week.rows.length} players</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {week.rows.map((row, index) => <PlayerCard key={`${getWeek(row)}-${index}`} row={row} index={index} fields={fields} />)}
      </div>
    </section>
  );
}

export default function BestElevenPage() {
  const [rows, setRows] = useState<BestElevenRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/best-eleven")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Unable to load Best 11");
        setRows(data.rows ?? []);
      })
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoading(false));
  }, []);

  const { fields, weeks } = useMemo(() => {
    const available = [...new Set(rows.flatMap((row) => Object.keys(row)))].filter((field) => !HIDDEN_FIELDS.has(field));
    const orderedFields = [...PRIORITY_FIELDS.filter((field) => available.includes(field)), ...available.filter((field) => !PRIORITY_FIELDS.includes(field))];
    return { fields: orderedFields, weeks: groupByWeek(rows) };
  }, [rows]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="relative mb-8 overflow-hidden rounded-3xl border border-[var(--border)] bg-gradient-to-br from-[#172b22] via-[#10233a] to-[#0b1425] p-6 shadow-2xl sm:mb-10 sm:p-10">
        <div className="absolute -right-12 -top-20 size-56 rounded-full bg-[var(--accent)]/10 blur-3xl" />
        <p className="relative mb-3 text-xs font-bold uppercase tracking-[0.24em] text-[var(--accent)]">Offside picks</p>
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight sm:text-6xl">Best <span className="text-[var(--accent)]">11</span></h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)] sm:text-base">Every week&apos;s strongest predicted starting XI, presented with the details behind each pick.</p>
          </div>
          <div className="flex gap-2 text-center">
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3"><div className="text-2xl font-black text-[var(--accent)]">{weeks.length}</div><div className="text-[10px] uppercase tracking-wider text-[var(--muted)]">Weeks</div></div>
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3"><div className="text-2xl font-black text-[var(--accent2)]">{rows.length}</div><div className="text-[10px] uppercase tracking-wider text-[var(--muted)]">Players</div></div>
          </div>
        </div>
      </header>

      {loading && <div className="card p-8 text-center text-[var(--muted)]">Loading the latest Best 11…</div>}
      {error && <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-5 text-rose-300">{error}</div>}
      {!loading && !error && rows.length === 0 && <div className="card p-8 text-center text-[var(--muted)]">No Best 11 data is available yet.</div>}
      {!loading && !error && weeks.length > 0 && <div className="space-y-5">{weeks.map((week, index) => <WeekCard key={week.label} week={week} fields={fields} weekIndex={index} />)}</div>}
    </main>
  );
}
