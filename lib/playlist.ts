export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number; // seconds
  src: string;
  artwork?: string;
  show?: string;
}

// The programming schedule for compute.fm
// To add music: drop files in /public/tracks/ and add entries here.
// All listeners hear the same track at the same time, synced by timestamp.
export const playlist: Track[] = [
  {
    id: "t1",
    title: "Midnight Drive",
    artist: "SoundHelix",
    album: "Compute FM Vol. 1",
    duration: 372,
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    show: "Night Waves",
  },
  {
    id: "t2",
    title: "Neon Pulse",
    artist: "SoundHelix",
    album: "Compute FM Vol. 1",
    duration: 425,
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    show: "Night Waves",
  },
  {
    id: "t3",
    title: "Static Bloom",
    artist: "SoundHelix",
    album: "Compute FM Vol. 1",
    duration: 304,
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    show: "Deep Focus",
  },
  {
    id: "t4",
    title: "Buffer Overflow",
    artist: "SoundHelix",
    album: "Compute FM Vol. 1",
    duration: 291,
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    show: "Deep Focus",
  },
  {
    id: "t5",
    title: "Latency Dreams",
    artist: "SoundHelix",
    album: "Compute FM Vol. 1",
    duration: 388,
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    show: "Deep Focus",
  },
  {
    id: "t6",
    title: "Kernel Panic",
    artist: "SoundHelix",
    album: "Compute FM Vol. 1",
    duration: 344,
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
    show: "After Hours",
  },
  {
    id: "t7",
    title: "Garbage Collection",
    artist: "SoundHelix",
    album: "Compute FM Vol. 1",
    duration: 367,
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
    show: "After Hours",
  },
  {
    id: "t8",
    title: "Race Condition",
    artist: "SoundHelix",
    album: "Compute FM Vol. 1",
    duration: 412,
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    show: "After Hours",
  },
  {
    id: "t9",
    title: "Warm Reboot",
    artist: "SoundHelix",
    album: "Compute FM Vol. 1",
    duration: 298,
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
    show: "Morning Compile",
  },
  {
    id: "t10",
    title: "Async Aria",
    artist: "SoundHelix",
    album: "Compute FM Vol. 1",
    duration: 356,
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
    show: "Morning Compile",
  },
  {
    id: "t11",
    title: "Stack Overflow",
    artist: "SoundHelix",
    album: "Compute FM Vol. 1",
    duration: 381,
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3",
    show: "Morning Compile",
  },
  {
    id: "t12",
    title: "Segfault Sonata",
    artist: "SoundHelix",
    album: "Compute FM Vol. 1",
    duration: 334,
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3",
    show: "Morning Compile",
  },
];

export const stationName = "compute.fm";
export const stationTagline = "low management, high signal";
