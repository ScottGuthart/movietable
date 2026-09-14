import Foundation
import Testing

@testable import MovieTableData

private final class ResponseQueue: @unchecked Sendable {
    private let lock = NSLock()
    private var responses: [Result<HTTPResponse, Error>]

    init(_ responses: [Result<HTTPResponse, Error>]) {
        self.responses = responses
    }

    func pop() -> Result<HTTPResponse, Error> {
        lock.lock()
        defer { lock.unlock() }
        if responses.isEmpty {
            return .failure(CatalogueError("no more responses"))
        }
        return responses.removeFirst()
    }
}

private final class IntegerLog: @unchecked Sendable {
    private let lock = NSLock()
    private var values: [Int] = []

    func append(_ value: Int) {
        lock.lock()
        do { values.append(value) }
        lock.unlock()
    }

    var recorded: [Int] {
        lock.lock()
        defer { lock.unlock() }
        return values
    }
}

private struct NetworkFailure: Error {}

@Suite("retrying fetch")
struct FetchWithRetryTests {
    private func fetch(_ queue: ResponseQueue) -> HTTPFetch {
        { _, _ in
            switch queue.pop() {
            case .success(let response): return response
            case .failure(let error): throw error
            }
        }
    }

    @Test("retries 5xx responses with doubling waits and returns the first success")
    func retriesServerErrors() async throws {
        let waits = IntegerLog()
        let queue = ResponseQueue([
            .success(HTTPResponse(status: 503, data: Data("down".utf8))),
            .success(HTTPResponse(status: 502, data: Data("down".utf8))),
            .success(HTTPResponse(status: 200, data: Data("[]".utf8))),
        ])
        let response = try await fetchWithRetry(
            fetch(queue),
            URL(string: "https://db.test/rest")!,
            attempts: 4,
            baseDelayMs: 10,
            sleep: { waits.append($0) }
        )
        #expect(response.status == 200)
        #expect(waits.recorded == [10, 20])
    }

    @Test("returns the last failing response once attempts run out")
    func lastFailure() async throws {
        let queue = ResponseQueue([
            .success(HTTPResponse(status: 503, data: Data())),
            .success(HTTPResponse(status: 503, data: Data())),
        ])
        let response = try await fetchWithRetry(
            fetch(queue),
            URL(string: "https://db.test/rest")!,
            attempts: 2,
            baseDelayMs: 1,
            sleep: { _ in }
        )
        #expect(response.status == 503)
    }

    @Test("does not retry client errors")
    func clientError() async throws {
        let queue = ResponseQueue([
            .success(HTTPResponse(status: 404, data: Data())),
            .success(HTTPResponse(status: 200, data: Data())),
        ])
        let response = try await fetchWithRetry(
            fetch(queue),
            URL(string: "https://db.test/rest")!,
            attempts: 3,
            baseDelayMs: 1,
            sleep: { _ in }
        )
        #expect(response.status == 404)
    }

    @Test("retries a thrown network error and rethrows when attempts run out")
    func networkErrors() async throws {
        let flaky = ResponseQueue([
            .failure(NetworkFailure()),
            .success(HTTPResponse(status: 200, data: Data())),
        ])
        let recovered = try await fetchWithRetry(
            fetch(flaky),
            URL(string: "https://db.test/rest")!,
            attempts: 2,
            baseDelayMs: 1,
            sleep: { _ in }
        )
        #expect(recovered.status == 200)

        let dead: HTTPFetch = { _, _ in throw NetworkFailure() }
        await #expect(throws: NetworkFailure.self) {
            _ = try await fetchWithRetry(
                dead,
                URL(string: "https://db.test/rest")!,
                attempts: 2,
                baseDelayMs: 1,
                sleep: { _ in }
            )
        }
    }
}
