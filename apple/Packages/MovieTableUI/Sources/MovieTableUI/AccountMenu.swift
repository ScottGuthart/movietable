import SwiftUI
import MovieTableData

/// The header bar: the wordmark, then a ghost Sign in or the account menu.
public struct LedgerHeader: View {
    private let account: AccountModel?
    @State private var showSignIn = false
    @State private var confirmClear = false

    public init(account: AccountModel?) {
        self.account = account
    }

    public var body: some View {
        HStack(alignment: .firstTextBaseline) {
            HStack(spacing: 0) {
                Text("MovieTable")
                Text(".")
                    .foregroundStyle(LedgerColors.marqueeCrimson)
            }
            .font(LedgerFont.custom(20, weight: .semibold, relativeTo: .title3))
            .foregroundStyle(LedgerColors.ink)
            Spacer()
            if let account {
                if account.session == nil {
                    Button("Sign in") { showSignIn = true }
                        .font(LedgerFont.custom(14, relativeTo: .subheadline))
                        .foregroundStyle(LedgerColors.ink)
                        .buttonStyle(.plain)
                        .disabled(!account.isConfigured)
                } else {
                    menu
                }
            }
        }
        .sheet(isPresented: $showSignIn) {
            if let account {
                SignInView(account: account)
            }
        }
        .confirmationDialog(
            "Clear your ratings?",
            isPresented: $confirmClear,
            titleVisibility: .visible
        ) {
            Button("Clear ratings", role: .destructive) {
                Task { await account?.clearRatings() }
            }
            Button("Keep ratings", role: .cancel) {}
        } message: {
            Text("This removes the ratings saved to your account and on this device and resets your taste ranking. This cannot be undone.")
        }
    }

    private var menu: some View {
        Menu {
            Section {
                Text(account?.statusLine ?? "")
                    .font(LedgerFont.custom(12, relativeTo: .caption))
                    .foregroundStyle(LedgerColors.fadedInk)
            }
            Section("Appearance") {
                ForEach(LedgerAppearance.allCases) { appearance in
                    Button {
                        account?.appearance = appearance
                    } label: {
                        if account?.appearance == appearance {
                            Label(appearance.label, systemImage: "checkmark")
                        } else {
                            Text(appearance.label)
                        }
                    }
                }
            }
            Section {
                Button("Clear ratings", role: .destructive) {
                    confirmClear = true
                }
                Button("Sign out") {
                    Task { await account?.signOut() }
                }
            }
        } label: {
            HStack(spacing: 8) {
                Image(systemName: "person.crop.circle")
                    .font(.system(size: 20))
                    .foregroundStyle(LedgerColors.fadedInk)
                Text(account?.session?.email ?? "Account")
                    .font(LedgerFont.custom(12, weight: .medium, relativeTo: .caption))
                    .lineLimit(1)
                Image(systemName: "chevron.down")
                    .font(.system(size: 11))
                    .foregroundStyle(LedgerColors.fadedInk)
            }
            .padding(.horizontal, 10)
            .frame(height: 32)
            .overlay(Rectangle().stroke(LedgerColors.hairline))
        }
    }
}
