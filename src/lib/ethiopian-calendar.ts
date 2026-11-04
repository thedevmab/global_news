export type EthDate = {
  year: number;
  month: number; // 1–13 (Pagumen = 13)
  day: number;
};

export type GregDate = {
  year: number;
  month: number; // 1–12
  day: number;
};

export type CalendarCell = {
  eth: EthDate;
  greg: GregDate;
  inMonth: boolean;
  isToday: boolean;
  weekday: number; // 0 = Sunday … 6 = Saturday
};

export const ETH_MONTHS_EN = [
  "Meskerem",
  "Tikimt",
  "Hidar",
  "Tahsas",
  "Tir",
  "Yekatit",
  "Megabit",
  "Miyazia",
  "Ginbot",
  "Sene",
  "Hamle",
  "Nehase",
  "Pagumen",
] as const;

export const ETH_MONTHS_AM = [
  "መስከረም",
  "ጥቅምት",
  "ኅዳር",
  "ታኅሳስ",
  "ጥር",
  "የካቲት",
  "መጋቢት",
  "ሚያዝያ",
  "ግንቦት",
  "ሰኔ",
  "ሐምሌ",
  "ነሐሴ",
  "ጳጉሜን",
] as const;

export const WEEKDAYS_EN = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const WEEKDAYS_AM = [
  "እሁድ",
  "ሰኞ",
  "ማክሰኞ",
  "ረቡዕ",
  "ሐሙስ",
  "አርብ",
  "ቅዳሜ",
] as const;

export const WEEKDAYS_SHORT_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
export const WEEKDAYS_SHORT_AM = ["እሁድ", "ሰኞ", "ማክሰ", "ረቡዕ", "ሐሙስ", "አርብ", "ቅዳሜ"] as const;

/** Ethiopian leap year: year % 4 === 3 */
export function isEthLeapYear(year: number): boolean {
  return ((year % 4) + 4) % 4 === 3;
}

export function daysInEthMonth(year: number, month: number): number {
  if (month < 1 || month > 13) return 0;
  if (month === 13) return isEthLeapYear(year) ? 6 : 5;
  return 30;
}

function gregorianToJdn(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

function jdnToGregorian(jdn: number): GregDate {
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  const day = e - Math.floor((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * Math.floor(m / 10);
  const year = 100 * b + d - 4800 + Math.floor(m / 10);
  return { year, month, day };
}

/** JDN of Ethiopian New Year (Meskerem 1) for a given Ethiopian year. */
function ethNewYearJdn(ethYear: number): number {
  // Meskerem 1 → 11 Sep of (ethYear+7), or 12 Sep when the following Gregorian year is leap.
  const sepYear = ethYear + 7;
  const nyDay = isGregLeapYear(sepYear + 1) ? 12 : 11;
  return gregorianToJdn(sepYear, 9, nyDay);
}

function isGregLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function ethToJdn(eth: EthDate): number {
  const { year, month, day } = eth;
  return ethNewYearJdn(year) + (month - 1) * 30 + (day - 1);
}

export function jdnToEth(jdn: number): EthDate {
  // Estimate year then refine
  let year = Math.floor((jdn - ethNewYearJdn(2000)) / 365.25) + 2000;
  // Clamp search
  for (let i = 0; i < 8; i++) {
    const ny = ethNewYearJdn(year);
    const nextNy = ethNewYearJdn(year + 1);
    if (jdn < ny) {
      year -= 1;
      continue;
    }
    if (jdn >= nextNy) {
      year += 1;
      continue;
    }
    const offset = jdn - ny;
    const month = Math.floor(offset / 30) + 1;
    const day = (offset % 30) + 1;
    return { year, month, day };
  }
  // Fallback linear scan around estimate
  while (jdn < ethNewYearJdn(year)) year -= 1;
  while (jdn >= ethNewYearJdn(year + 1)) year += 1;
  const offset = jdn - ethNewYearJdn(year);
  return {
    year,
    month: Math.floor(offset / 30) + 1,
    day: (offset % 30) + 1,
  };
}

export function ethToGregorian(eth: EthDate): GregDate {
  return jdnToGregorian(ethToJdn(eth));
}

export function gregorianToEth(greg: GregDate): EthDate {
  return jdnToEth(gregorianToJdn(greg.year, greg.month, greg.day));
}

export function todayEth(now = new Date()): EthDate {
  return gregorianToEth({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  });
}

export function todayGreg(now = new Date()): GregDate {
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  };
}

/** Weekday for an Ethiopian date: 0 Sunday … 6 Saturday (same as JS getUTCDay for that civil day). */
export function ethWeekday(eth: EthDate): number {
  const g = ethToGregorian(eth);
  // Use UTC noon to avoid TZ edge cases
  return new Date(Date.UTC(g.year, g.month - 1, g.day, 12)).getUTCDay();
}

export function sameEthDay(a: EthDate, b: EthDate): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

export function addEthMonths(eth: EthDate, delta: number): EthDate {
  let year = eth.year;
  let month = eth.month + delta;
  while (month > 13) {
    month -= 13;
    year += 1;
  }
  while (month < 1) {
    month += 13;
    year -= 1;
  }
  const maxDay = daysInEthMonth(year, month);
  return { year, month, day: Math.min(eth.day, maxDay) };
}

export function buildMonth(
  ethYear: number,
  ethMonth: number,
  now = new Date(),
): CalendarCell[] {
  const today = todayEth(now);
  const days = daysInEthMonth(ethYear, ethMonth);
  const first: EthDate = { year: ethYear, month: ethMonth, day: 1 };
  const startWeekday = ethWeekday(first);

  const cells: CalendarCell[] = [];

  // Leading days from previous month
  const prev = addEthMonths({ year: ethYear, month: ethMonth, day: 1 }, -1);
  const prevDays = daysInEthMonth(prev.year, prev.month);
  for (let i = startWeekday - 1; i >= 0; i--) {
    const eth: EthDate = {
      year: prev.year,
      month: prev.month,
      day: prevDays - i,
    };
    const greg = ethToGregorian(eth);
    cells.push({
      eth,
      greg,
      inMonth: false,
      isToday: sameEthDay(eth, today),
      weekday: ethWeekday(eth),
    });
  }

  for (let day = 1; day <= days; day++) {
    const eth: EthDate = { year: ethYear, month: ethMonth, day };
    const greg = ethToGregorian(eth);
    cells.push({
      eth,
      greg,
      inMonth: true,
      isToday: sameEthDay(eth, today),
      weekday: ethWeekday(eth),
    });
  }

  // Trailing days to complete weeks (6 rows max)
  let nextDay = 1;
  const next = addEthMonths({ year: ethYear, month: ethMonth, day: 1 }, 1);
  while (cells.length % 7 !== 0) {
    const eth: EthDate = {
      year: next.year,
      month: next.month,
      day: nextDay++,
    };
    const greg = ethToGregorian(eth);
    cells.push({
      eth,
      greg,
      inMonth: false,
      isToday: sameEthDay(eth, today),
      weekday: ethWeekday(eth),
    });
  }

  return cells;
}

export function formatEthDate(
  eth: EthDate,
  locale: "en" | "am",
  opts?: { weekday?: boolean },
): string {
  const months = locale === "am" ? ETH_MONTHS_AM : ETH_MONTHS_EN;
  const monthName = months[eth.month - 1] ?? String(eth.month);
  const base = `${eth.day} ${monthName} ${eth.year}`;
  if (!opts?.weekday) return base;
  const wd = ethWeekday(eth);
  const weekdays = locale === "am" ? WEEKDAYS_AM : WEEKDAYS_EN;
  return `${weekdays[wd]}, ${base}`;
}

export function formatGregDate(greg: GregDate, locale: "en" | "am"): string {
  const d = new Date(Date.UTC(greg.year, greg.month - 1, greg.day, 12));
  try {
    return new Intl.DateTimeFormat(locale === "am" ? "am-ET" : "en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(d);
  } catch {
    return `${greg.day}/${greg.month}/${greg.year}`;
  }
}

export function isValidEthDate(eth: EthDate): boolean {
  if (!Number.isInteger(eth.year) || !Number.isInteger(eth.month) || !Number.isInteger(eth.day)) {
    return false;
  }
  if (eth.month < 1 || eth.month > 13) return false;
  if (eth.day < 1 || eth.day > daysInEthMonth(eth.year, eth.month)) return false;
  return true;
}

export function isValidGregDate(greg: GregDate): boolean {
  if (!Number.isInteger(greg.year) || !Number.isInteger(greg.month) || !Number.isInteger(greg.day)) {
    return false;
  }
  if (greg.month < 1 || greg.month > 12) return false;
  const d = new Date(Date.UTC(greg.year, greg.month - 1, greg.day));
  return (
    d.getUTCFullYear() === greg.year &&
    d.getUTCMonth() === greg.month - 1 &&
    d.getUTCDate() === greg.day
  );
}
