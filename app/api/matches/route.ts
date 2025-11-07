import { NextResponse } from "next/server";
import type { Match } from "../../../lib/types";
import { MOCK_MATCHES } from "../../../lib/mockData";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const status = url.searchParams.get("status");

  let matches: Match[] = MOCK_MATCHES.map((m) => ({ ...m }));

  if (status === "live" || status === "upcoming" || status === "finished") {
    matches = matches.filter((m) => m.status === status);
  }

  // simulate a tiny jitter to mock live progression for demo
  matches = matches.map((m) => {
    if (m.status === "live" && m.batting) {
      const teamKey = m.batting === "A" ? "teamA" : "teamB";
      const parts = m[teamKey].score.split("/");
      const runs = Number(parts[0].replace(/[^0-9]/g, ""));
      const wkts = Number((parts[1] ?? "0").replace(/[^0-9]/g, ""));
      const add = Math.floor(Math.random() * 3); // 0-2 runs
      const newRuns = runs + add;
      const newOvers = (m[teamKey].overs ?? 0) + 0.1;
      return {
        ...m,
        [teamKey]: {
          ...m[teamKey],
          score: `${newRuns}/${wkts}`,
          overs: Number((Math.round(newOvers * 10) / 10).toFixed(1)),
        },
      } as Match;
    }
    return m;
  });

  return NextResponse.json({ matches, fetchedAt: new Date().toISOString() });
}
