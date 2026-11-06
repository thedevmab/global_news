import { format } from "date-fns";
import { getDictionary, type Locale } from "@/i18n";
import {
  getPremierLeagueBoard,
  type PremierMatch,
  type PremierPlayer,
  type PremierStanding,
} from "@/lib/premier-league";
import { cn } from "@/lib/utils";

function Badge({
  src,
  name,
  size = "md",
}: {
  src: string | null;
  name: string;
  size?: "sm" | "md";
}) {
  const box = size === "sm" ? "h-5 w-5 text-[9px]" : "h-7 w-7 text-[10px]";
  const px = size === "sm" ? 20 : 28;
  if (!src) {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full bg-gvn-navy font-bold text-white",
          box,
        )}
        aria-hidden
      >
        {name.slice(0, 1)}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={px}
      height={px}
      className={cn("shrink-0 object-contain", box)}
      loading="lazy"
    />
  );
}

function kickoffLabel(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return format(date, "EEE d MMM · HH:mm");
}

function ScoreOrVs({
  match,
  vs,
  showScore,
}: {
  match: PremierMatch;
  vs: string;
  showScore: boolean;
}) {
  if (showScore && match.homeScore != null && match.awayScore != null) {
    return (
      <span className="shrink-0 rounded bg-gvn-navy px-2 py-0.5 font-mono text-sm font-bold text-white">
        {match.homeScore} – {match.awayScore}
      </span>
    );
  }
  return (
    <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {vs}
    </span>
  );
}

function MatchMeta({ match, when }: { match: PremierMatch; when: string | null }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground sm:justify-end sm:text-xs">
      {match.live ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-gvn-red/10 px-2 py-0.5 font-semibold text-gvn-red">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gvn-red" />
          {match.status}
        </span>
      ) : when ? (
        <time dateTime={match.kickoff ?? undefined}>{when}</time>
      ) : null}
      {match.venue ? <span className="truncate">{match.venue}</span> : null}
    </div>
  );
}

function MatchRow({
  match,
  vs,
  showScore,
}: {
  match: PremierMatch;
  vs: string;
  showScore: boolean;
}) {
  const when = kickoffLabel(match.kickoff);
  return (
    <li className="border-b border-border py-3 last:border-0">
      {/* Phone: stacked app layout */}
      <div className="flex flex-col gap-2 sm:hidden">
        <div className="flex min-w-0 items-center gap-2">
          <Badge src={match.homeBadge} name={match.home} size="sm" />
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
            {match.home}
          </span>
        </div>
        <div className="flex justify-center">
          <ScoreOrVs match={match} vs={vs} showScore={showScore} />
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <Badge src={match.awayBadge} name={match.away} size="sm" />
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
            {match.away}
          </span>
        </div>
        <MatchMeta match={match} when={when} />
      </div>

      {/* sm+: single-line row */}
      <div className="hidden sm:flex sm:items-center sm:justify-between sm:gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Badge src={match.homeBadge} name={match.home} />
          <span className="min-w-0 truncate text-sm font-semibold text-foreground">
            {match.home}
          </span>
          <ScoreOrVs match={match} vs={vs} showScore={showScore} />
          <span className="min-w-0 truncate text-sm font-semibold text-foreground">
            {match.away}
          </span>
          <Badge src={match.awayBadge} name={match.away} />
        </div>
        <MatchMeta match={match} when={when} />
      </div>
    </li>
  );
}

function MatchSection({
  title,
  empty,
  matches,
  vs,
  showScore,
}: {
  title: string;
  empty: string;
  matches: PremierMatch[];
  vs: string;
  showScore: boolean;
}) {
  return (
    <section className="rounded-md border border-border bg-card">
      <h3 className="border-b border-border px-3 py-2.5 text-sm font-bold uppercase tracking-wide text-foreground sm:px-4 sm:py-3">
        {title}
      </h3>
      {matches.length === 0 ? (
        <p className="px-3 py-6 text-sm text-muted-foreground sm:px-4">{empty}</p>
      ) : (
        <ul className="px-3 sm:px-4">
          {matches.map((match) => (
            <MatchRow
              key={match.id}
              match={match}
              vs={vs}
              showScore={showScore}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function TableSection({
  title,
  empty,
  standings,
  labels,
}: {
  title: string;
  empty: string;
  standings: PremierStanding[];
  labels: {
    pos: string;
    team: string;
    played: string;
    won: string;
    drawn: string;
    lost: string;
    goalsFor: string;
    goalsAgainst: string;
    goalDiff: string;
    points: string;
  };
}) {
  return (
    <section className="w-full min-w-0 rounded-md border border-border bg-card">
      <h3 className="border-b border-border px-3 py-2.5 text-sm font-bold uppercase tracking-wide text-foreground sm:px-4 sm:py-3">
        {title}
      </h3>
      {standings.length === 0 ? (
        <p className="px-3 py-6 text-sm text-muted-foreground sm:px-4">{empty}</p>
      ) : (
        <div className="w-full min-w-0 overflow-x-auto">
          <table className="w-full border-collapse text-[11px] sm:text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">
                <th className="sticky left-0 z-10 bg-muted/95 px-1.5 py-2 font-semibold sm:static sm:bg-transparent sm:px-3">
                  {labels.pos}
                </th>
                <th className="sticky left-7 z-10 max-w-[42vw] bg-muted/95 px-1.5 py-2 font-semibold sm:static sm:max-w-none sm:bg-transparent sm:px-3">
                  {labels.team}
                </th>
                <th className="px-1 py-2 text-center font-semibold sm:px-2">
                  {labels.played}
                </th>
                <th className="px-1 py-2 text-center font-semibold sm:px-2">
                  {labels.won}
                </th>
                <th className="px-1 py-2 text-center font-semibold sm:px-2">
                  {labels.drawn}
                </th>
                <th className="px-1 py-2 text-center font-semibold sm:px-2">
                  {labels.lost}
                </th>
                <th className="hidden px-2 py-2 text-center font-semibold md:table-cell">
                  {labels.goalsFor}
                </th>
                <th className="hidden px-2 py-2 text-center font-semibold md:table-cell">
                  {labels.goalsAgainst}
                </th>
                <th className="px-1 py-2 text-center font-semibold sm:px-2">
                  {labels.goalDiff}
                </th>
                <th className="px-1.5 py-2 text-center font-semibold sm:px-3">
                  {labels.points}
                </th>
              </tr>
            </thead>
            <tbody>
              {standings.map((row) => (
                <tr
                  key={`${row.rank}-${row.team}`}
                  className="border-b border-border last:border-0"
                >
                  <td className="sticky left-0 z-10 bg-card px-1.5 py-2 font-mono text-muted-foreground sm:static sm:px-3">
                    {row.rank}
                  </td>
                  <td className="sticky left-7 z-10 max-w-[42vw] bg-card px-1.5 py-2 sm:static sm:max-w-none sm:px-3">
                    <span className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                      <Badge src={row.badge} name={row.team} size="sm" />
                      <span
                        className="truncate font-medium text-foreground"
                        title={row.team}
                      >
                        {row.team}
                      </span>
                    </span>
                  </td>
                  <td className="px-1 py-2 text-center tabular-nums sm:px-2">
                    {row.played}
                  </td>
                  <td className="px-1 py-2 text-center tabular-nums sm:px-2">
                    {row.won}
                  </td>
                  <td className="px-1 py-2 text-center tabular-nums sm:px-2">
                    {row.drawn}
                  </td>
                  <td className="px-1 py-2 text-center tabular-nums sm:px-2">
                    {row.lost}
                  </td>
                  <td className="hidden px-2 py-2 text-center tabular-nums md:table-cell">
                    {row.goalsFor}
                  </td>
                  <td className="hidden px-2 py-2 text-center tabular-nums md:table-cell">
                    {row.goalsAgainst}
                  </td>
                  <td className="px-1 py-2 text-center tabular-nums sm:px-2">
                    {row.goalDiff}
                  </td>
                  <td className="px-1.5 py-2 text-center font-bold tabular-nums text-foreground sm:px-3">
                    {row.points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function PlayersSection({
  title,
  empty,
  players,
  labels,
}: {
  title: string;
  empty: string;
  players: PremierPlayer[];
  labels: {
    player: string;
    team: string;
    goals: string;
    assists: string;
    matchesPlayed: string;
  };
}) {
  return (
    <section className="w-full min-w-0 rounded-md border border-border bg-card">
      <h3 className="border-b border-border px-3 py-2.5 text-sm font-bold uppercase tracking-wide text-foreground sm:px-4 sm:py-3">
        {title}
      </h3>
      {players.length === 0 ? (
        <p className="px-3 py-6 text-sm text-muted-foreground sm:px-4">{empty}</p>
      ) : (
        <div className="w-full min-w-0 overflow-x-auto">
          <table className="w-full border-collapse text-[11px] sm:text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">
                <th className="px-1.5 py-2 font-semibold sm:px-3">#</th>
                <th className="sticky left-0 z-10 max-w-[40vw] bg-muted/95 px-1.5 py-2 font-semibold sm:static sm:max-w-none sm:bg-transparent sm:px-3">
                  {labels.player}
                </th>
                <th className="hidden px-2 py-2 font-semibold sm:table-cell sm:px-3">
                  {labels.team}
                </th>
                <th className="px-1 py-2 text-center font-semibold sm:px-2">
                  {labels.matchesPlayed}
                </th>
                <th className="px-1 py-2 text-center font-semibold sm:px-2">
                  {labels.goals}
                </th>
                <th className="px-1.5 py-2 text-center font-semibold sm:px-3">
                  {labels.assists}
                </th>
              </tr>
            </thead>
            <tbody>
              {players.map((player, index) => (
                <tr
                  key={player.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-1.5 py-2 font-mono text-muted-foreground sm:px-3">
                    {index + 1}
                  </td>
                  <td className="sticky left-0 z-10 max-w-[40vw] bg-card px-1.5 py-2 sm:static sm:max-w-none sm:px-3">
                    <span className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                      <Badge src={player.headshot} name={player.name} size="sm" />
                      <span
                        className="min-w-0 truncate font-medium text-foreground"
                        title={`${player.name} · ${player.team}`}
                      >
                        {player.name}
                      </span>
                      <Badge
                        src={player.teamBadge}
                        name={player.team}
                        size="sm"
                      />
                    </span>
                  </td>
                  <td className="hidden px-2 py-2 sm:table-cell sm:px-3">
                    <span className="flex min-w-0 items-center gap-2">
                      <Badge src={player.teamBadge} name={player.team} />
                      <span
                        className="truncate text-muted-foreground"
                        title={player.team}
                      >
                        {player.team}
                      </span>
                    </span>
                  </td>
                  <td className="px-1 py-2 text-center tabular-nums sm:px-2">
                    {player.matches || "—"}
                  </td>
                  <td className="px-1 py-2 text-center font-semibold tabular-nums text-foreground sm:px-2">
                    {player.goals}
                  </td>
                  <td className="px-1.5 py-2 text-center tabular-nums sm:px-3">
                    {player.assists}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export async function PremierLeaguePanel({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const board = await getPremierLeagueBoard();
  const copy = dict.sportsPage;

  if (
    board.failed &&
    board.standings.length === 0 &&
    board.players.length === 0 &&
    board.live.length === 0 &&
    board.results.length === 0 &&
    board.fixtures.length === 0
  ) {
    return (
      <p className="rounded-md border border-border bg-muted/40 px-4 py-6 text-sm text-muted-foreground">
        {copy.unavailable}
      </p>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-4 sm:space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gvn-red sm:text-xs">
            English Premier League
            {board.seasonLabel ? ` · ${board.seasonLabel}` : ""}
          </p>
          <h2 className="font-serif text-xl font-bold text-foreground sm:text-2xl">
            {copy.eplTab}
          </h2>
        </div>
        <p className="text-[10px] text-muted-foreground sm:text-xs">{copy.credit}</p>
      </div>

      {board.live.length > 0 ? (
        <MatchSection
          title={copy.live}
          empty={copy.emptyLive}
          matches={board.live}
          vs={copy.vs}
          showScore
        />
      ) : null}

      <TableSection
        title={copy.table}
        empty={copy.emptyTable}
        standings={board.standings}
        labels={{
          pos: copy.pos,
          team: copy.team,
          played: copy.played,
          won: copy.won,
          drawn: copy.drawn,
          lost: copy.lost,
          goalsFor: copy.goalsFor,
          goalsAgainst: copy.goalsAgainst,
          goalDiff: copy.goalDiff,
          points: copy.points,
        }}
      />

      <PlayersSection
        title={copy.players}
        empty={copy.emptyPlayers}
        players={board.players}
        labels={{
          player: copy.player,
          team: copy.team,
          goals: copy.goals,
          assists: copy.assists,
          matchesPlayed: copy.matchesPlayed,
        }}
      />

      <MatchSection
        title={copy.fixtures}
        empty={copy.emptyFixtures}
        matches={board.fixtures}
        vs={copy.vs}
        showScore={false}
      />

      <MatchSection
        title={copy.results}
        empty={copy.emptyResults}
        matches={board.results}
        vs={copy.vs}
        showScore
      />
    </div>
  );
}
