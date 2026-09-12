#!/usr/bin/env bash
# Create the movietable Supabase service on a Coolify instance.
#
# Prerequisites:
#   1. `coolify context list` shows the target context with a working API token
#      (`coolify --context personal server list` must succeed).
#   2. DNS: api.movietable.ai points at the Coolify server (A record, or Cloudflare proxy).
#
# Usage:
#   infra/supabase/deploy.sh            # create, configure, start
#   infra/supabase/deploy.sh --dry-run  # resolve server/project and write the payload only
#
# Overrides (env): COOLIFY_CONTEXT SERVER_UUID DESTINATION_UUID PROJECT_NAME ENV_NAME SERVICE_NAME KONG_URL
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT="${OUT_DIR:-$HERE/out}"
mkdir -p "$OUT"
CTX="${COOLIFY_CONTEXT:-personal}"
PROJECT_NAME="${PROJECT_NAME:-movietable}"
ENV_NAME="${ENV_NAME:-production}"
SERVICE_NAME="${SERVICE_NAME:-movietable-supabase}"
KONG_URL="${KONG_URL:-https://api.movietable.ai:8000}"
DRY_RUN="${1:-}"
CFG="${COOLIFY_CONFIG:-$HOME/.config/coolify/config.json}"

log() { printf '\n## %s\n' "$*"; }
die() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}
cli() { coolify --context "$CTX" "$@"; }

BASE_URL=$(jq -er --arg c "$CTX" '.instances[] | select(.name == $c) | .fqdn' "$CFG") ||
  die "context '$CTX' not found in $CFG"
TOKEN=$(jq -er --arg c "$CTX" '.instances[] | select(.name == $c) | .token' "$CFG") ||
  die "no token for context '$CTX'"
api() {
  curl -sS --fail-with-body \
    -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -H 'Accept: application/json' "$@"
}

log "auth check: $CTX -> $BASE_URL"
cli server list --format json >"$OUT/servers.json" ||
  die "API token rejected. Create one at $BASE_URL/security/api-tokens and update the '$CTX' context."

SERVER_UUID="${SERVER_UUID:-}"
if [ -z "$SERVER_UUID" ]; then
  count=$(jq 'length' "$OUT/servers.json")
  [ "$count" -eq 1 ] || die "found $count servers; set SERVER_UUID to one of: $(jq -r '.[] | "\(.uuid)=\(.name)"' "$OUT/servers.json" | tr '\n' ' ')"
  SERVER_UUID=$(jq -r '.[0].uuid' "$OUT/servers.json")
fi
echo "server: $SERVER_UUID ($(jq -r --arg u "$SERVER_UUID" '.[] | select(.uuid == $u) | "\(.name) \(.ip)"' "$OUT/servers.json"))"

log "destination"
cli destination list --format json >"$OUT/destinations.json"
DESTINATION_UUID="${DESTINATION_UUID:-}"
if [ -z "$DESTINATION_UUID" ]; then
  dests=$(jq -r --arg s "$SERVER_UUID" '.[] | select(.server_uuid == $s) | .uuid' "$OUT/destinations.json")
  count=$(printf '%s\n' "$dests" | grep -c .)
  [ "$count" -eq 1 ] || die "found $count destinations on server; set DESTINATION_UUID"
  DESTINATION_UUID="$dests"
fi
echo "destination: $DESTINATION_UUID"

log "existing service check"
cli service list --format json >"$OUT/services.json"
if jq -e --arg n "$SERVICE_NAME" '.[] | select(.name == $n)' "$OUT/services.json" >/dev/null; then
  die "service '$SERVICE_NAME' already exists in context '$CTX'"
fi

log "project '$PROJECT_NAME'"
PROJECT_UUID=$(cli project list --format json | jq -r --arg n "$PROJECT_NAME" '.[] | select(.name == $n) | .uuid' | head -1)
if [ -z "$PROJECT_UUID" ]; then
  if [ "$DRY_RUN" = "--dry-run" ]; then
    echo "would create project '$PROJECT_NAME'"
    PROJECT_UUID="dry-run"
  else
    PROJECT_UUID=$(cli project create --name "$PROJECT_NAME" --format json | jq -er '.uuid')
  fi
fi
echo "project: $PROJECT_UUID"

log "create service '$SERVICE_NAME'"
COMPOSE_B64=$(base64 <"$HERE/docker-compose.yml" | tr -d '\n')
jq -n \
  --arg name "$SERVICE_NAME" --arg server "$SERVER_UUID" --arg dest "$DESTINATION_UUID" \
  --arg project "$PROJECT_UUID" --arg env "$ENV_NAME" --arg compose "$COMPOSE_B64" --arg url "$KONG_URL" \
  '{name: $name, description: "Supabase for movietable.ai", server_uuid: $server, destination_uuid: $dest,
    project_uuid: $project, environment_name: $env, docker_compose_raw: $compose, instant_deploy: false,
    urls: [{name: "supabase-kong", url: $url}]}' >"$OUT/create-payload.json"
if [ "$DRY_RUN" = "--dry-run" ]; then
  echo "dry run: payload written to $OUT/create-payload.json"
  exit 0
fi
if ! api -X POST "$BASE_URL/api/v1/services" --data @"$OUT/create-payload.json" >"$OUT/create-response.json"; then
  cat "$OUT/create-response.json"
  die "service creation failed"
fi
SVC=$(jq -er '.uuid' "$OUT/create-response.json") || {
  cat "$OUT/create-response.json"
  die "no uuid in response"
}
echo "service: $SVC  domains: $(jq -c '.domains' "$OUT/create-response.json")"

log "env sync from $HERE/service.env"
cli service env sync "$SVC" --file "$HERE/service.env"

log "supabase JWTs (Coolify leaves them empty when the JWT secret is generated later in the compose)"
cli service env list "$SVC" --format json -s >"$OUT/env-after.json"
if [ "$(jq -r '.[] | select(.key == "SERVICE_SUPABASEANON_KEY") | .value | length' "$OUT/env-after.json")" = "0" ]; then
  JWT_SECRET=$(jq -er '.[] | select(.key == "SERVICE_PASSWORD_JWT") | .value' "$OUT/env-after.json")
  eval "$(JWT_SECRET="$JWT_SECRET" bun run "$HERE/jwt.ts")"
  cli service env update "$SVC" SERVICE_SUPABASEANON_KEY --value "$ANON" --is-literal
  cli service env update "$SVC" SERVICE_SUPABASESERVICE_KEY --value "$SERVICE" --is-literal
fi

log "exclude one-shot minio-createbucket from status"
cli service get "$SVC" --format json >"$OUT/service.json"
cli service application update "$SVC" "$(jq -er '.applications[] | select(.name == "minio-createbucket") | .uuid' "$OUT/service.json")" --exclude-from-status >/dev/null

log "verify"
cli service env list "$SVC" --format json -s >"$OUT/env-after.json"
echo "env vars: $(jq 'length' "$OUT/env-after.json")"
for k in API_EXTERNAL_URL GOTRUE_SITE_URL ADDITIONAL_REDIRECT_URLS SERVICE_FQDN_SUPABASEKONG SERVICE_URL_SUPABASEKONG; do
  printf '  %-32s %s\n' "$k" "$(jq -r --arg k "$k" '.[] | select(.key == $k) | .value' "$OUT/env-after.json")"
done
for k in SERVICE_PASSWORD_JWT SERVICE_SUPABASEANON_KEY SERVICE_SUPABASESERVICE_KEY SERVICE_PASSWORD_64_SECRETKEYBASE SERVICE_PASSWORD_PGMETACRYPTO SERVICE_PASSWORD_LOGFLARE; do
  printf '  %-32s generated, %s chars\n' "$k" "$(jq -r --arg k "$k" '.[] | select(.key == $k) | .value | length' "$OUT/env-after.json")"
done
cli service storage list "$SVC" --format json >"$OUT/storage-after.json"
echo "file storages: $(jq '[.[] | select(.type == "file")] | length' "$OUT/storage-after.json") (expect 13)"
cli service get "$SVC" --format json >"$OUT/service.json"
jq -r '.applications[] | select(.fqdn != null and .fqdn != "") | "  fqdn \(.name) -> \(.fqdn)"' "$OUT/service.json"

log "start"
cli service start "$SVC"
for i in $(seq 1 30); do
  sleep 20
  status=$(cli service get "$SVC" --format json | jq -r '.status')
  echo "  [$i] $status"
  [ "$status" = "running:healthy" ] && break
done

log "done"
echo "service uuid: $SVC"
echo "API:    ${KONG_URL%:*}"
echo "Studio: ${KONG_URL%:*}/  (basic auth = SERVICE_USER_ADMIN / SERVICE_PASSWORD_ADMIN env vars)"
echo "Next: set SMTP_* env vars (or ENABLE_EMAIL_AUTOCONFIRM=true) and restart supabase-auth."
