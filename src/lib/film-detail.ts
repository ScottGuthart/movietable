/** A row of `movie_awards`: a Wikidata award record, usually attributed to a person. */
export interface AwardRow {
  award_name: string;
  result: "win" | "nominee";
  year: number | null;
  person_name: string | null;
  person_slug: string | null;
}

export interface AwardLine {
  text: string;
  detail: string;
}

export interface AwardSummary {
  lines: AwardLine[];
  /** Nominations left off the list once the limit is reached; wins are never hidden. */
  hiddenNominations: number;
}

interface AwardGroup {
  category: string;
  won: boolean;
  years: number[];
  people: Set<string>;
}

const ACADEMY_PREFIX = "Academy Award for ";
const NOMINATION_LIMIT = 5;

/** "Academy Award for Best Actor" is the category "Best Actor"; other award names stand alone. */
function categoryOf(awardName: string): string {
  return awardName.startsWith(ACADEMY_PREFIX) ? awardName.slice(ACADEMY_PREFIX.length) : awardName;
}

/** Wikidata leaves the person blank for awards that go to the film rather than to someone. */
function personOf(row: AwardRow): string {
  return (row.person_name ?? "").trim();
}

function winKey(category: string, person: string): string {
  return `${category} ${person}`;
}

/** Wikidata dates the same award differently across records, so a group keeps the year its rows agree on. */
function pickYear(years: number[]): number | null {
  const counts = new Map<number, number>();
  for (const year of years) counts.set(year, (counts.get(year) ?? 0) + 1);
  let best: number | null = null;
  let bestCount = 0;
  for (const [year, count] of counts) {
    if (count > bestCount || (count === bestCount && best !== null && year > best)) {
      best = year;
      bestCount = count;
    }
  }
  return best;
}

/** One group per category and outcome, so everyone who shared an award shares a line. */
function groupAwards(rows: AwardRow[]): AwardGroup[] {
  const wins = new Set(rows.filter((row) => row.result === "win").map((row) => winKey(categoryOf(row.award_name), personOf(row))));
  const groups = new Map<string, AwardGroup>();
  for (const row of rows) {
    const category = categoryOf(row.award_name);
    const person = personOf(row);
    if (row.result === "nominee" && wins.has(winKey(category, person))) continue;
    const key = `${category} ${row.result}`;
    const group = groups.get(key) ?? { category, won: row.result === "win", years: [], people: new Set<string>() };
    if (person) group.people.add(person);
    if (row.year !== null) group.years.push(row.year);
    groups.set(key, group);
  }
  return [...groups.values()].sort((a, b) => Number(b.won) - Number(a.won) || a.category.localeCompare(b.category, "en-US"));
}

function lineOf(group: AwardGroup): AwardLine {
  const people = [...group.people].sort((a, b) => a.localeCompare(b, "en-US")).join(", ");
  const year = pickYear(group.years);
  return {
    text: people ? `${group.category} ·\u00a0${people}` : group.category,
    detail: `${group.won ? "Won" : "Nominated"}${year ? `, ${year}` : ""}`,
  };
}

/**
 * Wins before nominations, each naming the category and the people it went to.
 *
 * Wikidata records a win as both a nomination and a win, so a person's nomination is dropped
 * once they won that category. Long nomination lists are cut to `nominationLimit` and counted.
 */
export function awardLines(rows: AwardRow[], nominationLimit = NOMINATION_LIMIT): AwardSummary {
  const lines: AwardLine[] = [];
  let listedNominations = 0;
  let hiddenNominations = 0;
  for (const group of groupAwards(rows)) {
    if (group.won) {
      lines.push(lineOf(group));
      continue;
    }
    if (listedNominations >= nominationLimit) {
      hiddenNominations += 1;
      continue;
    }
    listedNominations += 1;
    lines.push(lineOf(group));
  }
  return { lines, hiddenNominations };
}

export function imdbUrl(imdbId: string): string {
  return `https://www.imdb.com/title/${imdbId}/`;
}

/** "2 Oscars, 9 nominations", "Nominated for 3 Oscars", or null when there is nothing to say. */
export function oscarSummary(wins: number | null, nominations: number | null): string | null {
  if (wins && wins > 0) {
    const won = `${wins} Oscar${wins === 1 ? "" : "s"}`;
    return nominations && nominations > 0 ? `${won}, ${nominations} nomination${nominations === 1 ? "" : "s"}` : won;
  }
  if (nominations && nominations > 0) return `Nominated for ${nominations} Oscar${nominations === 1 ? "" : "s"}`;
  return null;
}
