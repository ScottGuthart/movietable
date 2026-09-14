import Foundation

public struct HTTPResponse: Sendable {
    public var status: Int
    public var data: Data

    public init(status: Int, data: Data) {
        self.status = status
        self.data = data
    }
}

/// One HTTP GET; injectable so tests never touch the network.
public typealias HTTPFetch = @Sendable (URL, [String: String]) async throws -> HTTPResponse

/// A GET over URLSession.
public let urlSessionFetch: HTTPFetch = { url, headers in
    var request = URLRequest(url: url)
    for (name, value) in headers {
        request.setValue(value, forHTTPHeaderField: name)
    }
    let (data, response) = try await URLSession.shared.data(for: request)
    guard let http = response as? HTTPURLResponse else {
        throw URLError(.badServerResponse)
    }
    return HTTPResponse(status: http.statusCode, data: data)
}

/// Fetches with doubling waits on 5xx responses and network errors, the
/// failures seen while the self-hosted Supabase restarts. Client errors return
/// at once.
public func fetchWithRetry(
    _ fetch: HTTPFetch,
    _ url: URL,
    headers: [String: String] = [:],
    attempts: Int = 4,
    baseDelayMs: Int = 1000,
    sleep: @Sendable (Int) async -> Void = { ms in
        try? await Task.sleep(nanoseconds: UInt64(ms) * 1_000_000)
    }
) async throws -> HTTPResponse {
    var attempt = 0
    while true {
        let last = attempt >= attempts - 1
        if attempt > 0 {
            await sleep(baseDelayMs * (1 << (attempt - 1)))
        }
        do {
            let response = try await fetch(url, headers)
            if response.status < 500 || last {
                return response
            }
        } catch {
            if last { throw error }
        }
        attempt += 1
    }
}

/// Walks a table in ascending key order until a page comes back short.
public func pageAll<T: Sendable>(
    _ fetchPage: @Sendable (String, Int) async throws -> [T],
    keyOf: (T) -> String,
    limit: Int = 1000
) async throws -> [T] {
    var rows: [T] = []
    var afterKey = ""
    while true {
        let page = try await fetchPage(afterKey, limit)
        rows.append(contentsOf: page)
        guard page.count >= limit, let last = page.last else { return rows }
        afterKey = keyOf(last)
    }
}
