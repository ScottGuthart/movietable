import Foundation
import MovieTableCore

/// Everything the app needs offline: the catalogue, its signals, the taste
/// attributes, and the provider list, as fetched.
public struct CatalogueSnapshot: Codable, Hashable, Sendable {
    public var movies: [RawMovie]
    public var signals: [String: FilmSignals]
    public var taste: TasteCatalogue
    public var providers: [Provider]
    public var fetchedAt: Date

    public init(movies: [RawMovie], signals: [String: FilmSignals], taste: TasteCatalogue, providers: [Provider], fetchedAt: Date) {
        self.movies = movies
        self.signals = signals
        self.taste = taste
        self.providers = providers
        self.fetchedAt = fetchedAt
    }
}

/// Codable JSON in Application Support with atomic writes: the catalogue
/// snapshot, guest ratings, and the film detail cache. No SwiftData, no Core
/// Data, no CloudKit.
public struct CatalogueStore: Sendable {
    public var directory: URL

    public init(directory: URL) {
        self.directory = directory
    }

    /// The default store: `Application Support/MovieTable`.
    public static func applicationSupport(fileManager: FileManager = .default) -> CatalogueStore {
        let base = fileManager.urls(for: .applicationSupportDirectory, in: .userDomainMask).first
            ?? fileManager.temporaryDirectory
        return CatalogueStore(directory: base.appending(path: "MovieTable"))
    }

    private func file(_ name: String) -> URL {
        directory.appending(path: name)
    }

    private func read<T: Decodable>(_ type: T.Type, from name: String) -> T? {
        guard let data = try? Data(contentsOf: file(name)) else { return nil }
        return try? JSONDecoder().decode(T.self, from: data)
    }

    private func write(_ value: some Encodable, to name: String) throws {
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        let data = try JSONEncoder().encode(value)
        try data.write(to: file(name), options: .atomic)
    }

    public func loadSnapshot() -> CatalogueSnapshot? {
        read(CatalogueSnapshot.self, from: "catalogue.json")
    }

    public func saveSnapshot(_ snapshot: CatalogueSnapshot) throws {
        try write(snapshot, to: "catalogue.json")
    }

    public func loadGuestRatings() -> StampedVerdicts {
        read(StampedVerdicts.self, from: "guest-ratings.json") ?? [:]
    }

    public func saveGuestRatings(_ ratings: StampedVerdicts) throws {
        try write(ratings, to: "guest-ratings.json")
    }

    public func loadFilmDetails() -> [String: FilmDetail] {
        read([String: FilmDetail].self, from: "film-details.json") ?? [:]
    }

    public func saveFilmDetails(_ details: [String: FilmDetail]) throws {
        try write(details, to: "film-details.json")
    }
}
