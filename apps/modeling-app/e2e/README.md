# E2E tests for modeling-app

Prerequisites:
- DHIS2 running (default: `http://localhost:8080`)
- CHAP backend running
- Frontend running (default: `http://localhost:3000`)

## Start the local backend stack (CHAP + DHIS2)

From the repository root:

```bash
pnpm docker:e2e up
```

To block until the stack is ready (useful in CI), run:

```bash
pnpm docker:e2e up --wait
```

This command runs both docker compose files:
- `docker/compose.chap.yml` (CHAP stack)
- `docker/compose.dhis2.yml` (DHIS2 stack)

`dhis2-db-dump` (one-shot service) ensures the DHIS2 demo dump exists before the DB starts.
On first run (empty DB volume), `dhis2-db` imports the dump via `docker/scripts/init-dhis2-db.sh` using `psql --set ON_ERROR_STOP=0`, then reuses the same DB volume on subsequent starts.
`dhis2-analytics` (one-shot service) then triggers analytics table generation after DHIS2 is healthy and creates a DHIS2 API route (`code=chap`) for CHAP.
DHIS2 uses `docker/dhis.conf` for DB connection settings in this local stack.
If you want to reseed from scratch, run:

```bash
pnpm docker:e2e reset
```

If ports are already in use locally, set `CHAP_PORT` and/or `DHIS2_PORT` in `docker/.env.local`.
`pnpm docker:e2e ...` uses `docker/.env.local` when present, otherwise `docker/.env.example`.

Useful commands:

```bash
pnpm docker:e2e down
pnpm docker:e2e reset
```

## Commands

```bash
pnpm e2e
pnpm e2e:ci
```

## Environment variables

Optional overrides:
- `E2E_APP_URL`
- `E2E_DHIS2_BASE_URL`
- `E2E_DHIS2_USERNAME`
- `E2E_DHIS2_PASSWORD`
