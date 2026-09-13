import { describe, expect, test } from "bun:test";
import { awardLines, imdbUrl, oscarSummary, type AwardRow } from "@/lib/film-detail";

describe("award lines", () => {
  const row = (award_name: string, result: AwardRow["result"], person_name: string | null, year: number | null = 1973): AwardRow =>
    ({ award_name, result, year, person_name, person_slug: person_name ? person_name.toLowerCase().replaceAll(" ", "-") : null });

  test("drops the Academy Award prefix, names the person, and puts wins first", () => {
    const summary = awardLines([
      row("Academy Award for Best Supporting Actor", "nominee", "Al Pacino"),
      row("Academy Award for Best Actor", "win", "Marlon Brando"),
      row("Academy Honorary Award", "win", "Charles Chaplin"),
    ]);
    expect(summary).toEqual({
      hiddenNominations: 0,
      lines: [
        { text: "Academy Honorary Award ·\u00a0Charles Chaplin", detail: "Won, 1973" },
        { text: "Best Actor ·\u00a0Marlon Brando", detail: "Won, 1973" },
        { text: "Best Supporting Actor ·\u00a0Al Pacino", detail: "Nominated, 1973" },
      ],
    });
  });
  test("keeps one line when Wikidata records a win and its nomination", () => {
    const summary = awardLines([
      row("Academy Award for Best Actress", "nominee", "Michelle Yeoh", 2023),
      row("Academy Award for Best Actress", "win", "Michelle Yeoh", 2023),
    ]);
    expect(summary.lines).toEqual([{ text: "Best Actress ·\u00a0Michelle Yeoh", detail: "Won, 2023" }]);
  });
  test("keeps a losing nominee beside the winner of the same category", () => {
    expect(awardLines([
      row("Academy Award for Best Supporting Actress", "win", "Jamie Lee Curtis", 2023),
      row("Academy Award for Best Supporting Actress", "nominee", "Jamie Lee Curtis", 2023),
      row("Academy Award for Best Supporting Actress", "nominee", "Stephanie Hsu", 2023),
    ]).lines).toEqual([
      { text: "Best Supporting Actress ·\u00a0Jamie Lee Curtis", detail: "Won, 2023" },
      { text: "Best Supporting Actress ·\u00a0Stephanie Hsu", detail: "Nominated, 2023" },
    ]);
  });
  test("joins the people who share one award", () => {
    expect(awardLines([
      row("Academy Award for Best Sound", "nominee", "Richard Portman"),
      row("Academy Award for Best Sound", "nominee", "Chris Newman"),
      row("Academy Award for Best Sound", "nominee", "Charles Grenzbach"),
    ]).lines).toEqual([{ text: "Best Sound ·\u00a0Charles Grenzbach, Chris Newman, Richard Portman", detail: "Nominated, 1973" }]);
  });
  test("merges an award Wikidata recorded under two years, keeping the year most rows agree on", () => {
    expect(awardLines([
      row("Academy Award for Best Writing, Original Screenplay", "win", "Dan Kwan", 2023),
      row("Academy Award for Best Writing, Original Screenplay", "win", "Daniels", 2022),
      row("Academy Award for Best Writing, Original Screenplay", "win", "Daniel Scheinert", 2023),
    ]).lines).toEqual([
      { text: "Best Writing, Original Screenplay ·\u00a0Dan Kwan, Daniel Scheinert, Daniels", detail: "Won, 2023" },
    ]);
  });
  test("counts the nominations it does not list and never hides a win", () => {
    const rows = [row("Academy Award for Best Picture", "win", "Albert S. Ruddy")];
    for (const category of ["Actor", "Actress", "Costume Design", "Film Editing", "Sound", "Score", "Cinematography"]) {
      rows.push(row(`Academy Award for Best ${category}`, "nominee", `Someone ${category}`));
    }
    const summary = awardLines(rows, 5);
    expect(summary.lines).toHaveLength(6);
    expect(summary.lines[0]!.detail).toBe("Won, 1973");
    expect(summary.hiddenNominations).toBe(2);
  });
  test("names the category alone when the award went to the film", () => {
    expect(awardLines([
      { award_name: "Academy Award for Best International Feature Film", result: "nominee", year: 2007, person_name: "  ", person_slug: null },
    ]).lines).toEqual([{ text: "Best International Feature Film", detail: "Nominated, 2007" }]);
  });
  test("omits the year when Wikidata has none, and handles no awards", () => {
    expect(awardLines([row("Academy Award for Best Director", "nominee", "Ang Lee", null)]).lines[0]!.detail).toBe("Nominated");
    expect(awardLines([])).toEqual({ lines: [], hiddenNominations: 0 });
  });
});

describe("links", () => {
  test("builds the IMDb title url from the id", () => {
    expect(imdbUrl("tt0068646")).toBe("https://www.imdb.com/title/tt0068646/");
  });
});

describe("Oscar summary", () => {
  test("summarises Oscar counts in words", () => {
    expect(oscarSummary(2, 9)).toBe("2 Oscars, 9 nominations");
    expect(oscarSummary(1, 1)).toBe("1 Oscar, 1 nomination");
    expect(oscarSummary(0, 3)).toBe("Nominated for 3 Oscars");
    expect(oscarSummary(0, 0)).toBeNull();
    expect(oscarSummary(null, null)).toBeNull();
  });
});
