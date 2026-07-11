import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { start } from "workflow/api";
import { matchCatalog, trackKey } from "@/lib/requests/catalog";
import { verifySlackSignature } from "@/lib/slack";
import type { SongRequest } from "@/lib/requests/types";
import { songRequestWorkflow } from "@/workflows/song-request";

export const dynamic = "force-dynamic";

const TTL_DAYS = Number(process.env.SONG_REQUEST_TTL_DAYS || "14");

// Slash-command handler for `/request <song>`. Slack requires a response within
// 3 seconds, so we verify, kick off the durable workflow, and ack immediately.
export async function POST(req: Request) {
  const raw = await req.text();
  const timestamp = req.headers.get("x-slack-request-timestamp");
  const signature = req.headers.get("x-slack-signature");

  if (!verifySlackSignature(raw, timestamp, signature)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const params = new URLSearchParams(raw);
  const query = (params.get("text") || "").trim();
  const userId = params.get("user_id") || "";
  const channelId = params.get("channel_id") || "";
  const userName = params.get("user_name") || undefined;

  if (!query) {
    return NextResponse.json({
      response_type: "ephemeral",
      text: "Usage: `/request <song name>` — I'll ping you when it airs.",
    });
  }

  const match = matchCatalog(query);
  const now = Date.now();
  const request: SongRequest = {
    id: randomUUID(),
    trackKey: match ? match.trackKey : trackKey(query),
    query,
    matchedTitle: match?.title,
    matchedArtist: match?.artist,
    slackUserId: userId,
    slackChannelId: channelId,
    slackUserName: userName,
    status: "pending",
    createdAt: now,
    updatedAt: now,
    expiresAt: now + TTL_DAYS * 86_400_000,
  };

  // Fire-and-forget: the workflow runs durably in the background.
  await start(songRequestWorkflow, [request]);

  const ack = match
    ? `Got it — I'll DM you when *${match.title}* airs on compute.fm. It won't skip the queue; it plays when it naturally comes up. 🎧`
    : `"${query}" isn't in the library yet, so I've noted it for the should-purchase list. 🛒`;

  return NextResponse.json({ response_type: "ephemeral", text: ack });
}
