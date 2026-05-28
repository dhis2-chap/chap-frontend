---
name: write-e2e-tests
description: Write or review concise, high-value Playwright end-to-end tests for chap-frontend. Use when adding e2e coverage, improving test quality, reducing mocks, creating realistic test data, debugging brittle e2e setup, or reviewing e2e tests for critical user flows.
---

# Write E2E Tests

Use this skill to add a small number of high-signal e2e tests that cover the critical behavior of a branch without turning the suite into an exhaustive checklist.

## Principles

- Prefer one or two excellent tests over many narrow tests.
- Cover the critical user flows and integration points that would break the feature for real users.
- Avoid testing every small UI detail, every validation branch, or implementation plumbing.
- Mock only when it is absolutely necessary. Prefer real UI/API interactions and realistic data.
- Do not rely on optional pre-existing CHAP data. Programmatically create CHAP data needed by the test.
- For stable DHIS2 fixture metadata, such as known data elements or org units, hardcode IDs/codes instead of rediscovering them in every test.
- Do not hardcode CHAP resource IDs created by previous runs. Create those resources for the test run.
- Do not add cleanup for ephemeral test instances unless lingering data can break later assertions. Prefer unique names.
- Use generated/shared types from the codebase instead of inventing local response/request types.
- Keep helper functions few and meaningful. Extract reusable setup into helper files, but inline one-off test actions.

## Workflow

1. Read the branch diff and identify the main user-facing behavior.
2. Pick the smallest set of e2e tests that covers roughly 90% of the risk.
3. Check existing e2e specs for app conventions, selectors, auth setup, and API helpers.
4. Prefer creating prerequisite data via API when UI setup would make the test slow or noisy.
5. Exercise the branch behavior through the UI when that is what users depend on.
6. Use `page.waitForResponse` for the specific API call that proves the action happened.
7. Poll asynchronous jobs explicitly until completion before continuing.
8. Keep assertions focused on durable outcomes: navigation, persisted names, enabled critical actions, job creation, or visible status.
9. Run focused e2e tests, lint, and typecheck after changes.

## Data Setup

- If a test needs an evaluation, create one with the naive model through the same CHAP endpoint the app uses.
- Build the request payload from real DHIS2 analytics and org unit geojson data.
- Poll the created evaluation job until it reaches `SUCCESS`, then load the created backtest from `database_result`.
- If the job reaches `FAILURE` or `REVOKED`, include job logs in the thrown error.
- Use unique names such as `E2E <thing> ${Date.now()}` so lingering records do not collide.
- For local credentials, use the existing Playwright auth setup and environment variables. Confirm the active stack when needed; do not bake credentials into tests or skill files.

## Mocking

Only mock when the mock is the behavior being tested or when an external system cannot reasonably be used. Good examples:

- Client-side validation tests that must assert no network request happens.
- Browser-only failures that cannot be triggered reliably against the real service.

Avoid mocks for critical creation, persistence, navigation, job, and API integration flows.

## Helper Shape

- Put heavyweight setup, such as creating a completed evaluation, in a separate helper file.
- Keep helpers close to the e2e folder unless they are useful outside e2e tests.
- Export only what the specs need.
- Prefer hardcoded stable fixture IDs over helper functions that search DHIS2 metadata.
- Avoid wrappers that merely rename Playwright methods.

## Review Checklist

- Does the test fail if the critical feature is broken?
- Does it avoid assuming a suitable evaluation already exists in the database?
- Does it use real CHAP API/UI behavior rather than broad route mocks?
- Are generated/shared types used where available?
- Are selectors stable, preferably `data-test` or accessible roles?
- Are async jobs polled rather than handled with blind sleeps?
- Is the amount of helper code smaller than the behavior it protects?
- Are assertions durable and user-meaningful?
- Are credentials and environment-specific secrets kept out of committed files?
