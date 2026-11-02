# Modeling App E2E: Need to Know

## How it works
- Playwright runs a `setup` project first (`auth.setup.ts`) to log in and save auth state to `playwright/.auth/user.json`.
- Specs reuse that auth state in the `chromium` project. The `settings` project runs afterward because it temporarily changes installation-wide defaults, restoring them after the test.

To run only the settings test, authenticate with `pnpm exec playwright test --project=setup`, then run `pnpm exec playwright test --project=settings --no-deps`.

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
- `E2E_DHIS2_PASSWORD` (default: `System123`)
