#!/usr/bin/env bash

set -euo pipefail

profile="${E2E_RESILIENCE_PROFILE:-combined}"
retries="${E2E_RESILIENCE_RETRIES:-1}"
workers="${E2E_RESILIENCE_WORKERS:-1}"
timeout_ms="${E2E_RESILIENCE_TIMEOUT_MS:-300000}"
dry_run="${E2E_RESILIENCE_DRY_RUN:-0}"
diagnostics_dir="${E2E_RESILIENCE_DIAGNOSTICS_DIR:-resilience-diagnostics}"
network_configured="false"

fail() {
    echo "e2e-resilience: $*" >&2
    exit 1
}

case "${profile}" in
poor-network)
    use_network="true"
    use_cpu_affinity="false"
    ;;
constrained-compute)
    use_network="false"
    use_cpu_affinity="true"
    ;;
combined)
    use_network="true"
    use_cpu_affinity="true"
    ;;
*)
    fail "unsupported profile '${profile}'"
    ;;
esac

[[ "${retries}" =~ ^[0-2]$ ]] || fail "retries must be 0, 1, or 2"
[[ "${workers}" =~ ^[1-4]$ ]] || fail "workers must be between 1 and 4"
[[ "${timeout_ms}" =~ ^[0-9]+$ ]] || fail "timeout must be an integer"
((timeout_ms >= 30000 && timeout_ms <= 600000)) ||
    fail "timeout must be between 30000 and 600000 milliseconds"
[[ "${dry_run}" == "0" || "${dry_run}" == "1" ]] ||
    fail "E2E_RESILIENCE_DRY_RUN must be 0 or 1"

test_command=(
    pnpm exec playwright test
    "--workers=${workers}"
    "--retries=${retries}"
    "--timeout=${timeout_ms}"
    "--reporter=line,html"
    "--trace=retain-on-failure"
)

cpu_id=""
if [[ "${use_cpu_affinity}" == "true" ]]; then
    if [[ "${dry_run}" == "0" ]]; then
        command -v taskset >/dev/null ||
            fail "taskset is required for the constrained-compute profile"
    fi

    if [[ "$(uname -s)" == "Linux" && -r /proc/self/status ]]; then
        allowed_cpu_list="$(awk '/^Cpus_allowed_list:/ { print $2 }' /proc/self/status)"
        first_cpu_range="${allowed_cpu_list%%,*}"
        cpu_id="${first_cpu_range%%-*}"
    elif [[ "${dry_run}" == "0" ]]; then
        fail "the constrained-compute profile requires Linux CPU affinity support"
    else
        cpu_id="0"
    fi

    [[ "${cpu_id}" =~ ^[0-9]+$ ]] || fail "unable to resolve an allowed CPU"
    test_command=(taskset --cpu-list "${cpu_id}" "${test_command[@]}")
fi

if [[ "${dry_run}" == "1" ]]; then
    printf 'profile=%s network=%s cpu=%s command=' \
        "${profile}" "${use_network}" "${use_cpu_affinity}"
    printf '%q ' "${test_command[@]}"
    printf '\n'
    exit 0
fi

[[ "$(uname -s)" == "Linux" ]] ||
    fail "resilience execution requires Linux; use E2E_RESILIENCE_DRY_RUN=1 elsewhere"

mkdir -p "${diagnostics_dir}"

cleanup() {
    if [[ "${network_configured}" == "true" ]]; then
        sudo tc qdisc del dev lo root >/dev/null 2>&1 || true
    fi
}
trap cleanup EXIT

{
    echo "profile=${profile}"
    echo "retries=${retries}"
    echo "workers=${workers}"
    echo "timeout_ms=${timeout_ms}"
    echo "cpu_affinity=${cpu_id:-none}"
    echo "recorded_at=$(date --utc +%Y-%m-%dT%H:%M:%SZ)"
    uname -a
    lscpu
    free -h
} > "${diagnostics_dir}/runtime.txt"

if [[ "${use_network}" == "true" ]]; then
    command -v tc >/dev/null || fail "tc is required for the poor-network profile"
    sudo -n true ||
        fail "passwordless sudo is required to configure loopback traffic control"

    existing_qdisc="$(tc qdisc show dev lo)"
    if ! grep -q 'qdisc noqueue.*root' <<< "${existing_qdisc}"; then
        fail "refusing to replace an existing loopback queue discipline: ${existing_qdisc}"
    fi

    sudo tc qdisc add dev lo root netem \
        delay 150ms 30ms 25% distribution normal \
        loss random 0.5% 25% \
        rate 1600kbit
    network_configured="true"
    sudo tc qdisc show dev lo > "${diagnostics_dir}/network.txt"
fi

printf 'Running: '
printf '%q ' "${test_command[@]}"
printf '\n'
"${test_command[@]}"
