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

## Pin the chap-core version

```bash
pnpm e2e:chap-core            # latest chap-core release
pnpm e2e:chap-core latest     # chap-core master
pnpm e2e:chap-core v2.1.0     # a specific chap-core release
```

Boots the stack on that version, then runs the suite. The frontend side is whatever is
checked out, so check out a release tag first to test a released frontend against a
released backend. Run `pnpm docker:e2e reset` when switching versions - the CHAP database
schema differs between them.

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
