import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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
