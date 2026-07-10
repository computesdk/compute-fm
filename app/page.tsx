import type { Metadata } from "next";
import RadioPlayer from "@/components/RadioPlayer";
import { PartnersSidebar, PartnersBanner } from "@/components/PartnersSidebar";
import { channels } from "@/lib/channels";

const SITE_URL = "https://compute.fm";
const DEFAULT_TITLE = "compute.fm";
const DEFAULT_DESCRIPTION =
  "low management, high signal — a synchronized internet radio station";

interface Live365Track {
  title: string;
  artist: string;
  art: string;
  status: string;
}

interface Live365Station {
  "current-track": Live365Track;
}

function isAdBreak(track: Live365Track): boolean {
  return track.artist === "Live365" && track.title.includes("Ad Break");
}

export async function generateMetadata(): Promise<Metadata> {
  const defaultChannel = channels[0];

  let track: Live365Track | null = null;
  try {
    const res = await fetch(
      `https://api.live365.com/station/${defaultChannel.stationId}`,
      {
        headers: { "User-Agent": "compute.fm/1.0" },
        next: { revalidate: 10 },
      }
    );
    if (res.ok) {
      const data = (await res.json()) as Live365Station;
      const current = data?.["current-track"];
      if (current && !isAdBreak(current)) {
        track = current;
      }
    }
  } catch {
    // Fall back to static metadata if Live365 is unreachable.
  }

  if (!track) {
    return {
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
    };
  }

  const title = `${track.title} by ${track.artist} — compute.fm`;
  const description = `Tune in to ${track.title} by ${track.artist} on compute.fm. ${DEFAULT_DESCRIPTION}`;

  const ogParams = new URLSearchParams({
    title: track.title,
    artist: track.artist,
  });
  if (track.art) ogParams.set("art", track.art);
  const imageUrl = `/api/og?${ogParams.toString()}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: SITE_URL,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `Now playing ${track.title} by ${track.artist} on compute.fm`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default function Home() {
  return (
    <div className="flex min-h-screen">
      <div className="flex-1 min-w-0">
        <RadioPlayer />
      </div>
      <PartnersSidebar />
      <PartnersBanner />
    </div>
  );
}
