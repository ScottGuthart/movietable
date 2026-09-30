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
                    VStack(alignment: .center, spacing: 14) {
                        Image(systemName: "envelope.badge.fill")
                            .font(.system(size: 40))
                            .foregroundStyle(LedgerColors.ink)
                            .accessibilityHidden(true)
                        VStack(alignment: .center, spacing: 6) {
                            Text("Check your inbox")
                                .font(LedgerFont.custom(20, weight: .semibold, relativeTo: .title3))
                                .foregroundStyle(LedgerColors.ink)
                            Text("A sign-in link is on its way to \(sentTo). Tap it and the table opens, signed in.")
                                .font(LedgerFont.custom(14, relativeTo: .subheadline))
                                .foregroundStyle(LedgerColors.fadedInk)
                                .multilineTextAlignment(.center)
                        }
                        Button {
                            self.sentTo = nil
                        } label: {
                            Text("Use a different email")
                                .font(LedgerFont.custom(14, weight: .medium, relativeTo: .subheadline))
                                .foregroundStyle(LedgerColors.ink)
                                .frame(maxWidth: .infinity, minHeight: 36)
                        }
                        .overlay(Rectangle().stroke(LedgerColors.hairline))
                        .buttonStyle(.plain)
                    }
                    .frame(maxWidth: .infinity)
                    .accessibilityElement(children: .combine)
                    .accessibilityLabel("Sign-in link sent to \(sentTo)")
                } else {
                    VStack(spacing: 10) {
                        SignInWithAppleButton(.signIn) { request in
                            request.requestedScopes = [.email]
                        } onCompletion: { result in
                            handleApple(result)
                        }
                        .frame(height: 32)

                        Button {
                            handleGoogle()
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
                            #if os(iOS)
                            .textInputAutocapitalization(.never)
                            .keyboardType(.emailAddress)
                            #endif
                            .textContentType(.emailAddress)
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
            .onChange(of: account.session != nil) { _, signedIn in
                if signedIn { dismiss() }
            }
        }
    }

    private func handleGoogle() {
        pending = true
        errorText = nil
        Task {
            defer { pending = false }
            do {
                try await account.signInWithGoogle()
                dismiss()
            } catch {
                errorText = "\(error)"
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
