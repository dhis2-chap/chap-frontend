#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

ENV_FILE_LOCAL="${DOCKER_DIR}/.env.local"
ENV_FILE_FALLBACK="${DOCKER_DIR}/.env.example"
COMPOSE_FILES=(-f "${DOCKER_DIR}/compose.chap.yml" -f "${DOCKER_DIR}/compose.dhis2.yml")
PROJECT_NAME="${COMPOSE_PROJECT_NAME:-chap-platform}"

compose() {
    local -a env_args=()
    if [ -f "${ENV_FILE_LOCAL}" ]; then
        env_args=(--env-file "${ENV_FILE_LOCAL}")
    elif [ -f "${ENV_FILE_FALLBACK}" ]; then
        env_args=(--env-file "${ENV_FILE_FALLBACK}")
    fi
    docker compose --project-name "${PROJECT_NAME}" "${env_args[@]}" "${COMPOSE_FILES[@]}" "$@"
}

usage() {
    cat <<EOF
Usage: $(basename "$0") [up|down|reset|ps|logs]

Default compose project name: ${PROJECT_NAME}
Override with: COMPOSE_PROJECT_NAME=<name>
Environment file priority: .env.local, then .env.example

Commands:
  up     Start CHAP + DHIS2 stack
  down   Stop stack containers
  reset  Stop stack and remove all stack volumes
  ps     Show service status
  logs   Stream logs for all services (or pass service names)
EOF
}

command="${1:-up}"
shift || true

case "${command}" in
up)
    compose up -d --remove-orphans "$@"
    compose ps
    ;;
down)
    compose down --remove-orphans "$@"
    ;;
reset)
    compose down --volumes --remove-orphans "$@"
    ;;
ps)
    compose ps "$@"
    ;;
logs)
    compose logs -f "$@"
    ;;
*)
    usage
    exit 1
    ;;
esac
