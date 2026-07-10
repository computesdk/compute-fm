"use client";

import { useEffect, useState } from "react";
import partnersData from "@/lib/partners.json";

interface Sponsor {
  name: string;
  tier: string;
  href: string;
  logo: string;
  logoDark: string;
  scale?: number;
}

interface TierConfig {
  key: string;
  label: string;
  lineColor: string;
  textColor: string;
  logoHeight: string;
  slotHeight: string;
}

const sponsors = partnersData.sponsors as Sponsor[];
const tiers = partnersData.tiers as TierConfig[];
const becomePartnerHref = partnersData.becomePartnerHref;

const GRID_COLS: Record<string, string> = {
  gold: "grid-cols-1",
  silver: "grid-cols-2",
  bronze: "grid-cols-3",
  platform: "grid-cols-1",
};

// Tailwind needs literal class names to generate CSS, so this translates each
// tier's `logoHeight` into its `max-h-*` counterpart rather than maintaining a
// second, separately-edited height per tier.
const MAX_HEIGHT_FROM_HEIGHT: Record<string, string> = {
  "h-6": "max-h-6",
  "h-8": "max-h-8",
  "h-10": "max-h-10",
  "h-11": "max-h-11",
  "h-12": "max-h-12",
  "h-14": "max-h-14",
  "h-16": "max-h-16",
  "h-18": "max-h-18",
  "h-20": "max-h-20",
};

const bannerSponsors = tiers.flatMap((tier) =>
  sponsors.filter((s) => s.tier === tier.key)
);

export function PartnersSidebar() {
  return (
    <aside className="hidden xl:flex flex-col w-64 shrink-0 border-l border-fm-text/10">
      <div className="sticky top-4 h-[calc(100vh-3rem)] overflow-y-auto flex flex-col pb-20 px-4 gap-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold tracking-wide text-fm-muted uppercase">
            Partners
          </span>
          <a
            href={becomePartnerHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-fm-muted hover:text-fm-accent transition-colors"
          >
            Become a Partner
          </a>
        </div>

        {tiers.map((tier) => {
          const tierSponsors = sponsors.filter((s) => s.tier === tier.key);
          const maxHeight = MAX_HEIGHT_FROM_HEIGHT[tier.logoHeight] ?? "max-h-10";
          return (
            <div key={tier.key} className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <span className={`h-px flex-1 ${tier.lineColor} opacity-60`} />
                <span
                  className={`text-[9px] font-bold tracking-widest shrink-0 ${tier.textColor}`}
                >
                  {tier.label}
                </span>
                <span className={`h-px flex-1 ${tier.lineColor} opacity-60`} />
              </div>
              <div className={`grid ${GRID_COLS[tier.key] ?? "grid-cols-1"} gap-0`}>
                {tierSponsors.length > 0 ? (
                  tierSponsors.map((s) => (
                    <a
                      key={s.name}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center justify-center ${tier.slotHeight} hover:opacity-75 transition-opacity`}
                    >
                      <div
                        className="w-full flex items-center justify-center"
                        style={s.scale ? { transform: `scale(${s.scale})` } : undefined}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={s.logo}
                          alt={s.name}
                          loading="lazy"
                          decoding="async"
                          className={`w-full ${maxHeight} object-contain block dark:hidden`}
                        />
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={s.logoDark}
                          alt={s.name}
                          loading="lazy"
                          decoding="async"
                          className={`w-full ${maxHeight} object-contain hidden dark:block`}
                        />
                      </div>
                    </a>
                  ))
                ) : (
                  <div
                    className={`col-span-full flex items-center justify-center ${tier.slotHeight}`}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

export function PartnersBanner() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (bannerSponsors.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % bannerSponsors.length);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  const sponsor = bannerSponsors[index % bannerSponsors.length];
  if (!sponsor) return null;

  return (
    <div className="xl:hidden fixed inset-x-0 bottom-0 z-40 border-t border-fm-text/10 bg-fm-surface/95 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-4 py-3 max-w-md mx-auto">
        <span className="text-[10px] font-semibold text-fm-muted uppercase tracking-wide">
          Partners
        </span>
        <a
          href={sponsor.href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 hover:opacity-75 transition-opacity"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={sponsor.logo}
            alt={sponsor.name}
            loading="lazy"
            decoding="async"
            className="h-6 w-auto object-contain block dark:hidden"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={sponsor.logoDark}
            alt={sponsor.name}
            loading="lazy"
            decoding="async"
            className="h-6 w-auto object-contain hidden dark:block"
          />
        </a>
        <div className="flex items-center gap-1 shrink-0" aria-hidden="true">
          {bannerSponsors.map((s, i) => (
            <span
              key={s.name}
              className={
                i === index % bannerSponsors.length
                  ? "h-1.5 w-3 rounded-full bg-fm-muted"
                  : "h-1.5 w-1.5 rounded-full bg-fm-text/15"
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
