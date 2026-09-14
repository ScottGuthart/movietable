import Foundation

/// A verdict plus the moment the visitor last set it, in milliseconds since the epoch.
public struct StampedVerdict: Hashable, Codable, Sendable {
    public var verdict: Verdict
    public var updatedAt: Int

    public init(verdict: Verdict, updatedAt: Int) {
        self.verdict = verdict
        self.updatedAt = updatedAt
    }
}

/// Verdicts with their timestamps, keyed by film slug.
public typealias StampedVerdicts = [String: StampedVerdict]

public struct MergeResult: Hashable, Sendable {
    /// The union of both sides; on a conflict the newer verdict wins, ties go to the account.
    public var merged: StampedVerdicts
    /// Local verdicts the account lacks or has an older copy of.
    public var toUpload: StampedVerdicts

    public init(merged: StampedVerdicts, toUpload: StampedVerdicts) {
        self.merged = merged
        self.toUpload = toUpload
    }
}

public func mergeVerdicts(_ local: StampedVerdicts, _ remote: StampedVerdicts) -> MergeResult {
    var merged = remote
    var toUpload: StampedVerdicts = [:]
    for (slug, entry) in local {
        if let theirs = remote[slug], theirs.updatedAt >= entry.updatedAt {
            continue
        }
        merged[slug] = entry
        toUpload[slug] = entry
    }
    return MergeResult(merged: merged, toUpload: toUpload)
}

public struct VerdictDiff: Hashable, Sendable {
    public var upserts: StampedVerdicts
    public var deletes: [String]

    public init(upserts: StampedVerdicts, deletes: [String]) {
        self.upserts = upserts
        self.deletes = deletes
    }
}

/// What changed locally since `previous`: entries that are new or newer, and slugs that disappeared.
public func diffVerdicts(_ previous: StampedVerdicts, _ current: StampedVerdicts) -> VerdictDiff {
    var upserts: StampedVerdicts = [:]
    for (slug, entry) in current {
        if let before = previous[slug], entry.updatedAt <= before.updatedAt {
            continue
        }
        upserts[slug] = entry
    }
    let deletes = previous.keys.filter { current[$0] == nil }.sorted()
    return VerdictDiff(upserts: upserts, deletes: deletes)
}

/// A `taste_ratings` value as PostgREST returns it: numbers arrive as strings.
public enum RatingStars: Hashable, Sendable {
    case number(Double)
    case string(String)
}

/// A `taste_ratings` row as PostgREST returns it.
public struct RatingRow: Hashable, Sendable {
    public var slug: String
    public var verdict: String
    public var stars: RatingStars?
    public var updated_at: String

    public init(slug: String, verdict: String, stars: RatingStars?, updated_at: String) {
        self.slug = slug
        self.verdict = verdict
        self.stars = stars
        self.updated_at = updated_at
    }
}

enum ISO8601 {
    /// `Date.parse` for the ISO strings PostgREST returns, in milliseconds since the epoch.
    static func milliseconds(_ string: String) -> Int? {
        let withFraction = ISO8601DateFormatter()
        withFraction.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = withFraction.date(from: string) {
            return Int((date.timeIntervalSince1970 * 1000).rounded())
        }
        let plain = ISO8601DateFormatter()
        if let date = plain.date(from: string) {
            return Int((date.timeIntervalSince1970 * 1000).rounded())
        }
        return nil
    }
}

func number(from stars: RatingStars?) -> Double? {
    switch stars {
    case .number(let number): return number
    case .string(let string): return Double(string)
    case nil: return nil
    }
}

/// Converts account rows to stamped verdicts, dropping rows whose stars are not
/// a valid half step.
public func rowsToStamped(_ rows: [RatingRow]) -> StampedVerdicts {
    var stamped: StampedVerdicts = [:]
    for row in rows {
        let verdict: Verdict?
        if row.verdict == "skip" {
            verdict = .skip
        } else {
            verdict = parseVerdict(number(from: row.stars))
        }
        if let verdict, let updatedAt = ISO8601.milliseconds(row.updated_at) {
            stamped[row.slug] = StampedVerdict(verdict: verdict, updatedAt: updatedAt)
        }
    }
    return stamped
}
