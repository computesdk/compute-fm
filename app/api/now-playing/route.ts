import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Matches a requester marker embedded in a track title, e.g. "Song {req:@handle}"
// or "Song [req: handle]". The handle is a valid X/Twitter username.
const REQUESTER_RE = /\s*[[{]\s*req\s*:\s*@?([A-Za-z0-9_]{1,15})\s*[\]}]\s*/i;

function applyRequester(track: unknown): unknown {
  if (!track || typeof track !== "object") return track;
  const t = track as { title?: unknown; requestedBy?: string };
  if (typeof t.title !== "string") return track;
  const match = t.title.match(REQUESTER_RE);
  if (match) {
    t.requestedBy = match[1];
    t.title = t.title.replace(REQUESTER_RE, " ").trim();
  }
  return track;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const stationId = searchParams.get("stationId");

  if (!stationId) {
    return NextResponse.json({ error: "stationId required" }, { status: 400 });
  }

  try {
    const res = await fetch(`https://api.live365.com/station/${stationId}`, {
      headers: { "User-Agent": "compute.fm/1.0" },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Live365 returned ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    if (data && typeof data === "object") {
      applyRequester(data["current-track"]);
      if (Array.isArray(data["last-played"])) {
        data["last-played"].forEach(applyRequester);
      }
    }
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch from Live365" },
      { status: 502 }
    );
  }
}
