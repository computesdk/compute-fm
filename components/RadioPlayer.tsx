"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { channels, Live365Channel } from "@/lib/channels";

interface Live365Track {
  title: string;
  artist: string;
  art: string;
  start: string;
  duration: number;
  end: string;
  status: string;
}

interface Live365Station {
  "mount-id": string;
  name: string;
  "stream-url": string;
  "stream-hls-url": string;
  listeners: number;
  "current-track": Live365Track;
  "last-played": Live365Track[];
  genres: string[] | { name: string; id: number }[];
}

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function parseTimestamp(ts: string): number {
  return new Date(ts).getTime();
}

function getTrackProgress(track: Live365Track): { offset: number; remaining: number; progress: number } {
  const startMs = parseTimestamp(track.start);
  const now = Date.now();
  const offset = Math.max(0, (now - startMs) / 1000);
  const remaining = Math.max(0, track.duration - offset);
  const progress = Math.min(1, offset / track.duration);
  return { offset, remaining, progress };
}

function isAdBreak(track: Live365Track): boolean {
  return track.artist === "Live365" && track.title.includes("Ad Break");
}

export default function RadioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [activeChannel, setActiveChannel] = useState<Live365Channel>(channels[0]);
  const [station, setStation] = useState<Live365Station | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStation = useCallback(async (stationId: string) => {
    try {
      const res = await fetch(`/api/now-playing?stationId=${stationId}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setStation(data);
      setError(null);
    } catch {
      setError("Failed to connect to Live365");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch station data on mount and when channel changes
  useEffect(() => {
    setLoading(true);
    fetchStation(activeChannel.stationId);
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => fetchStation(activeChannel.stationId), 10000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [activeChannel.stationId, fetchStation]);

  // Switch stream when channel changes and live
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isLive) return;
    audio.src = station?.["stream-url"] || "";
    audio.load();
    audio.volume = muted ? 0 : volume;
    audio.play().catch(() => {});
  }, [activeChannel.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Volume control
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = muted ? 0 : volume;
    }
  }, [volume, muted]);

  const goLive = () => {
    const audio = audioRef.current;
    if (!audio || !station) return;
    audio.src = station["stream-url"];
    audio.load();
    audio.volume = muted ? 0 : volume;
    audio.play().then(() => {
      setIsLive(true);
    }).catch(() => {
      setIsLive(false);
    });
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const newMuted = !muted;
    setMuted(newMuted);
    audio.volume = newMuted ? 0 : volume;
  };

  const switchChannel = (channel: Live365Channel) => {
    if (channel.id === activeChannel.id) return;
    setActiveChannel(channel);
    setIsLive(false);
  };

  if (loading && !station) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-fm-muted animate-pulse">tuning...</div>
      </div>
    );
  }

  if (error && !station) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-fm-accent mb-2">signal lost</div>
          <div className="text-fm-muted text-sm">{error}</div>
          <button
            onClick={() => fetchStation(activeChannel.stationId)}
            className="mt-4 px-4 py-2 bg-white/10 rounded-full text-sm hover:bg-white/20"
          >
            retry
          </button>
        </div>
      </div>
    );
  }

  if (!station) return null;

  const track = station["current-track"];
  const lastPlayed = station["last-played"] || [];
  const adBreak = isAdBreak(track);
  const { offset, remaining, progress } = getTrackProgress(track);
  const genreList = (station.genres || [])
    .map((g) => typeof g === "string" ? g : g.name)
    .join(", ");

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
          {isLive && (
            <div className="flex items-center gap-2 text-fm-muted">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span>{station.listeners || 0} listening</span>
            </div>
          )}
          <div className="text-fm-muted font-mono tabular-nums">
            {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
      </header>

      {/* Channel selector */}
      {channels.length > 1 && (
        <div className="px-6 py-3 flex gap-2 border-b border-white/5 overflow-x-auto">
          {channels.map((ch) => (
            <button
              key={ch.id}
              onClick={() => switchChannel(ch)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                ch.id === activeChannel.id
                  ? "bg-gradient-to-r from-fm-accent to-fm-accent2 text-white"
                  : "bg-white/5 text-fm-muted hover:bg-white/10"
              }`}
            >
              {ch.name}
            </button>
          ))}
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col lg:flex-row gap-6 p-6 max-w-6xl mx-auto w-full">
        {/* Left: Now Playing + Visualizer */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Show badge */}
          <div className="flex items-center gap-3 animate-fade-in">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase ${
              isLive
                ? "bg-fm-accent/20 text-fm-accent"
                : "bg-white/5 text-fm-muted"
            }`}>
              {isLive ? "● On Air" : "○ Standby"}
            </span>
            <span className="text-fm-muted text-sm">{activeChannel.name}</span>
            {genreList && (
              <span className="text-fm-muted/60 text-xs">· {genreList}</span>
            )}
          </div>

          {/* Now Playing Card */}
          <div className="bg-fm-surface rounded-2xl p-8 border border-white/5 animate-slide-up">
            <div className="flex gap-6 items-start">
              {/* Album art / visualizer */}
              <div className="w-32 h-32 rounded-xl bg-gradient-to-br from-fm-accent/30 to-fm-accent2/30 flex-shrink-0 flex items-center justify-center overflow-hidden relative">
                {track.art && !adBreak ? (
                  <img
                    src={track.art}
                    alt={track.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Visualizer active={isLive} />
                )}
                {isLive && (
                  <div className="absolute inset-0 pointer-events-none">
                    <Visualizer active={true} overlay />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs text-fm-muted uppercase tracking-wider mb-1">
                  {adBreak ? "Ad Break" : "Now Playing"}
                </p>
                <h2 className="text-2xl font-bold truncate">{track.title}</h2>
                <p className="text-lg text-fm-muted truncate">{track.artist}</p>

                {/* Progress bar */}
                {!adBreak && (
                  <div className="mt-4">
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-fm-accent to-fm-accent2 transition-all duration-1000 ease-linear"
                        style={{ width: `${progress * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1.5 text-xs text-fm-muted font-mono tabular-nums">
                      <span>{formatTime(offset)}</span>
                      <span>-{formatTime(remaining)}</span>
                    </div>
                  </div>
                )}
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
                <p className="text-xs text-fm-muted">Station</p>
                <p className="text-sm font-mono tabular-nums text-fm-muted/60">
                  {station.name}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Recently Played */}
        <div className="lg:w-80 flex-shrink-0">
          <div className="bg-fm-surface rounded-2xl p-5 border border-white/5">
            <h3 className="text-sm font-semibold text-fm-muted uppercase tracking-wider mb-4">
              Recently Played
            </h3>
            <div className="space-y-3">
              {lastPlayed.length === 0 && (
                <p className="text-sm text-fm-muted/50">No history yet</p>
              )}
              {lastPlayed.map((t, i) => {
                const ad = isAdBreak(t);
                return (
                  <div key={i} className="flex items-start gap-3 group">
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex-shrink-0 overflow-hidden">
                      {t.art && !ad ? (
                        <img src={t.art} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-fm-muted">
                          {ad ? "AD" : "♪"}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${ad ? "text-fm-muted/50" : ""}`}>
                        {t.title}
                      </p>
                      <p className="text-xs text-fm-muted truncate">{t.artist}</p>
                    </div>
                    <span className="text-xs text-fm-muted font-mono tabular-nums">
                      {formatTime(t.duration)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* About card */}
          <div className="mt-4 bg-fm-surface rounded-2xl p-5 border border-white/5">
            <h3 className="text-sm font-semibold text-fm-muted uppercase tracking-wider mb-2">About</h3>
            <p className="text-sm text-fm-muted leading-relaxed">
              compute.fm is a licensed internet radio station powered by Live365.
              Everyone listening hears the same track at the same time, just like
              traditional broadcast radio. No algorithms, no skip button.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-3 text-center text-xs text-fm-muted">
        compute.fm — {activeChannel.name} · licensed via Live365
      </footer>
    </div>
  );
}

// Visualizer component
function Visualizer({ active, overlay }: { active: boolean; overlay?: boolean }) {
  const bars = 5;
  return (
    <div className={`flex items-end justify-center gap-1 h-full w-full p-3 ${overlay ? "absolute inset-0" : ""}`}>
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className="flex-1 bg-gradient-to-t from-fm-accent to-fm-accent2 rounded-full"
          style={{
            animation: active
              ? `visualizer-bar ${0.4 + i * 0.15}s ease-in-out infinite alternate`
              : "none",
            height: active ? undefined : "20%",
            opacity: active ? (overlay ? 0.6 : 1) : 0.3,
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
