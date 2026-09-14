import Foundation
import Testing

@testable import MovieTableData

private final class RequestLog: @unchecked Sendable {
    private let lock = NSLock()
    private var requests: [(URL, [String: String])] = []

    func append(_ url: URL, _ headers: [String: String]) {
        lock.lock()
        do { requests.append((url, headers)) }
        lock.unlock()
    }

    var recorded: [(URL, [String: String])] {
        lock.lock()
        defer { lock.unlock() }
        return requests
    }
}

@Suite("Supabase catalogue client")
struct SupabaseCatalogueTests {
    private let config = SupabaseConfig(
        url: URL(string: "https://api.movietable.ai")!,
        anonKey: "anon-key"
    )

    @Test("sends the exact PostgREST provider select with anon authentication")
    func providers() async throws {
        let log = RequestLog()
        let client = SupabaseCatalogue(config: config, attempts: 1, baseDelayMs: 1) { url, headers in
            log.append(url, headers)
            return HTTPResponse(status: 200, data: Data(#"[{"id":8,"name":"Netflix","icon_url":null}]"#.utf8))
        }
        let providers = try await client.fetchProviders()
        #expect(providers == [Provider(id: 8, name: "Netflix")])
        let request = try #require(log.recorded.first)
        #expect(request.0.absoluteString == "https://api.movietable.ai/rest/v1/providers?select=id,name,icon_url&order=id")
        #expect(request.1["apikey"] == "anon-key")
        #expect(request.1["Authorization"] == "Bearer anon-key")
    }

    @Test("turns a server failure into a readable catalogue error")
    func serverError() async throws {
        let client = SupabaseCatalogue(config: config, attempts: 1, baseDelayMs: 1) { _, _ in
            HTTPResponse(status: 500, data: Data("upstream down".utf8))
        }
        await #expect(throws: CatalogueError.self) {
            _ = try await client.fetchProviders()
        }
    }

    @Test("loads a film detail with the exact movie and award selects")
    func detail() async throws {
        let log = RequestLog()
        let client = SupabaseCatalogue(config: config, attempts: 1, baseDelayMs: 1) { url, headers in
            log.append(url, headers)
            if url.path.contains("movie_awards") {
                return HTTPResponse(status: 200, data: Data(#"[]"#.utf8))
            }
            let json = #"""
            [{
              "slug":"parasite",
              "summary":"A poor family schemes.",
              "justwatch_url":null,
              "movie_imdb":{"imdb_id":"tt6751668"},
              "movie_genres":[{"genre_name":"Drama"}],
              "credits":[
                {"role":"director","billing":1,"character":null,"person_slug":"bong-joon-ho","people":{"name":"Bong Joon Ho"}}
              ],
              "streaming_offers":[]
            }]
            """#
            return HTTPResponse(status: 200, data: Data(json.utf8))
        }
        let detail = try await client.fetchFilmDetail("parasite")
        #expect(detail?.slug == "parasite")
        #expect(detail?.imdbUrl == "https://www.imdb.com/title/tt6751668/")
        let urls = log.recorded.map(\.0.absoluteString)
        #expect(urls.contains("https://api.movietable.ai/rest/v1/movies?select=slug,summary,justwatch_url,movie_imdb(imdb_id),movie_genres(genre_name),credits(role,billing,character,person_slug,people(name)),streaming_offers(monetization,quality,url,price,currency_code,providers(id,name,icon_url))&slug=eq.parasite&credits.order=billing&limit=1"))
        #expect(urls.contains("https://api.movietable.ai/rest/v1/movie_awards?select=award_name,result,year,person_name,person_slug&movie_slug=eq.parasite&order=award_name"))
    }

    @Test("returns nil when the slug is unknown")
    func unknownDetail() async throws {
        let client = SupabaseCatalogue(config: config) { url, _ in
            HTTPResponse(status: 200, data: url.path.contains("movie_awards") ? Data("[]".utf8) : Data("[]".utf8))
        }
        #expect(try await client.fetchFilmDetail("missing") == nil)
    }
}
