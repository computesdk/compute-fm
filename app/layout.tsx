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
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('theme')||'light';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();",
          }}
        />
      </head>
      <body className="bg-fm-bg text-fm-text">{children}</body>
    </html>
  );
}
