import { NextResponse } from "next/server";
import { fetchPlayers, fetchPredictions } from "@/lib/db";
import { fetchFplJson } from "@/lib/fpl";

/*
## Objective
Enrich database-backed player rows with official FPL event transfer data.

## Changelog
| # | date       | details | reasoning | reference |
|---|------------|---------|-----------|-----------|
| 1 | 2026-10-09 | Added current-event net transfers from bootstrap-static. | Reuse the existing official API join to supply the Players market without another request or DB field. | User request |

## Results/Takeaways
Net event transfers are transfers_in_event minus transfers_out_event from the official bootstrap-static element.
*/

export async function GET() {
  try {
    const [players, predictions, bootstrap] = await Promise.all([
      fetchPlayers(),
      fetchPredictions(),
      fetchFplJson("bootstrap-static/"),
    ]);
    const fplPlayerById = new Map<number, any>(bootstrap.elements.map((player: any) => [player.id, player]));
    const playersWithInjury = players.map((player) => {
      const fplPlayer = fplPlayerById.get(player.player_id);
      const chance = typeof fplPlayer?.chance_of_playing_next_round === "number"
        ? fplPlayer.chance_of_playing_next_round
        : null;
      return {
        ...player,
        chance_of_playing_next_round: chance,
        injury_percent: chance == null ? null : 100 - chance,
        net_transfers_event: fplPlayer
          ? fplPlayer.transfers_in_event - fplPlayer.transfers_out_event
          : null,
      };
    });
    return NextResponse.json({ players: playersWithInjury, predictions });
  } catch (e: any) {
    return NextResponse.json({ error: `Database error: ${e.message}` }, { status: 500 });
  }
}
