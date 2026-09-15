//
//  MovieTableApp.swift
//  MovieTable
//
//  Created by Scott on 9/14/2026.
//

import SwiftUI
import MovieTableData
import MovieTableUI

@main
struct MovieTableApp: App {
    @State private var model = CatalogueViewModel(
        store: .applicationSupport(),
        config: SupabaseConfig(bundle: .main)
    )

    var body: some Scene {
        WindowGroup {
            ContentView(model: model)
        }
        #if os(macOS)
        .defaultSize(width: 1_280, height: 800)
        #endif
        .commands {
            CatalogueCommands(model: model)
        }
    }
}

private struct CatalogueCommands: Commands {
    let model: CatalogueViewModel

    var body: some Commands {
        CommandMenu("Catalogue") {
            Menu("Sort by") {
                sortButton("Final Score", key: "1", sortOrder: [KeyPathComparator(\CatalogueRow.finalScore, order: .reverse)])
                sortButton("Title", key: "2", sortOrder: [KeyPathComparator(\CatalogueRow.title, order: .reverse)])
                sortButton("Year", key: "3", sortOrder: [KeyPathComparator(\CatalogueRow.year, order: .reverse)])
                sortButton("Users", key: "4", sortOrder: [KeyPathComparator(\CatalogueRow.users, order: .reverse)])
                sortButton("Critics", key: "5", sortOrder: [KeyPathComparator(\CatalogueRow.critics, order: .reverse)])
                sortButton("Popularity", key: "6", sortOrder: [KeyPathComparator(\CatalogueRow.popularity, order: .reverse)])
                sortButton("For you", key: "7", sortOrder: [KeyPathComparator(\CatalogueRow.forYou, order: .reverse)])
                sortButton("Rank", key: "8", sortOrder: [KeyPathComparator(\CatalogueRow.rank, order: .forward)])
            }

            Menu("Era") {
                eraButton("2000–2024", era: .modern, key: "0")
                eraButton("2000s", era: .twoThousands, key: "1")
                eraButton("2010s", era: .twentyTens, key: "2")
                eraButton("2020s", era: .twentyTwenties, key: "3")
            }

            Button("Popular only") {
                model.setPopularOnly(!model.popularOnly)
            }
            .keyboardShortcut("p", modifiers: [.command, .shift])

            Divider()

            Button("Reset view") {
                model.resetView()
            }
            .keyboardShortcut("r", modifiers: [.command, .shift])
        }
    }

    private func sortButton(_ title: String, key: KeyEquivalent, sortOrder: [KeyPathComparator<CatalogueRow>]) -> some View {
        Button(title) {
            model.applySort(sortOrder)
        }
        .keyboardShortcut(key, modifiers: [.command, .option])
    }

    private func eraButton(_ title: String, era: CatalogueEra, key: KeyEquivalent) -> some View {
        Button(title) {
            model.setEra(era)
        }
        .keyboardShortcut(key, modifiers: [.control, .option])
    }
}
