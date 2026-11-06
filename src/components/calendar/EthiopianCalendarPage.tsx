"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getDictionary, type Locale } from "@/i18n";
import {
  ETH_MONTHS_AM,
  ETH_MONTHS_EN,
  WEEKDAYS_SHORT_AM,
  WEEKDAYS_SHORT_EN,
  addEthMonths,
  buildMonth,
  daysInEthMonth,
  ethToGregorian,
  formatEthDate,
  formatGregDate,
  gregorianToEth,
  isValidEthDate,
  isValidGregDate,
  sameEthDay,
  todayEth,
  todayGreg,
  type EthDate,
  type GregDate,
} from "@/lib/ethiopian-calendar";
import {
  holidaysForEthYear,
  holidaysInMonth,
  holidaysOnDay,
  type Holiday,
  type HolidayCategory,
} from "@/lib/ethiopian-holidays";
import { cn } from "@/lib/utils";

type Filter = "all" | HolidayCategory;

function monthName(month: number, locale: Locale): string {
  const list = locale === "am" ? ETH_MONTHS_AM : ETH_MONTHS_EN;
  return list[month - 1] ?? String(month);
}

function holidayTitle(h: Holiday, locale: Locale): string {
  return locale === "am" ? h.nameAm : h.nameEn;
}

export function EthiopianCalendarPage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const copy = dict.calendarPage;
  const now = useMemo(() => new Date(), []);
  const initial = todayEth(now);

  const [view, setView] = useState<EthDate>({
    year: initial.year,
    month: initial.month,
    day: 1,
  });
  const [selected, setSelected] = useState<EthDate>(initial);
  const [filter, setFilter] = useState<Filter>("all");

  const [gIn, setGIn] = useState<GregDate>(todayGreg(now));
  const [eIn, setEIn] = useState<EthDate>(initial);
  const [gResult, setGResult] = useState<EthDate | null>(initial);
  const [eResult, setEResult] = useState<GregDate | null>(todayGreg(now));
  const [gError, setGError] = useState(false);
  const [eError, setEError] = useState(false);

  const yearHolidays = useMemo(
    () => holidaysForEthYear(view.year),
    [view.year],
  );

  const cells = useMemo(
    () => buildMonth(view.year, view.month, now),
    [view.year, view.month, now],
  );

  const monthHolidays = useMemo(
    () => holidaysInMonth(view.year, view.month, yearHolidays),
    [view.year, view.month, yearHolidays],
  );

  const selectedHolidays = useMemo(
    () => holidaysOnDay(selected, yearHolidays),
    [selected, yearHolidays],
  );

  const filteredHolidays = useMemo(() => {
    const base = filter === "all" ? yearHolidays : yearHolidays.filter((h) => h.category === filter);
    return base;
  }, [yearHolidays, filter]);

  const weekdays = locale === "am" ? WEEKDAYS_SHORT_AM : WEEKDAYS_SHORT_EN;
  const today = todayEth(now);
  const todayG = todayGreg(now);

  function goToday() {
    setView({ year: today.year, month: today.month, day: 1 });
    setSelected(today);
  }

  function shiftMonth(delta: number) {
    const next = addEthMonths({ ...view, day: 1 }, delta);
    setView({ year: next.year, month: next.month, day: 1 });
  }

  function convertToEth() {
    if (!isValidGregDate(gIn)) {
      setGError(true);
      setGResult(null);
      return;
    }
    setGError(false);
    setGResult(gregorianToEth(gIn));
  }

  function convertToGreg() {
    if (!isValidEthDate(eIn)) {
      setEError(true);
      setEResult(null);
      return;
    }
    setEError(false);
    setEResult(ethToGregorian(eIn));
  }

  const holidayKey = (h: Holiday) =>
    `${h.eth.year}-${h.eth.month}-${h.eth.day}-${h.id}`;

  const dayHolidayIds = useMemo(() => {
    const map = new Map<string, Holiday[]>();
    for (const h of monthHolidays) {
      const key = `${h.eth.month}-${h.eth.day}`;
      const list = map.get(key) ?? [];
      list.push(h);
      map.set(key, list);
    }
    return map;
  }, [monthHolidays]);

  return (
    <div className="min-w-0">
      <header className="border-b border-border bg-background text-foreground dark:bg-inverse dark:text-inverse-foreground">
        <div aria-hidden className="h-[3px] bg-gvn-red" />
        <div className="mx-auto max-w-7xl px-4 py-10 md:py-12">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:text-white/70">
            {copy.ethLabel}
          </p>
          <h1 className="mt-1 font-serif text-4xl font-bold text-gvn-navy dark:text-white md:text-5xl">
            {copy.title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground dark:text-white/80 md:text-base">
            {copy.standfirst}
          </p>
          <p className="mt-4 text-sm text-foreground dark:text-white/90">
            <span className="font-semibold">{copy.today}:</span>{" "}
            {formatEthDate(today, locale, { weekday: true })}
            <span className="mx-2 text-muted-foreground/60 dark:text-white/40">·</span>
            {formatGregDate(todayG, locale)}
          </p>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:py-10">
        <div className="space-y-6">
          <section className="rounded-md border border-border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => shiftMonth(-1)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground hover:bg-muted"
                  aria-label={copy.previousMonth}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <h2 className="min-w-[10rem] text-center font-serif text-xl font-bold text-foreground">
                  {monthName(view.month, locale)} {view.year}
                </h2>
                <button
                  type="button"
                  onClick={() => shiftMonth(1)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground hover:bg-muted"
                  aria-label={copy.nextMonth}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <button
                type="button"
                onClick={goToday}
                className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:border-gvn-red hover:text-gvn-red"
              >
                {copy.today}
              </button>
            </div>

            <div className="grid grid-cols-7 border-b border-border bg-muted/40 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {weekdays.map((d) => (
                <div key={d} className="px-1 py-2">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {cells.map((cell) => {
                const key = `${cell.eth.year}-${cell.eth.month}-${cell.eth.day}`;
                const marks =
                  cell.inMonth
                    ? dayHolidayIds.get(`${cell.eth.month}-${cell.eth.day}`) ?? []
                    : [];
                const selectedDay = sameEthDay(cell.eth, selected);
                return (
                  <button
                    key={key + String(cell.inMonth)}
                    type="button"
                    onClick={() => {
                      setSelected(cell.eth);
                      if (!cell.inMonth) {
                        setView({
                          year: cell.eth.year,
                          month: cell.eth.month,
                          day: 1,
                        });
                      }
                    }}
                    className={cn(
                      "relative flex min-h-[4.25rem] flex-col items-start border-b border-r border-border p-1.5 text-left transition-colors last:border-r-0",
                      !cell.inMonth && "bg-muted/20 text-muted-foreground",
                      cell.inMonth && "hover:bg-gvn-red/5",
                      selectedDay && "bg-gvn-red/10",
                      cell.isToday && "ring-2 ring-inset ring-gvn-red",
                    )}
                  >
                    <span
                      className={cn(
                        "text-sm font-bold tabular-nums",
                        cell.inMonth ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {cell.eth.day}
                    </span>
                    <span className="text-[10px] tabular-nums text-muted-foreground">
                      {cell.greg.day}/{cell.greg.month}
                    </span>
                    {marks.length > 0 ? (
                      <span className="mt-auto flex gap-0.5">
                        {marks.slice(0, 3).map((h) => (
                          <span
                            key={holidayKey(h)}
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              h.category === "national"
                                ? "bg-gvn-red"
                                : "bg-gvn-navy",
                            )}
                            title={holidayTitle(h, locale)}
                          />
                        ))}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-md border border-border bg-card p-4">
            <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">
              {copy.selectedDay}
            </h3>
            <p className="mt-2 font-serif text-xl font-semibold text-foreground">
              {formatEthDate(selected, locale, { weekday: true })}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {copy.gregLabel}: {formatGregDate(ethToGregorian(selected), locale)}
            </p>
            {selectedHolidays.length > 0 ? (
              <ul className="mt-3 space-y-1.5">
                {selectedHolidays.map((h) => (
                  <li
                    key={holidayKey(h)}
                    className="flex items-center gap-2 text-sm text-foreground"
                  >
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        h.category === "national" ? "bg-gvn-red" : "bg-gvn-navy",
                      )}
                    />
                    {holidayTitle(h, locale)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">{copy.noHolidays}</p>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-md border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">
                {copy.holidaysYear}
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {(
                  [
                    ["all", copy.all],
                    ["national", copy.national],
                    ["religious", copy.religious],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setFilter(id)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-semibold",
                      filter === id
                        ? "border-gvn-red bg-gvn-red/10 text-gvn-red"
                        : "border-border text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <ul className="max-h-[22rem] divide-y divide-border overflow-y-auto">
              {filteredHolidays.length === 0 ? (
                <li className="px-4 py-6 text-sm text-muted-foreground">
                  {copy.noHolidays}
                </li>
              ) : (
                filteredHolidays.map((h) => {
                  const inView = h.eth.month === view.month;
                  return (
                    <li key={holidayKey(h)}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelected(h.eth);
                          setView({
                            year: h.eth.year,
                            month: h.eth.month,
                            day: 1,
                          });
                        }}
                        className={cn(
                          "flex w-full flex-col gap-0.5 px-4 py-3 text-left hover:bg-muted/40",
                          inView && "bg-gvn-red/[0.04]",
                        )}
                      >
                        <span className="text-sm font-semibold text-foreground">
                          {holidayTitle(h, locale)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatEthDate(h.eth, locale)} ·{" "}
                          {formatGregDate(h.greg, locale)}
                        </span>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </section>

          <section className="rounded-md border border-border bg-card p-4">
            <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">
              {copy.converter}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{copy.converterHelp}</p>

            <div className="mt-4 space-y-5">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gvn-red">
                  {copy.toEthiopian}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <label className="text-xs text-muted-foreground">
                    {copy.day}
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={gIn.day}
                      onChange={(e) =>
                        setGIn((v) => ({ ...v, day: Number(e.target.value) }))
                      }
                      className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground"
                    />
                  </label>
                  <label className="text-xs text-muted-foreground">
                    {copy.month}
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={gIn.month}
                      onChange={(e) =>
                        setGIn((v) => ({ ...v, month: Number(e.target.value) }))
                      }
                      className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground"
                    />
                  </label>
                  <label className="text-xs text-muted-foreground">
                    {copy.year}
                    <input
                      type="number"
                      value={gIn.year}
                      onChange={(e) =>
                        setGIn((v) => ({ ...v, year: Number(e.target.value) }))
                      }
                      className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground"
                    />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={convertToEth}
                  className="mt-2 rounded-md bg-gvn-navy px-3 py-2 text-xs font-semibold text-white hover:bg-gvn-deep-navy"
                >
                  {copy.convert}
                </button>
                {gError ? (
                  <p className="mt-2 text-xs text-gvn-red">{copy.invalidDate}</p>
                ) : gResult ? (
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {copy.result}: {formatEthDate(gResult, locale, { weekday: true })}
                  </p>
                ) : null}
              </div>

              <div className="border-t border-border pt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gvn-red">
                  {copy.toGregorian}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <label className="text-xs text-muted-foreground">
                    {copy.day}
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={eIn.day}
                      onChange={(e) =>
                        setEIn((v) => ({ ...v, day: Number(e.target.value) }))
                      }
                      className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground"
                    />
                  </label>
                  <label className="text-xs text-muted-foreground">
                    {copy.month}
                    <select
                      value={eIn.month}
                      onChange={(e) => {
                        const month = Number(e.target.value);
                        setEIn((v) => ({
                          ...v,
                          month,
                          day: Math.min(v.day, daysInEthMonth(v.year, month)),
                        }));
                      }}
                      className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground"
                    >
                      {(locale === "am" ? ETH_MONTHS_AM : ETH_MONTHS_EN).map(
                        (name, index) => (
                          <option key={name} value={index + 1}>
                            {name}
                          </option>
                        ),
                      )}
                    </select>
                  </label>
                  <label className="text-xs text-muted-foreground">
                    {copy.year}
                    <input
                      type="number"
                      value={eIn.year}
                      onChange={(e) =>
                        setEIn((v) => ({ ...v, year: Number(e.target.value) }))
                      }
                      className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground"
                    />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={convertToGreg}
                  className="mt-2 rounded-md bg-gvn-navy px-3 py-2 text-xs font-semibold text-white hover:bg-gvn-deep-navy"
                >
                  {copy.convert}
                </button>
                {eError ? (
                  <p className="mt-2 text-xs text-gvn-red">{copy.invalidDate}</p>
                ) : eResult ? (
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {copy.result}: {formatGregDate(eResult, locale)}
                  </p>
                ) : null}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
