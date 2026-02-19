#!/usr/bin/env bash

set -euo pipefail

CREDENTIALS="$USERNAME:$PASSWORD"
LAST_YEARS="${DHIS2_ANALYTICS_LAST_YEARS:-1}"
POLL_INTERVAL_SECONDS="${DHIS2_ANALYTICS_POLL_INTERVAL_SECONDS:-5}"
MAX_TRIES="${DHIS2_ANALYTICS_MAX_POLL_TRIES:-360}"
ROUTE_NAME="${DHIS2_ROUTE_NAME:-Chap Modeling App}"
ROUTE_CODE="${DHIS2_ROUTE_CODE:-chap}"
ROUTE_URL="${DHIS2_ROUTE_URL:-http://chap:8000/**}"
ANALYTICS_TRIGGER_RESPONSE_FILE="/tmp/dhis2-analytics-trigger-response.json"
ROUTE_CREATE_RESPONSE_FILE="/tmp/dhis2-route-create-response.json"
ROUTE_QUERY_RESPONSE_FILE="/tmp/dhis2-route-query-response.json"
ROUTE_UPSERT_RESPONSE_FILE="/tmp/dhis2-route-upsert-response.json"

ANALYTICS_TRIGGER_STATUS=$(
    curl --silent --show-error \
        --output "${ANALYTICS_TRIGGER_RESPONSE_FILE}" \
        --write-out "%{http_code}" \
        --user "$CREDENTIALS" \
        --request POST \
        "$BASE_URL/api/resourceTables/analytics?skipTrackedEntities=true&lastYears=${LAST_YEARS}"
)

if [[ "${ANALYTICS_TRIGGER_STATUS}" != "200" && "${ANALYTICS_TRIGGER_STATUS}" != "201" ]]; then
    echo "Failed to trigger analytics table generation; expected HTTP 200/201, got ${ANALYTICS_TRIGGER_STATUS}" 1>&2
    cat "${ANALYTICS_TRIGGER_RESPONSE_FILE}" 1>&2 || true
    exit 1
fi

RELATIVE_POLL_ENDPOINT=$(jq -r '.response.relativeNotifierEndpoint // empty' "${ANALYTICS_TRIGGER_RESPONSE_FILE}")

if [[ -z "$RELATIVE_POLL_ENDPOINT" ]]; then
    echo "Unable to start analytics table generation" 1>&2
    cat "${ANALYTICS_TRIGGER_RESPONSE_FILE}" 1>&2 || true
    exit 1
fi

POLL_URL="$BASE_URL$RELATIVE_POLL_ENDPOINT"
TRIES=0

while true; do
    TRIES=$((TRIES + 1))
    COMPLETED=$(curl -fsSL --user "$CREDENTIALS" "$POLL_URL" | jq '. | any(.completed == true)')
    if [[ "$COMPLETED" == "true" ]]; then
        echo "Analytics table generation complete" 1>&2
        break
    elif test "$TRIES" -ge "$MAX_TRIES"; then
        echo "Analytics table generation timed out" 1>&2
        exit 1
    else
        echo "Polling analytics table generation status"
    fi
    sleep "$POLL_INTERVAL_SECONDS"
done

echo "Ensuring DHIS2 route '${ROUTE_CODE}' points to '${ROUTE_URL}'" 1>&2

# The demo dump can already contain a `chap` route with url=null. In that case,
# POST /api/routes may fail (409) and the stack will look "ready" but CHAP calls will fail.
# Upsert by code: update existing route if present, otherwise create.
ROUTE_QUERY_STATUS=$(
    curl --silent --show-error \
        --output "${ROUTE_QUERY_RESPONSE_FILE}" \
        --write-out "%{http_code}" \
        --user "$CREDENTIALS" \
        "$BASE_URL/api/routes?filter=code:eq:${ROUTE_CODE}&fields=id,code,url&paging=false"
)

if [[ "${ROUTE_QUERY_STATUS}" != "200" ]]; then
    echo "Failed to query DHIS2 routes; expected HTTP 200, got ${ROUTE_QUERY_STATUS}" 1>&2
    cat "${ROUTE_QUERY_RESPONSE_FILE}" 1>&2 || true
    exit 1
fi

EXISTING_ROUTE_ID="$(jq -r '.routes[0].id // empty' "${ROUTE_QUERY_RESPONSE_FILE}")"
EXISTING_ROUTE_URL="$(jq -r '.routes[0].url // empty' "${ROUTE_QUERY_RESPONSE_FILE}")"

if [[ -n "${EXISTING_ROUTE_ID}" ]]; then
    echo "Found existing route id=${EXISTING_ROUTE_ID} url=${EXISTING_ROUTE_URL:-<empty>}" 1>&2

    UPSERT_ROUTE_STATUS=$(
        curl --silent --show-error \
            --output "${ROUTE_UPSERT_RESPONSE_FILE}" \
            --write-out "%{http_code}" \
            --user "$CREDENTIALS" \
            --header "Content-Type: application/json" \
            --request PUT \
            --data "{
                \"id\": \"${EXISTING_ROUTE_ID}\",
                \"name\": \"${ROUTE_NAME}\",
                \"code\": \"${ROUTE_CODE}\",
                \"url\": \"${ROUTE_URL}\",
                \"authorities\": [\"F_CHAP_MODELING_APP\"],
                \"headers\": {
                    \"Content-Type\": \"application/json\"
                },
                \"responseTimeoutSeconds\": 30
            }" \
            "$BASE_URL/api/routes/${EXISTING_ROUTE_ID}"
    )

    if [[ "${UPSERT_ROUTE_STATUS}" != "200" ]]; then
        echo "Failed to update DHIS2 route; expected HTTP 200, got ${UPSERT_ROUTE_STATUS}" 1>&2
        cat "${ROUTE_UPSERT_RESPONSE_FILE}" 1>&2 || true
        exit 1
    fi

    echo "DHIS2 route '${ROUTE_CODE}' updated (HTTP 200)" 1>&2
else
    CREATE_ROUTE_STATUS=$(
        curl --silent --show-error \
            --output "${ROUTE_CREATE_RESPONSE_FILE}" \
            --write-out "%{http_code}" \
            --user "$CREDENTIALS" \
            --header "Content-Type: application/json" \
            --request POST \
            --data "{
                \"name\": \"${ROUTE_NAME}\",
                \"code\": \"${ROUTE_CODE}\",
                \"url\": \"${ROUTE_URL}\",
                \"authorities\": [\"F_CHAP_MODELING_APP\"],
                \"headers\": {
                    \"Content-Type\": \"application/json\"
                },
                \"responseTimeoutSeconds\": 30
            }" \
            "$BASE_URL/api/routes"
    )

    if [[ "$CREATE_ROUTE_STATUS" != "201" ]]; then
        echo "Failed to create DHIS2 route; expected HTTP 201, got ${CREATE_ROUTE_STATUS}" 1>&2
        cat "${ROUTE_CREATE_RESPONSE_FILE}" 1>&2 || true
        exit 1
    fi

    echo "DHIS2 route '${ROUTE_CODE}' created (HTTP 201)" 1>&2
fi

# Verify final route url is non-null and matches our target.
VERIFY_STATUS=$(
    curl --silent --show-error \
        --output "${ROUTE_QUERY_RESPONSE_FILE}" \
        --write-out "%{http_code}" \
        --user "$CREDENTIALS" \
        "$BASE_URL/api/routes?filter=code:eq:${ROUTE_CODE}&fields=id,code,url&paging=false"
)
if [[ "${VERIFY_STATUS}" != "200" ]]; then
    echo "Failed to verify DHIS2 routes; expected HTTP 200, got ${VERIFY_STATUS}" 1>&2
    cat "${ROUTE_QUERY_RESPONSE_FILE}" 1>&2 || true
    exit 1
fi

FINAL_URL="$(jq -r '.routes[0].url // empty' "${ROUTE_QUERY_RESPONSE_FILE}")"
if [[ -z "${FINAL_URL}" || "${FINAL_URL}" == "null" ]]; then
    echo "Route '${ROUTE_CODE}' url is still empty/null after upsert" 1>&2
    cat "${ROUTE_QUERY_RESPONSE_FILE}" 1>&2 || true
    exit 1
fi
echo "Route '${ROUTE_CODE}' url now set to: ${FINAL_URL}" 1>&2
