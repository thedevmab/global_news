"use client";

import { useMemo, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { getDictionary, type Locale } from "@/i18n";
import {
  CURRENCIES,
  QUICK_PAIRS,
  convert,
  formatMoney,
  type CurrencyBoard,
  type CurrencyCode,
} from "@/lib/currency-rates";
import { cn } from "@/lib/utils";

function currencyLabel(code: CurrencyCode, locale: Locale): string {
  const meta = CURRENCIES.find((c) => c.code === code);
  if (!meta) return code;
  const name = locale === "am" ? meta.nameAm : meta.nameEn;
  return `${code} · ${name}`;
}

export function CurrencyConverterClient({
  locale,
  board,
}: {
  locale: Locale;
  board: CurrencyBoard;
}) {
  const dict = getDictionary(locale);
  const copy = dict.businessPage;
  const [amount, setAmount] = useState("1000");
  const [from, setFrom] = useState<CurrencyCode>("ETB");
  const [to, setTo] = useState<CurrencyCode>("USD");

  const amountNumber = Number(String(amount).replace(/,/g, ""));
  const result = useMemo(() => {
    if (!Number.isFinite(amountNumber)) return null;
    return convert(amountNumber, from, to, board.rates);
  }, [amountNumber, from, to, board.rates]);

  const available = CURRENCIES.filter(
    (c) => c.code === "ETB" || board.rates[c.code] != null,
  );

  function swap() {
    setFrom(to);
    setTo(from);
  }

  function applyPair(nextFrom: CurrencyCode, nextTo: CurrencyCode) {
    setFrom(nextFrom);
    setTo(nextTo);
  }

  if (board.failed) {
    return (
      <p className="rounded-md border border-border bg-muted/40 px-4 py-6 text-sm text-muted-foreground">
        {copy.unavailable}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gvn-red">
            {copy.eyebrow}
            {board.date ? ` · ${board.date}` : ""}
          </p>
          <h2 className="font-serif text-2xl font-bold text-foreground">
            {copy.title}
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {copy.standfirst}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">{copy.credit}</p>
      </div>

      <section className="rounded-md border border-border bg-card p-4 md:p-6">
        <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-foreground">
          {copy.converter}
        </h3>

        <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr]">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {copy.amount}
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-lg font-semibold tabular-nums text-foreground outline-none focus-visible:ring-2 focus-visible:ring-gvn-red/40"
              aria-label={copy.amount}
            />
            <select
              value={from}
              onChange={(event) => setFrom(event.target.value as CurrencyCode)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-gvn-red/40"
              aria-label={copy.from}
            >
              {available.map((c) => (
                <option key={c.code} value={c.code}>
                  {currencyLabel(c.code, locale)}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end justify-center pb-1 md:pb-8">
            <button
              type="button"
              onClick={swap}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background text-gvn-navy hover:border-gvn-red hover:text-gvn-red"
              aria-label={copy.swap}
            >
              <ArrowLeftRight className="h-4 w-4" />
            </button>
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {copy.result}
            </span>
            <div className="flex min-h-[2.75rem] items-center rounded-md border border-gvn-navy/15 bg-gvn-navy px-3 py-2.5 text-lg font-semibold tabular-nums text-white">
              {result == null
                ? "—"
                : `${formatMoney(result, to, locale)} ${to}`}
            </div>
            <select
              value={to}
              onChange={(event) => setTo(event.target.value as CurrencyCode)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-gvn-red/40"
              aria-label={copy.to}
            >
              {available.map((c) => (
                <option key={c.code} value={c.code}>
                  {currencyLabel(c.code, locale)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {copy.quickPairs}
          </p>
          <div className="flex flex-wrap gap-2">
            {QUICK_PAIRS.map((pair) => {
              const active = from === pair.from && to === pair.to;
              return (
                <button
                  key={`${pair.from}-${pair.to}`}
                  type="button"
                  onClick={() => applyPair(pair.from, pair.to)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-semibold",
                    active
                      ? "border-gvn-red bg-gvn-red/10 text-gvn-red"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {pair.from} ↔ {pair.to}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-md border border-border bg-card">
        <h3 className="border-b border-border px-4 py-3 text-sm font-bold uppercase tracking-wide text-foreground">
          {copy.rateBoard}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[28rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2 font-semibold">{copy.currency}</th>
                <th className="px-3 py-2 text-right font-semibold">
                  {copy.perEtb}
                </th>
                <th className="px-4 py-2 text-right font-semibold">
                  {copy.perUnit}
                </th>
              </tr>
            </thead>
            <tbody>
              {available
                .filter((c) => c.code !== "ETB")
                .map((meta) => {
                  const perEtb = board.rates[meta.code];
                  if (perEtb == null) return null;
                  const perUnit = 1 / perEtb;
                  return (
                    <tr
                      key={meta.code}
                      className="border-b border-border last:border-0"
                    >
                      <td className="px-4 py-2.5">
                        <span className="font-semibold text-foreground">
                          {meta.code}
                        </span>
                        <span className="ml-2 text-muted-foreground">
                          {locale === "am" ? meta.nameAm : meta.nameEn}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-foreground">
                        {formatMoney(perEtb, meta.code, locale)}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-foreground">
                        {formatMoney(perUnit, "ETB", locale)} ETB
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
