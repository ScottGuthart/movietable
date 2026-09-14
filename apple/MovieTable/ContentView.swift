import MovieTableData
import MovieTableUI
import SwiftUI

struct ContentView: View {
    @State private var model = CatalogueViewModel(
        store: .applicationSupport(),
        config: SupabaseConfig(bundle: .main)
    )

    var body: some View {
        CatalogueScreen(model: model)
    }
}

#Preview {
    ContentView()
}
