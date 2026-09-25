# @dhis2-chap/ui

## 7.2.0

### Minor Changes

-   5313507: Add a Datasets page where data can be imported once, named per covariate, and reused across evaluations (CLIM-1075). While building a dataset, the app suggests column names from CHAP, shows how many models can use it and which columns to add to support more, and lists the DHIS2 data items each column used in earlier datasets first in the data item picker. A data check has CHAP validate the data in a dry run and previews which locations it would leave out before anything is saved (needs a CHAP Core version with `dryRun` on make-dataset), and the locations CHAP leaves out on import are shown afterwards. New evaluations can now start from a saved dataset, with importing from DHIS2 as the second option.

    Datasets created by evaluations and predictions are hidden from the Datasets page and the saved-dataset evaluation form, with an Origin filter that can be cleared to show them. This needs a CHAP Core version that flags datasets created manually; older versions keep showing all datasets (CLIM-1163).

### Patch Changes

-   787a772: Highlight the forecast line corresponding to the selected minimum outbreak probability in prediction tiles and alert previews.
-   80eb938: Use metric names, descriptions, units, targets, and target behavior from CHAP Core in the evaluation metrics widget.
    -   @dhis2-chap/core@7.2.0

## 7.1.0

### Minor Changes

-   e025041: Add labelled year boundaries to prediction charts so users can compare peaks across years [CLIM-1082].

### Patch Changes

-   @dhis2-chap/core@7.1.0

## 7.0.0

### Minor Changes

-   d87d55e: Redesign threshold strategy selection for prediction runs against the typed thresholds API. Strategies are fetched from the backend and each strategy exposes its parameters (standard deviations, percentile band, baseline years) in the run details panel and the alert output dialog. The percentile strategy renders a WHO endemic channel band computed in a single request. Threshold calculation shows loading and error states with a retry action, and importing alert outputs is blocked while a calculation is in progress or failed.

### Patch Changes

-   169eb1a: Use readable abbreviated month labels on evaluation and prediction chart axes and tooltips instead of raw period ids, and format period labels in the active locale
-   d259df4: Restore the chart menu on prediction tiles so predictions can be viewed in full screen.
-   Updated dependencies [d87d55e]
    -   @dhis2-chap/core@7.0.0

## 6.3.0

### Patch Changes

-   f1dba36: Fix uncertainty area chart x-axis ordering for weekly data: padded (2025W03) and unpadded (2025W3) week ids are now canonicalized and merged into a single chronologically sorted axis, and gaps in actual data no longer connect across missing weeks.
    -   @dhis2-chap/core@6.3.0

## 6.2.1

### Patch Changes

-   6d1ec81: Remove dead metric plot widget and generated metric plot client code now superseded by evaluation visualisations.
    -   @dhis2-chap/core@6.2.1

## 6.2.0

### Patch Changes

-   9e57d36: Remount uncertainty charts when their backing data changes to avoid stale Highcharts series points.
    -   @dhis2-chap/core@6.2.0

## 6.1.0

### Minor Changes

-   9b029ac: Add organisation unit, split period, and horizon filters to the custom evaluation plots widget, deriving the available filters from each visualization's facet coordinates and fetching filtered plots on demand. Supports grid layout plots and removes the metric plots experimental setting. Regenerates the API client with the new `maxHorizonDistance` backtest field.

### Patch Changes

-   @dhis2-chap/core@6.1.0

## 6.0.0

### Major Changes

-   c063516: rework the end-to-end prediction flow around prediction setups, with a per-setup dashboard, follow-up forecasting, persisted import mappings, and outbreak alerts

### Minor Changes

-   7f26cb9: Replace native monthly and weekly period inputs with DHIS2-aware period picker components backed by multi-calendar period generation.
-   4e396b2: Add a DHIS2 dashboard plugin for CHAP uncertainty charts and allow uncertainty area charts to receive an explicit chart height for dashboard layouts.

### Patch Changes

-   6f83436: Remove the mock endemic threshold fallback and route completed evaluation jobs to their result dashboard.
-   6f83436: Regenerate the CHAP API client with the latest backtest request fields.
-   Updated dependencies [7f26cb9]
    -   @dhis2-chap/core@6.0.0

## 5.1.0

## 5.0.0

### Major Changes

-   9d9e103: Release v5.0.0 to support CHAP v1.3.0

    BREAKING CHANGES:

    -   The modeling app now requires CHAP v1.3.0 or higher to work.
    -   Upgraded @dhis2/cli-app-scripts from 12.8.0-alpha.3 to 12.11.0 (latest stable).

## 4.0.1

### Patch Changes

-   c5bc1e3: fix: normalize and stabilize evaluation chart axes

## 4.0.0

## 3.3.0

### Patch Changes

-   56cfc6a: Added two extra eslint checks and refactored accordingly
-   015930a: refactor: convert CSS width/height to logical properties
-   23e228a: Update readme with correct package manager and changeset workflow [CLIM-366]

## 3.2.1

### Patch Changes

-   1de692b: added custom release scripts and changelog management
