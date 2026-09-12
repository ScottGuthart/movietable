import { describe, expect, test } from "bun:test";
import { mergeVerdicts, type StampedVerdicts } from "@/lib/ratings-sync";

const at = (verdict: 1 | 2 | 3 | 4 | 5 | "skip", updatedAt: number) => ({ verdict, updatedAt });

describe("merging local and account ratings", () => {
  test("keeps the union and lets the newer verdict win a conflict", () => {
    const local: StampedVerdicts = { heat: at(5, 200), amelie: at(2, 50) };
    const remote: StampedVerdicts = { heat: at(2, 100), "spirited-away": at(5, 300) };
    const { merged, toUpload } = mergeVerdicts(local, remote);
    expect(merged).toEqual({ heat: at(5, 200), amelie: at(2, 50), "spirited-away": at(5, 300) });
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
