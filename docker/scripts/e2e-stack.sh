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
Usage: $(basename "$0") [up|down|reset|ps|logs|ready]

Default compose project name: ${PROJECT_NAME}
Override with: COMPOSE_PROJECT_NAME=<name>
Environment file priority: .env.local, then .env.example

Commands:
  up     Start CHAP + DHIS2 stack (pass --wait to block until ready)
  down   Stop stack containers
  reset  Stop stack and remove all stack volumes
  ps     Show service status
  logs   Stream logs for all services (or pass service names)
  ready  Wait for CHAP + DHIS2 + analytics route readiness
EOF
}

wait_url() {
    local name="$1"
    local url="$2"
    local max_seconds="${3:-900}"
    local waited=0

    until curl --silent --fail "$url" >/dev/null; do
        if [ "$waited" -ge "$max_seconds" ]; then
            echo "Timed out waiting for $name at $url"
            return 1
        fi
        sleep 5
        waited=$((waited + 5))
    done

    echo "$name is ready ($url)"
}

wait_for_analytics_job() {
    local max_seconds="${1:-300}"
    local waited=0
    local status_log_interval_seconds=30
    local service_log_interval_seconds=120
    local next_status_log_at=0
    local next_service_log_at="${service_log_interval_seconds}"
    local last_reported_state=""

    echo "Waiting for dhis2-analytics to complete (timeout: ${max_seconds}s)"

    while true; do
        local analytics_container_id
        local analytics_state="not-created"
        analytics_container_id="$(compose ps -q dhis2-analytics | tr -d '\n')"

        if [ -n "${analytics_container_id}" ]; then
            analytics_state="$(docker inspect --format '{{.State.Status}} {{.State.ExitCode}}' "${analytics_container_id}" 2>/dev/null || true)"
        fi

        if [[ "${analytics_state}" != "${last_reported_state}" || "${waited}" -ge "${next_status_log_at}" ]]; then
            echo "dhis2-analytics status: ${analytics_state} (waited ${waited}s/${max_seconds}s)"
            last_reported_state="${analytics_state}"
            next_status_log_at=$((waited + status_log_interval_seconds))
        fi

        if [[ "${waited}" -ge "${next_service_log_at}" ]]; then
            echo "Recent dhis2-analytics logs:"
            compose logs --no-color --tail=30 dhis2-analytics || true
            next_service_log_at=$((waited + service_log_interval_seconds))
        fi

        if [[ "${analytics_state}" == "exited 0" ]]; then
            echo "dhis2-analytics completed successfully"
            return 0
        fi

        if [[ "${analytics_state}" =~ ^exited\ [1-9][0-9]*$ ]]; then
            echo "dhis2-analytics failed (state: ${analytics_state})"
            compose logs --no-color dhis2-analytics || true
            return 1
        fi

        if [ "$waited" -ge "$max_seconds" ]; then
            echo "Timed out waiting for dhis2-analytics to complete"
            echo "Current compose service status:"
            compose ps || true
            compose logs --no-color dhis2-analytics || true
            return 1
        fi

        sleep 5
        waited=$((waited + 5))
    done
}

get_host_port() {
    local service="$1"
    local container_port="$2"
    local mapped
    mapped="$(compose port "${service}" "${container_port}" 2>/dev/null | tail -n 1 | tr -d '\r')"

    if [ -z "${mapped}" ]; then
        echo "Unable to resolve published port for ${service}:${container_port}" 1>&2
        return 1
    fi

    printf '%s\n' "${mapped##*:}"
}

wait_for_stack_ready() {
    local chap_port
    local dhis2_port

    chap_port="$(get_host_port chap 8000)"
    dhis2_port="$(get_host_port dhis2-web 8080)"

    wait_url "CHAP health" "http://localhost:${chap_port}/health" 900
    wait_url "DHIS2 login page" "http://localhost:${dhis2_port}/dhis-web-login" 1800
    wait_for_analytics_job 300
}

command="${1:-up}"
shift || true

case "${command}" in
up)
    wait_after_up="false"
    up_args=()
    for arg in "$@"; do
        if [[ "${arg}" == "--wait" ]]; then
            wait_after_up="true"
            continue
        fi
        up_args+=("${arg}")
    done

    compose up -d --remove-orphans "${up_args[@]}"
    compose ps

    if [[ "${wait_after_up}" == "true" ]]; then
        wait_for_stack_ready
    fi
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
ready)
    wait_for_stack_ready
    ;;
*)
    usage
    exit 1
    ;;
esac
