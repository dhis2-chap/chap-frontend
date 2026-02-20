#!/usr/bin/env bash

set -euo pipefail

CREDENTIALS="$USERNAME:$PASSWORD"
LAST_YEARS="${DHIS2_ANALYTICS_LAST_YEARS}"
POLL_INTERVAL_SECONDS="${DHIS2_ANALYTICS_POLL_INTERVAL_SECONDS}"
MAX_TRIES="${DHIS2_ANALYTICS_MAX_POLL_TRIES}"
ROUTE_NAME="${DHIS2_ROUTE_NAME}"
ROUTE_CODE="${DHIS2_ROUTE_CODE}"
ROUTE_URL="${DHIS2_ROUTE_URL}"
ANALYTICS_TRIGGER_RESPONSE_FILE="/tmp/dhis2-analytics-trigger-response.json"
ROUTE_CREATE_RESPONSE_FILE="/tmp/dhis2-route-create-response.json"

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

echo "Creating DHIS2 route '${ROUTE_CODE}' -> '${ROUTE_URL}'" 1>&2

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
