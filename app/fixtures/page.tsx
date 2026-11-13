"use client";

import { useEffect, useMemo, useState } from "react";

type FixtureRow = {
  fixture_id: number;
  event: number | null;
  kickoff_time: string | null;
  team_h: number;
  team_a: number;
  team_h_name: string;
  team_a_name: string;
  prob_home_win: number | null;
  prob_draw: number | null;
  prob_away_win: number | null;
  lambda_home: number | null;
  lambda_away: number | null;
  home_score: number | null;
  away_score: number | null;
  finished: boolean;
};

const HEADER_BG = "bg-[#0d1526]";

const XG_MIN = 0.5;
const XG_MAX = 2.5;

function xgColor(value: number | null | undefined, mode: "attack" | "defense"): string {
  if (value == null || !Number.isFinite(value)) return "transparent";
  const strength = Math.max(0, Math.min(1, (value - XG_MIN) / (XG_MAX - XG_MIN)));
  const advantage = mode === "attack" ? strength : 1 - strength;
  if (advantage < 0.5) {
    const t = advantage / 0.5;
    return `rgb(${Math.round(239 + (245 - 239) * t)}, ${Math.round(68 + (158 - 68) * t)}, ${Math.round(68 + (11 - 68) * t)})`;
  }
  const t = (advantage - 0.5) / 0.5;
  return `rgb(${Math.round(245 + (34 - 245) * t)}, ${Math.round(158 + (197 - 158) * t)}, ${Math.round(11 + (94 - 11) * t)})`;
}

function MetricTable({
  title,
  description,
  schedule,
  nameById,
  metric,
}: {
  title: string;
  description: string;
  schedule: { teamId: number; cells: { ev: number; fixture: FixtureRow | null }[] }[];
  nameById: Map<number, string>;
  metric: "attack" | "defense";
}) {
  return (
    <section className="mt-6">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-bold tracking-tight">{title}</h2>
        <p className="text-xs text-[var(--muted)]">{description}</p>
      </div>
      <div className="max-h-[65vh] overflow-auto rounded-lg border border-[var(--border)]">
        <table className="border-collapse text-[11px]" style={{ minWidth: "max-content" }}>
          <thead>
            <tr>
              <th className={`sticky left-0 z-10 ${HEADER_BG} px-3 py-2 text-left text-[10px] uppercase tracking-wide text-[var(--muted)]`}>Team</th>
              {schedule[0]?.cells.map(({ ev }) => (
                <th key={ev} className={`${HEADER_BG} py-2 text-center font-semibold`}><span className="block w-[100px] text-[10px]">GW{ev}</span></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {schedule.map(({ teamId, cells }) => (
              <tr key={teamId} className="border-t border-[var(--border)]">
                <th className={`sticky left-0 z-10 ${HEADER_BG} px-3 py-1 text-left font-semibold whitespace-nowrap`}>{nameById.get(teamId)}</th>
                {cells.map(({ ev, fixture }) => {
                  if (!fixture) return <td key={ev} className="px-1 py-2 text-center text-[var(--muted)] opacity-40">·</td>;
                  const home = Number(fixture.team_h) === teamId;
                  const opponent = home ? fixture.team_a_name : fixture.team_h_name;
                  const expectedGoals = metric === "attack"
                    ? (home ? fixture.lambda_home : fixture.lambda_away)
                    : (home ? fixture.lambda_away : fixture.lambda_home);
                  const venue = home ? "vs" : "@";
                  const isPast = fixture.finished || Boolean(fixture.kickoff_time && new Date(fixture.kickoff_time).getTime() < Date.now());
                  const color = xgColor(expectedGoals, metric);
                  const textColor = expectedGoals != null && ((metric === "attack" && expectedGoals >= 1.5) || (metric === "defense" && expectedGoals <= 1.5)) ? "text-black/80" : "text-white/95";
                  const label = metric === "attack" ? "xG for" : "xG against";
                  return (
                    <td key={ev} className="p-[2px]">
                      <div title={`${fixture.team_h_name} ${fixture.home_score ?? "–"} : ${fixture.away_score ?? "–"} ${fixture.team_a_name}\n${label}: ${expectedGoals?.toFixed(2) ?? "—"} · ${fmtKickoff(fixture.kickoff_time)}`} className={`flex h-12 w-[100px] flex-col items-center justify-center rounded ${isPast ? "bg-slate-700/70 text-slate-300" : textColor}`} style={isPast ? undefined : { backgroundColor: color }}>
                        <span className="w-full truncate px-1 text-center text-[10px] font-semibold">{venue} {opponent}</span>
                        <span className="text-[10px] font-bold">{expectedGoals != null ? expectedGoals.toFixed(2) : "—"} {metric === "attack" ? "xGF" : "xGA"}</span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function fmtKickoff(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
    " " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });
}

export default function FixturesPage() {
  const [fixtures, setFixtures] = useState<FixtureRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gw, setGw] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    setFixtures(null);
    fetch(`/api/fixture-matrix${gw ? `?gw=${encodeURIComponent(gw)}` : ""}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`API ${res.status}`);
        return res.json();
      })
      .then((json) => { if (!cancelled) setFixtures(json.fixtures ?? []); })
      .catch((e) => { if (!cancelled) setError(e.message ?? "Failed to load"); });
    return () => { cancelled = true; };
  }, [gw]);

  const teamIds = useMemo(() => {
    if (!fixtures) return [];
    const s = new Set<number>();
    for (const f of fixtures) { s.add(Number(f.team_h)); s.add(Number(f.team_a)); }
    return [...s].sort((a, b) => a - b);
  }, [fixtures]);

  const nameById = useMemo(() => {
    const m = new Map<number, string>();
    if (fixtures) for (const f of fixtures) {
      if (!m.has(Number(f.team_h))) m.set(Number(f.team_h), f.team_h_name);
      if (!m.has(Number(f.team_a))) m.set(Number(f.team_a), f.team_a_name);
    }
    return m;
  }, [fixtures]);

  const events = useMemo(() => {
    if (!fixtures) return [];
    const s = new Set<number>();
    for (const f of fixtures) if (f.event != null) s.add(Number(f.event));
    return [...s].sort((a, b) => a - b);
  }, [fixtures]);

  /** weeks × teams: each cell = the row team's fixture in that gameweek */
  const schedule = useMemo(() => {
    if (!fixtures) return [];
    const byTeamGw = new Map<string, FixtureRow>();
    for (const f of fixtures) {
      if (f.event == null) continue;
      byTeamGw.set(`${f.team_h}-${f.event}`, f);
      byTeamGw.set(`${f.team_a}-${f.event}`, f);
    }
    return teamIds.map((teamId) => ({
      teamId,
      cells: events.map((ev) => ({ ev, fixture: byTeamGw.get(`${teamId}-${ev}`) ?? null })),
    }));
  }, [fixtures, teamIds, events]);

  return (
    <main className="mx-auto max-w-[1400px] px-2 py-6">
      <h1 className="text-2xl font-extrabold tracking-tight">Fixture advantages</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Compare each team&apos;s expected goals for and against by gameweek. Values come from the same Poisson model as the match probabilities; greener cells indicate the stronger FPL matchup.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-[var(--muted)]">GW</span>
          <input
            value={gw}
            onChange={(e) => setGw(e.target.value)}
            placeholder="all"
            className="w-20 rounded-md border border-[var(--border)] bg-[#0d1526] px-2 py-1 text-sm"
          />
        </label>
      </div>

      {error && <p className="mt-4 text-sm text-red-400">Failed to load: {error}</p>}
      {!fixtures && !error && <p className="mt-4 text-sm text-[var(--muted)]">Loading…</p>}

      {fixtures && (
        <>
          <p className="mt-3 text-xs text-[var(--muted)]">
            {fixtures.length} fixtures · gameweeks {events.length ? `${events[0]}–${events[events.length - 1]}` : "—"}
          </p>
          <MetricTable
            title="Attacking advantage"
            description="Expected goals for (xGF) · higher is better"
            schedule={schedule}
            nameById={nameById}
            metric="attack"
          />
          <MetricTable
            title="Defensive advantage"
            description="Expected goals against (xGA) · lower is better"
            schedule={schedule}
            nameById={nameById}
            metric="defense"
          />
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
            <span>Less favorable</span>
            <span className="h-2 w-40 rounded" style={{ background: "linear-gradient(to right, rgb(239,68,68), rgb(245,158,11), rgb(34,197,94))" }} />
            <span>More favorable</span>
            <span className="ml-1">· Colors use the modeled xG scale (0.5–2.5)</span>
          </div>
        </>
      )}
    </main>
  );
}
