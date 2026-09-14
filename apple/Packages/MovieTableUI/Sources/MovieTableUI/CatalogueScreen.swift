import SwiftUI
import MovieTableCore
import MovieTableData

/// The main catalogue: score bias, search, quick filters, and a ranked ledger
/// sectioned by score band.
public struct CatalogueScreen: View {
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass
    @State private var biasDraft = DEFAULT_CRITIC_WEIGHT
    @State private var sortOrder: [KeyPathComparator<CatalogueRow>] = [
        KeyPathComparator(\CatalogueRow.finalScore, order: .reverse)
    ]
    private let model: CatalogueViewModel

    public init(model: CatalogueViewModel) {
        self.model = model
    }

    public var body: some View {
        Group {
            switch model.phase {
            case .loading, .loaded, .refreshing:
                content
            case .offline:
                OfflineCatalogueView()
            }
        }
        .background(LedgerColors.paper)
        .task { await model.start() }
        .onAppear { biasDraft = model.scoreBias }
        .onChange(of: sortOrder) { _, newOrder in model.applySort(newOrder) }
    }

    private var content: some View {
        VStack(spacing: 0) {
            controls
            Rectangle().fill(LedgerColors.hairline).frame(height: 1)
            if model.sections.isEmpty {
                emptyState
            } else if horizontalSizeClass == .compact {
                compactTable
            } else {
                ledgerTable
            }
        }
    }

    private var controls: some View {
        VStack(spacing: 10) {
            HStack(spacing: 8) {
                searchField
                resetButton
            }
            chips
            scoreBiasControl
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(LedgerColors.paperTint.opacity(0.2))
    }

    private var searchField: some View {
        HStack(spacing: 8) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 14))
                .foregroundStyle(LedgerColors.fadedInk)
            TextField("Search titles, directors, writers…", text: Binding(
                get: { model.searchText },
                set: { model.setSearch($0) }
            ))
            .font(LedgerFont.custom(14, relativeTo: .subheadline))
            .foregroundStyle(LedgerColors.ink)
            .textFieldStyle(.plain)
            if !model.searchText.isEmpty {
                Button {
                    model.setSearch("")
                } label: {
                    Image(systemName: "xmark")
                        .font(.system(size: 12))
                        .foregroundStyle(LedgerColors.fadedInk)
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Clear search")
            }
        }
        .padding(.horizontal, 10)
        .frame(height: 32)
        .overlay(Rectangle().stroke(LedgerColors.hairline))
    }

    private var resetButton: some View {
        Button("Reset view", action: {
            model.resetView()
            biasDraft = model.scoreBias
            sortOrder = [KeyPathComparator(\CatalogueRow.finalScore, order: .reverse)]
        })
        .font(LedgerFont.custom(14, weight: .medium, relativeTo: .subheadline))
        .foregroundStyle(LedgerColors.ink)
        .frame(height: 32)
        .padding(.horizontal, 10)
        .overlay(Rectangle().stroke(LedgerColors.hairline))
        .buttonStyle(.plain)
    }

    private var chips: some View {
        HStack(spacing: 6) {
            ForEach(CatalogueEra.allCases) { era in
                FilterChip(
                    label: era.label,
                    active: model.era == era,
                    action: { model.setEra(era) }
                )
            }
            FilterChip(
                label: "Popular",
                active: model.popularOnly,
                action: { model.setPopularOnly(!model.popularOnly) }
            )
            Spacer()
        }
    }

    private var scoreBiasControl: some View {
        VStack(spacing: 4) {
            HStack {
                Text("Score bias")
                    .font(LedgerFont.custom(14, weight: .medium, relativeTo: .subheadline))
                    .foregroundStyle(LedgerColors.ink)
                Spacer()
                Text(biasReadout)
                    .font(LedgerFont.custom(13, relativeTo: .caption))
                    .monospacedDigit()
                    .foregroundStyle(LedgerColors.fadedInk)
            }
            HStack(spacing: 10) {
                Text("Users")
                    .font(LedgerFont.custom(13, relativeTo: .caption))
                    .foregroundStyle(LedgerColors.fadedInk)
                Slider(value: $biasDraft, in: 0...1, step: 0.1) { editing in
                    if !editing { model.setScoreBias(biasDraft) }
                }
                .tint(LedgerColors.marqueeCrimson)
                Text("Critics")
                    .font(LedgerFont.custom(13, relativeTo: .caption))
                    .foregroundStyle(LedgerColors.fadedInk)
            }
        }
    }

    private var biasReadout: String {
        let rounded = (biasDraft * 10).rounded() / 10
        if rounded == 0.5 { return "Equal weight" }
        if rounded < 0.5 { return "\(Int(((1 - rounded) * 100).rounded()))% users" }
        return "\(Int((rounded * 100).rounded()))% critics"
    }

    private var emptyState: some View {
        VStack(spacing: 8) {
            Text("No movies match.")
                .font(LedgerFont.custom(15, weight: .medium, relativeTo: .body))
                .foregroundStyle(LedgerColors.ink)
            Text("Try a different search or reset your view.")
                .font(LedgerFont.custom(13, relativeTo: .footnote))
                .foregroundStyle(LedgerColors.fadedInk)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var compactTable: some View {
        List {
            ForEach(model.sections) { section in
                Section(section.title) {
                    ForEach(section.rows) { row in
                        CompactCatalogueCell(row: row)
                            .listRowBackground(LedgerColors.paper)
                            .listRowSeparatorTint(LedgerColors.hairline)
                    }
                }
            }
        }
        .listStyle(.plain)
        .scrollContentBackground(.hidden)
    }

    private var ledgerTable: some View {
        Table(of: CatalogueRow.self, sortOrder: $sortOrder) {
            TableColumn("Rank", value: \.rank) { row in
                RankCell(rank: row.rank)
            }
            .width(min: 44, ideal: 50)

            TableColumn("Title", value: \.title) { row in
                TitleCell(row: row)
            }
            .width(min: 180, ideal: 320)

            TableColumn("Year", value: \.yearLabel) { row in
                NumberCell(value: Double(row.year), muted: true)
            }
            .width(min: 56, ideal: 64)

            TableColumn("Users", value: \.users) { row in
                NumberCell(value: row.movie.users)
            }
            .width(min: 60, ideal: 72)

            TableColumn("Critics", value: \.critics) { row in
                NumberCell(value: row.movie.critics)
            }
            .width(min: 64, ideal: 76)

            TableColumn("Popularity", value: \.popularity) { row in
                NumberCell(value: row.movie.popularity)
            }
            .width(min: 84, ideal: 100)

            TableColumn("Final Score", value: \.finalScore) { row in
                ScoreChipCell(score: row.movie.finalScore)
            }
            .width(min: 84, ideal: 96)

            TableColumn("For you", value: \.forYou) { row in
                ForYouCell(score: row.movie.forYou)
            }
            .width(min: 68, ideal: 80)
        } rows: {
            ForEach(model.sections) { section in
                Section(section.title) {
                    ForEach(section.rows) { row in
                        TableRow(row)
                    }
                }
            }
        }
        .frame(minHeight: 320)
        .tint(LedgerColors.headerInk.opacity(0.8))
    }
}

private struct FilterChip: View {
    let label: String
    let active: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(label)
                .font(LedgerFont.custom(13, relativeTo: .footnote))
                .monospacedDigit()
                .foregroundStyle(active ? LedgerColors.headerInk : LedgerColors.fadedInk)
                .padding(.horizontal, 10)
                .frame(height: 28)
                .background(active ? LedgerColors.secondaryPaper : LedgerColors.paper)
                .overlay(Rectangle().stroke(LedgerColors.hairline))
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(active ? [.isSelected] : [])
    }
}

private struct RankCell: View {
    let rank: Int

    var body: some View {
        Text(String(rank))
            .font(LedgerFont.custom(13, relativeTo: .footnote))
            .monospacedDigit()
            .foregroundStyle(LedgerColors.fadedInk)
            .frame(maxWidth: .infinity, alignment: .trailing)
    }
}

private struct TitleCell: View {
    let row: CatalogueRow

    var body: some View {
        Link(destination: URL(string: row.movie.link) ?? URL(string: "https://www.metacritic.com")!) {
            Text(row.title)
                .font(LedgerFont.custom(14, weight: .medium, relativeTo: .subheadline))
                .foregroundStyle(LedgerColors.ink)
                .lineLimit(1)
        }
        .buttonStyle(.plain)
    }
}

private struct NumberCell: View {
    let value: Double?
    var muted = false

    var body: some View {
        Text(value.map(decimalString) ?? missingValue)
            .font(LedgerFont.custom(13, relativeTo: .footnote))
            .monospacedDigit()
            .foregroundStyle(muted || value == nil ? LedgerColors.fadedInk : LedgerColors.ink)
            .frame(maxWidth: .infinity, alignment: .trailing)
    }
}

private struct ScoreChipCell: View {
    let score: Int?

    var body: some View {
        Group {
            if let score {
                Text(String(score))
                    .font(LedgerFont.custom(14, weight: .semibold, relativeTo: .footnote))
                    .monospacedDigit()
                    .foregroundStyle(LedgerColors.marqueeCrimson)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(LedgerColors.marqueeCrimson.opacity(0.1))
            } else {
                Text(missingValue)
                    .font(LedgerFont.custom(13, relativeTo: .footnote))
                    .monospacedDigit()
                    .foregroundStyle(LedgerColors.fadedInk)
            }
        }
        .frame(maxWidth: .infinity, alignment: .trailing)
    }
}

private struct ForYouCell: View {
    let score: Int?

    var body: some View {
        Group {
            if let score {
                Text(String(score))
                    .font(LedgerFont.custom(14, weight: .semibold, relativeTo: .footnote))
                    .monospacedDigit()
                    .foregroundStyle(LedgerColors.marqueeCrimson)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(LedgerColors.marqueeCrimson.opacity(0.1))
            } else {
                Text(missingValue)
                    .font(LedgerFont.custom(13, relativeTo: .footnote))
                    .foregroundStyle(LedgerColors.fadedInk)
            }
        }
        .frame(maxWidth: .infinity, alignment: .trailing)
    }
}

private struct CompactCatalogueCell: View {
    let row: CatalogueRow

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(alignment: .firstTextBaseline, spacing: 8) {
                Text(String(row.rank))
                    .font(LedgerFont.custom(13, relativeTo: .footnote))
                    .monospacedDigit()
                    .foregroundStyle(LedgerColors.fadedInk)
                Link(destination: URL(string: row.movie.link) ?? URL(string: "https://www.metacritic.com")!) {
                    Text(row.title)
                        .font(LedgerFont.custom(16, weight: .medium, relativeTo: .body))
                        .foregroundStyle(LedgerColors.ink)
                        .lineLimit(2)
                }
                .buttonStyle(.plain)
                Spacer()
                ScoreChipCell(score: row.movie.finalScore)
            }
            HStack(spacing: 12) {
                CompactMetric(label: "Year", value: "\(row.year)")
                CompactMetric(label: "Users", value: row.movie.users.map(decimalString) ?? missingValue)
                CompactMetric(label: "Critics", value: row.movie.critics.map(decimalString) ?? missingValue)
                CompactMetric(label: "Popularity", value: row.movie.popularity.map(decimalString) ?? missingValue)
                CompactMetric(label: "For you", value: row.movie.forYou.map { "\($0)" } ?? missingValue)
            }
        }
        .padding(.vertical, 4)
    }
}

private struct CompactMetric: View {
    let label: String
    let value: String

    var body: some View {
        VStack(alignment: .leading, spacing: 1) {
            Text(label)
                .font(LedgerFont.custom(11, weight: .medium, relativeTo: .caption2))
                .foregroundStyle(LedgerColors.fadedInk)
            Text(value)
                .font(LedgerFont.custom(12, relativeTo: .caption))
                .monospacedDigit()
                .foregroundStyle(LedgerColors.ink)
        }
    }
}

/// The catalogue is a snapshot, so a missing cache and a failed network read
/// render as an invitation to try again, not an error page.
private struct OfflineCatalogueView: View {
    var body: some View {
        VStack(spacing: 12) {
            Text("The catalogue isn’t loaded yet.")
                .font(LedgerFont.custom(20, weight: .semibold, relativeTo: .title3))
                .foregroundStyle(LedgerColors.ink)
            Text("MovieTable keeps a snapshot on your device. Connect once to fill it, then browse offline.")
                .font(LedgerFont.custom(14, relativeTo: .subheadline))
                .foregroundStyle(LedgerColors.fadedInk)
                .multilineTextAlignment(.center)
                .frame(maxWidth: 420)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding(24)
    }
}

#Preview("Seed catalogue") {
    CatalogueScreen(model: try! CatalogueViewModel(snapshot: SeedCatalogue.load()))
}
