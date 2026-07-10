import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "compute.fm",
  description: "low management, high signal — a synchronized internet radio station",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    title: "compute.fm",
    description: "low management, high signal — synchronized internet radio",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-fm-bg text-fm-text">{children}</body>
    </html>
  );
}
