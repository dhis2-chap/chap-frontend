# E2E tests for modeling-app

Prerequisites:
- DHIS2 running (default: `http://localhost:8080`)
- CHAP backend running
- Frontend running (default: `http://localhost:3000`)

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
