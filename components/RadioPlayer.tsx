"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { channels, Live365Channel } from "@/lib/channels";
import ThemeToggle from "@/components/ThemeToggle";

const TWEET_INTENT =
  "https://twitter.com/intent/tweet?text=" +
  encodeURIComponent("@computesdk song request:  #computefm");

interface Live365Track {
  title: string;
  artist: string;
  art: string;
  start: string;
  duration: number;
  end: string;
  status: string;
  requestedBy?: string;
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
  const isLiveRef = useRef(false);
  const bcRef = useRef<BroadcastChannel | null>(null);
  const othersLiveRef = useRef(false);
  const autoTriedRef = useRef(false);

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

  const goLive = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !station) return;
    audio.src = station["stream-url"];
    audio.load();
    audio.volume = muted ? 0 : volume;
    audio.play().then(() => {
      setIsLive(true);
      isLiveRef.current = true;
      bcRef.current?.postMessage({ type: "started" });
    }).catch(() => {
      setIsLive(false);
      isLiveRef.current = false;
    });
  }, [station, muted, volume]);

  // Keep other tabs informed and only autoplay if nothing is playing elsewhere
  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;
    const bc = new BroadcastChannel("compute-fm-playback");
    bcRef.current = bc;
    bc.onmessage = (ev) => {
      const msg = ev.data;
      if (!msg) return;
      if (msg.type === "whoIsLive" && isLiveRef.current) {
        bc.postMessage({ type: "live" });
      } else if (msg.type === "live" || msg.type === "started") {
        othersLiveRef.current = true;
      }
    };
    bc.postMessage({ type: "whoIsLive" });
    return () => {
      bc.close();
      bcRef.current = null;
    };
  }, []);

  // Autoplay once, only if no other tab is already live. Browsers block unmuted
  // autoplay without a gesture, so fall back to muted playback and unmute on the
  // first interaction anywhere on the page.
  const attemptAutoplay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !station || isLiveRef.current) return;
    audio.src = station["stream-url"];
    audio.load();
    audio.muted = false;
    audio.volume = volume;
    const markLive = () => {
      setIsLive(true);
      isLiveRef.current = true;
      bcRef.current?.postMessage({ type: "started" });
    };
    audio.play().then(() => {
      setMuted(false);
      markLive();
    }).catch(() => {
      audio.muted = true;
      audio.play().then(() => {
        setMuted(true);
        markLive();
        const unmute = () => {
          audio.muted = false;
          audio.volume = volume;
          setMuted(false);
          window.removeEventListener("pointerdown", unmute);
          window.removeEventListener("keydown", unmute);
          window.removeEventListener("touchstart", unmute);
        };
        window.addEventListener("pointerdown", unmute, { once: true });
        window.addEventListener("keydown", unmute, { once: true });
        window.addEventListener("touchstart", unmute, { once: true });
      }).catch(() => {
        setIsLive(false);
        isLiveRef.current = false;
      });
    });
  }, [station, volume]);

  useEffect(() => {
    if (autoTriedRef.current || !station || isLive) return;
    autoTriedRef.current = true;
    const t = setTimeout(() => {
      if (othersLiveRef.current || isLiveRef.current) return;
      bcRef.current?.postMessage({ type: "live" });
      attemptAutoplay();
    }, 800 + Math.random() * 400);
    return () => clearTimeout(t);
  }, [station, isLive, attemptAutoplay]);

  useEffect(() => {
    isLiveRef.current = isLive;
  }, [isLive]);

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
            className="mt-4 px-4 py-2 bg-fm-text/10 rounded-full text-sm hover:bg-fm-text/20"
          >
            retry
          </button>
        </div>
      </div>
    );
  }

  if (!station) return null;

  const track = station["current-track"];
  const adBreak = isAdBreak(track);

  return (
    <div className="relative min-h-screen bg-fm-bg text-fm-text flex flex-col">
      <audio ref={audioRef} preload="auto" />

      {/* Theme toggle */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      {/* Brand - centered at top */}
      <div className="flex flex-col items-center text-center gap-2 pt-10 pb-2 px-6">
        <img
          src="/logomark-light.svg"
          alt="ComputeSDK"
          className="w-12 h-12 block dark:hidden"
        />
        <img
          src="/logomark-dark.svg"
          alt="ComputeSDK"
          className="w-12 h-12 hidden dark:block"
        />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">compute.fm</h1>
          <p className="text-xs text-fm-muted mt-0.5">
            the sound of{" "}
            <a
              href="https://computesdk.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-fm-text hover:text-fm-accent transition-colors"
            >
              ComputeSDK
            </a>
            , the independent compute{" "}
            <a
              href="https://computesdk.com/benchmarks"
              target="_blank"
              rel="noopener noreferrer"
              className="text-fm-text hover:text-fm-accent transition-colors"
            >
              benchmarking
            </a>{" "}
            company
          </p>
        </div>
      </div>

      {/* Channel selector */}
      {channels.length > 1 && (
        <div className="px-6 py-3 flex gap-2 justify-center border-b border-fm-text/10 overflow-x-auto">
          {channels.map((ch) => (
            <button
              key={ch.id}
              onClick={() => switchChannel(ch)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                ch.id === activeChannel.id
                  ? "bg-gradient-to-r from-fm-accent to-fm-accent2 text-white"
                  : "bg-fm-text/5 text-fm-muted hover:bg-fm-text/10"
              }`}
            >
              {ch.name}
            </button>
          ))}
        </div>
      )}

      {/* Main content - centered hero */}
      <main className="flex-1 flex flex-col items-center justify-center gap-8 p-6 pb-24 xl:pb-6">
        {/* Album art with prominent visualizer */}
        <div className="relative w-72 h-72 sm:w-80 sm:h-80 rounded-3xl overflow-hidden shadow-2xl shadow-fm-accent/20 animate-slide-up">
          {track.art && !adBreak ? (
            <img src={track.art} alt={track.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-fm-accent/40 to-fm-accent2/40" />
          )}
          {/* Visualizer overlay across the bottom */}
          {isLive && (
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent flex items-end">
              <Visualizer active={true} />
            </div>
          )}
        </div>

        {/* Track info */}
        <div className="text-center max-w-lg px-4">
          <p className="text-xs text-fm-muted uppercase tracking-widest mb-2">
            {adBreak ? "Ad Break" : "Now Playing"}
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold leading-tight">{track.title}</h2>
          <p className="text-xl text-fm-muted mt-1">{track.artist}</p>
          {track.requestedBy && !adBreak && (
            <a
              href={`https://x.com/${track.requestedBy}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-fm-accent/15 text-fm-accent hover:bg-fm-accent/25 transition-colors"
            >
              <span aria-hidden="true">♫</span>
              Requested by @{track.requestedBy}
            </a>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          {!isLive ? (
            <button
              onClick={goLive}
              className="px-8 py-4 bg-gradient-to-r from-fm-accent to-fm-accent2 rounded-full font-semibold text-white text-lg hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <span>▶</span> Tune In
            </button>
          ) : (
            <>
              <button
                onClick={toggleMute}
                className="px-6 py-3 bg-fm-text/10 rounded-full font-semibold hover:bg-fm-text/20 transition-colors flex items-center gap-2"
              >
                {muted ? "🔇 Muted" : "🔊 Live"}
              </button>
              <div className="flex items-center gap-2 w-40">
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
            </>
          )}
        </div>

        {/* Song request CTA */}
        <a
          href={TWEET_INTENT}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-3 px-7 py-4 rounded-full text-base sm:text-lg font-semibold border-2 border-fm-accent/50 bg-fm-accent/10 text-fm-accent hover:bg-fm-accent hover:text-white hover:border-fm-accent transition-colors shadow-lg shadow-fm-accent/10"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          Got a song request? Tweet @computesdk
        </a>
      </main>
    </div>
  );
}

// Prominent visualizer bars
function Visualizer({ active }: { active: boolean }) {
  const bars = 24;
  return (
    <div className="flex items-end justify-center gap-1 h-full w-full px-4 pb-4">
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className="flex-1 bg-gradient-to-t from-fm-accent to-fm-accent2 rounded-full"
          style={{
            animation: active
              ? `visualizer-bar ${0.5 + (i % 5) * 0.18}s ease-in-out infinite alternate`
              : "none",
            animationDelay: `${(i % 7) * 0.09}s`,
            height: active ? undefined : "15%",
            opacity: active ? 0.9 : 0.3,
          }}
        />
      ))}
      <style>{`
        @keyframes visualizer-bar {
          0% { height: 10%; }
          100% { height: 100%; }
        }
      `}</style>
    </div>
  );
}
