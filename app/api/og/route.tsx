import { ImageResponse } from "next/og";

export const runtime = "edge";

const LOGO_MARK = (
  <svg viewBox="0 0 80 80" width={72} height={72} fill="none">
    <path d="M79.8262 0H0V80H79.8262V0Z" fill="#4ade80" />
    <path
      d="M47.942 46.0706H58.2786L58.2381 46.9002C57.874 51.6941 56.0737 55.5172 52.8576 58.2883C49.6815 61.0394 45.4338 62.4352 40.2349 62.4352C34.5506 62.4352 29.9991 60.4932 26.7018 56.6296C23.4653 52.8065 21.8066 47.5268 21.8066 40.9325V38.3031C21.8066 34.0954 22.5758 30.3331 24.0524 27.1166C25.5694 23.8596 27.7543 21.3106 30.5658 19.5715C33.3773 17.8316 36.6547 16.9417 40.3561 16.9417C45.4738 16.9417 49.6611 18.3374 52.7968 21.109C55.9524 23.8596 57.7932 27.784 58.2786 32.7405L58.3594 33.5696H48.0024L47.962 32.8817C47.7599 30.3131 47.0516 28.4519 45.8783 27.3595C44.7051 26.247 42.8439 25.7008 40.3561 25.7008C37.6658 25.7008 35.7039 26.6112 34.3885 28.5327C33.0132 30.4947 32.3053 33.6504 32.2649 37.8985V41.135C32.2649 45.5852 32.9323 48.8626 34.2473 50.865C35.5014 52.7865 37.4633 53.7169 40.2349 53.7169C42.7635 53.7169 44.6447 53.1707 45.8384 52.0582C47.0112 50.9658 47.7195 49.1859 47.9016 46.7785L47.942 46.0702V46.0706Z"
      fill="#0a0f0c"
    />
  </svg>
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") || "compute.fm";
  const artist = searchParams.get("artist");
  const art = searchParams.get("art");
  const isNowPlaying = searchParams.has("title");

  // Brand colors from the dark theme.
  const bg = "#0a0f0c";
  const surface = "#111814";
  const text = "#f5f5fa";
  const muted = "#9ca3af";
  const accent = "#4ade80";
  const accent2 = "#19874d";

  // Now-playing layout with album art: art on the left, track info on the right.
  if (isNowPlaying && art) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            background: `linear-gradient(135deg, ${bg} 0%, ${surface} 100%)`,
            color: text,
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            padding: 72,
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `radial-gradient(circle at 20% 50%, ${accent}18 0%, transparent 55%)`,
            }}
          />

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={art}
            alt=""
            width={420}
            height={420}
            style={{
              width: 420,
              height: 420,
              borderRadius: 32,
              objectFit: "cover",
              boxShadow: "0 30px 60px rgba(0,0,0,0.5)",
              zIndex: 1,
            }}
          />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginLeft: 64,
              flex: 1,
              zIndex: 1,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {LOGO_MARK}
              <span
                style={{
                  fontSize: 44,
                  fontWeight: 900,
                  letterSpacing: "-0.04em",
                  color: text,
                }}
              >
                compute.fm
              </span>
            </div>

            <span
              style={{
                fontSize: 26,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                color: accent,
                marginTop: 48,
                marginBottom: 12,
              }}
            >
              Now Playing
            </span>
            <span
              style={{
                fontSize: 64,
                fontWeight: 800,
                lineHeight: 1.05,
                color: text,
                display: "block",
              }}
            >
              {title}
            </span>
            {artist && (
              <span
                style={{
                  fontSize: 40,
                  fontWeight: 500,
                  color: muted,
                  marginTop: 16,
                }}
              >
                {artist}
              </span>
            )}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }

  // Default / textual now-playing card (no album art available).
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(135deg, ${bg} 0%, ${surface} 100%)`,
          color: text,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          padding: 80,
          position: "relative",
        }}
      >
        {/* Accent glow */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `radial-gradient(circle at 50% 120%, ${accent}15 0%, transparent 60%)`,
          }}
        />

        {/* Logo mark */}
        <div style={{ display: "flex", alignItems: "center", gap: 24, zIndex: 1 }}>
          <svg viewBox="0 0 80 80" width={80} height={80} fill="none">
            <path d="M79.8262 0H0V80H79.8262V0Z" fill={accent} />
            <path
              d="M47.942 46.0706H58.2786L58.2381 46.9002C57.874 51.6941 56.0737 55.5172 52.8576 58.2883C49.6815 61.0394 45.4338 62.4352 40.2349 62.4352C34.5506 62.4352 29.9991 60.4932 26.7018 56.6296C23.4653 52.8065 21.8066 47.5268 21.8066 40.9325V38.3031C21.8066 34.0954 22.5758 30.3331 24.0524 27.1166C25.5694 23.8596 27.7543 21.3106 30.5658 19.5715C33.3773 17.8316 36.6547 16.9417 40.3561 16.9417C45.4738 16.9417 49.6611 18.3374 52.7968 21.109C55.9524 23.8596 57.7932 27.784 58.2786 32.7405L58.3594 33.5696H48.0024L47.962 32.8817C47.7599 30.3131 47.0516 28.4519 45.8783 27.3595C44.7051 26.247 42.8439 25.7008 40.3561 25.7008C37.6658 25.7008 35.7039 26.6112 34.3885 28.5327C33.0132 30.4947 32.3053 33.6504 32.2649 37.8985V41.135C32.2649 45.5852 32.9323 48.8626 34.2473 50.865C35.5014 52.7865 37.4633 53.7169 40.2349 53.7169C42.7635 53.7169 44.6447 53.1707 45.8384 52.0582C47.0112 50.9658 47.7195 49.1859 47.9016 46.7785L47.942 46.0702V46.0706Z"
              fill={bg}
            />
          </svg>
          <span
            style={{
              fontSize: 56,
              fontWeight: 900,
              letterSpacing: "-0.04em",
              color: text,
            }}
          >
            compute.fm
          </span>
        </div>

        <div
          style={{
            marginTop: 48,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            maxWidth: 1000,
            zIndex: 1,
          }}
        >
          {isNowPlaying && (
            <span
              style={{
                fontSize: 28,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                color: accent,
                marginBottom: 16,
              }}
            >
              Now Playing
            </span>
          )}
          <span
            style={{
              fontSize: 72,
              fontWeight: 800,
              lineHeight: 1.1,
              color: text,
              display: "block",
            }}
          >
            {title}
          </span>
          {artist && (
            <span
              style={{
                fontSize: 44,
                fontWeight: 500,
                color: muted,
                marginTop: 16,
              }}
            >
              {artist}
            </span>
          )}
        </div>

        {/* Bottom tagline / URL */}
        <div
          style={{
            position: "absolute",
            bottom: 48,
            left: 80,
            right: 80,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 26,
            color: muted,
            zIndex: 1,
          }}
        >
          <span>
            {isNowPlaying ? "low management, high signal" : "synchronized internet radio"}
          </span>
          <span style={{ color: accent2 }}>compute.fm</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
