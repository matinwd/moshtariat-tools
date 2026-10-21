#!/usr/bin/env bash
# Deploys moshtariat-tools to the production host over SSH.
# Real infrastructure values come from deploy/production.env (gitignored).
# Usage: ./deploy/deploy.sh [build|up|route|unroute|down|status|smoke]
set -euo pipefail

cd "$(dirname "$0")/.."
ENV_FILE=deploy/production.env
if [[ ! -f $ENV_FILE ]]; then
  echo "missing $ENV_FILE — copy deploy/production.env.example and fill it" >&2
  exit 1
fi
# shellcheck source=/dev/null
source "$ENV_FILE"

: "${SSH_HOST:?}" "${DOCKER_BIN:?}" "${TOOLS_EDGE_NETWORK:?}" "${PROXY_CONTAINER:?}" "${PROXY_CONF:?}"
TAG="${TOOLS_TAG:-$(git rev-parse --short HEAD)}"
REMOTE_DIR="${REMOTE_DIR:-~/moshtariat-tools}"
DOCKER="env DOCKER_HOST=unix:///run/user/\$(id -u)/moshtariat-docker.sock $DOCKER_BIN"

remote() { ssh "$SSH_HOST" "$@"; }

case "${1:-status}" in
  build)
    if remote "test -d $REMOTE_DIR/.git"; then
      remote "git -C $REMOTE_DIR fetch -q origin && git -C $REMOTE_DIR checkout -q $(git rev-parse HEAD)"
    else
      remote "git clone -q https://github.com/matinwd/moshtariat-tools $REMOTE_DIR"
    fi
    remote "cd $REMOTE_DIR && $DOCKER build -t moshtariat-tools:$TAG -t moshtariat-tools:latest --build-arg GIT_SHA=\$(git rev-parse HEAD) --build-arg BUILD_DATE=\$(date -u +%FT%TZ) ."
    ;;

  up)
    remote "cd $REMOTE_DIR && printf 'TOOLS_EDGE_NETWORK=%s\nTOOLS_TAG=%s\n' '$TOOLS_EDGE_NETWORK' '$TAG' > .env && $DOCKER compose up -d && sleep 2 && $DOCKER ps --filter name=moshtariat-tools-web --format '{{.Names}} {{.Status}}'"
    remote "$DOCKER exec moshtariat-tools-web nginx -t"
    ;;

  route)
    scp -q deploy/route-block.conf deploy/apply_route.py "$SSH_HOST:/tmp/"
    remote "cp $PROXY_CONF /tmp/proxy-default.conf.bak-\$(date +%Y%m%d%H%M%S) && python3 /tmp/apply_route.py install $PROXY_CONF /tmp/route-block.conf && $DOCKER exec $PROXY_CONTAINER nginx -t && $DOCKER exec $PROXY_CONTAINER nginx -s reload && echo reloaded"
    ;;

  unroute)
    scp -q deploy/apply_route.py "$SSH_HOST:/tmp/"
    remote "python3 /tmp/apply_route.py remove $PROXY_CONF && $DOCKER exec $PROXY_CONTAINER nginx -t && $DOCKER exec $PROXY_CONTAINER nginx -s reload && echo reloaded"
    ;;

  down)
    remote "cd $REMOTE_DIR && $DOCKER compose down"
    ;;

  smoke)
    for url in 'https://moshtariat.ir/tools/' 'https://moshtariat.ir/tools/ras-cheque' 'https://moshtariat.ir/tools/proforma-invoice' 'https://moshtariat.ir/tools/installment' 'https://moshtariat.ir/tools/discount' 'https://moshtariat.ir/tools/vat' 'https://moshtariat.ir/tools/markup-margin' 'https://moshtariat.ir/tools/break-even' 'https://moshtariat.ir/tools/sitemap.xml'; do
      code=$(curl -sS -o /dev/null -w '%{http_code}' "$url")
      echo "$code $url"
    done
    code=$(curl -sS -o /dev/null -w '%{http_code} -> %{redirect_url}' 'https://moshtariat.ir/tools/vat/')
    echo "$code  (trailing-slash redirect)"
    code=$(curl -sS -o /dev/null -w '%{http_code}' 'https://moshtariat.ir/')
    echo "$code https://moshtariat.ir/  (main site regression)"
    code=$(curl -sS -o /dev/null -w '%{http_code}' 'https://moshtariat.ir/tools/no-such-page')
    echo "$code https://moshtariat.ir/tools/no-such-page  (404 expected)"
    ;;

  status)
    remote "$DOCKER ps --filter name=moshtariat-tools-web --format '{{.Names}} {{.Status}} {{.Image}}'; grep -c 'moshtariat-tools route' $PROXY_CONF || true"
    ;;

  *)
    echo "usage: $0 [build|up|route|unroute|down|smoke|status]" >&2; exit 1;;
esac
