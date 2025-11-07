"use client";

import { useEffect, useMemo, useState } from "react";
import type { Match } from "../lib/types";

type FetchState = {
  matches: Match[];
  lastUpdated: string | null;
  loading: boolean;
  error: string | null;
};

const REFRESH_MS = 15000;

export default function HomePage() {
  const [state, setState] = useState<FetchState>({ matches: [], lastUpdated: null, loading: true, error: null });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "live" | "upcoming" | "finished">("all");
  const [sort, setSort] = useState<"time" | "status">("time");

  async function load() {
    try {
      setState((s) => ({ ...s, loading: s.matches.length === 0 }));
      const qs = new URLSearchParams();
      if (status !== "all") qs.set("status", status);
      const res = await fetch(`/api/matches?${qs.toString()}`, { next: { revalidate: 0 } });
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      const data = (await res.json()) as { matches: Match[]; fetchedAt: string };
      setState({ matches: data.matches, lastUpdated: data.fetchedAt, loading: false, error: null });
    } catch (err: any) {
      setState((s) => ({ ...s, loading: false, error: err?.message ?? "Unknown error" }));
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    let list = [...state.matches];
    if (term) {
      list = list.filter((m) =>
        [m.teamA.name, m.teamB.name, m.series, m.venue].some((x) => x.toLowerCase().includes(term))
      );
    }
    if (sort === "status") {
      const order = { live: 0, upcoming: 1, finished: 2 } as const;
      list.sort((a, b) => order[a.status] - order[b.status] || a.startTime.localeCompare(b.startTime));
    } else {
      list.sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return list;
  }, [state.matches, search, sort]);

  return (
    <main className="space-y-6">
      <Controls
        search={search}
        onSearch={setSearch}
        status={status}
        onStatus={setStatus}
        sort={sort}
        onSort={setSort}
        loading={state.loading}
        lastUpdated={state.lastUpdated}
      />

      {state.error ? (
        <div className="card p-4 text-red-600 dark:text-red-400">{state.error}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m) => (
            <MatchCard key={m.id} match={m} />)
          )}
          {filtered.length === 0 && !state.loading && (
            <div className="col-span-full card p-6 text-center text-slate-500">No matches</div>
          )}
        </div>
      )}
    </main>
  );
}

function Controls(props: {
  search: string;
  onSearch: (v: string) => void;
  status: "all" | "live" | "upcoming" | "finished";
  onStatus: (v: "all" | "live" | "upcoming" | "finished") => void;
  sort: "time" | "status";
  onSort: (v: "time" | "status") => void;
  loading: boolean;
  lastUpdated: string | null;
}) {
  const { search, onSearch, status, onStatus, sort, onSort, loading, lastUpdated } = props;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
      <div className="lg:col-span-2">
        <label className="block text-sm font-medium mb-1">Search</label>
        <input className="field" placeholder="Teams, series, venue..." value={search} onChange={(e) => onSearch(e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Status</label>
        <select className="field" value={status} onChange={(e) => onStatus(e.target.value as any)}>
          <option value="all">All</option>
          <option value="live">Live</option>
          <option value="upcoming">Upcoming</option>
          <option value="finished">Finished</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Sort</label>
        <select className="field" value={sort} onChange={(e) => onSort(e.target.value as any)}>
          <option value="time">Start time</option>
          <option value="status">Status</option>
        </select>
      </div>
      <div className="sm:col-span-2 lg:col-span-1 flex items-center gap-3 text-sm text-slate-500">
        <span className="shrink-0">{loading ? "Refreshing..." : "Updated:"}</span>
        <span className="truncate">{lastUpdated ? new Date(lastUpdated).toLocaleString() : "?"}</span>
      </div>
    </div>
  );
}

function MatchCard({ match }: { match: Match }) {
  const statusBadge =
    match.status === "live" ? (
      <span className="badge-live">Live</span>
    ) : match.status === "upcoming" ? (
      <span className="badge-upcoming">Upcoming</span>
    ) : (
      <span className="badge-finished">Finished</span>
    );

  return (
    <article className="card p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs text-slate-500">{match.series}</div>
          <h3 className="font-semibold truncate">{match.teamA.name} vs {match.teamB.name}</h3>
        </div>
        {statusBadge}
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <TeamScore name={match.teamA.name} score={match.teamA.score} overs={match.teamA.overs} isBatting={match.batting === "A"} />
        <TeamScore name={match.teamB.name} score={match.teamB.score} overs={match.teamB.overs} isBatting={match.batting === "B"} align="right" />
      </div>

      <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between">
        <span>{match.venue}</span>
        <span>{new Date(match.startTime).toLocaleString()}</span>
      </div>

      <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {match.note}
      </div>
    </article>
  );
}

function TeamScore({ name, score, overs, isBatting, align }: { name: string; score: string; overs: number | null; isBatting: boolean; align?: "left" | "right" }) {
  return (
    <div className={`flex flex-col ${align === "right" ? "items-end" : "items-start"}`}>
      <div className="flex items-center gap-2">
        <span className="font-semibold">{name}</span>
        {isBatting && <span className="text-xs text-emerald-600 dark:text-emerald-400">?</span>}
      </div>
      <div className="text-lg tabular-nums">
        {score || "?"} {overs !== null && <span className="text-xs text-slate-500">({overs.toFixed(1)} ov)</span>}
      </div>
    </div>
  );
}
