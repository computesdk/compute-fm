import { playlist, Track } from "./playlist";

export interface NowPlaying {
  track: Track;
  trackIndex: number;
  offset: number; // seconds into current track
  remaining: number; // seconds remaining in track
  progress: number; // 0..1 within current track
  cyclePosition: number; // seconds into full cycle
  cycleDuration: number; // total seconds in cycle
}

// The "broadcast epoch" - a fixed start time so the schedule is deterministic.
// All clients compute the same position from this anchor.
const EPOCH = new Date("2024-01-01T00:00:00Z").getTime();

export function getCycleDuration(): number {
  return playlist.reduce((sum, t) => sum + t.duration, 0);
}

export function getNowPlaying(now: number = Date.now()): NowPlaying {
  const cycleDuration = getCycleDuration();
  const elapsed = Math.floor((now - EPOCH) / 1000);
  const cyclePosition = ((elapsed % cycleDuration) + cycleDuration) % cycleDuration;

  let pos = cyclePosition;
  let trackIndex = 0;
  let track = playlist[0];

  for (let i = 0; i < playlist.length; i++) {
    if (pos < playlist[i].duration) {
      trackIndex = i;
      track = playlist[i];
      break;
    }
    pos -= playlist[i].duration;
  }

  const offset = pos;
  const remaining = track.duration - offset;
  const progress = offset / track.duration;

  return {
    track,
    trackIndex,
    offset,
    remaining,
    progress,
    cyclePosition,
    cycleDuration,
  };
}

export function getUpNext(currentIndex: number, count: number = 5): Track[] {
  const result: Track[] = [];
  for (let i = 1; i <= count; i++) {
    result.push(playlist[(currentIndex + i) % playlist.length]);
  }
  return result;
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
