import MovieTableData
import MovieTableUI
import SwiftUI

struct ContentView: View {
    @State private var model = CatalogueViewModel(
        store: .applicationSupport(),
        config: SupabaseConfig(bundle: .main)
    )
    @State private var account: AccountModel?

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
    ContentView()
}
