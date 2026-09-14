import Foundation
import MovieTableCore

/// An optional number that Table can sort: present values compare normally and
/// missing values always sort last, in either direction.
public struct OptionalSortValue: Comparable, Hashable, Sendable {
    public var value: Double?

    public init(_ value: Double?) {
        self.value = value
    }

    public static func < (lhs: OptionalSortValue, rhs: OptionalSortValue) -> Bool {
        switch (lhs.value, rhs.value) {
        case (nil, nil): return false
        case (nil, _): return false
        case (_, nil): return true
        case (let a?, let b?): return a < b
        }
    }
}

/// One scored film with the rank the current view gives it.
public struct CatalogueRow: Identifiable, Hashable, Sendable {
    public var rank: Int
    public var movie: ScoredMovie

    public var id: String { movie.slug }
    public var title: String { movie.title }
    public var year: Int { movie.year }
    /// Years render without a thousands separator; the table sorts on `year`.
    public var yearLabel: String { String(movie.year) }

    public var users: OptionalSortValue { .init(movie.users) }
    public var critics: OptionalSortValue { .init(movie.critics) }
    public var popularity: OptionalSortValue { .init(movie.popularity) }
    public var finalScore: OptionalSortValue { .init(movie.finalScore.map(Double.init)) }
    public var forYou: OptionalSortValue { .init(movie.forYou.map(Double.init)) }
}

/// A score band with its already-ranked rows.
public struct CatalogueSection: Identifiable, Hashable, Sendable {
    public var id: String
    public var label: String
    public var count: Int
    public var averageFinalScore: Int?
    public var rows: [CatalogueRow]

    public init(id: String, label: String, count: Int, averageFinalScore: Int?, rows: [CatalogueRow]) {
        self.id = id
        self.label = label
        self.count = count
        self.averageFinalScore = averageFinalScore
        self.rows = rows
    }

    public var title: String {
        let average = averageFinalScore.map { "avg \($0)" } ?? missingValue
        return "\(label) · \(count) film\(count == 1 ? "" : "s") · \(average)"
    }
}
