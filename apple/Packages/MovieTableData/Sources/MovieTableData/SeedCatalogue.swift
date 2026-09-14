import Foundation

/// Loads the full seed catalogue bundled for SwiftUI previews and offline tests.
public enum SeedCatalogue {
    public static func load() throws -> CatalogueSnapshot {
        try load(bundle: .module)
    }

    static func load(bundle: Bundle) throws -> CatalogueSnapshot {
        guard let url = bundle.url(forResource: "snapshot", withExtension: "json") else {
            throw CatalogueError("The bundled seed snapshot is missing. Run scripts/build-seed-snapshot.ts.")
        }
        let data = try Data(contentsOf: url)
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return try decoder.decode(CatalogueSnapshot.self, from: data)
    }
}
