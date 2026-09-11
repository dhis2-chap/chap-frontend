# @dhis2-chap/modeling-app

## 7.0.0

### Major Changes

-   3d0de4f: Release v7 of the modeling app.

    BREAKING CHANGES:

    -   The modeling app now requires CHAP Core 2.3.0 or newer. The thresholds
        API was redesigned in CHAP Core 2.3.0 and is not backwards compatible,
        so prediction runs do not work against older backends. The app reports
        an incompatible version instead of failing at runtime [CLIM-1092].
    -   Evaluation plots now require the facet coordinate endpoints introduced
        in CHAP Core 2.3.0 and no longer fall back to whole-plot rendering on
        older backends [CLIM-1039].

### Minor Changes

-   8653b60: Add CHAP API token configuration to route settings, including replacement and removal. Settings now reports whether the server accepted, rejected or is missing the token, rather than only whether one is stored, and a refused request explains the token problem and where to fix it instead of showing a bare "Unauthorized" [CLIM-1044].
-   ceeaff1: Add optional endemic threshold data element mapping to the prediction import, importing endemic threshold values by period across the full plotted range (historical and forecast periods) alongside predicted values [CLIM-942]
-   cd48553: Make evaluation plots available without experimental features and fix predicted vs actual plots to show only the selected forecast horizon. Plot filters now name split periods the way the rest of the app does and label horizons as "1 period ahead". Opening another evaluation now resets the plot filters and result selections instead of carrying over the previous evaluation's choices [CLIM-1039].
-   dafaa03: Require CHAP Core 2.3.0 or newer. The redesigned thresholds API in CHAP Core 2.3.0 is not backwards compatible, so prediction runs do not work against older backends. The app now reports an incompatible version instead of failing at runtime [CLIM-1092].
-   33b491f: Show aggregate metrics on the evaluation details screen [CLIM-1037]. The widget
    shows five headline metrics by default with the rest behind a toggle, explains
    each metric in plain language, hides the backend's demonstration metrics, and
    flags calibration metrics that sit far from their expected value.
-   d87d55e: Redesign threshold strategy selection for prediction runs against the typed thresholds API. Strategies are fetched from the backend and each strategy exposes its parameters (standard deviations, percentile band, baseline years) in the run details panel and the alert output dialog. The percentile strategy renders a WHO endemic channel band computed in a single request. Threshold calculation shows loading and error states with a retry action, and importing alert outputs is blocked while a calculation is in progress or failed.

### Patch Changes

-   44aa78b: Allow evaluations for models without covariates to pass data validation with only their target mapped [CLIM-1048].
-   169eb1a: Use readable abbreviated month labels on evaluation and prediction chart axes and tooltips instead of raw period ids, and format period labels in the active locale
-   57cbb84: Show a dismissible red banner on DHIS2 2.40 stating that the version is no longer supported and should be upgraded to get the latest features.
-   37eded4: Push release version commits through the GitHub API so they are GPG-signed and satisfy the repository's signed-commit rules
-   bd4ba64: Add a View action to the evaluation menu to open evaluation details.
-   Updated dependencies [d87d55e]
-   Updated dependencies [169eb1a]
-   Updated dependencies [d87d55e]
-   Updated dependencies [d259df4]
    -   @dhis2-chap/core@7.0.0
    -   @dhis2-chap/ui@7.0.0

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
