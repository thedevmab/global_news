import {
  ethToGregorian,
  ethToJdn,
  jdnToEth,
  type EthDate,
  type GregDate,
} from "@/lib/ethiopian-calendar";

export type HolidayCategory = "religious" | "national";

export type Holiday = {
  id: string;
  nameEn: string;
  nameAm: string;
  eth: EthDate;
  greg: GregDate;
  category: HolidayCategory;
};

type FixedHolidayDef = {
  id: string;
  nameEn: string;
  nameAm: string;
  month: number;
  day: number;
  category: HolidayCategory;
};

const FIXED: FixedHolidayDef[] = [
  {
    id: "enkutatash",
    nameEn: "Enkutatash (Ethiopian New Year)",
    nameAm: "እንቁጣጣሽ (አዲስ ዓመት)",
    month: 1,
    day: 1,
    category: "national",
  },
  {
    id: "meskel",
    nameEn: "Meskel (Finding of the True Cross)",
    nameAm: "መስቀል",
    month: 1,
    day: 17,
    category: "religious",
  },
  {
    id: "timkat",
    nameEn: "Timkat (Epiphany)",
    nameAm: "ጥምቀት",
    month: 5,
    day: 11,
    category: "religious",
  },
  {
    id: "adwa",
    nameEn: "Adwa Victory Day",
    nameAm: "የአድዋ ድል በዓል",
    month: 6,
    day: 23,
    category: "national",
  },
  {
    id: "labour",
    nameEn: "International Labour Day",
    nameAm: "የዓለም አቀፍ የሰራተኞች ቀን",
    month: 8,
    day: 23,
    category: "national",
  },
  {
    id: "patriots",
    nameEn: "Patriots' Victory Day",
    nameAm: "የአርበኞች ድል በዓል",
    month: 8,
    day: 27,
    category: "national",
  },
  {
    id: "derg-downfall",
    nameEn: "Downfall of the Derg",
    nameAm: "የደርግ ውድቀት",
    month: 9,
    day: 20,
    category: "national",
  },
];

/**
 * Ethiopian Orthodox Easter (Fasika) for an Ethiopian year.
 * Uses the Meeus algorithm adapted for the Ethiopian calendar
 * (same computus as Eastern Orthodox, mapped into Eth dates).
 */
export function ethEaster(ethYear: number): EthDate {
  // Convert Eth year to approximate Gregorian year of that spring
  const gYear = ethYear + 8;
  // Anonymous Gregorian algorithm for Orthodox Easter (Julian-based)
  const a = gYear % 4;
  const b = gYear % 7;
  const c = gYear % 19;
  const d = (19 * c + 15) % 30;
  const e = (2 * a + 4 * b - d + 34) % 7;
  const month = Math.floor((d + e + 114) / 31); // 3=March, 4=April (Julian)
  const day = ((d + e + 114) % 31) + 1;

  // Julian Easter date in Gregorian civil calendar:
  // Add 13 days for 1900–2099
  const julianJdn = (() => {
    // Treat month/day as Julian calendar date in gYear
    const y = gYear;
    const m = month;
    const d0 = day;
    const a0 = Math.floor((14 - m) / 12);
    const y0 = y + 4800 - a0;
    const m0 = m + 12 * a0 - 3;
    return (
      d0 +
      Math.floor((153 * m0 + 2) / 5) +
      365 * y0 +
      Math.floor(y0 / 4) -
      32083
    );
  })();
  const gregJdn = julianJdn + 13; // 20th/21st century offset
  return jdnToEth(gregJdn);
}

function addDaysEth(eth: EthDate, delta: number): EthDate {
  return jdnToEth(ethToJdn(eth) + delta);
}

function makeHoliday(
  id: string,
  nameEn: string,
  nameAm: string,
  eth: EthDate,
  category: HolidayCategory,
): Holiday {
  return {
    id,
    nameEn,
    nameAm,
    eth,
    greg: ethToGregorian(eth),
    category,
  };
}

export function holidaysForEthYear(ethYear: number): Holiday[] {
  const fixed = FIXED.map((h) =>
    makeHoliday(
      `${h.id}-${ethYear}`,
      h.nameEn,
      h.nameAm,
      { year: ethYear, month: h.month, day: h.day },
      h.category,
    ),
  );

  const fasika = ethEaster(ethYear);
  const movable = [
    makeHoliday(
      `good-friday-${ethYear}`,
      "Siklet (Good Friday)",
      "ስቅለት",
      addDaysEth(fasika, -2),
      "religious",
    ),
    makeHoliday(
      `fasika-${ethYear}`,
      "Fasika (Ethiopian Easter)",
      "ፋሲካ",
      fasika,
      "religious",
    ),
  ];

  return [...fixed, ...movable].sort(
    (a, b) => ethToJdn(a.eth) - ethToJdn(b.eth),
  );
}

export function holidaysOnDay(
  eth: EthDate,
  yearHolidays?: Holiday[],
): Holiday[] {
  const list = yearHolidays ?? holidaysForEthYear(eth.year);
  return list.filter(
    (h) =>
      h.eth.year === eth.year &&
      h.eth.month === eth.month &&
      h.eth.day === eth.day,
  );
}

export function holidaysInMonth(
  ethYear: number,
  ethMonth: number,
  yearHolidays?: Holiday[],
): Holiday[] {
  const list = yearHolidays ?? holidaysForEthYear(ethYear);
  return list.filter((h) => h.eth.year === ethYear && h.eth.month === ethMonth);
}
