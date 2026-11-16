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

const partsFmt = new Intl.DateTimeFormat("en-US", {
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

const gregEnFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: ADDIS_TZ,
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});

const gregAmFmt = new Intl.DateTimeFormat("am-ET", {
  timeZone: ADDIS_TZ,
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});

type DateLabels = { gregLabel: string; ethLabel: string; dayKey: string };

function addisGreg(now: Date): GregDate {
  const parts = Object.fromEntries(
    partsFmt.formatToParts(now).map((p) => [p.type, p.value]),
  ) as Record<string, string>;
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
  };
}

function buildDateLabels(now: Date, locale: Locale): DateLabels {
  const greg = addisGreg(now);
  const eth: EthDate = gregorianToEth(greg);
  const dayKey = `${greg.year}-${greg.month}-${greg.day}`;

  const gregLabel =
    locale === "am" ? gregAmFmt.format(now) : gregEnFmt.format(now);

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

  return { gregLabel, ethLabel, dayKey };
}

function formatTime(now: Date): string {
  const parts = Object.fromEntries(
    partsFmt.formatToParts(now).map((p) => [p.type, p.value]),
  ) as Record<string, string>;
  return `${parts.hour}:${parts.minute}:${parts.second} ${parts.dayPeriod} EAT`;
}

function ClockTime() {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => {
      if (document.hidden) return;
      setTime(formatTime(new Date()));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    const onVis = () => {
      if (!document.hidden) tick();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <span className="font-semibold tabular-nums tracking-wide text-chrome-foreground">
      {time ?? "—"}
    </span>
  );
}

export function SiteDateTimeBar({ locale }: { locale: Locale }) {
  const [labels, setLabels] = useState<DateLabels | null>(null);

  useEffect(() => {
    const refresh = () => {
      if (document.hidden) return;
      const next = buildDateLabels(new Date(), locale);
      setLabels((prev) =>
        prev && prev.dayKey === next.dayKey ? prev : next,
      );
    };
    refresh();
    const id = window.setInterval(refresh, 60_000);
    const onVis = () => {
      if (!document.hidden) refresh();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [locale]);

  return (
    <div className="border-b border-chrome-border bg-chrome text-chrome-foreground">
      <div className="mx-auto flex max-w-7xl flex-col gap-0.5 px-4 py-1.5 text-[11px] leading-snug sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:text-xs">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-chrome-foreground/90">
          <ClockTime />
          <span aria-hidden className="hidden text-chrome-foreground/35 sm:inline">
            |
          </span>
          <span className="text-chrome-foreground/70">Addis Ababa</span>
        </div>
        <div className="flex min-w-0 flex-col gap-0.5 sm:items-end">
          <p className="truncate text-chrome-foreground/85">
            <span className="mr-1.5 font-semibold uppercase tracking-wider text-gvn-red">
              {locale === "am" ? "ግሪጎሪያን" : "Gregorian"}
            </span>
            {labels?.gregLabel ?? "—"}
          </p>
          <p className="truncate text-chrome-foreground/85">
            <span className="mr-1.5 font-semibold uppercase tracking-wider text-gvn-red">
              {locale === "am" ? "ኢትዮጵያዊ" : "Ethiopian"}
            </span>
            {labels?.ethLabel ?? "—"}
          </p>
        </div>
      </div>
    </div>
  );
}
