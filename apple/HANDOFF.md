# Handoff

Open items that need the Apple Developer account or a dashboard login. Delete each once done.

- [ ] Add repository secrets `SUPABASE_URL` and `SUPABASE_ANON_KEY` (GitHub → movietable → Settings → Secrets and variables → Actions → New repository secret). Until then, Apple CI builds with `https://api.movietable.ai` and a placeholder key; the app's data and sign-in features will not reach Supabase from CI builds.
