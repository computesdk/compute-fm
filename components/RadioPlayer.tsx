"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { channels, Live365Channel } from "@/lib/channels";
import ThemeToggle from "@/components/ThemeToggle";

const TWEET_INTENT =
  "https://twitter.com/intent/tweet?text=" +
  encodeURIComponent("🎵 The sound of @computesdk needs to include: #computefm");

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
    audio.muted = muted;
    audio.volume = volume;
    audio.play().catch(() => {});
  }, [activeChannel.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the audio element's mute/volume in sync with state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = muted;
    audio.volume = volume;
  }, [volume, muted]);

  const goLive = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !station) return;
    audio.src = station["stream-url"];
    audio.load();
    audio.muted = false;
    audio.volume = volume;
    audio.play().then(() => {
      setMuted(false);
      setIsLive(true);
      isLiveRef.current = true;
      bcRef.current?.postMessage({ type: "started" });
    }).catch(() => {
      setIsLive(false);
      isLiveRef.current = false;
    });
  }, [station, volume]);

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
        audio.muted = false;
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
    setMuted((m) => !m);
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

      {/* Brand - subbrand of ComputeSDK */}
      <div className="flex flex-col items-center text-center gap-2 pt-10 pb-2 px-6">
        {/* Parent brand lockup */}
        <a
          href="https://computesdk.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm font-semibold text-fm-text hover:text-fm-accent transition-colors"
        >
          <img
            src="/logomark-light.svg"
            alt="ComputeSDK"
            className="w-6 h-6 block dark:hidden rounded-md"
          />
          <img
            src="/logomark-dark.svg"
            alt="ComputeSDK"
            className="w-6 h-6 hidden dark:block rounded-md"
          />
          ComputeSDK
        </a>
        {/* Product brand with divider */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="w-8 h-px bg-fm-text/15" />
          <h1 className="text-3xl font-bold tracking-tight">compute.fm</h1>
        </div>
        {/* Tagline */}
        <p className="text-xs text-fm-muted max-w-md">
          the sound of the independent compute benchmarking company
        </p>
        {/* Benchmarks link - subtle navigation, not a CTA */}
        <a
          href="https://computesdk.com/benchmarks"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-fm-muted hover:text-fm-accent transition-colors mt-0.5"
        >
          View benchmarks
          <svg viewBox="0 0 24 24" className="w-3 h-3 fill-none stroke-current stroke-2" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
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
        <div className="relative w-72 h-72 sm:w-80 sm:h-80 rounded-3xl overflow-hidden shadow-2xl shadow-fm-accent/20 animate-slide-up group">
          {track.art && !adBreak ? (
            <img src={track.art} alt={track.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-fm-accent/40 to-fm-accent2/40" />
          )}
          {/* Visualizer overlay across the bottom */}
          {isLive && (
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent flex items-end pointer-events-none">
              <Visualizer active={true} />
            </div>
          )}
          {/* Play / mute button overlay */}
          <button
            onClick={!isLive ? goLive : toggleMute}
            aria-label={!isLive ? "Tune in" : muted ? "Unmute" : "Mute"}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div
              className={`flex items-center justify-center w-16 h-16 rounded-full bg-black/40 backdrop-blur-sm text-white transition-all duration-200 ${
                !isLive || muted
                  ? "opacity-90 group-hover:scale-110"
                  : "opacity-0 group-hover:opacity-90 group-hover:scale-110"
              }`}
            >
              {!isLive ? (
                <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current ml-1" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
              ) : muted ? (
                <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current" aria-hidden="true">
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM3 9v6h4l5 5V4L7 9H3z" />
                  <path d="M19 12c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71z" />
                  <path d="M4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current" aria-hidden="true">
                  <path d="M3 9v6h4l5 5V4L7 9H3z" />
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                </svg>
              )}
            </div>
          </button>
          {/* LIVE indicator badge - after button so it renders on top */}
          {isLive && (
            <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm pointer-events-none">
              <span className={`w-2 h-2 rounded-full ${muted ? "bg-gray-400" : "bg-red-500 animate-pulse"}`} />
              <span className="text-[10px] font-bold tracking-widest text-white uppercase">
                {muted ? "Muted" : "Live"}
              </span>
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

        {/* Song request - subtle link */}
        <a
          href={TWEET_INTENT}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-fm-muted hover:text-fm-accent transition-colors"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          Have a song request? Request a song on X
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
