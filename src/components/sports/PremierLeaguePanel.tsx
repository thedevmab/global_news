import { format } from "date-fns";
import { getDictionary, type Locale } from "@/i18n";
import {
  getPremierLeagueBoard,
  type PremierMatch,
  type PremierPlayer,
  type PremierStanding,
} from "@/lib/premier-league";

function Badge({ src, name }: { src: string | null; name: string }) {
  if (!src) {
    return (
      <span
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gvn-navy text-[10px] font-bold text-white"
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
      width={28}
      height={28}
      className="h-7 w-7 shrink-0 object-contain"
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
    <li className="flex flex-col gap-2 border-b border-border py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Badge src={match.homeBadge} name={match.home} />
        <span className="min-w-0 truncate text-sm font-semibold text-foreground">
          {match.home}
        </span>
        {showScore && match.homeScore != null && match.awayScore != null ? (
          <span className="mx-1 shrink-0 rounded bg-gvn-navy px-2 py-0.5 font-mono text-sm font-bold text-white">
            {match.homeScore} – {match.awayScore}
          </span>
        ) : (
          <span className="mx-1 shrink-0 text-xs text-muted-foreground">
            {vs}
          </span>
        )}
        <span className="min-w-0 truncate text-sm font-semibold text-foreground">
          {match.away}
        </span>
        <Badge src={match.awayBadge} name={match.away} />
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2 text-xs text-muted-foreground sm:justify-end">
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
      <h3 className="border-b border-border px-4 py-3 text-sm font-bold uppercase tracking-wide text-foreground">
        {title}
      </h3>
      {matches.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="px-4">
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
    <section className="overflow-hidden rounded-md border border-border bg-card">
      <h3 className="border-b border-border px-4 py-3 text-sm font-bold uppercase tracking-wide text-foreground">
        {title}
      </h3>
      {standings.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2 font-semibold">{labels.pos}</th>
                <th className="px-3 py-2 font-semibold">{labels.team}</th>
                <th className="px-2 py-2 text-center font-semibold">{labels.played}</th>
                <th className="hidden px-2 py-2 text-center font-semibold sm:table-cell">
                  {labels.won}
                </th>
                <th className="hidden px-2 py-2 text-center font-semibold sm:table-cell">
                  {labels.drawn}
                </th>
                <th className="hidden px-2 py-2 text-center font-semibold sm:table-cell">
                  {labels.lost}
                </th>
                <th className="hidden px-2 py-2 text-center font-semibold md:table-cell">
                  {labels.goalsFor}
                </th>
                <th className="hidden px-2 py-2 text-center font-semibold md:table-cell">
                  {labels.goalsAgainst}
                </th>
                <th className="px-2 py-2 text-center font-semibold">{labels.goalDiff}</th>
                <th className="px-3 py-2 text-center font-semibold">{labels.points}</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((row) => (
                <tr
                  key={`${row.rank}-${row.team}`}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-3 py-2 font-mono text-muted-foreground">
                    {row.rank}
                  </td>
                  <td className="px-3 py-2">
                    <span className="flex min-w-0 items-center gap-2">
                      <Badge src={row.badge} name={row.team} />
                      <span className="truncate font-medium text-foreground">
                        {row.team}
                      </span>
                    </span>
                  </td>
                  <td className="px-2 py-2 text-center tabular-nums">{row.played}</td>
                  <td className="hidden px-2 py-2 text-center tabular-nums sm:table-cell">
                    {row.won}
                  </td>
                  <td className="hidden px-2 py-2 text-center tabular-nums sm:table-cell">
                    {row.drawn}
                  </td>
                  <td className="hidden px-2 py-2 text-center tabular-nums sm:table-cell">
                    {row.lost}
                  </td>
                  <td className="hidden px-2 py-2 text-center tabular-nums md:table-cell">
                    {row.goalsFor}
                  </td>
                  <td className="hidden px-2 py-2 text-center tabular-nums md:table-cell">
                    {row.goalsAgainst}
                  </td>
                  <td className="px-2 py-2 text-center tabular-nums">{row.goalDiff}</td>
                  <td className="px-3 py-2 text-center font-bold tabular-nums text-foreground">
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
    <section className="overflow-hidden rounded-md border border-border bg-card">
      <h3 className="border-b border-border px-4 py-3 text-sm font-bold uppercase tracking-wide text-foreground">
        {title}
      </h3>
      {players.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[28rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2 font-semibold">#</th>
                <th className="px-3 py-2 font-semibold">{labels.player}</th>
                <th className="px-3 py-2 font-semibold">{labels.team}</th>
                <th className="px-2 py-2 text-center font-semibold">{labels.matchesPlayed}</th>
                <th className="px-2 py-2 text-center font-semibold">{labels.goals}</th>
                <th className="px-3 py-2 text-center font-semibold">{labels.assists}</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player, index) => (
                <tr
                  key={player.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-3 py-2 font-mono text-muted-foreground">
                    {index + 1}
                  </td>
                  <td className="px-3 py-2">
                    <span className="flex min-w-0 items-center gap-2">
                      <Badge src={player.headshot} name={player.name} />
                      <span className="truncate font-medium text-foreground">
                        {player.name}
                      </span>
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className="flex min-w-0 items-center gap-2">
                      <Badge src={player.teamBadge} name={player.team} />
                      <span className="truncate text-muted-foreground">
                        {player.team}
                      </span>
                    </span>
                  </td>
                  <td className="px-2 py-2 text-center tabular-nums">
                    {player.matches || "—"}
                  </td>
                  <td className="px-2 py-2 text-center font-semibold tabular-nums text-foreground">
                    {player.goals}
                  </td>
                  <td className="px-3 py-2 text-center tabular-nums">
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gvn-red">
            English Premier League
            {board.seasonLabel ? ` · ${board.seasonLabel}` : ""}
          </p>
          <h2 className="font-serif text-2xl font-bold text-foreground">
            {copy.eplTab}
          </h2>
        </div>
        <p className="text-xs text-muted-foreground">{copy.credit}</p>
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
