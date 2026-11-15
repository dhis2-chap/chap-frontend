# Aligning the modeling app with Chap blocks

The UI/core layer is a modest migration because Chap blocks already contains extracted versions of the modeling
app's components. Moving the full workflows needs more work: the two repositories have diverged since extraction,
and their connection, cache and settings behavior differs.

This draft uses blocks in 111 modeling-app source files. It consumes the public repository as a pinned submodule,
following its source-workspace distribution model. The pin includes the additive changes in
[chap-blocks #1](https://github.com/dhis2-chap/chap-blocks/pull/1); merge that PR and update this pin to the resulting
main commit before merging this draft if the companion is squash-merged.

## What this draft reuses

| Area | Shared blocks | Host responsibility |
| --- | --- | --- |
| Layout and navigation | Card, Widget, Pill, Tag, StatusIndicator, OverflowButton, Sidenav family | Routes, breadcrumbs, feature flags, sidebar state |
| Period selection | PeriodPicker, PeriodRangeField, core calendar/period helpers | DHIS2 calendar settings, form state and validation |
| Evaluation and forecast charts | ResultPlot, ComparisonPlotList, UncertaintyAreaChart | Fetching, filters, selected locations and signal evidence |
| Prediction maps and tables | PredictionMap, PredictionTable, geometry parsing | DHIS2 geometry query and explicit existing basemap configuration |
| Performance monitoring | MonitoringChart and monitoringSeries | Metric/baseline selection, query, loading and errors |
| Outbreak scores | OutbreakMetricsTable | Policy selection, scores/catalog queries, baseline comparison and metric-help tooltips |
| Search | SearchField on models and prediction setups | URL filters and archived-model selection |
| Transformations | Public DOM-free `@chap-blocks/ui/utils` | Current generated API services and workflow hooks |

The app no longer directly depends on `@dhis2-chap/core`. `@dhis2-chap/ui` remains for the current generated API,
DHIS2 route/settings integration and the recent signal-review table. Other applications in this monorepo still use
the existing shared packages, so their implementation is retained. This is a consumption migration, not deletion of
all duplicated code across both repositories.

The host keeps its DHIS2 App Platform shell and Vite/MDX configuration. React, ReactDOM, React Query and Highcharts
are deduplicated; the modeling app uses Highcharts 11.4.9 to match the blocks. Map workers stay out of development
prebundling. Every install/build CI checkout initializes submodules. Turbo's dependency graph includes the source
inputs of the three imported block packages even though those packages have no build script. The root
`package.json` workspaces remain limited to host apps/packages, so Changesets does not version the vendored packages.

## Work still needed for full workflow reuse

| Work | Why it matters | Rough effort, one engineer |
| --- | --- | --- |
| Review and harden this UI/core draft | Review browser behavior, bundle size, shared string extraction/localization, clean-checkout CI and the companion pin | 3–5 days |
| Bring modeling blocks up to current frontend behavior | Extraction baseline is `1662146d` (2026-11-03), with monitoring selectively ported. Port later API contracts, dataset columnar upload, signal evidence/approval/filtering and fixes before replacing pages | 3–5 days |
| Add a DHIS2 runtime adapter | Allow a host-owned Chap client/query cache, data engine, settings store and notifications; preserve route credentials, retries and request queuing | 3–5 days |
| Replace domain screens in stages | Datasets/models/jobs first, then evaluations/benchmarks and prediction workflows; verify navigation and cache invalidation across pages | 2–4 days |
| Final regression and cleanup | End-to-end checks, translated UI, dependency/bundle review, remove obsolete host components where no other app needs them | 2–3 days |

These are planning estimates, not measured implementation times: approximately 3–5 engineer-days to finish this
stage and 2–4 engineer-weeks total to make the modeling app mostly a shell around shared workflows, with overlapping
review work. Assumes one engineer familiar with the app and a working Chap/DHIS2 test environment. No backend rewrite
is implied. A full replacement of DHIS2 UI primitives is not required: Chap blocks itself uses DHIS2 UI.

In particular, dropping the existing pages under a nested `ChapProvider` is not sufficient. It creates another query
cache, so mutations would not refresh host lists automatically. Its data source maps `dataStore/modeling/*` to browser
localStorage even when a DHIS2 URL is configured; installation-wide settings must keep their current semantics. Its
client also lacks the host's adaptive Route API request queue. The host must retain authority checks and route setup.

## Useful additions to Chap blocks

The companion PR adds a DOM-free utilities export and `renderMetricLabel` to the outbreak table, and carries forward
the stable default outbreak-period array so shared charts do not reset on unrelated parent renders.

Next candidates are the new `SignalReviewTable` and signal-evidence compositions; props-only dataset/model/job tables;
form sections with submission/navigation callbacks; and runtime injection points for cache, requests and settings.
Prefer public feature subpaths so hosts do not need deep imports or application-specific aliases.

## Install and update

For a fresh checkout:

```sh
git clone --recurse-submodules https://github.com/dhis2-chap/chap-frontend.git
cd chap-frontend
pnpm install --frozen-lockfile
```

For an existing checkout, run `git submodule update --init --recursive` before installing. Chap blocks is public;
no additional repository credential is required. Only its api/core/ui packages are included in this workspace.

To review an update:

```sh
chap_blocks_before=$(git -C vendor/chap-blocks rev-parse HEAD)
git submodule update --init --remote vendor/chap-blocks
git -C vendor/chap-blocks log --oneline "$chap_blocks_before"..HEAD
git -C vendor/chap-blocks diff "$chap_blocks_before"..HEAD -- packages
pnpm install
pnpm linter:check
pnpm test
pnpm build
pnpm tsc:check
# Run the affected browser flows against a local Chap/DHIS2 stack.
git add vendor/chap-blocks pnpm-lock.yaml
git commit -m "chore: update chap-blocks"
```

CI uses the committed pin, never `--remote`. For a selected revision or rollback, fetch and check out the desired SHA
inside the submodule, then install, validate and commit the pin and lockfile. Make block changes in chap-blocks, then
update the pin here. See [its reuse guide](https://github.com/dhis2-chap/chap-blocks/blob/main/docs/reuse.md).

## Validation

- `pnpm install --frozen-lockfile` succeeds with initialized submodules.
- Monorepo lint, production builds and type checks pass (existing lint and bundle-size warnings remain).
- Unit tests: 341 passed, 2 previously skipped. Existing period, forecast/export, threshold and monitoring tests now
  exercise the imported utilities. The schema test no longer mocks probability constants from the UI barrel.
- Local browser check: DHIS2 shell, navigation, model search and the shared monitoring chart render with real API data.
- Targeted Playwright suites: 19 scenario tests plus two authentication setup executions passed against the local
  DHIS2/Chap stack. They cover model filtering, evaluation forms, outbreak scores/retry, prediction setup/run/logs,
  signal evidence and approval. Maps were typechecked/built but not exercised in this browser run.
- Companion chap-blocks PR: typecheck, lint, 350 tests and all four reference-app builds pass.

Localization remains a review item: DHIS2's default scanner reads the host's `src`, while shared source packages need
an explicit translation extraction/distribution contract. English fallback works; non-English behavior was not verified.
