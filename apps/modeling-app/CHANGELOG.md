# @dhis2-chap/modeling-app

## 6.3.0

### Minor Changes

-   66bf2bf: Add organisation unit group selector next to the level selector in the org unit selection modal, with validation that all org units within selected groups are on the same level

### Patch Changes

-   Updated dependencies [f1dba36]
    -   @dhis2-chap/ui@6.3.0
    -   @dhis2-chap/core@6.3.0

## 6.2.1

### Patch Changes

-   4a23853: Disable experimental feature toggles and show a notice when the user lacks the F_CHAP_MODELING_APP authority.
-   89edc9a: Fix "Cannot read properties of undefined (reading 'digest')" when starting a dry run or import from a non-HTTPS, non-localhost origin, by replacing the SHA-256 cache key with a plain concatenated string key that doesn't depend on crypto.subtle.
-   6d1ec81: Remove dead metric plot widget and generated metric plot client code now superseded by evaluation visualisations.
-   Updated dependencies [6d1ec81]
    -   @dhis2-chap/ui@6.2.1
    -   @dhis2-chap/core@6.2.1

## 6.2.0

### Minor Changes

-   c25cee8: Add edit schedule dialog to toggle scheduling on prediction setups.
-   eefd45f: Add outbreak indicator data element field to prediction setup create and edit forms. All data element mapping fields are now optional.

### Patch Changes

-   c60ed44: Show active prediction setup jobs in the recent activity widget and open the widget by default.
-   f578a4f: Fix HTML entity escaping of quotes in prune confirmation dialog.
-   b9cb565: Update creating-a-prediction user guide with real screenshots and remove em dashes.
-   Updated dependencies [9e57d36]
    -   @dhis2-chap/ui@6.2.0
    -   @dhis2-chap/core@6.2.0

## 6.1.0

### Minor Changes

-   9b029ac: Add organisation unit, split period, and horizon filters to the custom evaluation plots widget, deriving the available filters from each visualization's facet coordinates and fetching filtered plots on demand. Supports grid layout plots and removes the metric plots experimental setting. Regenerates the API client with the new `maxHorizonDistance` backtest field.
-   8c080d6: Add a reusable bug report dialog with report templates and app diagnostics context.

### Patch Changes

-   df66ef3: Prevent stale browser-cached analytics responses from producing empty evaluation data.
-   Updated dependencies [9b029ac]
    -   @dhis2-chap/ui@6.1.0
    -   @dhis2-chap/core@6.1.0

## 6.0.0

### Major Changes

-   c063516: rework the end-to-end prediction flow around prediction setups, with a per-setup dashboard, follow-up forecasting, persisted import mappings, and outbreak alerts

### Minor Changes

-   dadb379: Add an optional clear-and-import flow for prediction run imports so previous DHIS2 values can be deleted before importing replacement prediction values.
-   5b57e6c: Add a Recent activity bar chart for summarizing system job activity, with chart-driven drilldown and date range filtering across activity and jobs tables.
-   7f26cb9: Replace native monthly and weekly period inputs with DHIS2-aware period picker components backed by multi-calendar period generation.
-   af3ba9b: Add an experimental scheduling status widget to the prediction setup dashboard.
-   6384d83: Redesign model selection as a searchable split view with readiness, period, author, target, and covariate details.
-   8d5557e: Suggest matching DHIS2 data elements when configuring quantile import mappings for prediction setup creation, editing, and prediction run imports.
-   d360aab: Unify dataset and metrics downloads on the evaluations table into a single Download modal. The new Metrics (CSV) download is gated to chap-core 1.4.1+.

### Patch Changes

-   81d3867: Add e2e coverage for showing archived models when Include archived is enabled.
-   6f83436: Remove the mock endemic threshold fallback and route completed evaluation jobs to their result dashboard.
-   964a33c: Add user guides for viewing evaluation results, comparing evaluations, and configuring modeling app settings.
-   bf5dc44: Refine concept guide wording and interactive examples for covariates and prediction intervals.
-   875bad7: Use query aliases for long evaluation data requests on older DHIS2 versions.
-   Updated dependencies [6f83436]
-   Updated dependencies [c063516]
-   Updated dependencies [6f83436]
-   Updated dependencies [7f26cb9]
-   Updated dependencies [4e396b2]
    -   @dhis2-chap/ui@6.0.0
    -   @dhis2-chap/core@6.0.0

## 5.1.0

### Minor Changes

-   2a85290: increase performance and functionality on the compare page

### Patch Changes

-   5dfb831: Add user guide on configuring a model from a model template
-   b3c2086: fix: use query alias API for analytics fetching to avoid URI too long errors [CLIM-711]
    -   @dhis2-chap/ui@5.1.0

## 5.0.0

### Major Changes

-   9d9e103: Release v5.0.0 to support CHAP v1.3.0

    BREAKING CHANGES:

    -   The modeling app now requires CHAP v1.3.0 or higher to work.
    -   Upgraded @dhis2/cli-app-scripts from 12.8.0-alpha.3 to 12.11.0 (latest stable).

### Patch Changes

-   Updated dependencies [9d9e103]
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
