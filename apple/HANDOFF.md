# Handoff

Open items that need the Apple Developer account or a dashboard login. Delete each once done.

- [ ] Apple Developer Program: enable Sign in with Apple on the App ID (developer.apple.com → Certificates, Identifiers & Profiles → Identifiers → movietable.ai.MovieTable → Capabilities → Sign in with Apple → Save). The entitlements file is wired into the iOS build and the AASA now carries team ID `F5B94KJBBK`.
- [ ] Supabase dashboard: enable Apple, paste the Services ID `movietable.ai.MovieTable` and the secret key from the Apple key, and save. Without this, the Apple button remains the only unavailable sign-in path. Google, GitHub, and magic links are configured.
- [ ] Optional GoogleSignIn native flow: create an iOS OAuth client, add `GOOGLE_CLIENT_ID`, register its URL scheme, add the GoogleSignIn SDK, and wire `GIDSignIn` to `AccountModel.signInWithGoogle(idToken:)`. The app currently uses Supabase's Google OAuth web flow with `movietable://auth/callback`, which works without an extra SDK.
