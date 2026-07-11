import { playlist, Track } from "@/lib/playlist";

export interface CatalogMatch {
  title: string;
  artist: string;
  trackKey: string;
}

// Lowercase, strip punctuation and collapse whitespace so that user input and
// Live365 metadata compare cleanly ("Midnight Drive!" === "midnight drive").
export function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/\([^)]*\)|\[[^\]]*\]/g, " ") // drop "(remix)", "[live]" etc.
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function trackKey(title: string, artist?: string): string {
  return `${normalize(title)}|${normalize(artist ?? "")}`;
}

// A request matches an owned track when the normalized query contains the
// track's normalized title (and, if given, is consistent with the artist).
// This is intentionally conservative: only tracks we actually own can play.
export function matchCatalog(query: string): CatalogMatch | null {
  const q = normalize(query);
  if (!q) return null;

  let best: { track: Track; score: number } | null = null;
  for (const track of playlist) {
    const title = normalize(track.title);
    const artist = normalize(track.artist);
    if (!title) continue;

    let score = 0;
    if (q === title) score = 100;
    else if (q.includes(title)) score = 60 + title.length;
    else if (title.includes(q) && q.length >= 4) score = 40 + q.length;

    if (score > 0 && artist && q.includes(artist)) score += 10;

    if (score > 0 && (!best || score > best.score)) best = { track, score };
  }

  if (!best) return null;
  return {
    title: best.track.title,
    artist: best.track.artist,
    trackKey: trackKey(best.track.title, best.track.artist),
  };
}
