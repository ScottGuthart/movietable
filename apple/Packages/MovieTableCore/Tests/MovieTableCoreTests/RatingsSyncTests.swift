import Foundation
import Testing

@testable import MovieTableCore

private func at(_ verdict: Verdict, _ updatedAt: Int) -> StampedVerdict {
    StampedVerdict(verdict: verdict, updatedAt: updatedAt)
}

@Suite("merging local and account ratings")
struct MergeVerdictsTests {
    @Test("keeps the union and lets the newer verdict win a conflict")
    func newerWins() {
        let local: StampedVerdicts = ["heat": at(.rated(4.5), 200), "amelie": at(.rated(2), 50)]
        let remote: StampedVerdicts = ["heat": at(.rated(2), 100), "spirited-away": at(.rated(5), 300)]
        let result = mergeVerdicts(local, remote)
        #expect(result.merged == [
            "heat": at(.rated(4.5), 200),
            "amelie": at(.rated(2), 50),
            "spirited-away": at(.rated(5), 300),
        ])
        #expect(result.toUpload.keys.sorted() == ["amelie", "heat"])
    }

    @Test("uploads nothing when the account already has everything")
    func nothingToUpload() {
        let shared: StampedVerdicts = ["heat": at(.rated(5), 100)]
        var remote = shared
        remote["extra"] = at(.skip, 5)
        #expect(mergeVerdicts(shared, remote).toUpload.isEmpty)
    }

    @Test("treats equal timestamps as already in sync")
    func equalTimestamps() {
        let result = mergeVerdicts(["heat": at(.rated(5), 100)], ["heat": at(.rated(2), 100)])
        #expect(result.merged["heat"] == at(.rated(2), 100))
        #expect(result.toUpload.isEmpty)
    }

    @Test("handles empty sides")
    func emptySides() {
        #expect(mergeVerdicts([:], [:]) == MergeResult(merged: [:], toUpload: [:]))
        #expect(mergeVerdicts(["a": at(.rated(5), 1)], [:]).toUpload == ["a": at(.rated(5), 1)])
        #expect(mergeVerdicts([:], ["a": at(.rated(5), 1)]).merged == ["a": at(.rated(5), 1)])
    }
}

@Suite("diffing verdicts since the last sync")
struct DiffVerdictsTests {
    @Test("upserts new and newer entries and deletes removed ones")
    func diff() {
        let previous: StampedVerdicts = ["heat": at(.rated(5), 100), "amelie": at(.rated(2), 100), "gone": at(.skip, 100)]
        let current: StampedVerdicts = ["heat": at(.rated(2), 200), "amelie": at(.rated(2), 100), "fresh": at(.rated(5), 300)]
        #expect(diffVerdicts(previous, current) == VerdictDiff(
            upserts: ["heat": at(.rated(2), 200), "fresh": at(.rated(5), 300)],
            deletes: ["gone"]
        ))
    }

    @Test("reports nothing when both sides are the same")
    func same() {
        let verdicts: StampedVerdicts = ["heat": at(.rated(5), 100)]
        #expect(diffVerdicts(verdicts, verdicts) == VerdictDiff(upserts: [:], deletes: []))
    }

    @Test("ignores an older local copy that the last sync already superseded")
    func older() {
        #expect(diffVerdicts(["heat": at(.rated(5), 200)], ["heat": at(.rated(2), 100)]) == VerdictDiff(upserts: [:], deletes: []))
    }
}

@Suite("account rows")
struct AccountRowsTests {
    @Test("read PostgREST numeric strings and skips, and drop invalid stars")
    func rows() {
        let stamped = rowsToStamped([
            RatingRow(slug: "heat", verdict: "rated", stars: .string("3.5"), updated_at: "2026-09-12T00:00:00.000Z"),
            RatingRow(slug: "amelie", verdict: "rated", stars: .number(4), updated_at: "2026-09-12T00:00:01.000Z"),
            RatingRow(slug: "unseen", verdict: "skip", stars: nil, updated_at: "2026-09-12T00:00:02.000Z"),
            RatingRow(slug: "broken", verdict: "rated", stars: .string("7"), updated_at: "2026-09-12T00:00:03.000Z"),
        ])
        #expect(stamped == [
            "heat": StampedVerdict(verdict: .rated(3.5), updatedAt: 1_789_171_200_000),
            "amelie": StampedVerdict(verdict: .rated(4), updatedAt: 1_789_171_201_000),
            "unseen": StampedVerdict(verdict: .skip, updatedAt: 1_789_171_202_000),
        ])
    }
}
