import { channels } from "@/lib/channels";

export interface CurrentTrack {
  title: string;
  artist: string;
}

function stationId(): string {
  return process.env.COMPUTE_FM_STATION_ID || channels[0]?.stationId || "";
}

// Reads what is airing right now from Live365. Returns null on any failure so
// callers (the polling workflow) simply try again on the next tick.
export async function fetchCurrentTrack(): Promise<CurrentTrack | null> {
  const id = stationId();
  if (!id) return null;
  try {
    const res = await fetch(`https://api.live365.com/station/${id}`, {
      headers: { "User-Agent": "compute.fm/1.0" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      "current-track"?: { title?: string; artist?: string };
    };
    const current = data["current-track"];
    if (!current?.title) return null;
    return { title: current.title, artist: current.artist ?? "" };
  } catch {
    return null;
  }
}
