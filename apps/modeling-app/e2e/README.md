# Modeling App E2E: Need to Know

## How it works
- Playwright runs a `setup` project first (`auth.setup.ts`) to log in and save auth state to `playwright/.auth/user.json`.
- All `*.spec.ts` tests run in the `chromium` project and reuse that auth state.
- Tests that need CHAP records create uniquely named data for the run instead of relying on optional pre-existing records.

## What "coverage" means here

Playwright can collect Chromium JavaScript execution coverage through the Chrome
DevTools Protocol. That number is browser/code coverage: it shows which shipped
JavaScript bytes or functions executed. It excludes CHAP and DHIS2 backend code,
is sensitive to bundling and source maps, and does not show whether an important
user outcome was asserted. It is therefore not a meaningful statistical target
for this end-to-end suite.

We measure end-to-end coverage as a small inventory of critical user journeys.
A journey counts as live integration coverage when the test drives the UI,
uses the real DHIS2/CHAP stack, and asserts a durable outcome such as persisted
data, navigation, or a created job. Use the discovered test list as the
reproducible count:

```bash
pnpm exec playwright test --list
```

### Baseline

Before the evaluation-management tests were added on 2026-07-25, Playwright
discovered 10 tests in 5 files: 1 authentication setup and 9 application tests.

| Critical area | Baseline evidence |
| --- | --- |
| Authentication and evaluations entry point | Auth setup plus evaluations table smoke test |
| New evaluation | Period validation, unsaved-change guard, and a live import that reaches a successful job |
| Evaluation details | A completed live evaluation opens and creates a prediction setup |
| Evaluation comparison | Not covered |
| Prediction setup | A live prediction starts and appears in scoped activity |
| Models | Archived-model filtering uses a model created and archived through the live API |
| Evaluation lifecycle management | Not covered |

The two focused client-side validation tests in `new-evaluation-form.spec.ts`
stub only the create-backtest response so they do not create data; they count as
form behavior coverage, not live integration coverage. The evaluation-management
spec closes the lifecycle gap with live rename-persistence and delete journeys,
and the evaluation-comparison spec covers live compatible selection, chart data,
and URL restoration. Together they bring the discovered inventory to 13 tests:
1 setup and 12 application tests.

Important remaining gaps include configured-model creation, prediction
result/import, and environment-changing settings. Add coverage there only when
the live-data setup and assertions can be reliable.

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
