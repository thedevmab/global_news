const LEAGUE = "eng.1";
const SITE = "https://site.api.espn.com/apis";
const CORE = "https://sports.core.api.espn.com/v2";
const SPORTSDB = "https://www.thesportsdb.com/api/v1/json/123";
const SPORTSDB_LEAGUE = "4328";
const REVALIDATE = 900;

const FETCH_HEADERS = {
  accept: "application/json, text/plain, */*",
  "accept-language": "en-US,en;q=0.9",
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  referer: "https://www.espn.com/soccer/table/_/league/eng.1",
  origin: "https://www.espn.com",
};

export type PremierMatch = {
  id: string;
  home: string;
  away: string;
  homeScore: number | null;
  awayScore: number | null;
  kickoff: string | null;
  status: string;
  venue: string | null;
  homeBadge: string | null;
  awayBadge: string | null;
  live: boolean;
};

export type PremierStanding = {
  rank: number;
  team: string;
  badge: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: string;
  points: number;
  form: string | null;
};

export type PremierPlayer = {
  id: string;
  name: string;
  team: string;
  teamBadge: string | null;
  headshot: string | null;
  goals: number;
  assists: number;
  matches: number;
  category: "goals" | "assists";
};

export type PremierLeagueBoard = {
  seasonLabel: string | null;
  standings: PremierStanding[];
  players: PremierPlayer[];
  live: PremierMatch[];
  results: PremierMatch[];
  fixtures: PremierMatch[];
  failed: boolean;
};

type EspnEvent = {
  id?: string;
  date?: string;
  status?: {
    type?: {
      name?: string;
      state?: string;
      detail?: string;
      shortDetail?: string;
    };
  };
  competitions?: Array<{
    venue?: { fullName?: string };
    competitors?: Array<{
      homeAway?: string;
      score?: string;
      team?: {
        displayName?: string;
        logo?: string;
        logos?: Array<{ href?: string }>;
      };
    }>;
  }>;
};

type SportsDbEvent = {
  idEvent?: string;
  strHomeTeam?: string;
  strAwayTeam?: string;
  intHomeScore?: string | null;
  intAwayScore?: string | null;
  strTimestamp?: string | null;
  dateEvent?: string | null;
  strTime?: string | null;
  strStatus?: string | null;
  strVenue?: string | null;
  strHomeTeamBadge?: string | null;
  strAwayTeamBadge?: string | null;
  idLeague?: string | null;
  strProgress?: string | null;
};

function statValue(
  stats:
    | Array<{
        name?: string;
        abbreviation?: string;
        displayValue?: string;
        value?: number | string;
      }>
    | undefined,
  name: string,
): string {
  const found = stats?.find((s) => s.name === name || s.abbreviation === name);
  if (!found) return "";
  if (found.displayValue != null && found.displayValue !== "") {
    return String(found.displayValue);
  }
  if (found.value != null) return String(found.value);
  return "";
}

function toInt(value: string | number | null | undefined): number {
  if (value == null || value === "") return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, {
      next: { revalidate: REVALIDATE },
      headers: FETCH_HEADERS,
    });
    if (!response.ok) return null;
    const type = response.headers.get("content-type") || "";
    if (!type.includes("json")) {
      const text = await response.text();
      if (text.trimStart().startsWith("<")) return null;
      try {
        return JSON.parse(text) as T;
      } catch {
        return null;
      }
    }
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function mapEspnEvent(event: EspnEvent): PremierMatch | null {
  const competition = event.competitions?.[0];
  const competitors = competition?.competitors ?? [];
  const home = competitors.find((c) => c.homeAway === "home");
  const away = competitors.find((c) => c.homeAway === "away");
  if (!event.id || !home?.team?.displayName || !away?.team?.displayName) {
    return null;
  }

  const state = event.status?.type?.state || "";
  const live = state === "in";
  const finished = state === "post";

  return {
    id: event.id,
    home: home.team.displayName,
    away: away.team.displayName,
    homeScore: finished || live ? toInt(home.score) : null,
    awayScore: finished || live ? toInt(away.score) : null,
    kickoff: event.date || null,
    status:
      event.status?.type?.shortDetail ||
      event.status?.type?.detail ||
      event.status?.type?.name ||
      "",
    venue: competition?.venue?.fullName || null,
    homeBadge: home.team.logo || home.team.logos?.[0]?.href || null,
    awayBadge: away.team.logo || away.team.logos?.[0]?.href || null,
    live,
  };
}

function sportsDbKickoff(event: SportsDbEvent): string | null {
  if (event.strTimestamp) {
    const d = new Date(event.strTimestamp);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  if (event.dateEvent) {
    const time =
      event.strTime && event.strTime !== "00:00:00"
        ? event.strTime
        : "12:00:00";
    const d = new Date(`${event.dateEvent}T${time}Z`);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return null;
}

function mapSportsDbEvent(
  event: SportsDbEvent,
  live = false,
): PremierMatch | null {
  if (!event.idEvent || !event.strHomeTeam || !event.strAwayTeam) return null;
  const status = (event.strStatus || "").trim() || (live ? "LIVE" : "NS");
  const finished =
    /^(FT|AET|PEN)$/i.test(status) || /finished/i.test(status);
  const homeScore =
    finished || live
      ? event.intHomeScore == null || event.intHomeScore === ""
        ? null
        : toInt(event.intHomeScore)
      : null;
  const awayScore =
    finished || live
      ? event.intAwayScore == null || event.intAwayScore === ""
        ? null
        : toInt(event.intAwayScore)
      : null;
  return {
    id: event.idEvent,
    home: event.strHomeTeam,
    away: event.strAwayTeam,
    homeScore,
    awayScore,
    kickoff: sportsDbKickoff(event),
    status: event.strProgress?.trim() || status,
    venue: event.strVenue?.trim() || null,
    homeBadge: event.strHomeTeamBadge || null,
    awayBadge: event.strAwayTeamBadge || null,
    live,
  };
}

function yyyymmdd(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

async function fetchScoreboard(dates?: string) {
  const query = dates ? `?dates=${dates}&limit=50` : "?limit=50";
  return fetchJson<{
    events?: EspnEvent[];
    leagues?: Array<{
      season?: { year?: number; displayName?: string };
      calendar?: string[];
    }>;
  }>(`${SITE}/site/v2/sports/soccer/${LEAGUE}/scoreboard${query}`);
}

async function resolveAthlete(
  seasonYear: number,
  ref: string,
): Promise<{ id: string; name: string; headshot: string | null } | null> {
  const match = /athletes\/(\d+)/.exec(ref);
  if (!match) return null;
  const id = match[1];
  const data = await fetchJson<{
    id?: string;
    displayName?: string;
    fullName?: string;
    headshot?: { href?: string };
  }>(
    `${CORE}/sports/soccer/leagues/${LEAGUE}/seasons/${seasonYear}/athletes/${id}?lang=en&region=us`,
  );
  if (!data) return null;
  return {
    id,
    name: data.displayName || data.fullName || `Player ${id}`,
    headshot:
      data.headshot?.href ||
      `https://a.espncdn.com/i/headshots/soccer/players/full/${id}.png`,
  };
}

async function resolveTeam(
  seasonYear: number,
  ref: string,
): Promise<{ name: string; badge: string | null } | null> {
  const match = /teams\/(\d+)/.exec(ref);
  if (!match) return null;
  const id = match[1];
  const data = await fetchJson<{
    displayName?: string;
    name?: string;
    logos?: Array<{ href?: string }>;
  }>(
    `${CORE}/sports/soccer/leagues/${LEAGUE}/seasons/${seasonYear}/teams/${id}?lang=en&region=us`,
  );
  if (!data) return null;
  return {
    name: data.displayName || data.name || `Team ${id}`,
    badge:
      data.logos?.[0]?.href ||
      `https://a.espncdn.com/i/teamlogos/soccer/500/${id}.png`,
  };
}

function parseLeaderDisplay(display: string | undefined): {
  goals: number;
  assists: number;
  matches: number;
} {
  const text = display || "";
  const goals = Number(/Goals?:\s*(\d+)/i.exec(text)?.[1] ?? NaN);
  const assists = Number(/A(?:ssists?)?:\s*(\d+)/i.exec(text)?.[1] ?? NaN);
  const matches = Number(
    /Matches?:\s*(\d+)/i.exec(text)?.[1] ??
      /M:\s*(\d+)/i.exec(text)?.[1] ??
      NaN,
  );
  return {
    goals: Number.isFinite(goals) ? goals : 0,
    assists: Number.isFinite(assists) ? assists : 0,
    matches: Number.isFinite(matches) ? matches : 0,
  };
}

async function loadSportsDbFallback(): Promise<{
  standings: PremierStanding[];
  fixtures: PremierMatch[];
  results: PremierMatch[];
  live: PremierMatch[];
}> {
  const [tableData, nextData, pastData, liveData] = await Promise.all([
    fetchJson<{
      table?: Array<{
        intRank?: string;
        strTeam?: string;
        strBadge?: string;
        intPlayed?: string;
        intWin?: string;
        intDraw?: string;
        intLoss?: string;
        intGoalsFor?: string;
        intGoalsAgainst?: string;
        intGoalDifference?: string;
        intPoints?: string;
        strForm?: string;
      }>;
    }>(`${SPORTSDB}/lookuptable.php?l=${SPORTSDB_LEAGUE}`),
    fetchJson<{ events: SportsDbEvent[] | null }>(
      `${SPORTSDB}/eventsnextleague.php?id=${SPORTSDB_LEAGUE}`,
    ),
    fetchJson<{ events: SportsDbEvent[] | null }>(
      `${SPORTSDB}/eventspastleague.php?id=${SPORTSDB_LEAGUE}`,
    ),
    fetchJson<{ events: SportsDbEvent[] | null }>(
      `${SPORTSDB}/livescore.php?s=Soccer`,
    ),
  ]);

  const standings: PremierStanding[] = (tableData?.table ?? []).map(
    (row, index) => ({
      rank: toInt(row.intRank) || index + 1,
      team: row.strTeam || "Unknown",
      badge: row.strBadge || null,
      played: toInt(row.intPlayed),
      won: toInt(row.intWin),
      drawn: toInt(row.intDraw),
      lost: toInt(row.intLoss),
      goalsFor: toInt(row.intGoalsFor),
      goalsAgainst: toInt(row.intGoalsAgainst),
      goalDiff:
        row.intGoalDifference != null
          ? Number(row.intGoalDifference) > 0
            ? `+${row.intGoalDifference}`
            : String(row.intGoalDifference)
          : "0",
      points: toInt(row.intPoints),
      form: row.strForm || null,
    }),
  );

  const fixtures = (nextData?.events ?? [])
    .map((event) => mapSportsDbEvent(event))
    .filter((match): match is PremierMatch => Boolean(match))
    .slice(0, 12);

  const results = (pastData?.events ?? [])
    .map((event) => mapSportsDbEvent(event))
    .filter((match): match is PremierMatch => Boolean(match))
    .filter((match) => match.homeScore != null && match.awayScore != null)
    .slice(0, 12);

  const live = (liveData?.events ?? [])
    .filter((event) => String(event.idLeague) === SPORTSDB_LEAGUE)
    .map((event) => mapSportsDbEvent(event, true))
    .filter((match): match is PremierMatch => Boolean(match));

  return { standings, fixtures, results, live };
}

export async function getPremierLeagueBoard(): Promise<PremierLeagueBoard> {
  const [standingsData, defaultBoard] = await Promise.all([
    fetchJson<{
      children?: Array<{
        name?: string;
        standings?: {
          entries?: Array<{
            team?: {
              displayName?: string;
              logos?: Array<{ href?: string }>;
            };
            stats?: Array<{
              name?: string;
              abbreviation?: string;
              displayValue?: string;
              value?: number | string;
            }>;
          }>;
        };
      }>;
    }>(`${SITE}/v2/sports/soccer/${LEAGUE}/standings`),
    fetchScoreboard(),
  ]);

  const seasonYear = defaultBoard?.leagues?.[0]?.season?.year ?? 2026;
  const seasonLabel =
    defaultBoard?.leagues?.[0]?.season?.displayName ||
    standingsData?.children?.[0]?.name ||
    null;

  let standings: PremierStanding[] = (
    standingsData?.children?.[0]?.standings?.entries ?? []
  ).map((entry, index) => {
    const stats = entry.stats;
    return {
      rank: toInt(statValue(stats, "rank")) || index + 1,
      team: entry.team?.displayName || "Unknown",
      badge: entry.team?.logos?.[0]?.href || null,
      played: toInt(statValue(stats, "gamesPlayed")),
      won: toInt(statValue(stats, "wins")),
      drawn: toInt(statValue(stats, "ties")),
      lost: toInt(statValue(stats, "losses")),
      goalsFor: toInt(statValue(stats, "pointsFor")),
      goalsAgainst: toInt(statValue(stats, "pointsAgainst")),
      goalDiff: statValue(stats, "pointDifferential") || "0",
      points: toInt(statValue(stats, "points")),
      form: null,
    };
  });

  const calendar = (defaultBoard?.leagues?.[0]?.calendar ?? [])
    .map((iso) => new Date(iso))
    .filter((d) => !Number.isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  const now = Date.now();
  const pastDates = calendar
    .filter((d) => d.getTime() <= now)
    .slice(-3)
    .map(yyyymmdd);
  const futureDates = calendar
    .filter((d) => d.getTime() >= now - 12 * 60 * 60 * 1000)
    .slice(0, 3)
    .map(yyyymmdd);
  const uniqueDates = [
    ...new Set([...pastDates, ...futureDates, yyyymmdd(new Date())]),
  ];

  // Fetch matchdays sequentially in small batches to avoid ESPN bot blocks.
  const dayBoards: Array<Awaited<ReturnType<typeof fetchScoreboard>>> = [];
  for (let i = 0; i < uniqueDates.length; i += 2) {
    const chunk = uniqueDates.slice(i, i + 2);
    const part = await Promise.all(chunk.map((d) => fetchScoreboard(d)));
    dayBoards.push(...part);
  }

  const allEvents = new Map<string, PremierMatch>();
  for (const board of [defaultBoard, ...dayBoards]) {
    for (const event of board?.events ?? []) {
      const match = mapEspnEvent(event);
      if (match) allEvents.set(match.id, match);
    }
  }

  let matches = [...allEvents.values()].sort((a, b) => {
    const at = a.kickoff ? new Date(a.kickoff).getTime() : 0;
    const bt = b.kickoff ? new Date(b.kickoff).getTime() : 0;
    return at - bt;
  });

  let live = matches.filter((m) => m.live);
  let results = matches
    .filter((m) => {
      if (m.live || m.homeScore == null || m.awayScore == null) return false;
      const hint = m.status.toUpperCase();
      return (
        hint.includes("FT") ||
        hint.includes("FINAL") ||
        hint.includes("FULL") ||
        (!hint.includes("SCHED") && !hint.includes("POSTP"))
      );
    })
    .sort((a, b) => {
      const at = a.kickoff ? new Date(a.kickoff).getTime() : 0;
      const bt = b.kickoff ? new Date(b.kickoff).getTime() : 0;
      return bt - at;
    })
    .slice(0, 12);

  let fixtures = matches
    .filter((m) => !m.live && m.homeScore == null && m.awayScore == null)
    .filter((m) => {
      if (!m.kickoff) return true;
      return new Date(m.kickoff).getTime() >= now - 60 * 60 * 1000;
    })
    .slice(0, 12);

  if (
    standings.length === 0 ||
    (fixtures.length === 0 && results.length === 0)
  ) {
    const fallback = await loadSportsDbFallback();
    if (standings.length === 0) standings = fallback.standings;
    if (fixtures.length === 0) fixtures = fallback.fixtures;
    if (results.length === 0) results = fallback.results;
    if (live.length === 0) live = fallback.live;
  }

  const leadersData = await fetchJson<{
    categories?: Array<{
      name?: string;
      leaders?: Array<{
        displayValue?: string;
        value?: number;
        athlete?: { $ref?: string };
        team?: { $ref?: string };
      }>;
    }>;
  }>(
    `${CORE}/sports/soccer/leagues/${LEAGUE}/seasons/${seasonYear}/types/1/leaders?limit=10`,
  );

  const goalLeaders =
    leadersData?.categories?.find((c) => c.name === "goalsLeaders")?.leaders ??
    [];

  const playerRows = await Promise.all(
    goalLeaders.slice(0, 8).map(async (leader) => {
      const [athlete, team] = await Promise.all([
        leader.athlete?.$ref
          ? resolveAthlete(seasonYear, leader.athlete.$ref)
          : null,
        leader.team?.$ref ? resolveTeam(seasonYear, leader.team.$ref) : null,
      ]);
      if (!athlete) return null;
      const parsed = parseLeaderDisplay(leader.displayValue);
      const row: PremierPlayer = {
        id: `goals-${athlete.id}`,
        name: athlete.name,
        team: team?.name || "—",
        teamBadge: team?.badge || null,
        headshot: athlete.headshot,
        goals: Number(leader.value ?? parsed.goals) || 0,
        assists: parsed.assists,
        matches: parsed.matches,
        category: "goals",
      };
      return row;
    }),
  );
  const players = playerRows.filter((player) => player != null);

  const failed =
    standings.length === 0 &&
    players.length === 0 &&
    live.length === 0 &&
    results.length === 0 &&
    fixtures.length === 0;

  return {
    seasonLabel,
    standings,
    players,
    live,
    results,
    fixtures,
    failed,
  };
}
