import type { Metadata } from "next";
import "./globals.css";

const SITE_URL = "https://compute.fm";
const TITLE = "compute.fm";
const DESCRIPTION =
  "low management, high signal — a synchronized internet radio station";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    siteName: TITLE,
    url: SITE_URL,
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 630,
        alt: "compute.fm — synchronized internet radio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/api/og"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('theme');if(t!=='light')document.documentElement.classList.add('dark');}catch(e){document.documentElement.classList.add('dark');}})();",
          }}
        />
      </head>
      <body className="bg-fm-bg text-fm-text">{children}</body>
    </html>
  );
}
