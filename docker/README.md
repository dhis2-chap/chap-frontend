# Docker E2E Stack: Need to Know

## What it starts
- CHAP services (`compose.chap.yml`)
- DHIS2 services (`compose.dhis2.yml`)
- One-shot DHIS2 analytics + CHAP route creation job

## Run
From repo root:

```bash
pnpm docker:e2e up --wait
```

Without waiting:

```bash
pnpm docker:e2e up
```

Wait only:

```bash
pnpm docker:e2e ready
```

## Stop and reset
```bash
pnpm docker:e2e down
pnpm docker:e2e reset
```

## Configuration
- Env file priority: `docker/.env.local` then `docker/.env.example`
- Default compose project: `chap-platform` (override with `COMPOSE_PROJECT_NAME`)
- Common local overrides in `docker/.env.local`:
  - `CHAP_PORT`
  - `DHIS2_PORT`
  - `DHIS2_DB_DUMP_URL`
  - `DHIS2_ANALYTICS_USERNAME`
  - `DHIS2_ANALYTICS_PASSWORD`
  - `DHIS2_ANALYTICS_LAST_YEARS`
  - `DHIS2_ROUTE_NAME`
  - `DHIS2_ROUTE_CODE`
  - `DHIS2_ROUTE_URL`
