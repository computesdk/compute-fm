"use client";

import { useEffect, useState } from "react";
import partnersData from "@/lib/partners.json";

interface Sponsor {
  name: string;
  tier: string;
  href: string;
  logo: string;
  logoDark: string;
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

const bannerSponsors = tiers.flatMap((tier) =>
  sponsors.filter((s) => s.tier === tier.key)
);

export function PartnersSidebar() {
  return (
    <aside className="hidden xl:flex flex-col w-64 shrink-0 sticky top-0 h-screen overflow-y-auto border-l border-fm-text/10 p-5 gap-5">
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
        if (tierSponsors.length === 0) return null;
        return (
          <div key={tier.key} className="flex flex-col gap-3">
            <div className="flex items-center gap-1.5">
              <div className={`h-px flex-1 ${tier.lineColor} opacity-60`} />
              <span
                className={`text-[9px] font-bold tracking-widest shrink-0 ${tier.textColor}`}
              >
                {tier.label}
              </span>
              <div className={`h-px flex-1 ${tier.lineColor} opacity-60`} />
            </div>
            <div className="flex flex-col gap-3">
              {tierSponsors.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center justify-center ${tier.slotHeight} hover:opacity-75 transition-opacity`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.logo}
                    alt={s.name}
                    className={`${tier.logoHeight} w-auto max-w-full object-contain block dark:hidden`}
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.logoDark}
                    alt=""
                    className={`${tier.logoHeight} w-auto max-w-full object-contain hidden dark:block`}
                  />
                </a>
              ))}
            </div>
          </div>
        );
      })}
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
    <div className="xl:hidden fixed inset-x-0 bottom-0 z-40 border-t border-fm-text/10 bg-fm-surface/95 px-4 py-2 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center gap-3">
        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-widest text-fm-muted">
          Partners
        </span>
        <a
          href={sponsor.href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-9 flex-1 items-center justify-center rounded-md px-3 transition-opacity active:opacity-70"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={sponsor.logo}
            alt={sponsor.name}
            className="max-h-6 w-auto max-w-36 object-contain block dark:hidden"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={sponsor.logoDark}
            alt=""
            className="max-h-6 w-auto max-w-36 object-contain hidden dark:block"
          />
        </a>
        <div className="flex shrink-0 items-center gap-1" aria-hidden="true">
          {bannerSponsors.map((item, itemIndex) => (
            <span
              key={item.name}
              className={`h-1.5 rounded-full transition-all ${
                itemIndex === index % bannerSponsors.length
                  ? "w-3 bg-fm-muted"
                  : "w-1.5 bg-fm-text/15"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
