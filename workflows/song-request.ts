import { sleep } from "workflow";
import { trackKey } from "@/lib/requests/catalog";
import { fetchCurrentTrack } from "@/lib/requests/nowplaying";
import { getStore } from "@/lib/requests/store";
import { dmUser } from "@/lib/slack";
import type { SongRequest } from "@/lib/requests/types";

// How often to check what is airing, and how long to keep waiting before a
// request is parked in "should purchase". Fixed at module load so the workflow
// loop is deterministic across replays.
const POLL_SECONDS = Number(process.env.SONG_REQUEST_POLL_SECONDS || "180");
const TTL_DAYS = Number(process.env.SONG_REQUEST_TTL_DAYS || "14");
const MAX_POLLS = Math.max(1, Math.ceil((TTL_DAYS * 86400) / POLL_SECONDS));

// A song request never reorders the broadcast queue. It simply watches the
// station and, if the requested track airs on its own, notifies the requester
// in real time. If it never airs within the window, it becomes a
// "should purchase" wishlist item. This keeps the station non-interactive,
// which is what keeps it inside the DMCA statutory webcasting license.
export async function songRequestWorkflow(request: SongRequest) {
  "use workflow";

  await persistRequest(request);

  // Not something we own, so it can't legally air. Straight to the wishlist.
  if (!request.matchedTitle) {
    await parkForPurchase(request, "not-in-catalog");
    await notify(
      request,
      `That one isn't in the compute.fm library yet, so I can't spin it. I've added "${request.query}" to the should-purchase list. 🛒`
    );
    return;
  }

  for (let i = 0; i < MAX_POLLS; i++) {
    if (await isAiringNow(request.trackKey)) {
      await markPlayed(request);
      await notify(
        request,
        `🎵 Your request is playing right now on compute.fm: *${request.matchedTitle}* by ${request.matchedArtist}. Tune in: https://compute.fm`
      );
      return;
    }
    await sleep(`${POLL_SECONDS}s`);
  }

  // Waited the whole window and it never came up in rotation.
  await parkForPurchase(request, "expired");
  await notify(
    request,
    `Heads up: *${request.matchedTitle}* didn't make it into rotation, so I've moved it to the should-purchase list. 🛒`
  );
}

async function persistRequest(request: SongRequest) {
  "use step";
  await getStore().createRequest(request);
}

async function isAiringNow(key: string): Promise<boolean> {
  "use step";
  const current = await fetchCurrentTrack();
  if (!current) return false;
  return trackKey(current.title, current.artist) === key;
}

async function markPlayed(request: SongRequest) {
  "use step";
  await getStore().updateRequestStatus(request.id, "played");
}

async function parkForPurchase(
  request: SongRequest,
  reason: "not-in-catalog" | "expired"
) {
  "use step";
  const store = getStore();
  await store.updateRequestStatus(request.id, "should-purchase", { reason });
  await store.addToWishlist({
    trackKey: request.trackKey,
    title: request.matchedTitle || request.query,
    artist: request.matchedArtist,
  });
}

async function notify(request: SongRequest, text: string) {
  "use step";
  await dmUser(request.slackUserId, text);
}
