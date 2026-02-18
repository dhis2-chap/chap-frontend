# Docker stack for modeling app e2e

This folder uses a layered Docker Compose setup:

- `compose.chap.yml`: CHAP services
- `compose.dhis2.yml`: DHIS2 services
- `dhis.conf`: DHIS2 database connection configuration (mounted into `dhis2-web`)

The e2e stack uses compose project name `chap-platform` by default (so resources are prefixed `chap-platform` instead of `docker`).
You can override it by setting `COMPOSE_PROJECT_NAME`.

## Start the full stack

From the repository root:

```bash
./docker/scripts/e2e-stack.sh up
```

or:

```bash
pnpm docker:e2e up
```

## Stop/reset

```bash
pnpm docker:e2e down
pnpm docker:e2e reset
```

## Demo database seed behavior

`dhis2-db-dump` is a one-shot service that downloads `DHIS2_DB_DUMP_URL` if needed and writes `dhis2-demo.dump.gz`.
On first start (empty DB volume), `dhis2-db` runs `docker/scripts/init-dhis2-db.sh` and imports that dump with:

- `psql --set ON_ERROR_STOP=0`

This allows the seed to continue if the dump includes `DROP ...` statements for objects that do not exist in the fresh database.

## Analytics generation

`dhis2-analytics` is a one-shot service (same pattern as push-analytics) that:

- triggers analytics table generation once `dhis2-web` is healthy
- creates an API route in DHIS2 by posting to `/api/routes`
- fails unless route creation returns HTTP `201 Created`

It uses:

- `DHIS2_ANALYTICS_USERNAME`
- `DHIS2_ANALYTICS_PASSWORD`
- `DHIS2_ANALYTICS_LAST_YEARS`
- `DHIS2_ROUTE_NAME`
- `DHIS2_ROUTE_CODE`
- `DHIS2_ROUTE_URL`

`dhis.conf` currently targets `dhis2-db` with database `dhis2` and user/password `dhis`.

To force a fresh DHIS2 DB import, run:

```bash
pnpm docker:e2e reset
```

The stack uses `docker/.env.local` when present, otherwise falls back to `docker/.env.example`.
If port `8000` is already used, set `CHAP_PORT` in `docker/.env.local`.
If port `8080` is already used, set `DHIS2_PORT` in `docker/.env.local`.
