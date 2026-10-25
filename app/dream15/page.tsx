"use client";

import { useEffect, useMemo, useState } from "react";

type BestElevenRow = Record<string, unknown>;

const PRIORITY_FIELDS = ["player_name", "web_name", "name", "position", "club", "team_name", "prediction", "pred_points", "points", "price", "cost", "gameweek", "gw"];
const HIDDEN_FIELDS = new Set(["id", "created_at", "updated_at"]);

function labelFor(key: string) {
  return key.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function displayValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
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

  const fields = useMemo(() => {
    const available = [...new Set(rows.flatMap((row) => Object.keys(row)))].filter((field) => !HIDDEN_FIELDS.has(field));
    return [...PRIORITY_FIELDS.filter((field) => available.includes(field)), ...available.filter((field) => !PRIORITY_FIELDS.includes(field))];
  }, [rows]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="relative mb-8 overflow-hidden rounded-3xl border border-[var(--border)] bg-gradient-to-br from-[#172b22] via-[#10233a] to-[#0b1425] p-6 shadow-2xl sm:p-10">
        <div className="absolute -right-12 -top-20 size-56 rounded-full bg-[var(--accent)]/10 blur-3xl" />
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-[var(--accent)]">Offside picks</p>
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight sm:text-6xl">Best <span className="text-[var(--accent)]">11</span></h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)] sm:text-base">The strongest predicted starting XI, pulled directly from the latest model output.</p>
          </div>
          <div className="flex gap-2 text-center">
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3"><div className="text-2xl font-black text-[var(--accent)]">{rows.length}</div><div className="text-[10px] uppercase tracking-wider text-[var(--muted)]">Players</div></div>
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3"><div className="text-2xl font-black text-[var(--accent2)]">{fields.length}</div><div className="text-[10px] uppercase tracking-wider text-[var(--muted)]">Details</div></div>
          </div>
        </div>
      </header>

      {loading && <div className="card p-8 text-center text-[var(--muted)]">Loading the latest Best 11…</div>}
      {error && <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-5 text-rose-300">{error}</div>}
      {!loading && !error && rows.length === 0 && <div className="card p-8 text-center text-[var(--muted)]">No Best 11 data is available yet.</div>}

      {!loading && !error && rows.length > 0 && (
        <section aria-label="Best 11 player details" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row, index) => {
            const titleField = PRIORITY_FIELDS.find((field) => row[field] != null) ?? fields[0];
            const title = displayValue(row[titleField]);
            const detailFields = fields.filter((field) => field !== titleField);
            return <article key={`${title}-${index}`} className="card overflow-hidden p-5 transition hover:-translate-y-1 hover:border-[var(--accent)]/60">
              <div className="mb-4 flex items-start justify-between gap-3 border-b border-[var(--border)] pb-4">
                <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">Pick {index + 1}</p><h2 className="mt-1 text-xl font-extrabold">{title}</h2></div>
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)]/15 text-sm font-black text-[var(--accent)]">{index + 1}</span>
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                {detailFields.map((field) => <div key={field} className="min-w-0"><dt className="truncate text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">{labelFor(field)}</dt><dd className="mt-0.5 truncate text-sm font-semibold">{displayValue(row[field])}</dd></div>)}
              </dl>
            </article>;
          })}
        </section>
      )}
    </main>
  );
}
