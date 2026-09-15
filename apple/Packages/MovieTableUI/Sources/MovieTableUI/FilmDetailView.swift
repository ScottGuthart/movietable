import SwiftUI
import MovieTableCore
import MovieTableData

/// A film tapped in the ledger, opened in place as a sheet.
public struct FilmReference: Identifiable, Hashable, Sendable {
    public var slug: String
    public var title: String

    public var id: String { slug }

    public init(slug: String, title: String) {
        self.slug = slug
        self.title = title
    }

    public init(row: CatalogueRow) {
        self.init(slug: row.movie.slug, title: row.movie.title)
    }
}

/// Synopsis, credits, streaming offers, IMDb link, and awards for one film.
public struct FilmDetailView: View {
    private let model: CatalogueViewModel
    private let film: FilmReference
    @State private var detail: FilmDetail?
    @Environment(\.dismiss) private var dismiss

    public init(model: CatalogueViewModel, film: FilmReference) {
        self.model = model
        self.film = film
    }

    public var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    header
                    if let detail {
                        body(of: detail)
                    } else {
                        ProgressView()
                            .frame(maxWidth: .infinity, alignment: .center)
                            .padding(.top, 32)
                    }
                }
                .padding(24)
            }
            .background(LedgerColors.paper)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                }
            }
        }
        .task {
            detail = await model.detail(for: film.slug)
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(film.title)
                .font(LedgerFont.custom(24, weight: .semibold, relativeTo: .title))
                .foregroundStyle(LedgerColors.ink)
            RatingControl(
                stars: model.verdictValue(for: film.slug),
                size: .sheet
            ) { stars in
                model.setRating(film.slug, stars)
            }
        }
    }

    @ViewBuilder
    private func body(of detail: FilmDetail) -> some View {
        VStack(alignment: .leading, spacing: 20) {
            Text(detail.summary?.isEmpty == false ? detail.summary! : "No synopsis on record.")
                .font(LedgerFont.custom(14, relativeTo: .subheadline))
                .foregroundStyle(detail.summary?.isEmpty == false ? LedgerColors.ink : LedgerColors.fadedInk)
                .lineSpacing(4)

            if !detail.genres.isEmpty {
                WrapRow(spacing: 6) {
                    ForEach(detail.genres, id: \.self) { genre in
                        Text(genre)
                            .font(LedgerFont.custom(12, relativeTo: .caption))
                            .foregroundStyle(LedgerColors.headerInk)
                            .padding(.horizontal, 5)
                            .frame(height: 20)
                            .overlay(Rectangle().stroke(LedgerColors.hairline))
                            .background(LedgerColors.paper)
                    }
                }
            }

            creditLine("Directed by", names: detail.directors.map(\.name))
            creditLine("Written by", names: detail.writers.map(\.name))
            if !detail.cast.isEmpty {
                creditLine("Cast", names: detail.cast.map { $0.name })
            }

            if !detail.offers.isEmpty {
                offers(detail.offers)
            }

            if let url = detail.imdbUrl ?? detail.justwatchUrl {
                Link("More on IMDb", destination: URL(string: url)!)
                    .font(LedgerFont.custom(14, relativeTo: .subheadline))
                    .foregroundStyle(LedgerColors.fadedInk)
            }

            if !detail.awards.lines.isEmpty {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Awards")
                        .font(LedgerFont.custom(14, weight: .medium, relativeTo: .subheadline))
                        .foregroundStyle(LedgerColors.ink)
                    ForEach(detail.awards.lines, id: \.self) { line in
                        HStack(alignment: .top) {
                            Text(line.text)
                                .font(LedgerFont.custom(14, relativeTo: .subheadline))
                                .foregroundStyle(LedgerColors.ink)
                            Spacer()
                            Text(line.detail)
                                .font(LedgerFont.custom(12, relativeTo: .caption))
                                .monospacedDigit()
                                .foregroundStyle(LedgerColors.fadedInk)
                        }
                    }
                    if detail.awards.hiddenNominations > 0 {
                        Text("+\(detail.awards.hiddenNominations) more nominations")
                            .font(LedgerFont.custom(12, relativeTo: .caption))
                            .monospacedDigit()
                            .foregroundStyle(LedgerColors.fadedInk)
                    }
                }
            }
        }
    }

    private func creditLine(_ label: String, names: [String]) -> some View {
        Group {
            if !names.isEmpty {
                HStack(alignment: .top, spacing: 6) {
                    Text(label)
                        .font(LedgerFont.custom(14, relativeTo: .subheadline))
                        .foregroundStyle(LedgerColors.fadedInk)
                    Text(names.joined(separator: ", "))
                        .font(LedgerFont.custom(14, weight: .medium, relativeTo: .subheadline))
                        .foregroundStyle(LedgerColors.ink)
                    Spacer()
                }
            }
        }
    }

    private func offers(_ offers: [FilmOffer]) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Where to watch")
                .font(LedgerFont.custom(14, weight: .medium, relativeTo: .subheadline))
                .foregroundStyle(LedgerColors.ink)
            ForEach(offers, id: \.self) { offer in
                HStack(spacing: 8) {
                    ProviderMark(offer: offer)
                    Text(offer.provider)
                        .font(LedgerFont.custom(14, relativeTo: .subheadline))
                        .foregroundStyle(LedgerColors.ink)
                    Spacer()
                    Text(offerMeta(offer))
                        .font(LedgerFont.custom(12, relativeTo: .caption))
                        .monospacedDigit()
                        .foregroundStyle(LedgerColors.fadedInk)
                }
            }
        }
    }

    private func offerMeta(_ offer: FilmOffer) -> String {
        var parts = [offer.quality]
        if let price = offer.price, let currency = offer.currency {
            parts.insert("\(currency)\(decimalString(price))", at: 0)
        }
        return parts.joined(separator: " · ")
    }
}

/// A 16px provider mark, grayscale at rest, with a one-letter outline chip when
/// the image is missing.
private struct ProviderMark: View {
    let offer: FilmOffer

    var body: some View {
        if let url = offer.iconUrl.flatMap(URL.init) {
            AsyncImage(url: url) { phase in
                switch phase {
                case .success(let image):
                    image.resizable()
                        .scaledToFit()
                        .frame(width: 16, height: 16)
                        .saturation(0)
                        .opacity(0.85)
                case .empty, .failure:
                    fallback
                @unknown default:
                    fallback
                }
            }
            .frame(width: 16, height: 16)
        } else {
            fallback
        }
    }

    private var fallback: some View {
        Text(String(offer.provider.prefix(1)))
            .font(LedgerFont.custom(11, relativeTo: .caption2))
            .foregroundStyle(LedgerColors.fadedInk)
            .frame(width: 16, height: 16)
            .overlay(Rectangle().stroke(LedgerColors.hairline))
    }
}

/// A minimal wrapping row for badges without a layout dependency.
private struct WrapRow<Content: View>: View {
    let spacing: CGFloat
    @ViewBuilder let content: Content

    var body: some View {
        HStack(spacing: spacing) { content }
    }
}
