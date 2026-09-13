import { describe, expect, test } from "bun:test";
import { mergeVerdicts, rowsToStamped, type StampedVerdicts } from "@/lib/ratings-sync";
import type { Verdict } from "@/lib/taste";

const at = (verdict: Verdict, updatedAt: number) => ({ verdict, updatedAt });

describe("merging local and account ratings", () => {
  test("keeps the union and lets the newer verdict win a conflict", () => {
    const local: StampedVerdicts = { heat: at(4.5, 200), amelie: at(2, 50) };
    const remote: StampedVerdicts = { heat: at(2, 100), "spirited-away": at(5, 300) };
    const { merged, toUpload } = mergeVerdicts(local, remote);
    expect(merged).toEqual({ heat: at(4.5, 200), amelie: at(2, 50), "spirited-away": at(5, 300) });
    expect(Object.keys(toUpload).sort()).toEqual(["amelie", "heat"]);
  });
  test("uploads nothing when the account already has everything", () => {
    const shared: StampedVerdicts = { heat: at(5, 100) };
    expect(mergeVerdicts(shared, { ...shared, extra: at("skip", 5) }).toUpload).toEqual({});
  });
  test("treats equal timestamps as already in sync", () => {
    const { merged, toUpload } = mergeVerdicts({ heat: at(5, 100) }, { heat: at(2, 100) });
    expect(merged.heat).toEqual(at(2, 100));
    expect(toUpload).toEqual({});
  });
  test("handles empty sides", () => {
    expect(mergeVerdicts({}, {})).toEqual({ merged: {}, toUpload: {} });
    expect(mergeVerdicts({ a: at(5, 1) }, {}).toUpload).toEqual({ a: at(5, 1) });
    expect(mergeVerdicts({}, { a: at(5, 1) }).merged).toEqual({ a: at(5, 1) });
  });
});

import { diffVerdicts } from "@/lib/ratings-sync";

describe("diffing verdicts since the last sync", () => {
  test("upserts new and newer entries and deletes removed ones", () => {
    const previous: StampedVerdicts = { heat: at(5, 100), amelie: at(2, 100), gone: at("skip", 100) };
    const current: StampedVerdicts = { heat: at(2, 200), amelie: at(2, 100), fresh: at(5, 300) };
    expect(diffVerdicts(previous, current)).toEqual({ upserts: { heat: at(2, 200), fresh: at(5, 300) }, deletes: ["gone"] });
  });
  test("reports nothing when both sides are the same", () => {
    const same: StampedVerdicts = { heat: at(5, 100) };
    expect(diffVerdicts(same, { ...same })).toEqual({ upserts: {}, deletes: [] });
  });
  test("ignores an older local copy that the last sync already superseded", () => {
    expect(diffVerdicts({ heat: at(5, 200) }, { heat: at(2, 100) })).toEqual({ upserts: {}, deletes: [] });
  });
});

describe("account rows", () => {
  test("read PostgREST numeric strings and skips, and drop invalid stars", () => {
    const stamped = rowsToStamped([
      { slug: "heat", verdict: "rated", stars: "3.5", updated_at: "2026-09-12T00:00:00.000Z" },
      { slug: "amelie", verdict: "rated", stars: 4, updated_at: "2026-09-12T00:00:01.000Z" },
      { slug: "unseen", verdict: "skip", stars: null, updated_at: "2026-09-12T00:00:02.000Z" },
      { slug: "broken", verdict: "rated", stars: "7", updated_at: "2026-09-12T00:00:03.000Z" },
    ]);
    expect(stamped).toEqual({
      heat: { verdict: 3.5, updatedAt: Date.parse("2026-09-12T00:00:00.000Z") },
      amelie: { verdict: 4, updatedAt: Date.parse("2026-09-12T00:00:01.000Z") },
      unseen: { verdict: "skip", updatedAt: Date.parse("2026-09-12T00:00:02.000Z") },
    });
  });
});
