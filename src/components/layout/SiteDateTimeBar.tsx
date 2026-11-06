"use client";

import { useEffect, useState } from "react";
import {
  ETH_MONTHS_AM,
  ETH_MONTHS_EN,
  WEEKDAYS_AM,
  WEEKDAYS_EN,
  ethWeekday,
  gregorianToEth,
  type EthDate,
  type GregDate,
} from "@/lib/ethiopian-calendar";
import type { Locale } from "@/i18n";

const ADDIS_TZ = "Africa/Addis_Ababa";

type ClockState = {
  time: string;
  gregLabel: string;
  ethLabel: string;
};

function addisParts(now: Date) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: ADDIS_TZ,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "long",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  const parts = Object.fromEntries(
    dtf.formatToParts(now).map((p) => [p.type, p.value]),
  ) as Record<string, string>;
  const greg: GregDate = {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
  };
  const eth: EthDate = gregorianToEth(greg);
  return { parts, greg, eth };
}

function buildClock(now: Date, locale: Locale): ClockState {
  const { parts, eth } = addisParts(now);
  const time = `${parts.hour}:${parts.minute}:${parts.second} ${parts.dayPeriod} EAT`;

  const gregLabel =
    locale === "am"
      ? new Intl.DateTimeFormat("am-ET", {
          timeZone: ADDIS_TZ,
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }).format(now)
      : new Intl.DateTimeFormat("en-US", {
          timeZone: ADDIS_TZ,
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }).format(now);

  const wd = ethWeekday(eth);
  const ethWeekdayName =
    locale === "am" ? WEEKDAYS_AM[wd] : WEEKDAYS_EN[wd];
  const ethMonthName =
    locale === "am"
      ? ETH_MONTHS_AM[eth.month - 1]
      : ETH_MONTHS_EN[eth.month - 1];

  const ethLabel =
    locale === "am"
      ? `${ethWeekdayName}፣ ${ethMonthName} ${eth.day}፣ ${eth.year} ዓ.ም.`
      : `${ethWeekdayName}, ${ethMonthName} ${eth.day}, ${eth.year} E.C.`;

  return { time, gregLabel, ethLabel };
}

export function SiteDateTimeBar({ locale }: { locale: Locale }) {
  const [clock, setClock] = useState<ClockState | null>(null);

  useEffect(() => {
    const tick = () => setClock(buildClock(new Date(), locale));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [locale]);

  return (
    <div className="border-b border-white/10 bg-gvn-deep-navy text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-0.5 px-4 py-1.5 text-[11px] leading-snug sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:text-xs">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-white/90">
          <span className="font-semibold tabular-nums tracking-wide text-white">
            {clock?.time ?? "—"}
          </span>
          <span aria-hidden className="hidden text-white/35 sm:inline">
            |
          </span>
          <span className="text-white/70">Addis Ababa</span>
        </div>
        <div className="flex min-w-0 flex-col gap-0.5 sm:items-end">
          <p className="truncate text-white/85">
            <span className="mr-1.5 font-semibold uppercase tracking-wider text-gvn-red">
              {locale === "am" ? "ግሪጎሪያን" : "Gregorian"}
            </span>
            {clock?.gregLabel ?? "—"}
          </p>
          <p className="truncate text-white/85">
            <span className="mr-1.5 font-semibold uppercase tracking-wider text-gvn-red">
              {locale === "am" ? "ኢትዮጵያዊ" : "Ethiopian"}
            </span>
            {clock?.ethLabel ?? "—"}
          </p>
        </div>
      </div>
    </div>
  );
}
