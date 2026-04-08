# @dhis2-chap/modeling-app

## 5.0.0

### Major Changes

-   Release v5.0.0 to support CHAP v1.3.0

    BREAKING CHANGES:

    -   The modeling app now requires CHAP v1.3.0 or higher to work.
    -   Updated axios from 0.25.0 to 1.14.0 to resolve critical security vulnerability.

### Patch Changes

-   Updated dependencies
    -   @dhis2-chap/ui@5.0.0

## 4.0.1

### Patch Changes

-   48f8a5b: added the code and displayName properties on exported geojson data
-   5541260: ci: update automatic tests to also run against the latest chap-core release
-   c5bc1e3: fix: normalize and stabilize evaluation chart axes
-   cbfe3f7: added e2e test framework and initial test
-   0a998e3: fix: new evaluation form crashes when selecting root org unit
-   Updated dependencies [c5bc1e3]
    -   @dhis2-chap/ui@4.0.1

## 4.0.0

### Major Changes

-   cb83b46: Support Chap v1.1.5

### Minor Changes

-   cb83b46: use api dry run for import summaries and add backtest request download

### Patch Changes

-   @dhis2-chap/ui@4.0.0

## 3.3.0

### Minor Changes

-   e0fda6c: Fixed the broken "Go to result" link in the jobs table [CLIM-233]
-   ade3a88: Added dataset download action to model executions (>v1.1.4)
-   7f47137: Add experimental settings with feature toggles and gate evaluation/metric plots behind them.

### Patch Changes

-   56cfc6a: Added two extra eslint checks and refactored accordingly
-   015930a: refactor: convert CSS width/height to logical properties
-   23e228a: Update readme with correct package manager and changeset workflow [CLIM-366]
-   fb53c25: chore: updated OpenAPI client
-   6281371: docs: fix broken links and minor language fixes
-   7369720: Refresh backtests list on mount and window focus so completed evaluations appear without manual refresh. [CLIM-223]
-   Updated dependencies [56cfc6a]
-   Updated dependencies [015930a]
-   Updated dependencies [23e228a]
    -   @dhis2-chap/ui@3.3.0

## 3.2.1

### Patch Changes

-   1de692b: added custom release scripts and changelog management
-   Updated dependencies [1de692b]
    -   @dhis2-chap/ui@3.2.1
