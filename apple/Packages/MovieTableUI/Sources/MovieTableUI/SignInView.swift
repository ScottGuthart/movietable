import SwiftUI
import AuthenticationServices
import MovieTableData

/// Sign-in is a side door, never a gate: a sheet with two providers and a
/// magic-link field.
public struct SignInView: View {
    @Environment(\.dismiss) private var dismiss
    private let account: AccountModel
    @State private var email = ""
    @State private var errorText: String?
    @State private var sentTo: String?
    @State private var pending = false
    @State private var showGoogleNotice = false

    public init(account: AccountModel) {
        self.account = account
    }

    public var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 16) {
                VStack(alignment: .leading, spacing: 6) {
                    Text("Keep your ratings everywhere.")
                        .font(LedgerFont.custom(24, weight: .semibold, relativeTo: .title))
                        .foregroundStyle(LedgerColors.ink)
                    Text("Sign in to save your ratings and pick them up on any device.")
                        .font(LedgerFont.custom(14, relativeTo: .subheadline))
                        .foregroundStyle(LedgerColors.fadedInk)
                }

                if let sentTo {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Check \(sentTo) for a sign-in link. It works once and opens the table signed in.")
                            .font(LedgerFont.custom(14, relativeTo: .subheadline))
                            .foregroundStyle(LedgerColors.ink)
                        Button("Use a different email") {
                            self.sentTo = nil
                        }
                        .font(LedgerFont.custom(14, relativeTo: .subheadline))
                        .foregroundStyle(LedgerColors.ink)
                        .buttonStyle(.plain)
                    }
                } else {
                    VStack(spacing: 10) {
                        SignInWithAppleButton(.signIn) { request in
                            request.requestedScopes = [.email]
                        } onCompletion: { result in
                            handleApple(result)
                        }
                        .frame(height: 32)

                        Button {
                            showGoogleNotice = true
                        } label: {
                            HStack(spacing: 8) {
                                Image(systemName: "g.circle")
                                    .font(.system(size: 16))
                                Text("Continue with Google")
                            }
                            .font(LedgerFont.custom(14, weight: .medium, relativeTo: .subheadline))
                            .foregroundStyle(LedgerColors.ink)
                            .frame(maxWidth: .infinity, minHeight: 32)
                        }
                        .overlay(Rectangle().stroke(LedgerColors.hairline))
                        .buttonStyle(.plain)
                        .disabled(pending)
                    }
                    .opacity(pending ? 0.5 : 1)

                    HStack(spacing: 12) {
                        Rectangle().fill(LedgerColors.hairline).frame(height: 1)
                        Text("or")
                            .font(LedgerFont.custom(12, relativeTo: .caption))
                            .foregroundStyle(LedgerColors.fadedInk)
                        Rectangle().fill(LedgerColors.hairline).frame(height: 1)
                    }

                    VStack(alignment: .leading, spacing: 6) {
                        Text("Email")
                            .font(LedgerFont.custom(14, weight: .medium, relativeTo: .subheadline))
                            .foregroundStyle(LedgerColors.ink)
                        TextField("you@example.com", text: $email)
                            .autocorrectionDisabled()
                            .font(LedgerFont.custom(14, relativeTo: .subheadline))
                            .frame(height: 32)
                            .padding(.horizontal, 10)
                            .overlay(Rectangle().stroke(LedgerColors.hairline))
                        Button {
                            sendMagicLink()
                        } label: {
                            HStack {
                                Spacer()
                                Text("Send me a sign-in link")
                                Image(systemName: "arrow.right")
                            }
                            .font(LedgerFont.custom(14, weight: .medium, relativeTo: .subheadline))
                            .foregroundStyle(LedgerColors.ink)
                            .frame(maxWidth: .infinity, minHeight: 32)
                        }
                        .overlay(Rectangle().stroke(LedgerColors.hairline))
                        .buttonStyle(.plain)
                    }

                    if let errorText {
                        Text(errorText)
                            .font(LedgerFont.custom(14, relativeTo: .subheadline))
                            .foregroundStyle(LedgerColors.alertRed)
                    }
                }

                Spacer()
            }
            .padding(20)
            .frame(maxWidth: 384)
            .frame(maxWidth: .infinity)
            .background(LedgerColors.paper)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Back") { dismiss() }
                }
            }
            .alert("Google sign-in isn’t set up yet.", isPresented: $showGoogleNotice) {
                Button("OK", role: .cancel) {}
            } message: {
                Text("The Google iOS client ID still needs to be added in the Supabase and Apple dashboards.")
            }
        }
    }

    private func handleApple(_ result: Result<ASAuthorization, Error>) {
        switch result {
        case .success(let authorization):
            guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
                  let tokenData = credential.identityToken,
                  let token = String(data: tokenData, encoding: .utf8) else {
                errorText = "Apple didn’t return an identity token."
                return
            }
            pending = true
            errorText = nil
            Task {
                defer { pending = false }
                do {
                    try await account.signInWithApple(idToken: token, nonce: nil)
                    dismiss()
                } catch {
                    errorText = "\(error)"
                }
            }
        case .failure(let error):
            errorText = "\(error)"
        }
    }

    private func sendMagicLink() {
        pending = true
        errorText = nil
        Task {
            defer { pending = false }
            do {
                try await account.sendMagicLink(email: email)
                sentTo = email
            } catch {
                errorText = "\(error)"
            }
        }
    }
}
