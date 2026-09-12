# Supabase for movietable.ai

Coolify service definition for the app's Supabase stack. It starts from Coolify's
one-click Supabase template, pins newer component images, and carries custom Kong
routes and a Vector log pipeline. Coolify generates all secrets on creation.

## Files

- `docker-compose.yml` – service definition with all bind-mounted config inlined
  (`content:` blocks): Kong routes, Vector log pipeline, Postgres init SQL,
  Supavisor pooler config, MinIO bucket script, edge-function entrypoints.
- `service.env` – non-secret environment overrides applied after creation.
- `deploy.sh` – creates the service through the Coolify API, syncs the env file,
  starts the stack, and prints the generated values. `--dry-run` stops before
  creating anything.
- `jwt.ts` – signs the anon and service-role JWTs when Coolify leaves them empty.

## Deployment choices

| Area | Choice |
| --- | --- |
| Studio | `supabase/studio:2026.08.31-sha-2c76bb3`, served at `https://api.movietable.ai/` behind Kong basic auth |
| Auth | email sign-up only; OAuth server, phone, and anonymous users off |
| Storage backend | bundled MinIO (`stub` bucket) |
| JWT verification | HS256 shared secret |
| Logs | Vector ships container logs to Logflare (Studio log explorer) |
| Host ports | none; Traefik is the only ingress |
| Edge runtime | stock `main` router and `hello` function, JWT verification on |

## Deploy

```sh
coolify context set-token personal <token>     # if `coolify --context personal server list` fails
infra/supabase/deploy.sh --dry-run
infra/supabase/deploy.sh
```

Afterwards set `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_ADMIN_EMAIL` in the
service env (or set `ENABLE_EMAIL_AUTOCONFIRM=true`) and restart `supabase-auth`,
otherwise sign-up emails cannot be sent.

## Gotchas seen on first deploy (2026-09-12)

- `minio/mc` on Docker Hub no longer pulls; compose uses `quay.io/minio/mc`.
- Coolify generated empty `SERVICE_SUPABASEANON_KEY` / `SERVICE_SUPABASESERVICE_KEY`
  because the JWT secret was referenced later in the compose. `deploy.sh` now
  signs them with `jwt.ts` when empty; the kong env block lists `JWT_SECRET` first.
- `minio-createbucket` exits 0 by design; it is excluded from service status.
- The personal server (3.9 GB RAM) cannot run two Supabase stacks; the older
  `supabase-nvsewslbztkhznokyvmzf7cq` service was stopped, not deleted.
- Studio: `https://api.movietable.ai/` with basic auth from `SERVICE_USER_ADMIN` /
  `SERVICE_PASSWORD_ADMIN` (`coolify --context personal service env list <uuid> -s`).
