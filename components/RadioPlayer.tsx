"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { playlist } from "@/lib/playlist";
import { getNowPlaying, getUpNext, formatTime, NowPlaying } from "@/lib/scheduler";

export default function RadioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isLive, setIsLive] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [connected, setConnected] = useState(false);
  const [listeners, setListeners] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const updateNowPlaying = useCallback(() => {
    const np = getNowPlaying();
    setNowPlaying(np);
    return np;
  }, []);

  // Sync to the broadcast clock
  useEffect(() => {
    updateNowPlaying();
    tickRef.current = setInterval(updateNowPlaying, 1000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [updateNowPlaying]);

  // Track the current loaded track ID to detect changes
  const loadedTrackIdRef = useRef<string>("");

  // When live and the scheduler moves to a new track, switch audio source
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !nowPlaying || !isLive) return;

    if (loadedTrackIdRef.current === nowPlaying.track.id) return;
    loadedTrackIdRef.current = nowPlaying.track.id;

    audio.src = nowPlaying.track.src;
    audio.load();
    const seekAndPlay = () => {
      try {
        audio.currentTime = nowPlaying.offset;
      } catch {
        // seek may fail if metadata not loaded yet
      }
      audio.volume = muted ? 0 : volume;
      audio.play().catch(() => {});
    };
    if (audio.readyState >= 1) {
      seekAndPlay();
    } else {
      audio.addEventListener("loadedmetadata", seekAndPlay, { once: true });
    }
  }, [nowPlaying?.track.id, isLive, nowPlaying, muted, volume]);

  // Volume control
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = muted ? 0 : volume;
    }
  }, [volume, muted]);

  // Fake listener count for ambiance (deterministic-ish based on time)
  useEffect(() => {
    if (!connected) return;
    const update = () => {
      const base = 47;
      const hour = new Date().getHours();
      const dayBoost = new Date().getDay() >= 5 ? 15 : 0;
      const hourBoost = hour >= 9 && hour <= 17 ? 22 : hour >= 20 || hour <= 2 ? 18 : 0;
      const jitter = Math.floor(Math.sin(Date.now() / 30000) * 5);
      setListeners(Math.max(1, base + hourBoost + dayBoost + jitter));
    };
    update();
    const iv = setInterval(update, 5000);
    return () => clearInterval(iv);
  }, [connected]);

  const goLive = () => {
    const audio = audioRef.current;
    if (!audio || !nowPlaying) return;
    setConnected(true);
    setIsLive(true);
    loadedTrackIdRef.current = nowPlaying.track.id;
    audio.src = nowPlaying.track.src;
    audio.load();
    audio.addEventListener("loadedmetadata", () => {
      audio.currentTime = nowPlaying.offset;
      audio.volume = muted ? 0 : volume;
      audio.play().catch(() => {
        // Autoplay may be blocked - user needs to interact
        setIsLive(false);
      });
    }, { once: true });
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const newMuted = !muted;
    setMuted(newMuted);
    audio.volume = newMuted ? 0 : volume;
    if (!newMuted && !isLive && audio.paused) {
      setIsLive(true);
      audio.play().catch(() => {});
    }
  };

  if (!nowPlaying) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-fm-muted animate-pulse">tuning...</div>
      </div>
    );
  }

  const upNext = getUpNext(nowPlaying.trackIndex, 5);
  const showName = nowPlaying.track.show || "On Air";

  return (
    <div className="min-h-screen bg-fm-bg text-fm-text flex flex-col">
      <audio ref={audioRef} preload="auto" />

      {/* Header */}
      <header className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-fm-accent to-fm-accent2 flex items-center justify-center font-bold text-lg">
            ▶
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">compute.fm</h1>
            <p className="text-xs text-fm-muted -mt-0.5">low management, high signal</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          {connected && (
            <div className="flex items-center gap-2 text-fm-muted">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span>{listeners} listening</span>
            </div>
          )}
          <div className="text-fm-muted font-mono tabular-nums">
            {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col lg:flex-row gap-6 p-6 max-w-6xl mx-auto w-full">
        {/* Left: Now Playing + Visualizer */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Show badge */}
          <div className="flex items-center gap-3 animate-fade-in">
            <span className="px-3 py-1 rounded-full bg-fm-accent/20 text-fm-accent text-xs font-semibold tracking-wider uppercase">
              {isLive ? "● On Air" : "○ Standby"}
            </span>
            <span className="text-fm-muted text-sm">{showName}</span>
          </div>

          {/* Now Playing Card */}
          <div className="bg-fm-surface rounded-2xl p-8 border border-white/5 animate-slide-up">
            <div className="flex gap-6 items-start">
              {/* Album art / visualizer */}
              <div className="w-32 h-32 rounded-xl bg-gradient-to-br from-fm-accent/30 to-fm-accent2/30 flex-shrink-0 flex items-center justify-center overflow-hidden relative">
                <Visualizer active={isLive} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs text-fm-muted uppercase tracking-wider mb-1">Now Playing</p>
                <h2 className="text-2xl font-bold truncate">{nowPlaying.track.title}</h2>
                <p className="text-lg text-fm-muted truncate">{nowPlaying.track.artist}</p>
                {nowPlaying.track.album && (
                  <p className="text-sm text-fm-muted/60 truncate mt-0.5">{nowPlaying.track.album}</p>
                )}

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-fm-accent to-fm-accent2 transition-all duration-1000 ease-linear"
                      style={{ width: `${nowPlaying.progress * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5 text-xs text-fm-muted font-mono tabular-nums">
                    <span>{formatTime(nowPlaying.offset)}</span>
                    <span>-{formatTime(nowPlaying.remaining)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="mt-6 flex items-center gap-4">
              {!isLive ? (
                <button
                  onClick={goLive}
                  className="px-6 py-3 bg-gradient-to-r from-fm-accent to-fm-accent2 rounded-full font-semibold text-white hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  <span>▶</span> Tune In
                </button>
              ) : (
                <button
                  onClick={toggleMute}
                  className="px-6 py-3 bg-white/10 rounded-full font-semibold hover:bg-white/20 transition-colors flex items-center gap-2"
                >
                  {muted ? "🔇 Muted" : "🔊 Live"}
                </button>
              )}

              {/* Volume slider */}
              {isLive && (
                <div className="flex items-center gap-2 flex-1 max-w-[200px]">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={muted ? 0 : volume}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setVolume(v);
                      setMuted(v === 0);
                    }}
                    className="flex-1 accent-fm-accent"
                  />
                </div>
              )}

              <div className="ml-auto text-right">
                <p className="text-xs text-fm-muted">Broadcast Cycle</p>
                <p className="text-sm font-mono tabular-nums text-fm-muted/60">
                  {formatTime(nowPlaying.cyclePosition)} / {formatTime(nowPlaying.cycleDuration)}
                </p>
              </div>
            </div>
          </div>

          {/* Schedule strip */}
          <ScheduleStrip currentIndex={nowPlaying.trackIndex} />
        </div>

        {/* Right: Up Next */}
        <div className="lg:w-80 flex-shrink-0">
          <div className="bg-fm-surface rounded-2xl p-5 border border-white/5">
            <h3 className="text-sm font-semibold text-fm-muted uppercase tracking-wider mb-4">Up Next</h3>
            <div className="space-y-3">
              {upNext.map((track, i) => (
                <div
                  key={`${track.id}-${i}`}
                  className="flex items-start gap-3 group cursor-default"
                >
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex-shrink-0 flex items-center justify-center text-xs text-fm-muted font-mono">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate group-hover:text-fm-accent transition-colors">
                      {track.title}
                    </p>
                    <p className="text-xs text-fm-muted truncate">{track.artist}</p>
                    {track.show && (
                      <p className="text-xs text-fm-muted/50 truncate mt-0.5">{track.show}</p>
                    )}
                  </div>
                  <span className="text-xs text-fm-muted font-mono tabular-nums">
                    {formatTime(track.duration)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* About card */}
          <div className="mt-4 bg-fm-surface rounded-2xl p-5 border border-white/5">
            <h3 className="text-sm font-semibold text-fm-muted uppercase tracking-wider mb-2">About</h3>
            <p className="text-sm text-fm-muted leading-relaxed">
              compute.fm is a synchronized internet radio station. Everyone
              listening hears the same track at the same time, just like
              traditional broadcast radio. No algorithms, no skip button.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-3 text-center text-xs text-fm-muted">
        compute.fm — {playlist.length} tracks in rotation · {" "}
        {Math.round(playlist.reduce((s, t) => s + t.duration, 0) / 60)} min cycle
      </footer>
    </div>
  );
}

// Inline visualizer component
function Visualizer({ active }: { active: boolean }) {
  const bars = 5;
  return (
    <div className="flex items-end justify-center gap-1 h-full w-full p-3">
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className="flex-1 bg-gradient-to-t from-fm-accent to-fm-accent2 rounded-full"
          style={{
            animation: active
              ? `visualizer-bar ${0.4 + i * 0.15}s ease-in-out infinite alternate`
              : "none",
            height: active ? undefined : "20%",
            opacity: active ? 1 : 0.3,
          }}
        />
      ))}
      <style>{`
        @keyframes visualizer-bar {
          0% { height: 15%; }
          100% { height: 85%; }
        }
      `}</style>
    </div>
  );
}

// Schedule strip showing the full rotation
function ScheduleStrip({ currentIndex }: { currentIndex: number }) {
  const shows = new Map<string, { start: number; end: number; tracks: number }>();
  let pos = 0;
  for (let i = 0; i < playlist.length; i++) {
    const show = playlist[i].show || "Mixed";
    if (!shows.has(show)) {
      shows.set(show, { start: pos, end: 0, tracks: 0 });
    }
    const entry = shows.get(show)!;
    entry.tracks++;
    pos += playlist[i].duration;
    entry.end = pos;
  }

  const totalDuration = pos;

  return (
    <div className="bg-fm-surface rounded-2xl p-5 border border-white/5">
      <h3 className="text-sm font-semibold text-fm-muted uppercase tracking-wider mb-3">
        Programming
      </h3>
      <div className="flex gap-2 h-12 rounded-lg overflow-hidden">
        {Array.from(shows.entries()).map(([name, { start, end, tracks }]) => {
          const width = ((end - start) / totalDuration) * 100;
          const isCurrent = currentIndex >= 0 && playlist[currentIndex].show === name;
          return (
            <div
              key={name}
              className={`flex items-center justify-center px-2 text-xs font-medium text-center transition-all ${
                isCurrent
                  ? "bg-gradient-to-r from-fm-accent/40 to-fm-accent2/40 text-white"
                  : "bg-white/5 text-fm-muted"
              }`}
              style={{ width: `${width}%` }}
              title={`${name} — ${tracks} tracks`}
            >
              <span className="truncate">{name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
