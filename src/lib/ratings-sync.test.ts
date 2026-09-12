import { describe, expect, test } from "bun:test";
import { mergeVerdicts, type StampedVerdicts } from "@/lib/ratings-sync";

const at = (verdict: "like" | "pass" | "skip", updatedAt: number) => ({ verdict, updatedAt });

describe("merging local and account ratings", () => {
  test("keeps the union and lets the newer verdict win a conflict", () => {
    const local: StampedVerdicts = { heat: at("like", 200), amelie: at("pass", 50) };
    const remote: StampedVerdicts = { heat: at("pass", 100), "spirited-away": at("like", 300) };
    const { merged, toUpload } = mergeVerdicts(local, remote);
    expect(merged).toEqual({ heat: at("like", 200), amelie: at("pass", 50), "spirited-away": at("like", 300) });
    expect(Object.keys(toUpload).sort()).toEqual(["amelie", "heat"]);
  });
  test("uploads nothing when the account already has everything", () => {
    const shared: StampedVerdicts = { heat: at("like", 100) };
    expect(mergeVerdicts(shared, { ...shared, extra: at("skip", 5) }).toUpload).toEqual({});
  });
  test("treats equal timestamps as already in sync", () => {
    const { merged, toUpload } = mergeVerdicts({ heat: at("like", 100) }, { heat: at("pass", 100) });
    expect(merged.heat).toEqual(at("pass", 100));
    expect(toUpload).toEqual({});
  });
  test("handles empty sides", () => {
    expect(mergeVerdicts({}, {})).toEqual({ merged: {}, toUpload: {} });
    expect(mergeVerdicts({ a: at("like", 1) }, {}).toUpload).toEqual({ a: at("like", 1) });
    expect(mergeVerdicts({}, { a: at("like", 1) }).merged).toEqual({ a: at("like", 1) });
  });
});

import { diffVerdicts } from "@/lib/ratings-sync";

describe("diffing verdicts since the last sync", () => {
  test("upserts new and newer entries and deletes removed ones", () => {
    const previous: StampedVerdicts = { heat: at("like", 100), amelie: at("pass", 100), gone: at("skip", 100) };
    const current: StampedVerdicts = { heat: at("pass", 200), amelie: at("pass", 100), fresh: at("like", 300) };
    expect(diffVerdicts(previous, current)).toEqual({ upserts: { heat: at("pass", 200), fresh: at("like", 300) }, deletes: ["gone"] });
  });
  test("reports nothing when both sides are the same", () => {
    const same: StampedVerdicts = { heat: at("like", 100) };
    expect(diffVerdicts(same, { ...same })).toEqual({ upserts: {}, deletes: [] });
  });
  test("ignores an older local copy that the last sync already superseded", () => {
    expect(diffVerdicts({ heat: at("like", 200) }, { heat: at("pass", 100) })).toEqual({ upserts: {}, deletes: [] });
  });
});
