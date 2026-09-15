import SwiftUI
import MovieTableCore

/// The starter hand: twelve popular films to rate so a profile can exist.
public struct StarterHandPanel: View {
    private let model: CatalogueViewModel

    public init(model: CatalogueViewModel) {
        self.model = model
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .firstTextBaseline) {
                Text("Your taste")
                    .font(LedgerFont.custom(14, weight: .medium, relativeTo: .subheadline))
                    .foregroundStyle(LedgerColors.ink)
                Spacer()
                Text(status)
                    .font(LedgerFont.custom(14, relativeTo: .subheadline))
                    .foregroundStyle(LedgerColors.fadedInk)
            }
            Text(guidance)
                .font(LedgerFont.custom(14, relativeTo: .subheadline))
                .foregroundStyle(LedgerColors.fadedInk)
            LazyVGrid(columns: [GridItem(.adaptive(minimum: 300), spacing: 1)], spacing: 1) {
                ForEach(model.hand, id: \.slug) { candidate in
                    HandCell(model: model, candidate: candidate)
                }
            }
            .overlay(Rectangle().stroke(LedgerColors.hairline))
            Button {
                model.dealAnotherHandNext()
            } label: {
                Label("Deal another hand", systemImage: "shuffle")
                    .font(LedgerFont.custom(14, weight: .medium, relativeTo: .subheadline))
                    .foregroundStyle(LedgerColors.ink)
                    .frame(height: 32)
                    .padding(.horizontal, 10)
            }
            .overlay(Rectangle().stroke(LedgerColors.hairline))
            .buttonStyle(.plain)
        }
        .padding(20)
        .background(LedgerColors.paperTint.opacity(0.4))
        .task { await MainActor.run { model.dealAnotherHand() } }
    }

    private var status: String {
        if model.hasProfile {
            return "\(model.ratedCount) film\(model.ratedCount == 1 ? "" : "s") rated"
        }
        return "Not set"
    }

    private var guidance: String {
        if model.hasProfile {
            return "Your ranking is built from your ratings."
        }
        return "Rate films you've seen, half a star to five. Give a film four or five stars to build your ranking."
    }
}

private struct HandCell: View {
    let model: CatalogueViewModel
    let candidate: HandCandidate

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            if let movie = model.handMovie(candidate.slug) {
                Link(destination: URL(string: movie.link) ?? URL(string: "https://www.metacritic.com")!) {
                    Text(movie.title)
                        .font(LedgerFont.custom(14, weight: .medium, relativeTo: .subheadline))
                        .foregroundStyle(LedgerColors.ink)
                        .multilineTextAlignment(.leading)
                }
                .buttonStyle(.plain)
                Text(creditLine(movie))
                    .font(LedgerFont.custom(12, relativeTo: .caption))
                    .monospacedDigit()
                    .foregroundStyle(LedgerColors.fadedInk)
                Text(model.handSummary(candidate.slug) ?? missingValue)
                    .font(LedgerFont.custom(14, relativeTo: .subheadline))
                    .foregroundStyle(LedgerColors.fadedInk)
                    .lineLimit(2)
                HStack {
                    RatingControl(
                        stars: model.verdictValue(for: candidate.slug),
                        size: .sheet
                    ) { stars in
                        model.setRating(candidate.slug, stars)
                    }
                    Spacer()
                    Button("Haven't seen") {
                        model.skip(candidate.slug)
                    }
                    .font(LedgerFont.custom(13, relativeTo: .footnote))
                    .foregroundStyle(LedgerColors.fadedInk)
                    .buttonStyle(.plain)
                }
            }
        }
        .padding(16)
        .background(LedgerColors.paper)
    }

    private func creditLine(_ movie: Movie) -> String {
        var parts: [String] = []
        if let director = movie.signals?.directors.first { parts.append(director.name) }
        if let language = movie.language { parts.append(language) }
        var line = String(movie.year)
        if !parts.isEmpty { line += " · " + parts.joined(separator: " · ") }
        return line
    }
}
