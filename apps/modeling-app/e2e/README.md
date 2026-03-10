# Modeling App E2E: Need to Know

## How it works
- Playwright runs a `setup` project first (`auth.setup.ts`) to log in and save auth state to `playwright/.auth/user.json`.
- All `*.spec.ts` tests run in the `chromium` project and reuse that auth state.

## Run locally
From repo root:

```bash
pnpm docker:e2e up --wait
pnpm e2e
```

Headless run:

```bash
pnpm e2e:ci
```

## Stack control
```bash
pnpm docker:e2e down
pnpm docker:e2e reset
```

## Optional overrides
- `E2E_APP_URL` (default: `http://localhost:3000`)
- `E2E_DHIS2_BASE_URL` (default: `http://localhost:8080`)
- `E2E_DHIS2_USERNAME` (default: `system`)
- `E2E_DHIS2_PASSWORD` (default: `S&stem123!`)
