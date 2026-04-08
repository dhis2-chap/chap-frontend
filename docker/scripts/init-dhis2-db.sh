#!/usr/bin/env bash

set -euo pipefail

DUMP_FILE="/opt/dhis2-dump/dhis2-demo.dump.gz"

if [ ! -f "${DUMP_FILE}" ]; then
    echo "DHIS2 init dump not found at ${DUMP_FILE}"
    exit 1
fi

echo "Importing DHIS2 dump from ${DUMP_FILE} (continuing on SQL errors)"
gunzip -c "${DUMP_FILE}" \
    | psql --username "${POSTGRES_USER}" --dbname "${POSTGRES_DB}" --set ON_ERROR_STOP=0

echo "DHIS2 import completed"
