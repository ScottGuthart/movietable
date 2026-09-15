import MovieTableData
import MovieTableUI
import SwiftUI

struct ContentView: View {
    @State private var model: CatalogueViewModel
    @State private var account: AccountModel?

    init(model: CatalogueViewModel) {
        if ProcessInfo.processInfo.arguments.contains("-uitest-seed") {
            self.model = CatalogueViewModel(store: .applicationSupport(), config: nil)
            if let snapshot = try? SeedCatalogue.load() {
                model.installForTesting(snapshot)
            }
        } else {
            self.model = model
        }
    }

    var body: some View {
        CatalogueScreen(model: model, account: account)
            .preferredColorScheme(account?.appearance.scheme)
            .task {
                if account == nil {
                    account = AccountModel(model: model, config: SupabaseConfig(bundle: .main))
                }
                await account?.start()
            }
            .onOpenURL { url in
                Task { await account?.handle(url) }
            }
    }
}

#Preview {
    ContentView(
        model: CatalogueViewModel(
            store: nil,
            config: nil,
            loadRemote: nil
        )
    )
}
